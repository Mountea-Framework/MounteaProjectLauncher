import type { GlobalSettings, LaunchRequest, ProjectConfig } from '../../shared/types.ts';

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry: unknown) => typeof entry === 'string');
}

export function projectPath(value: unknown): string {
  if (typeof value !== 'string' || value.includes('\0') || !value.toLowerCase().endsWith('.uproject')) {
    throw new Error('Invalid project path');
  }
  return value;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined || typeof value === 'string') {
    return value;
  }
  throw new Error(`Invalid ${name}`);
}

export function projectConfig(value: unknown): ProjectConfig {
  if (!isObject(value)) {
    throw new Error('Invalid config');
  }
  const fields = {
    engineVersion: optionalString(value.engineVersion, 'engineVersion'),
    map: optionalString(value.map, 'map'),
    launchMode: optionalString(value.launchMode, 'launchMode'),
    extraArgs: optionalString(value.extraArgs, 'extraArgs'),
    lastLaunched: optionalString(value.lastLaunched, 'lastLaunched'),
  };
  return Object.fromEntries(Object.entries(fields).filter(([, entry]) => entry !== undefined));
}

export function launchRequest(value: unknown): LaunchRequest {
  if (!isObject(value)) {
    throw new Error('Invalid request');
  }
  const config = projectConfig(value);
  if (config.engineVersion === undefined || config.map === undefined || config.launchMode === undefined || config.extraArgs === undefined) {
    throw new Error('Missing launch request fields');
  }
  return {
    projectPath: projectPath(value.projectPath),
    engineVersion: config.engineVersion,
    map: config.map,
    launchMode: config.launchMode,
    extraArgs: config.extraArgs,
  };
}

export function globalSettings(value: unknown): Partial<GlobalSettings> {
  if (!isObject(value)) {
    throw new Error('Invalid settings');
  }
  const out: Partial<GlobalSettings> = {};
  if (value.nightMode !== undefined) {
    if (typeof value.nightMode !== 'boolean') {
      throw new Error('Invalid nightMode');
    }
    out.nightMode = value.nightMode;
  }
  if (value.scanRoots !== undefined) {
    if (!stringArray(value.scanRoots)) {
      throw new Error('Invalid scanRoots');
    }
    out.scanRoots = value.scanRoots;
  }
  if (value.enginePaths !== undefined) {
    if (!stringArray(value.enginePaths)) {
      throw new Error('Invalid enginePaths');
    }
    out.enginePaths = value.enginePaths;
  }
  if (value.launchTemplates !== undefined) {
    if (!isObject(value.launchTemplates)) {
      throw new Error('Invalid launchTemplates');
    }
    out.launchTemplates = Object.fromEntries(Object.entries(value.launchTemplates).map(([name, template]) => {
      if (!stringArray(template)) {
        throw new Error('Invalid launchTemplates');
      }
      return [name, template];
    }));
  }
  return out;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
