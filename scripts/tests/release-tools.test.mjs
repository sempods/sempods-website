import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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

function renderedCheck(directory) {
  return spawnSync('python3', [join(root, 'scripts/check-rendered-links.py'), '--dist', directory, '--kotlin', directory, '--spec', directory], { encoding: 'utf8' });
}

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
