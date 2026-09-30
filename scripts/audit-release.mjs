import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const website = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDataFiles = new Set(['src/data/release.json', 'src/data/client-examples.json', 'src/data/site.json']);
const usage = 'Usage: node scripts/audit-release.mjs --kotlin PATH --spec PATH --release TAG [--previous REF] [--spec-ref REF]';

function git(root, ...args) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', root, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
}

function snapshot(root, ref) {
  const commit = git(root, 'rev-parse', '--verify', `${ref}^{commit}`);
  const dirty = git(root, 'status', '--porcelain');
  return { commit, checkoutCommit: git(root, 'rev-parse', 'HEAD'), dirty: Boolean(dirty) };
}

function optionalSource(root, commit, path) {
  try { git(root, 'cat-file', '-e', `${commit}:${path}`); }
  catch { return null; }
  return git(root, 'show', `${commit}:${path}`);
}

function files(root) {
  return readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]);
}

function lineAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function matches(source, pattern) {
  return [...source.matchAll(pattern)].map(match => ({
    line: lineAt(source, match.index), text: match[1] ?? match[0],
  }));
}

const candidatePatterns = [
  ['version', /\b\d+\.\d+(?:\.\d+)?(?:-SNAPSHOT|-dev)?\b/g],
  ['legacy-client', /\b(?:SempodsPodClient|SempodsClient|PodWireClient|SempodsHttpTransport)\b/g],
  ['contract-status', /descriptive|implementation (?:is right|currently wins)|bind(?:s)? (?:anyone|no one)|holds no one/g],
  ['capability-or-direction', /\b(?:contexts?|grants?|tokens?|conforman\w*|certifi\w*|optional|SHACL|ACP|vector|TypeScript)\b/gi],
  ['operation-or-availability', /\b(?:Java|JVM|Docker|deploy\w*|upgrad\w*|backup\w*|migration\w*|download\w*|hosted|preview|paid)\b/gi],
];

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage);
    process.exit(0);
  }
  const options = {};
  const allowed = new Set(['--kotlin', '--spec', '--release', '--previous', '--spec-ref']);
  for (let i = 0; i < args.length; i += 2) {
    if (!allowed.has(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options[args[i]]) {
      throw new Error(usage);
    }
    options[args[i]] = args[i + 1];
  }
  if (!options['--kotlin'] || !options['--spec'] || !options['--release']) throw new Error(usage);
  for (const flag of ['--release', '--previous', '--spec-ref']) {
    if (options[flag]?.startsWith('-')) throw new Error(`Invalid ${flag} reference`);
  }
  const kotlin = resolve(options['--kotlin']);
  const spec = resolve(options['--spec']);
  const release = options['--release'];
  const implementation = snapshot(kotlin, release);
  const specification = snapshot(spec, options['--spec-ref'] ?? 'HEAD');
  const previous = options['--previous']
    ? git(kotlin, 'rev-parse', '--verify', `${options['--previous']}^{commit}`) : null;
  const implementationIndexText = optionalSource(kotlin, implementation.commit, 'gradle/spec/requirements.json');
  const implementationIndex = implementationIndexText === null ? null : JSON.parse(implementationIndexText);
  const specificationIndexText = optionalSource(spec, specification.commit, 'requirements.json');
  const specificationIndex = specificationIndexText === null ? null : JSON.parse(specificationIndexText);
  const properties = git(kotlin, 'show', `${implementation.commit}:gradle.properties`);
  const changedPaths = previous
    ? git(kotlin, 'diff', '--name-only', previous, implementation.commit).split('\n').filter(Boolean) : null;
  const websiteFiles = [join(website, 'AGENTS.md'), ...['src', 'public'].flatMap(dir => files(join(website, dir)))];
  const inventory = websiteFiles.filter(path => /\.(?:astro|ts|css|svg|txt|md)$/.test(path) || publicDataFiles.has(relative(website, path))).map(path => {
    const source = readFileSync(path, 'utf8');
    return {
      file: relative(website, path),
      ...(publicDataFiles.has(relative(website, path)) ? { data: JSON.parse(source) } : {}),
      headings: matches(source, /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/g),
      metadata: matches(source, /\b(?:title|description|aria-label|alt)="([^"]*)"/g),
      links: matches(source, /\b(?:href|src)="([^"]+)"/g),
      reviewCandidates: candidatePatterns.flatMap(([kind, pattern]) =>
        matches(source, pattern).map(match => ({ kind, ...match }))),
    };
  });
  const sourceLinks = [];
  for (const entry of inventory) {
    for (const link of entry.links) {
      const match = /^https:\/\/github\.com\/sempods\/(sempods-kotlin|sempods-spec)\/(?:blob|tree)\/([^/]+)\/(.+?)(?:#.*)?$/.exec(link.text);
      if (!match) continue;
      const root = match[1] === 'sempods-kotlin' ? kotlin : spec;
      const commit = match[1] === 'sempods-kotlin' ? implementation.commit : specification.commit;
      let exists = true;
      try { git(root, 'cat-file', '-e', `${commit}:${decodeURIComponent(match[3])}`); }
      catch { exists = false; }
      sourceLinks.push({ file: entry.file, line: link.line, url: link.text,
        targetPath: match[3], checkedAt: commit, existsAtSelectedRevision: exists,
        followsMain: match[2] === 'main' });
    }
  }
  console.log(JSON.stringify({
    schemaVersion: 1,
    website: { ...snapshot(website, 'HEAD'), content: 'working tree' },
    implementation: { release, ...implementation, content: 'committed release revision', previous,
      version: /^version=(.+)$/m.exec(properties)?.[1],
      specVersion: /^specVersion=(.+)$/m.exec(properties)?.[1],
      specificationVersions: implementationIndex?.versions ?? null,
      requirementIndexMatchesSelectedSpec: implementationIndexText === null || specificationIndexText === null
        ? null : implementationIndexText === specificationIndexText,
      changedPaths },
    specification: { ...specification, content: 'committed selected revision',
      versions: specificationIndex?.versions ?? null },
    inventory, sourceLinks,
    missingEvidence: [
      ...(implementationIndex === null ? ['Release has no vendored gradle/spec/requirements.json.'] : []),
      ...(specificationIndex === null ? ['Selected specification has no requirements.json.'] : []),
    ],
    limitations: ['Candidates need editorial review; absence of a match is not a pass.',
      'No publication, artifact resolution, runtime, live service, URL or anchor validation.',
      'Literal source links are checked for path existence at selected revisions, not at their URL revisions.',
      'Dirty source checkouts are reported; release and specification evidence uses committed revisions.'],
  }, null, 2));
} catch (error) {
  console.error(error.stderr?.toString().trim() || error.message);
  process.exitCode = 1;
}
