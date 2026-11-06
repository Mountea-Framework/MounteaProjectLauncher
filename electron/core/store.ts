import fs from 'node:fs';
import path from 'node:path';
import type { GlobalSettings, ProjectConfig, StoreData } from '../../shared/types.ts';

export function normalizePath(p: string): string {
  const r = path.resolve(p);
  return process.platform === 'win32' ? r.toLowerCase() : r;
}

let dir = '';
let defaults: GlobalSettings;
let data: StoreData;

const file = () => path.join(dir, 'settings.json');
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Reads Config/DefaultConfig.json-style defaults; missing/bad file gives empty defaults. */
export function readDefaults(defaultsFile: string): GlobalSettings {
  const base: GlobalSettings = { nightMode: true, scanRoots: [], enginePaths: [], launchTemplates: {} };
  try {
    const j = JSON.parse(fs.readFileSync(defaultsFile, 'utf8'));
    return isObj(j) ? { ...base, ...(j as Partial<GlobalSettings>) } : base;
  } catch {
    return base;
  }
}

function save() {
  fs.mkdirSync(dir, { recursive: true });
  const tmp = file() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file());
}

export function loadStore(storeDir: string, defaultGlobal: GlobalSettings): StoreData {
  dir = storeDir;
  defaults = defaultGlobal;
  data = { version: 1, global: { ...defaults }, projects: {} };
  if (!fs.existsSync(file())) return data;
  try {
    const j = JSON.parse(fs.readFileSync(file(), 'utf8'));
    if (!isObj(j) || !isObj(j.global) || !isObj(j.projects)) throw new Error('bad shape');
    data = { version: 1, global: { ...defaults, ...(j.global as Partial<GlobalSettings>) }, projects: j.projects as StoreData['projects'] };
  } catch {
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
  data.projects[key] = { ...data.projects[key], ...config };
  save();
  return data;
}
