import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCommandArgs, formatCommand } from './core/command.ts';
import { detectEngines, listMaps, scanProjects } from './core/scan.ts';
import { getStore, loadStore, readDefaults, setProjectConfig, updateGlobal } from './core/store.ts';
import type { LaunchRequest, LaunchResult } from '../shared/types.ts';
import { errorMessage, globalSettings, launchRequest, projectConfig, projectPath } from './core/validation.ts';

const here = path.dirname(fileURLToPath(import.meta.url));

function resolveCommand(r: LaunchRequest) {
  const c = buildCommandArgs(r, getStore().global);
  return { ...c, command: formatCommand(c.file, c.args) };
}

async function launch(r: LaunchRequest): Promise<LaunchResult> {
  let c;
  try {
    c = resolveCommand(r);
  } catch (e) {
    return { ok: false, error: errorMessage(e), command: '' };
  }
  const child = spawn(c.file, c.args, { detached: true, stdio: 'ignore' });
  const err = await new Promise<Error | undefined>((res) => {
    child.once('error', res);
    child.once('spawn', () => {
      res(undefined);
    });
  });
  if (err) return { ok: false, error: err.message, command: c.command };
  child.unref();
  setProjectConfig(r.projectPath, { lastLaunched: new Date().toISOString() });
  return { ok: true, command: c.command };
}

function registerIpc() {
  const h = (name: string, fn: (...args: unknown[]) => unknown) => {
    ipcMain.handle(`launcher:${name}`, (_event, ...args: unknown[]) => fn(...args));
  };
  h('scanProjects', () => scanProjects(getStore().global.scanRoots));
  h('getProjectDetails', (p) => {
    const pp = projectPath(p);
    return { engines: detectEngines(getStore().global.enginePaths), maps: listMaps(pp) };
  });
  h('getStore', () => getStore());
  h('setGlobal', (s) => updateGlobal(globalSettings(s)));
  h('setProjectConfig', (p, c) => setProjectConfig(projectPath(p), projectConfig(c)));
  h('previewCommand', (r) => {
    try {
      return resolveCommand(launchRequest(r)).command;
    } catch (e) {
      return `Error: ${errorMessage(e)}`;
    }
  });
  h('launchProject', (r) => launch(launchRequest(r)));
}

function createWindow() {
  // Sandboxed preloads must be CJS; accept whichever extension the bundler emitted.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Preload candidates are fixed filenames relative to the installed main bundle.
  const preload = ['preload.cjs', 'preload.mjs', 'preload.js'].map((f) => path.join(here, f)).find((f) => fs.existsSync(f));
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload },
  });
  const dev = process.env.VITE_DEV_SERVER_URL;
  const loaded = dev ? win.loadURL(dev) : win.loadFile(path.join(here, '..', 'dist', 'index.html'));
  loaded.catch((error: unknown) => {
    console.error('Failed to load launcher window:', errorMessage(error));
  });
}

app.whenReady().then(() => {
  loadStore(app.getPath('userData'), readDefaults(path.join(app.getAppPath(), 'Config', 'DefaultConfig.json')));
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((error: unknown) => {
  console.error('Failed to start launcher:', errorMessage(error));
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
