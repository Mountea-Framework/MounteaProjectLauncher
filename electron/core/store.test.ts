import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadStore, readDefaults, setProjectConfig, updateGlobal, normalizePath } from './store.ts';

const defaults = { nightMode: true, scanRoots: [], enginePaths: ['x'], launchTemplates: {} };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'store-'));

void test('missing file gives defaults, updates persist', () => {
  const dir = tmp();
  assert.deepEqual(loadStore(dir, defaults).global, defaults);
  updateGlobal({ nightMode: false });
  setProjectConfig('C:/A/B.uproject', { map: '/Game/M' });
  setProjectConfig('C:/A/B.uproject', { launchMode: 'Client' });
  const s = loadStore(dir, defaults);
  assert.equal(s.global.nightMode, false);
  assert.deepEqual(s.projects[normalizePath('C:/A/B.uproject')], { map: '/Game/M', launchMode: 'Client' });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  assert.equal(fs.existsSync(path.join(dir, 'settings.json.tmp')), false);
});

void test('corrupt file is renamed and defaults used', () => {
  const dir = tmp();
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  fs.writeFileSync(path.join(dir, 'settings.json'), '{nope');
  assert.deepEqual(loadStore(dir, defaults).global, defaults);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  assert.ok(fs.readdirSync(dir).some((f) => f.startsWith('settings.corrupt-')));
});

void test('valid JSON with invalid settings or project configs is quarantined', () => {
  for (const invalid of [
    { global: { enginePaths: [7] }, projects: {} },
    { global: {}, projects: { 'P.uproject': { map: 4 } } },
  ]) {
    const dir = tmp();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
    fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(invalid));
    assert.deepEqual(loadStore(dir, defaults), { version: 1, global: defaults, projects: {} });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
    assert.ok(fs.readdirSync(dir).some((file) => file.startsWith('settings.corrupt-')));
  }
});

void test('invalid defaults fall back to safe settings', () => {
  const file = path.join(tmp(), 'DefaultConfig.json');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  fs.writeFileSync(file, '{"scanRoots":"invalid","nightMode":false}');
  assert.deepEqual(readDefaults(file), { nightMode: true, scanRoots: [], enginePaths: [], launchTemplates: {} });
});
