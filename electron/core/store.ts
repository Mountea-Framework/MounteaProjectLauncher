import fs from 'node:fs';
import path from 'node:path';
import { globalSettings, isObject, projectConfig } from './validation.ts';
import type { GlobalSettings, ProjectConfig, StoreData } from '../../shared/types.ts';

export function normalizePath(p: string): string {
  const r = path.resolve(p);
  return process.platform === 'win32' ? r.toLowerCase() : r;
}

/** Resolve existing filesystem casing independently of the stable settings key. */
export function displayPath(p: string): string {
  try {
    // Read-only canonicalization restores Windows filesystem casing for discovered project paths.
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
}

let dir = '';
let defaults: GlobalSettings;
let data: StoreData;

const file = () => path.join(dir, 'settings.json');

/** Reads Config/DefaultConfig.json-style defaults; missing/bad file gives empty defaults. */
export function readDefaults(defaultsFile: string): GlobalSettings {
  const base: GlobalSettings = { nightMode: true, scanRoots: [], enginePaths: [], launchTemplates: {} };
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Defaults path is supplied by main from the application installation directory.
    const parsed: unknown = JSON.parse(fs.readFileSync(defaultsFile, 'utf8'));
    return { ...base, ...globalSettings(parsed) };
  } catch {
    return base;
  }
}

/** Keep common launch templates while choosing shipped engine search roots for this OS. */
export function readApplicationDefaults(configDirectory: string, platform: NodeJS.Platform = process.platform): GlobalSettings {
  const settings = readDefaults(path.join(configDirectory, 'DefaultConfig.json'));
  if (platform === 'darwin') {
    settings.enginePaths = readDefaults(path.join(configDirectory, 'DefaultConfig.mac.json')).enginePaths;
  }
  return settings;
}

function save() {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Store directory comes from Electron userData, never from renderer input.
  fs.mkdirSync(dir, { recursive: true });
  const tmp = file() + '.tmp';
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Temporary settings filename is fixed inside the trusted userData store directory.
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Both filenames are fixed settings paths inside the trusted userData store directory.
  fs.renameSync(tmp, file());
}

export function loadStore(storeDir: string, defaultGlobal: GlobalSettings): StoreData {
  dir = storeDir;
  defaults = defaultGlobal;
  data = { version: 1, global: { ...defaults }, projects: {} };
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Settings filename is fixed inside the trusted userData store directory.
  if (!fs.existsSync(file())) return data;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Settings filename is fixed inside the trusted userData store directory.
    const parsed: unknown = JSON.parse(fs.readFileSync(file(), 'utf8'));
    if (!isObject(parsed) || !isObject(parsed.projects)) {
      throw new Error('Invalid store');
    }
    const global = { ...defaults, ...globalSettings(parsed.global) };
    const projects = Object.fromEntries(Object.entries(parsed.projects).map(([key, value]) => [key, projectConfig(value)]));
    data = { version: 1, global, projects };
  } catch {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Quarantine destination is generated inside the trusted userData store directory.
    fs.renameSync(file(), path.join(dir, `settings.corrupt-${Date.now()}.json`));
  }
  return data;
}

export function getStore(): StoreData {
  return data;
}

export function updateGlobal(partial: Partial<GlobalSettings>): StoreData {
  data.global = { ...data.global, ...partial };
  save();
  return data;
}

/** Merges into the existing entry so omitted fields (e.g. lastLaunched) survive. */
export function setProjectConfig(projectPath: string, config: ProjectConfig): StoreData {
  const key = normalizePath(projectPath);
  const previous = Object.entries(data.projects).find(([entry]) => entry === key)?.[1];
  Object.defineProperty(data.projects, key, {
    value: { ...previous, ...config },
    writable: true,
    enumerable: true,
    configurable: true,
  });
  save();
  return data;
}
