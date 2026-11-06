import { detectEngines } from './scan.ts';
import type { GlobalSettings, LaunchRequest } from '../../shared/types.ts';

export interface TemplateValues {
  executable: string;
  uproject_path: string;
  map_path: string;
}

/** Split on whitespace outside double quotes; quotes are removed. */
export function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let has = false;
  let quoted = false;
  for (const ch of s) {
    if (ch === '"') {
      quoted = !quoted;
      has = true;
    } else if (!quoted && /\s/.test(ch)) {
      if (has) out.push(cur);
      cur = '';
      has = false;
    } else {
      cur += ch;
      has = true;
    }
  }
  if (has) out.push(cur);
  return out;
}

export function buildArgs(template: string[], values: TemplateValues): string[] {
  const out: string[] = [];
  for (const token of template) {
    // A token that needs a map is dropped entirely when no map is chosen.
    if (token.includes('{map_path}') && !values.map_path) continue;
    const t = token.replace(/\{(executable|uproject_path|map_path)\}/g, (placeholder: string) => {
      switch (placeholder) {
        case '{executable}':
          return values.executable;
        case '{uproject_path}':
          return values.uproject_path;
        case '{map_path}':
          return values.map_path;
        default:
          return placeholder;
      }
    });
    if (t) out.push(t);
  }
  return out;
}

export function buildCommandArgs(request: LaunchRequest, settings: GlobalSettings): { file: string; args: string[] } {
  const template = Object.entries(settings.launchTemplates).find(([mode]) => mode === request.launchMode)?.[1];
  if (!template) throw new Error(`Unknown launch mode: ${request.launchMode}`);
  const engine = detectEngines(settings.enginePaths).find((e) => e.version === request.engineVersion);
  if (!engine) throw new Error(`Engine ${request.engineVersion || '(none)'} not found`);
  const [file, ...args] = buildArgs(template, {
    executable: engine.executable,
    uproject_path: request.projectPath,
    map_path: request.map,
  });
  if (!file) throw new Error('Launch template is empty');
  return { file, args: [...args, ...splitArgs(request.extraArgs)] };
}

export function formatCommand(file: string, args: string[]): string {
  return [file, ...args].map((a) => (/[\s"]/.test(a) || a === '' ? `"${a.replace(/"/g, '\\"')}"` : a)).join(' ');
}
