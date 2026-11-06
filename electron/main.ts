import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCommandArgs, formatCommand } from './core/command.ts';
import { detectEngines, listMaps, scanProjects } from './core/scan.ts';
import { getStore, loadStore, readDefaults, setProjectConfig, updateGlobal } from './core/store.ts';
import type { GlobalSettings, LaunchRequest, LaunchResult, ProjectConfig } from '../shared/types.ts';

const here = path.dirname(fileURLToPath(import.meta.url));

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');

function projectPath(v: unknown): string {
  if (typeof v !== 'string' || !v.toLowerCase().endsWith('.uproject')) throw new Error('Invalid project path');
  return v;
}

function request(v: unknown): LaunchRequest {
  if (!isObj(v)) throw new Error('Invalid request');
  for (const k of ['engineVersion', 'map', 'launchMode', 'extraArgs']) if (typeof v[k] !== 'string') throw new Error(`Invalid ${k}`);
  return { projectPath: projectPath(v.projectPath), engineVersion: v.engineVersion as string, map: v.map as string, launchMode: v.launchMode as string, extraArgs: v.extraArgs as string };
}

function config(v: unknown): ProjectConfig {
  if (!isObj(v)) throw new Error('Invalid config');
  const out: ProjectConfig = {};
  for (const k of ['engineVersion', 'map', 'launchMode', 'extraArgs', 'lastLaunched'] as const) {
    if (v[k] === undefined) continue;
    if (typeof v[k] !== 'string') throw new Error(`Invalid ${k}`);
    out[k] = v[k] as string;
  }
  return out;
}

function globalSettings(v: unknown): Partial<GlobalSettings> {
  if (!isObj(v)) throw new Error('Invalid settings');
  const out: Partial<GlobalSettings> = {};
  if (v.nightMode !== undefined) {
    if (typeof v.nightMode !== 'boolean') throw new Error('Invalid nightMode');
    out.nightMode = v.nightMode;
  }
  for (const k of ['scanRoots', 'enginePaths'] as const) {
    if (v[k] === undefined) continue;
    if (!isStrArr(v[k])) throw new Error(`Invalid ${k}`);
    out[k] = v[k] as string[];
  }
  if (v.launchTemplates !== undefined) {
    const t = v.launchTemplates;
    if (!isObj(t) || !Object.values(t).every(isStrArr)) throw new Error('Invalid launchTemplates');
    out.launchTemplates = t as Record<string, string[]>;
  }
  return out;
}

function resolveCommand(r: LaunchRequest) {
  const c = buildCommandArgs(r, getStore().global);
  return { ...c, command: formatCommand(c.file, c.args) };
}

async function launch(r: LaunchRequest): Promise<LaunchResult> {
  let c;
  try {
    c = resolveCommand(r);
  } catch (e) {
    return { ok: false, error: (e as Error).message, command: '' };
  }
  const child = spawn(c.file, c.args, { detached: true, stdio: 'ignore' });
  const err = await new Promise<Error | undefined>((res) => {
    child.once('error', res);
    child.once('spawn', () => res(undefined));
  });
  if (err) return { ok: false, error: err.message, command: c.command };
  child.unref();
  setProjectConfig(r.projectPath, { lastLaunched: new Date().toISOString() });
  return { ok: true, command: c.command };
}

function registerIpc() {
  const h = (name: string, fn: (...a: any[]) => unknown) => ipcMain.handle(`launcher:${name}`, (_e, ...a) => fn(...a));
  h('scanProjects', () => scanProjects(getStore().global.scanRoots));
  h('getProjectDetails', (p) => {
    const pp = projectPath(p);
    return { engines: detectEngines(getStore().global.enginePaths), maps: listMaps(pp) };
  });
  h('getStore', () => getStore());
  h('setGlobal', (s) => updateGlobal(globalSettings(s)));
  h('setProjectConfig', (p, c) => setProjectConfig(projectPath(p), config(c)));
  h('previewCommand', (r) => {
    try {
      return resolveCommand(request(r)).command;
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  });
  h('launchProject', (r) => launch(request(r)));
}

function createWindow() {
  // Sandboxed preloads must be CJS; accept whichever extension the bundler emitted.
  const preload = ['preload.cjs', 'preload.mjs', 'preload.js'].map((f) => path.join(here, f)).find((f) => fs.existsSync(f));
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload },
  });
  const dev = process.env.VITE_DEV_SERVER_URL;
  if (dev) win.loadURL(dev);
  else win.loadFile(path.join(here, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  loadStore(app.getPath('userData'), readDefaults(path.join(app.getAppPath(), 'Config', 'DefaultConfig.json')));
  registerIpc();
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
