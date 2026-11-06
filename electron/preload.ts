import { contextBridge, ipcRenderer } from 'electron';
import type { LauncherApi } from '../shared/types.ts';

const call = (method: string, ...args: unknown[]) => ipcRenderer.invoke(`launcher:${method}`, ...args);

const api: LauncherApi = {
  scanProjects: () => call('scanProjects'),
  getProjectDetails: (projectPath) => call('getProjectDetails', projectPath),
  getStore: () => call('getStore'),
  setGlobal: (settings) => call('setGlobal', settings),
  setProjectConfig: (projectPath, config) => call('setProjectConfig', projectPath, config),
  previewCommand: (request) => call('previewCommand', request),
  launchProject: (request) => call('launchProject', request),
};

contextBridge.exposeInMainWorld('launcher', api);
