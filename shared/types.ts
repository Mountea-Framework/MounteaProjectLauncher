// Contract shared by the Electron main process (electron/) and the React renderer (src/).

export interface ProjectInfo {
  /** Absolute path to the .uproject file, preserving its filesystem casing. */
  path: string;
  /** Normalized path used for persisted settings, including legacy lowercase Windows keys. */
  configKey?: string;
  /** Bounded PNG data URL from the project's conventional Unreal thumbnail, when available. */
  thumbnailUrl?: string;
  /** File name without extension. */
  name: string;
  /** Value of EngineAssociation in the .uproject, may be empty. */
  engineAssociation: string;
  /** False when the file no longer exists; the entry is kept so its config survives. */
  exists: boolean;
  /** Where the project was found: "recent" | "documents" | "scanRoot" | "saved". */
  source: string;
}

export interface EngineInstall {
  /** "MajorVersion.MinorVersion", e.g. "5.6". */
  version: string;
  /** Absolute path to UnrealEditor.exe (or UE4Editor.exe). */
  executable: string;
}

export interface MapInfo {
  /** Base name without extension, e.g. "Lvl_Main". */
  name: string;
  /** Unreal path, e.g. "/Game/Maps/Lvl_Main" or "/MyPlugin/Maps/Lvl_Test". */
  unrealPath: string;
}

export interface ProjectDetails {
  engines: EngineInstall[];
  maps: MapInfo[];
}

export interface ProjectConfig {
  engineVersion?: string;
  map?: string;
  launchMode?: string;
  extraArgs?: string;
  lastLaunched?: string;
}

export interface GlobalSettings {
  nightMode: boolean;
  scanRoots: string[];
  enginePaths: string[];
  /** Mode name -> argument template. Tokens: {executable} {uproject_path} {map_path}. */
  launchTemplates: Record<string, string[]>;
}

export interface StoreData {
  version: 1;
  global: GlobalSettings;
  /** Keyed by normalized .uproject path. */
  projects: Record<string, ProjectConfig>;
}

export interface LaunchRequest {
  projectPath: string;
  engineVersion: string;
  map: string;
  launchMode: string;
  extraArgs: string;
}

export interface LaunchResult {
  ok: boolean;
  error?: string;
  /** Preview of what was executed, for display and copy. */
  command: string;
}

/** API exposed to the renderer as window.launcher (see electron/preload.ts). */
export interface LauncherApi {
  scanProjects(): Promise<ProjectInfo[]>;
  getProjectDetails(projectPath: string): Promise<ProjectDetails>;
  openProjectFolder(projectPath: string): Promise<void>;
  pickEngineFolder(initialPath?: string): Promise<string | null>;
  getStore(): Promise<StoreData>;
  setGlobal(settings: Partial<GlobalSettings>): Promise<StoreData>;
  setProjectConfig(projectPath: string, config: ProjectConfig): Promise<StoreData>;
  previewCommand(request: LaunchRequest): Promise<string>;
  launchProject(request: LaunchRequest): Promise<LaunchResult>;
}

declare global {
  interface Window {
    launcher: LauncherApi;
  }
}
