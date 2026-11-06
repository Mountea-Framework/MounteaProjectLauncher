import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizePath } from './store.ts';
import type { EngineInstall, MapInfo, ProjectInfo } from '../../shared/types.ts';

const SKIP = new Set(['node_modules', 'intermediate', 'binaries', 'saved', '.git', 'deriveddatacache']);
const MAX_DEPTH = 4;
const LAUNCHER_DAT = 'C:\\ProgramData\\Epic\\UnrealEngineLauncher\\LauncherInstalled.dat';

function readJson(p: string): any {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return undefined;
  }
}

function readDir(p: string): fs.Dirent[] {
  try {
    return fs.readdirSync(p, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** Collects *.uproject files up to maxDepth levels below root. */
function findUprojects(root: string, maxDepth: number, out: string[] = [], depth = 0): string[] {
  for (const e of readDir(root)) {
    if (e.isFile() && e.name.toLowerCase().endsWith('.uproject')) out.push(path.join(root, e.name));
    else if (e.isDirectory() && depth < maxDepth && !SKIP.has(e.name.toLowerCase())) findUprojects(path.join(root, e.name), maxDepth, out, depth + 1);
  }
  return out;
}

/** Project paths from every installed engine's EditorSettings.ini (format varies by version, so match any .uproject path on a *ProjectFiles line). */
function recentProjects(): string[] {
  const base = path.join(process.env.LOCALAPPDATA ?? '', 'UnrealEngine');
  const out: string[] = [];
  for (const v of readDir(base)) {
    let text = '';
    try {
      text = fs.readFileSync(path.join(base, v.name, 'Saved', 'Config', 'WindowsEditor', 'EditorSettings.ini'), 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      if (!/ProjectFiles/i.test(line)) continue;
      for (const m of line.matchAll(/[A-Za-z]:[^"=,()]*?\.uproject/gi)) out.push(m[0]);
    }
  }
  return out;
}

// shortcut: Documents assumed at ~/Documents (misses OneDrive-redirected folders), upgrade by asking the shell API for the known folder.
export function scanProjects(scanRoots: string[]): ProjectInfo[] {
  const found: [string, string][] = [];
  for (const p of recentProjects()) found.push([p, 'recent']);
  for (const p of findUprojects(path.join(os.homedir(), 'Documents', 'Unreal Projects'), 2)) found.push([p, 'documents']);
  for (const r of scanRoots) for (const p of findUprojects(r, MAX_DEPTH)) found.push([p, 'scanRoot']);

  const seen = new Map<string, ProjectInfo>();
  for (const [p, source] of found) {
    const key = normalizePath(p);
    if (seen.has(key)) continue;
    const exists = fs.existsSync(key);
    const assoc = exists ? readJson(key)?.EngineAssociation : undefined;
    seen.set(key, {
      path: key,
      name: path.basename(p, path.extname(p)),
      engineAssociation: typeof assoc === 'string' ? assoc : '',
      exists,
      source,
    });
  }
  return [...seen.values()];
}

function engineAt(root: string): EngineInstall | undefined {
  const bin = path.join(root, 'Engine', 'Binaries', 'Win64');
  for (const exe of ['UnrealEditor.exe', 'UE4Editor.exe']) {
    const executable = path.join(bin, exe);
    if (!fs.existsSync(executable)) continue;
    const b = readJson(path.join(root, 'Engine', 'Build', 'Build.version'));
    if (b?.MajorVersion === undefined || b?.MinorVersion === undefined) return undefined;
    return { version: `${b.MajorVersion}.${b.MinorVersion}`, executable };
  }
}

export function detectEngines(enginePaths: string[]): EngineInstall[] {
  const roots = [...enginePaths];
  for (const e of enginePaths) for (const d of readDir(e)) if (d.isDirectory()) roots.push(path.join(e, d.name));
  for (const i of readJson(LAUNCHER_DAT)?.InstallationList ?? []) if (typeof i?.InstallLocation === 'string') roots.push(i.InstallLocation);

  const seen = new Map<string, EngineInstall>();
  for (const r of roots) {
    const eng = engineAt(r);
    if (eng && !seen.has(normalizePath(eng.executable))) seen.set(normalizePath(eng.executable), eng);
  }
  return [...seen.values()].sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
}

function walkUmaps(dir: string, rel: string[], prefix: string, out: Map<string, MapInfo>) {
  for (const e of readDir(dir)) {
    if (e.isDirectory()) walkUmaps(path.join(dir, e.name), [...rel, e.name], prefix, out);
    else if (e.isFile() && e.name.toLowerCase().endsWith('.umap')) {
      const name = e.name.slice(0, -'.umap'.length);
      const unrealPath = `/${[prefix, ...rel, name].join('/')}`;
      out.set(unrealPath, { name, unrealPath });
    }
  }
}

/** projectPath is the .uproject file (or its directory); the directory holds Content/ and Plugins/. */
export function listMaps(projectPath: string): MapInfo[] {
  const root = projectPath.toLowerCase().endsWith('.uproject') ? path.dirname(projectPath) : projectPath;
  const out = new Map<string, MapInfo>();
  walkUmaps(path.join(root, 'Content'), [], 'Game', out);
  for (const p of readDir(path.join(root, 'Plugins'))) {
    if (p.isDirectory()) walkUmaps(path.join(root, 'Plugins', p.name, 'Content'), [], p.name, out);
  }
  return [...out.values()].sort((a, b) => a.unrealPath.localeCompare(b.unrealPath));
}
