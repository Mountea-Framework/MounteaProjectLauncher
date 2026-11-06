import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildArgs, buildCommandArgs, formatCommand, splitArgs } from './command.ts';
import type { GlobalSettings } from '../../shared/types.ts';

const v = { executable: 'E.exe', uproject_path: 'C:/My Proj/P.uproject', map_path: '/Game/M' };

test('splitArgs respects quotes', () => {
  assert.deepEqual(splitArgs('-a  "b c" -d="e f" ""'), ['-a', 'b c', '-d=e f', '']);
});

test('buildArgs drops map tokens when map empty', () => {
  const t = ['{executable}', '{uproject_path}', '{map_path}?listen', '-log'];
  assert.deepEqual(buildArgs(t, v), ['E.exe', 'C:/My Proj/P.uproject', '/Game/M?listen', '-log']);
  assert.deepEqual(buildArgs(t, { ...v, map_path: '' }), ['E.exe', 'C:/My Proj/P.uproject', '-log']);
});

test('buildCommandArgs resolves engine and appends extraArgs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eng-'));
  const bin = path.join(root, 'UE_5.6', 'Engine', 'Binaries', 'Win64');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(root, 'UE_5.6', 'Engine', 'Build'));
  fs.writeFileSync(path.join(bin, 'UnrealEditor.exe'), '');
  fs.writeFileSync(path.join(root, 'UE_5.6', 'Engine', 'Build', 'Build.version'), '{"MajorVersion":5,"MinorVersion":6}');
  const settings: GlobalSettings = { nightMode: true, scanRoots: [], enginePaths: [root], launchTemplates: { S: ['{executable}', '{uproject_path}', '{map_path}'] } };
  const req = { projectPath: 'P.uproject', engineVersion: '5.6', map: '', launchMode: 'S', extraArgs: '-x "a b"' };
  const { file, args } = buildCommandArgs(req, settings);
  assert.equal(file, path.join(bin, 'UnrealEditor.exe'));
  assert.deepEqual(args, ['P.uproject', '-x', 'a b']);
  assert.match(formatCommand(file, args), /"a b"$/);
  assert.throws(() => buildCommandArgs({ ...req, launchMode: 'nope' }, settings));
  assert.throws(() => buildCommandArgs({ ...req, engineVersion: '9.9' }, settings));
});
