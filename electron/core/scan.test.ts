import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectEngines, listMaps, scanProjects } from './scan.ts';
import { normalizePath } from './store.ts';

const touch = (p: string, c: string | Buffer = '') => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  fs.mkdirSync(path.dirname(p), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test fixture paths are generated beneath an OS temporary directory.
  fs.writeFileSync(p, c);
};

void test('scanProjects restores Windows casing and deduplicates recent paths and junction aliases', { skip: process.platform !== 'win32' }, () => {
  // Runner TEMP may use a junction or an 8.3 alias. Canonicalize only the fixture's parent,
  // so the expected project path still independently checks the mixed-case file names.
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'scan-case-')));
  const projectPath = path.join(root, 'MixedCaseProject', 'MyProject.uproject');
  touch(projectPath, '{"EngineAssociation":"5.6"}');
  const aliasRoot = path.join(root, 'ProjectAlias');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Both junction paths belong to this isolated temporary fixture.
  fs.symlinkSync(path.dirname(projectPath), aliasRoot, 'junction');
  const settingsRoot = path.join(root, 'Settings');
  const recentPath = path.join(aliasRoot, 'MyProject.uproject').toLowerCase();
  touch(path.join(settingsRoot, 'UnrealEngine', '5.6', 'Saved', 'Config', 'WindowsEditor', 'EditorSettings.ini'),
    `RecentlyOpenedProjectFiles=${recentPath}`);

  const found = scanProjects([root, root.toLowerCase(), aliasRoot], {
    platform: 'win32',
    homeDir: root,
    localAppData: settingsRoot,
  });
  assert.equal(found.length, 1);
  assert.equal(found[0].path, projectPath);
  assert.equal(found[0].name, 'MyProject');
  assert.equal(found[0].configKey, normalizePath(projectPath));
  assert.equal(found[0].engineAssociation, '5.6');
  assert.equal(found[0].source, 'recent');
});

void test('scanProjects uses Unreal thumbnail priority and tolerates missing, corrupt, and oversized images', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-image-'));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  const cases = ['Explicit', 'Automatic', 'Corrupt', 'Missing', 'Oversized'];
  for (const name of cases) touch(path.join(root, name, `${name}.uproject`), '{}');
  touch(path.join(root, 'Explicit', 'Explicit.png'), png);
  touch(path.join(root, 'Explicit', 'Saved', 'AutoScreenshot.png'), 'invalid ignored screenshot');
  touch(path.join(root, 'Automatic', 'Automatic.png'), 'corrupt image');
  touch(path.join(root, 'Automatic', 'Saved', 'AutoScreenshot.png'), png);
  touch(path.join(root, 'Corrupt', 'Corrupt.png'), Buffer.alloc(64));
  touch(path.join(root, 'Oversized', 'Oversized.png'), Buffer.alloc(2 * 1024 * 1024 + 1));
  const found = scanProjects([root]);
  for (const name of ['Explicit', 'Automatic']) {
    assert.equal(found.find((project) => project.name === name)?.thumbnailUrl, `data:image/png;base64,${png.toString('base64')}`);
  }
  for (const name of ['Corrupt', 'Missing', 'Oversized']) {
    assert.equal(found.find((project) => project.name === name)?.thumbnailUrl, undefined);
  }
});

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
  const e = detectEngines([root, root], { platform: 'win32' }).filter((x) => x.executable.startsWith(root));
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
  assert.deepEqual(detectEngines([root], { platform: 'win32' }).filter((engine) => engine.executable.startsWith(root)), []);
});

void test('macOS engines resolve installed roots, selected editor bundles and registered source builds', () => {
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mac-eng-'));
  const installedRoot = path.join(homeDir, 'Epic Games');
  const modern = path.join(installedRoot, 'UE_5.6');
  const legacy = path.join(homeDir, 'Source UE4');
  const modernBundle = path.join(modern, 'Engine', 'Binaries', 'Mac', 'UnrealEditor.app');
  const legacyBundle = path.join(legacy, 'Engine', 'Binaries', 'Mac', 'UE4Editor.app');
  touch(path.join(modernBundle, 'Contents', 'MacOS', 'UnrealEditor'));
  touch(path.join(modern, 'Engine', 'Build', 'Build.version'), '{"MajorVersion":5,"MinorVersion":6}');
  touch(path.join(legacyBundle, 'Contents', 'MacOS', 'UE4Editor'));
  touch(path.join(legacy, 'Engine', 'Build', 'Build.version'), '{"MajorVersion":4,"MinorVersion":27}');
  touch(path.join(installedRoot, 'WindowsOnly', 'Engine', 'Binaries', 'Win64', 'UnrealEditor.exe'));
  touch(path.join(installedRoot, 'WindowsOnly', 'Engine', 'Build', 'Build.version'), '{"MajorVersion":5,"MinorVersion":5}');
  touch(path.join(homeDir, 'Library', 'Application Support', 'Epic', 'UnrealEngine', 'Install.ini'),
    `[Installations]\n{source-build}="${legacy}"\n[Other]\nignored=${installedRoot}`);
  const found = detectEngines([installedRoot, modernBundle, legacyBundle], { platform: 'darwin', homeDir });
  assert.deepEqual(found, [
    { version: '4.27', executable: path.join(legacyBundle, 'Contents', 'MacOS', 'UE4Editor') },
    { version: '5.6', executable: path.join(modernBundle, 'Contents', 'MacOS', 'UnrealEditor') },
  ]);
  assert.deepEqual(detectEngines([], { platform: 'darwin', homeDir }), [found[0]]);
});

void test('macOS recent projects include modern and legacy settings with POSIX paths and spaces', () => {
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mac-recent-'));
  const modernProject = path.join(homeDir, 'Projects With Spaces', 'Modern Project.uproject');
  const legacyProject = path.join(homeDir, 'Projects With Spaces', 'Legacy Project.uproject');
  touch(modernProject, '{"EngineAssociation":"5.6"}');
  touch(legacyProject, '{"EngineAssociation":"4.27"}');
  touch(path.join(homeDir, 'Library', 'Application Support', 'Epic', 'UnrealEngine', '5.6', 'Saved', 'Config', 'MacEditor', 'EditorSettings.ini'),
    `RecentlyOpenedProjectFiles=(ProjectName="${modernProject}",LastOpenTime=123)\nRecentlyOpenedProjectFiles="/Users/Test Person/Unreal Projects/Missing Project.uproject"`);
  touch(path.join(homeDir, 'Library', 'Preferences', 'Unreal Engine', '4.27', 'EditorSettings.ini'),
    `RecentlyOpenedProjectFiles=${legacyProject}`);
  const found = scanProjects([path.dirname(modernProject)], { platform: 'darwin', homeDir });
  assert.equal(found.length, 3);
  assert.ok(found.every((project) => project.source === 'recent'));
  assert.equal(found.find((project) => project.name === 'Modern Project')?.exists, true);
  assert.equal(found.find((project) => project.name === 'Legacy Project')?.exists, true);
  assert.equal(found.find((project) => project.name === 'Missing Project')?.path,
    path.resolve('/Users/Test Person/Unreal Projects/Missing Project.uproject'));
});
