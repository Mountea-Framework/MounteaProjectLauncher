import { contextBridge, ipcRenderer } from 'electron';
import type { LauncherApi } from '../shared/types.ts';

// Main owns these handlers and validates requests before returning the shared API contract.
const call = <Method extends keyof LauncherApi>(method: Method, ...args: Parameters<LauncherApi[Method]>): ReturnType<LauncherApi[Method]> =>
  ipcRenderer.invoke(`launcher:${method}`, ...args) as ReturnType<LauncherApi[Method]>;

const api: LauncherApi = {
  scanProjects: () => call('scanProjects'),
  getProjectDetails: (projectPath) => call('getProjectDetails', projectPath),
  openProjectFolder: (projectPath) => call('openProjectFolder', projectPath),
  getStore: () => call('getStore'),
  setGlobal: (settings) => call('setGlobal', settings),
  setProjectConfig: (projectPath, config) => call('setProjectConfig', projectPath, config),
  previewCommand: (request) => call('previewCommand', request),
  launchProject: (request) => call('launchProject', request),
};

contextBridge.exposeInMainWorld('launcher', api);
