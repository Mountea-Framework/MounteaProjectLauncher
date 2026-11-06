import test from 'node:test';
import assert from 'node:assert/strict';
import { globalSettings, launchRequest, projectConfig, projectPath } from './validation.ts';

void test('settings reject malformed disk and IPC values', () => {
  for (const input of [null, [], { nightMode: 'true' }, { scanRoots: [1] }, { enginePaths: {} }, { launchTemplates: { Client: 'bad' } }]) {
    assert.throws(() => globalSettings(input));
  }
  assert.deepEqual(globalSettings({ scanRoots: ['C:/Projects'], launchTemplates: { Client: ['{executable}'] } }), {
    scanRoots: ['C:/Projects'], launchTemplates: { Client: ['{executable}'] },
  });
});

void test('config patches omit absent fields so saved values survive', () => {
  assert.deepEqual(projectConfig({ map: '/Game/M' }), { map: '/Game/M' });
  assert.deepEqual(projectConfig({ extraArgs: '' }), { extraArgs: '' });
  assert.throws(() => projectConfig({ lastLaunched: 42 }));
});

void test('launch requests require all fields and a usable project path', () => {
  const request = { projectPath: 'P.uproject', engineVersion: '5.6', map: '', launchMode: 'Client', extraArgs: '' };
  assert.deepEqual(launchRequest(request), request);
  assert.throws(() => launchRequest({ ...request, launchMode: undefined }));
  assert.throws(() => launchRequest({ ...request, map: [] }));
  assert.throws(() => projectPath('P\0.uproject'));
  assert.throws(() => projectPath('P.txt'));
});

void test('template names do not alter object prototypes', () => {
  const input: unknown = JSON.parse('{"launchTemplates":{"__proto__":["{executable}"]}}');
  const templates = globalSettings(input).launchTemplates;
  assert.ok(templates);
  assert.equal(Object.getPrototypeOf(templates), Object.prototype);
  assert.ok(Object.hasOwn(templates, '__proto__'));
});
