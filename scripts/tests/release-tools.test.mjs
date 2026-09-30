import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { publicPod } from '../../src/data/public-query.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'sempods-release-tools-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function write(directory, path, text) {
  const target = join(directory, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
}

test('extraction rejects a stale version even when the tag and commit agree', t => {
  const directory = fixture(t);
  const kotlin = join(directory, 'kotlin');
  write(kotlin, 'gradle.properties', 'version=0.2.0\n');
  write(kotlin, 'settings.gradle.kts', 'id("org.jetbrains.kotlin.jvm") version "2.4.20"\n');
  write(kotlin, 'sempods-client/src/test/kotlin/org/sempods/client/DocumentationExamplesTest.kt', `
// doc-example:start install
  val installed = true
// doc-example:end install
// doc-example:start public-read
  val resource = "fixture"
// doc-example:end public-read
`);
  const git = (...args) => execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgSign=false', '-c', 'tag.gpgSign=false', '-C', kotlin, ...args], { encoding: 'utf8', timeout: 10000 }).trim();
  git('init', '-q');
  git('add', '.');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Create fixture');
  git('tag', 'v0.2.0');
  const commit = git('rev-parse', 'HEAD');
  const website = join(directory, 'website');
  const manifest = { implementation: { version: '0.1.0', tag: 'v0.2.0', commit } };
  write(website, 'src/data/release.json', JSON.stringify(manifest));
  mkdirSync(join(website, 'scripts'), { recursive: true });
  copyFileSync(join(root, 'scripts/sync-examples.mjs'), join(website, 'scripts/sync-examples.mjs'));
  const run = () => spawnSync(process.execPath, [join(website, 'scripts/sync-examples.mjs'), '--kotlin', kotlin], { encoding: 'utf8' });
  const rejected = run();
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /Recorded release version 0.1.0 differs.*0.2.0/);
  assert.equal(existsSync(join(website, 'src/data/client-examples.json')), false);
  manifest.implementation.version = '0.2.0';
  write(website, 'src/data/release.json', JSON.stringify(manifest));
  const accepted = run();
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.equal(JSON.parse(readFileSync(join(website, 'src/data/client-examples.json'))).source.commit, commit);
});

function renderedCheck(directory, extraArgs = []) {
  return spawnSync('python3', [join(root, 'scripts/check-rendered-links.py'), '--dist', directory, '--kotlin', directory, '--spec', directory, ...extraArgs], { encoding: 'utf8' });
}

for (const href of ['/%2e%2e/outside.txt', 'https://www.sempods.org/%2E%2E/outside.txt', '/images/%2e%2e%2f%2e%2e/outside.txt']) {
  test(`a decoded path outside the build is rejected: ${href}`, t => {
    const directory = fixture(t);
    const dist = join(directory, 'dist');
    write(directory, 'outside.txt', 'Not in the published artifact');
    write(dist, 'index.html', `<h1>Home</h1><a href="${href}">Outside</a>`);
    mkdirSync(join(dist, 'images'));
    const result = renderedCheck(dist);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /outside build root/);
  });
}

for (const kind of ['asset', 'directory index', 'HTML page']) {
  test(`a ${kind} symlink outside the build is rejected`, t => {
    const directory = fixture(t);
    const dist = join(directory, 'dist');
    write(directory, 'outside.txt', '<h1>Outside the artifact</h1>');
    write(dist, 'index.html', '<h1>Home</h1><a href="/linked">Linked</a>');
    if (kind === 'directory index') {
      mkdirSync(join(dist, 'linked'));
      symlinkSync(join(directory, 'outside.txt'), join(dist, 'linked/index.html'));
    } else {
      const name = kind === 'HTML page' ? 'linked.html' : 'linked';
      symlinkSync(join(directory, 'outside.txt'), join(dist, name));
      write(dist, 'index.html', `<h1>Home</h1><a href="/${name}">Linked</a>`);
    }
    const result = renderedCheck(dist);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /outside build root/);
  });
}

test('decoded dot segments and symlinks within the build remain valid', t => {
  const directory = fixture(t);
  write(directory, 'start/index.html', '<h1 id="build">Build</h1>');
  write(directory, 'images/real.svg', '<svg></svg>');
  symlinkSync(join(directory, 'images/real.svg'), join(directory, 'images/alias.svg'));
  write(directory, 'index.html', '<h1>Home</h1><a href="/images/%2e%2e/start#build">Start</a><img src="/images/alias.svg">');
  const result = renderedCheck(directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /2 internal links/);
});

test('relative links in an internal HTML symlink resolve from its rendered URL', t => {
  const directory = fixture(t);
  write(directory, 'real/index.html', '<h1>Real page</h1><a href="guide">Guide</a>');
  write(directory, 'real/guide/index.html', '<h1>Guide</h1>');
  mkdirSync(join(directory, 'alias'));
  symlinkSync(join(directory, 'real/index.html'), join(directory, 'alias/index.html'));
  const result = renderedCheck(directory);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /alias\/index.html: missing target guide/);
});

test('absolute and scheme-relative same-origin links include canonical URLs and assets', t => {
  const directory = fixture(t);
  write(directory, 'start/index.html', '<h1 id="build">Build</h1>');
  write(directory, 'assets/image 2.svg', '<svg></svg>');
  write(directory, 'index.html', `<h1>Home</h1>
<link rel="canonical" href="https://www.sempods.org/">
<a href="https://www.sempods.org/start?mode=read#build">Start</a>
<a href="//www.sempods.org/start/#build">Start</a>
<a href="https://WWW.SEMPODS.ORG:443/start/">Start</a>
<img src="https://www.sempods.org/assets/image%202.svg?v=1">
<a href="https://www.sempods.org.example/missing">External</a>
<a href="https://www.sempods.org:444/missing">External</a>
<a href="http://www.sempods.org/missing">External</a>
<a href="https://sempods.org/aaltra">Public pod</a>`);
  const result = renderedCheck(directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /5 internal links/);
});

test('missing absolute same-origin routes, assets and anchors fail the rendered check', t => {
  const directory = fixture(t);
  write(directory, 'start/index.html', '<h1 id="build">Build</h1>');
  write(directory, 'index.html', `<h1>Home</h1>
<link rel="canonical" href="https://www.sempods.org/missing">
<script src="//www.sempods.org/missing.js"></script>
<a href="https://www.sempods.org/start#missing">Missing anchor</a>`);
  const result = renderedCheck(directory);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /missing target https:\/\/www.sempods.org\/missing/);
  assert.match(result.stdout, /missing target \/\/www.sempods.org\/missing.js/);
  assert.match(result.stdout, /missing anchor https:\/\/www.sempods.org\/start#missing/);
});

test('the configured site origin determines which absolute URLs are internal', t => {
  const directory = fixture(t);
  write(directory, 'index.html', `<h1>Home</h1>
<link rel="canonical" href="https://preview.example:8443/">
<a href="https://www.sempods.org/missing">External</a>
<a href="https://preview.example:8443/missing">Internal</a>`);
  const result = renderedCheck(directory, ['--site', 'https://preview.example:8443']);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /missing target https:\/\/preview.example:8443\/missing/);
  assert.doesNotMatch(result.stdout, /missing target https:\/\/www.sempods.org/);
});

test('relative directories, assets, query-only URLs and anchors resolve from the page URL', t => {
  const directory = fixture(t);
  write(directory, 'index.html', '<h1 id="home">Home</h1>');
  write(directory, 'start/index.html', '<h1 id="build">Build</h1>');
  write(directory, 'concepts/guide/index.html', '<h1 id="read">Read</h1>');
  write(directory, 'images/example.svg', '<svg></svg>');
  write(directory, 'concepts/index.html', `<h1 id="intro">Concepts</h1>
<a href="guide?mode=read#read">Guide</a>
<a href="./guide/">Guide</a>
<a href="../start#build">Start</a>
<a href="../index.html#home">Home</a>
<a href="?mode=read#intro">Current page</a>
<a href="#intro">Intro</a>
<a href="/start/">Start</a>
<img src="../images/example.svg">
<a href="https://elsewhere.example/missing">External</a>
<a href="//elsewhere.example/missing">External</a>
<a href="mailto:hello@example.invalid">Email</a>`);
  const result = renderedCheck(directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /8 internal links/);
});

test('missing relative targets and anchors fail the rendered check', t => {
  const directory = fixture(t);
  write(directory, 'start/index.html', '<h1 id="build">Build</h1>');
  write(directory, 'concepts/index.html', '<a href="guide">Missing guide</a><a href="../start#missing">Missing anchor</a><img src="../images/missing.svg">');
  const result = renderedCheck(directory);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /missing target guide/);
  assert.match(result.stdout, /missing anchor ..\/start#missing/);
  assert.match(result.stdout, /missing target ..\/images\/missing.svg/);
});

function demoCheck(t, eventIds, amend = () => {}) {
  const directory = fixture(t);
  const results = {
    head: { vars: ['e', 'name', 'start'] },
    results: { bindings: eventIds.map((id, index) => ({
      e: { type: 'uri', value: id },
      name: { type: 'literal', value: `Name ${index}` },
      start: { type: 'literal', value: `2026-09-${28 + index}` },
    })) },
  };
  const event = { '@id': eventIds[0], '@type': 'https://schema.org/Event', 'https://schema.org/startDate': '2026-09-30' };
  amend(results.results.bindings);
  write(directory, 'fetch-fixture.mjs', `
let requests = 0;
globalThis.fetch = async () => {
  if (++requests === 1) return new Response(JSON.stringify(${JSON.stringify(results)}), { headers: { 'Content-Type': 'application/sparql-results+json' } });
  if (requests === 2) return new Response(JSON.stringify(${JSON.stringify(event)}), { headers: { 'Content-Type': 'application/ld+json' } });
  throw new Error('Unexpected request');
};
`);
  return spawnSync(process.execPath, ['--import', join(directory, 'fetch-fixture.mjs'), join(root, 'scripts/verify-public-demo.mjs')], { encoding: 'utf8' });
}

test('three bindings for the same event do not prove three events', t => {
  const event = `${publicPod}/events/one`;
  const result = demoCheck(t, [event, event, event]);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /The website demonstrates three distinct events/);
});

test('three distinct events pass the full demo check', t => {
  const result = demoCheck(t, ['one', 'two', 'three'].map(id => `${publicPod}/events/${id}`));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).rows, 3);
});

test('the full demo rejects a resource IRI projected as an event name', t => {
  const result = demoCheck(t, ['one', 'two', 'three'].map(id => `${publicPod}/events/${id}`), rows => {
    rows[0].name = { type: 'uri', value: 'https://pod.example/name' };
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Event name is a nonempty literal/);
});

test('the full demo rejects a language-tagged date binding', t => {
  const result = demoCheck(t, ['one', 'two', 'three'].map(id => `${publicPod}/events/${id}`), rows => {
    rows[0].start = { type: 'literal', value: '2026-09-30', 'xml:lang': 'en' };
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Event start is a literal calendar date/);
});

test('the full demo rejects a numeric name datatype', t => {
  const result = demoCheck(t, ['one', 'two', 'three'].map(id => `${publicPod}/events/${id}`), rows => {
    rows[0].name = { type: 'literal', value: '42', datatype: 'http://www.w3.org/2001/XMLSchema#integer' };
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /string-compatible datatype/);
});

test('the full demo never reads a selected private-network event URI', t => {
  const result = demoCheck(t, ['http://127.0.0.1/private', `${publicPod}/events/two`, `${publicPod}/events/three`]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Event read stays within the configured public pod/);
});

for (const [name, markup] of [
  ['script', '<script src=""></script>'],
  ['image', '<img src="">'],
  ['stylesheet', '<link rel="stylesheet" href="">'],
  ['media source', '<source src="">'],
  ['poster', '<video poster=""></video>'],
  ['valueless attribute', '<img src>'],
  ['whitespace attribute', '<script src=" \n\t "></script>'],
  ['srcset', '<img srcset="">'],
  ['imagesrcset', '<link rel="preload" as="image" imagesrcset=" , , ">'],
]) {
  test(`an empty ${name} URL is rejected`, t => {
    const directory = fixture(t);
    write(directory, 'index.html', `<h1>Home</h1>${markup}`);
    const result = renderedCheck(directory);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /empty asset URL/);
  });
}

test('self-navigation, inline scripts and absent optional media URLs remain valid', t => {
  const directory = fixture(t);
  write(directory, 'index.html', `<h1 id="home">Home</h1>
<a href="">Current page</a><a href="#home">Home</a>
<area href=""><script>const inline = true;</script><video></video>`);
  const result = renderedCheck(directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /3 internal links/);
});

for (const field of ['og:image', 'twitter:image', 'og:image:secure_url', 'twitter:player']) {
  test(`a missing ${field} target fails the rendered check`, t => {
    const directory = fixture(t);
    write(directory, 'index.html', `<h1>Home</h1><meta ${field.startsWith('og:') ? 'property' : 'name'}="${field}" content="https://www.sempods.org/missing.png">`);
    const result = renderedCheck(directory);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, /missing target https:\/\/www.sempods.org\/missing.png/);
  });
}

test('URL-valued social metadata is checked without interpreting text fields as URLs', t => {
  const directory = fixture(t);
  write(directory, 'images/preview.png', 'fixture');
  write(directory, 'index.html', `<h1>Home</h1>
<meta property="og:url" content="https://www.sempods.org/">
<meta property="og:image" content="https://www.sempods.org/images/preview.png">
<meta name="twitter:image" content="/images/preview.png">
<meta property="og:image:width" content="1280">
<meta property="og:image:alt" content="A social preview">
<meta name="description" content="Something to read">
<meta property="og:video" content="https://external.example/video.mp4">`);
  const result = renderedCheck(directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /3 internal links/);
});

test('an empty social URL fails the rendered check', t => {
  const directory = fixture(t);
  write(directory, 'index.html', '<h1>Home</h1><meta property="og:image" content=" ">');
  const result = renderedCheck(directory);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /empty social URL og:image/);
});

test('the release inventory reports recorded public JSON sources and excludes other JSON', t => {
  const directory = fixture(t);
  const website = join(directory, 'website');
  const kotlin = join(directory, 'kotlin');
  const spec = join(directory, 'spec');
  const release = { implementation: { version: '0.1.0', tag: 'v0.1.0', commit: 'recorded-implementation' }, specification: { commit: 'recorded-specification' } };
  const examples = { source: { commit: 'recorded-example', path: 'Example.kt', sha256: 'recorded-hash', regions: ['install'] }, compilerVersion: '2.4.20', snippets: { install: 'public example' } };
  const site = { url: 'https://www.sempods.org' };
  write(website, 'AGENTS.md', '# Fixture\n');
  for (const [name, data] of Object.entries({ 'release.json': release, 'client-examples.json': examples, 'site.json': site, 'credentials.json': { secret: 'must not be inventoried' } })) {
    write(website, `src/data/${name}`, JSON.stringify(data));
  }
  write(website, 'public/credentials.json', '{"secret":"also excluded"}');
  write(kotlin, 'gradle.properties', 'version=0.2.0\nspecVersion=0.1-dev\n');
  write(spec, 'requirements.json', '{"versions":{"core":"0.1-dev"}}');
  for (const repository of [website, kotlin, spec]) {
    const git = (...args) => execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgSign=false', '-c', 'tag.gpgSign=false', '-C', repository, ...args], { encoding: 'utf8', timeout: 10000 });
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Create fixture');
    if (repository === kotlin) git('tag', 'v0.2.0');
  }
  mkdirSync(join(website, 'scripts'), { recursive: true });
  copyFileSync(join(root, 'scripts/audit-release.mjs'), join(website, 'scripts/audit-release.mjs'));
  const result = spawnSync(process.execPath, [join(website, 'scripts/audit-release.mjs'), '--kotlin', kotlin, '--spec', spec, '--release', 'v0.2.0'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  const inventory = new Map(report.inventory.map(entry => [entry.file, entry]));
  assert.deepEqual(inventory.get('src/data/release.json')?.data, release);
  assert.deepEqual(inventory.get('src/data/client-examples.json')?.data, examples);
  assert.deepEqual(inventory.get('src/data/site.json')?.data, site);
  assert.equal(report.implementation.version, '0.2.0');
  assert.equal(inventory.get('src/data/release.json').reviewCandidates.some(candidate => candidate.kind === 'version' && candidate.text === '0.1.0'), true);
  assert.equal(inventory.has('src/data/credentials.json'), false);
  assert.equal(inventory.has('public/credentials.json'), false);
});

const missingAssets = [
  ['stylesheet', '<link rel="stylesheet" href="/missing.css">', '/missing.css'],
  ['script', '<script src="/missing.js"></script>', '/missing.js'],
  ['favicon', '<link rel="icon" href="/missing.ico">', '/missing.ico'],
  ['preload', '<link rel="preload" as="font" href="/missing.woff2">', '/missing.woff2'],
  ['media source', '<video><source src="/missing.webm"></video>', '/missing.webm'],
  ['picture source', '<picture><source srcset="/missing.webp 1x"></picture>', '/missing.webp'],
  ['image srcset', '<img srcset="/missing.webp 1x">', '/missing.webp'],
  ['preloaded srcset', '<link rel="preload" as="image" imagesrcset="/missing.webp 1x">', '/missing.webp'],
];
for (const [name, markup, target] of missingAssets) {
  test(`a missing ${name} fails the rendered check`, t => {
    const directory = fixture(t);
    write(directory, 'index.html', `<h1>Fixture</h1>${markup}`);
    const result = renderedCheck(directory);
    assert.equal(result.status, 1, result.stdout);
    assert.ok(result.stdout.includes(`missing target ${target}`), result.stdout);
  });
}

test('local assets and srcset candidates are checked while data URLs stay external', t => {
  const directory = fixture(t);
  for (const file of ['style.css', 'script.js', 'favicon.ico', 'font.woff2', 'video.webm', 'image.webp', 'image 2.webp']) write(directory, `assets/${file}`, 'fixture');
  write(directory, 'index.html', `<h1>Fixture</h1>
<link rel="stylesheet" href="assets/style.css?v=2#version"><script src="assets/script.js"></script>
<link rel="icon" href="assets/favicon.ico"><link rel="preload" as="font" href="assets/font.woff2">
<video><source src="assets/video.webm"></video>
<picture><source srcset="assets/image.webp 1x, assets/image%202.webp 2x"></picture>
<img srcset="data:image/png;base64,AAAA 1x, assets/image.webp 2x">
<link rel="preload" as="image" imagesrcset="assets/image.webp 1x, assets/image%202.webp 2x">`);
  const result = renderedCheck(directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /10 internal links/);
});
