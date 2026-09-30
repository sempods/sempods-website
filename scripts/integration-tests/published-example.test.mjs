import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const gradle = process.env.SEMPODS_TEST_GRADLE;
assert.ok(gradle, 'Set SEMPODS_TEST_GRADLE to the Gradle executable; JDK 25 and 21 are required.');

test('a throwing installation reports failure and lets the consumer JVM exit', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'sempods-install-failure-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  cpSync(join(root, 'scripts/verify-published-example.mjs'), join(directory, 'scripts/verify-published-example.mjs'), { recursive: true });
  cpSync(join(root, 'src/data'), join(directory, 'src/data'), { recursive: true });
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
  const path = join(directory, 'src/data/client-examples.json');
  const example = JSON.parse(readFileSync(path, 'utf8'));
  example.snippets.install += '.also { error("Install failure fixture") }';
  writeFileSync(path, JSON.stringify(example));

  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(directory, 'scripts/verify-published-example.mjs'), '--gradle', gradle], {
      detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    const timer = setTimeout(() => {
      process.kill(-child.pid, 'SIGKILL');
      reject(new Error(`Consumer did not exit after installation failed:\n${output}`));
    }, 120000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', (code, signal) => { clearTimeout(timer); resolve({ code, signal, output }); });
  });
  assert.equal(result.signal, null, result.output);
  assert.notEqual(result.code, 0, result.output);
  assert.match(result.output, /Install failure fixture/);
});
