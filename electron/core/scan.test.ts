import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectEngines, listMaps, scanProjects } from './scan.ts';

const touch = (p: string, c = '') => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  fs.mkdirSync(path.dirname(p), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  fs.writeFileSync(p, c);
};

void test('scanProjects finds, dedupes and tolerates bad json', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'));
  touch(path.join(root, 'A', 'A.uproject'), '{"EngineAssociation":"5.6"}');
  touch(path.join(root, 'B', 'B.uproject'), '{bad');
  touch(path.join(root, 'node_modules', 'C', 'C.uproject'), '{}');
  touch(path.join(root, 'a', 'b', 'c', 'd', 'e', 'Deep.uproject'), '{}');
  const found = scanProjects([root, root]).filter((p) => p.source === 'scanRoot');
  assert.deepEqual(found.map((p) => p.name).sort(), ['A', 'B']);
  assert.equal(found.find((p) => p.name === 'A')?.engineAssociation, '5.6');
  assert.equal(found.find((p) => p.name === 'B')?.engineAssociation, '');
  assert.ok(found.every((p) => p.exists));
});

void test('listMaps maps Game and plugin paths', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'maps-'));
  touch(path.join(root, 'P.uproject'), '{}');
  touch(path.join(root, 'Content', 'Maps', 'Lvl.umap'));
  touch(path.join(root, 'Plugins', 'Foo', 'Content', 'Maps', 'T.umap'));
  touch(path.join(root, 'Plugins', 'Bar', 'Content', 'Maps', 'T.umap'));
  assert.deepEqual(listMaps(path.join(root, 'P.uproject')).map((m) => m.unrealPath), ['/Bar/Maps/T', '/Foo/Maps/T', '/Game/Maps/Lvl']);
});

void test('detectEngines reads Build.version', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eng-'));
  touch(path.join(root, 'UE_5.6', 'Engine', 'Binaries', 'Win64', 'UnrealEditor.exe'));
  touch(path.join(root, 'UE_5.6', 'Engine', 'Build', 'Build.version'), '{"MajorVersion":5,"MinorVersion":6}');
  touch(path.join(root, 'UE_X', 'Engine', 'Binaries', 'Win64', 'UnrealEditor.exe'));
  const e = detectEngines([root, root]).filter((x) => x.executable.startsWith(root));
  assert.equal(e.length, 1);
  assert.equal(e[0].version, '5.6');
});

void test('detectEngines skips malformed version fields', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eng-'));
  for (const [index, version] of [
    { MajorVersion: '5', MinorVersion: 6 },
    { MajorVersion: {}, MinorVersion: [] },
    { MajorVersion: 5, MinorVersion: -1 },
    { MajorVersion: 5.5, MinorVersion: 6 },
  ].entries()) {
    const engine = path.join(root, String(index));
    touch(path.join(engine, 'Engine', 'Binaries', 'Win64', 'UnrealEditor.exe'));
    touch(path.join(engine, 'Engine', 'Build', 'Build.version'), JSON.stringify(version));
  }
  assert.deepEqual(detectEngines([root]).filter((engine) => engine.executable.startsWith(root)), []);
});
