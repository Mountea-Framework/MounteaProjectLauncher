import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadStore, setProjectConfig, updateGlobal, normalizePath } from './store.ts';

const defaults = { nightMode: true, scanRoots: [], enginePaths: ['x'], launchTemplates: {} };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'store-'));

test('missing file gives defaults, updates persist', () => {
  const dir = tmp();
  assert.deepEqual(loadStore(dir, defaults).global, defaults);
  updateGlobal({ nightMode: false });
  setProjectConfig('C:/A/B.uproject', { map: '/Game/M' });
  setProjectConfig('C:/A/B.uproject', { launchMode: 'Client' });
  const s = loadStore(dir, defaults);
  assert.equal(s.global.nightMode, false);
  assert.deepEqual(s.projects[normalizePath('C:/A/B.uproject')], { map: '/Game/M', launchMode: 'Client' });
  assert.equal(fs.existsSync(path.join(dir, 'settings.json.tmp')), false);
});

test('corrupt file is renamed and defaults used', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'settings.json'), '{nope');
  assert.deepEqual(loadStore(dir, defaults).global, defaults);
  assert.ok(fs.readdirSync(dir).some((f) => f.startsWith('settings.corrupt-')));
});
