import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const release = JSON.parse(readFileSync(join(root, 'src/data/release.json'), 'utf8'));
const args = process.argv.slice(2);
const check = args.includes('--check');
const positional = args.filter(arg => arg !== '--check');
const usage = 'Usage: node scripts/sync-examples.mjs --kotlin PATH [--check]';

try {
  if (positional.length !== 2 || positional[0] !== '--kotlin') throw new Error(usage);
  const kotlin = positional[1];
  const git = (...params) => execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', kotlin, ...params], { encoding: 'utf8' }).trimEnd();
  const commit = git('rev-parse', '--verify', `${release.implementation.tag}^{commit}`);
  if (commit !== release.implementation.commit) throw new Error('Release tag does not match the recorded commit.');
  const path = 'sempods-client/src/test/kotlin/org/sempods/client/DocumentationExamplesTest.kt';
  const source = git('show', `${commit}:${path}`);
  function region(name) {
    const start = `// doc-example:start ${name}`;
    const end = `// doc-example:end ${name}`;
    if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error(`Missing or duplicate region: ${name}`);
    const block = source.slice(source.indexOf(start) + start.length, source.indexOf(end)).split('\n');
    while (block.length && !block[0].trim()) block.shift();
    while (block.length && !block.at(-1).trim()) block.pop();
    if (!block.length) throw new Error(`Empty region: ${name}`);
    const indent = Math.min(...block.filter(line => line.trim()).map(line => /^ */.exec(line)[0].length));
    return block.map(line => line.slice(indent)).join('\n');
  }
  const snippets = { install: region('install'), publicRead: region('public-read') };
  const settings = git('show', `${commit}:settings.gradle.kts`);
  const kotlinVersion = /id\("org\.jetbrains\.kotlin\.jvm"\) version "([^"]+)"/.exec(settings)?.[1];
  if (!kotlinVersion) throw new Error('No Kotlin compiler version found at release.');
  const result = {
    source: { commit, path, sha256: createHash('sha256').update(source).digest('hex'), regions: ['install', 'public-read'] },
    compilerVersion: kotlinVersion,
    snippets,
  };
  const output = `${JSON.stringify(result, null, 2)}\n`;
  const destination = join(root, 'src/data/client-examples.json');
  if (check) {
    if (readFileSync(destination, 'utf8') !== output) throw new Error('Examples differ from the recorded release source; run examples:sync.');
    console.log('Examples match the recorded release source.');
  } else {
    writeFileSync(destination, output);
    console.log(`Extracted install and public-read from ${commit}.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
