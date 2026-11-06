import { useEffect, useState } from 'react';
import { Copy, Play } from 'lucide-react';
import type { LaunchRequest, ProjectConfig, ProjectDetails, ProjectInfo, StoreData } from '../../shared/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  project: ProjectInfo;
  store: StoreData;
  onStore: (s: StoreData) => void;
}

// Remounted per project (key in App), so state initialises from the saved config once.
export function ProjectPanel({ project, store, onStore }: Props) {
  const saved = store.projects[project.path] ?? {};
  const modes = Object.keys(store.global.launchTemplates);
  const [details, setDetails] = useState<ProjectDetails>({ engines: [], maps: [] });
  const [engineVersion, setEngineVersion] = useState(saved.engineVersion ?? '');
  const [map, setMap] = useState(saved.map ?? '');
  const [launchMode, setLaunchMode] = useState(saved.launchMode ?? modes[0] ?? '');
  const [extraArgs, setExtraArgs] = useState(saved.extraArgs ?? '');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.launcher.getProjectDetails(project.path).then((d) => {
      setDetails(d);
      // Preselect the engine matching EngineAssociation when nothing was saved.
      setEngineVersion((cur) => cur || d.engines.find((e) => e.version === project.engineAssociation)?.version || '');
      setLoaded(true);
    });
  }, [project]);

  const request: LaunchRequest = { projectPath: project.path, engineVersion, map, launchMode, extraArgs };

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      const config: ProjectConfig = { ...saved, engineVersion, map, launchMode, extraArgs };
      window.launcher.setProjectConfig(project.path, config).then(onStore);
      window.launcher.previewCommand(request).then(setPreview).catch((e) => setPreview(String(e)));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, engineVersion, map, launchMode, extraArgs]);

  async function launch() {
    setError('');
    const res = await window.launcher
      .launchProject(request)
      .catch((e) => ({ ok: false, error: String(e), command: '' }));
    if (!res.ok) setError(res.error ?? 'Launch failed');
  }

  return (
    <>
      <DrawerHeader className="shrink-0 gap-2 border-b px-6 pb-5 pt-3 text-left sm:px-8">
        <div className="flex items-center gap-3">
          <DrawerTitle className="text-xl">{project.name}</DrawerTitle>
          {project.engineAssociation && <Badge variant="secondary">UE {project.engineAssociation}</Badge>}
        </div>
        <DrawerDescription className="truncate text-xs" title={project.path}>{project.path}</DrawerDescription>
      </DrawerHeader>
      <div className="drawer-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="px-6 py-6 sm:px-8">
          <section className="min-w-0 space-y-5" aria-labelledby="launch-settings-heading">
            <h2 id="launch-settings-heading" className="text-sm font-semibold">Launch settings</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="launch-map">Startup map</Label>
                <Select value={map || '__project_default__'} onValueChange={(value) => setMap(value === '__project_default__' ? '' : value)} disabled={!loaded}>
                  <SelectTrigger id="launch-map"><SelectValue placeholder="Select a map" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__project_default__">Project default</SelectItem>
                    {details.maps.map((m) => (
                      <SelectItem key={m.unrealPath} value={m.unrealPath} title={m.unrealPath}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="truncate text-xs text-muted-foreground" title={map || undefined}>
                  {map || 'Use the map configured in Unreal Engine'}
                </p>
              </div>
            <div className="space-y-2">
              <Label htmlFor="launch-engine">Engine version</Label>
              <Select value={engineVersion} onValueChange={setEngineVersion}>
                <SelectTrigger id="launch-engine"><SelectValue placeholder="Select an engine" /></SelectTrigger>
                <SelectContent>
                  {details.engines.map((e) => (
                    <SelectItem key={e.version} value={e.version}>{e.version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
            <div className="space-y-2">
              <p id="launch-mode-label" className="text-sm font-medium">Launch mode</p>
              <Tabs value={launchMode} onValueChange={setLaunchMode}>
                <TabsList aria-labelledby="launch-mode-label" className="h-auto w-full flex-wrap justify-start gap-1">
                  {modes.map((m) => <TabsTrigger className="flex-1" key={m} value={m}>{m}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label htmlFor="launch-args">Extra arguments</Label>
              <Input id="launch-args" value={extraArgs} onChange={(e) => setExtraArgs(e.target.value)} placeholder="e.g. -log -windowed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="launch-preview">Command preview</Label>
              <Textarea id="launch-preview" readOnly rows={3} value={preview} className="drawer-scroll resize-none bg-muted/40 font-mono text-xs leading-relaxed" />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Launch failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </section>
        </div>
      </div>
      <DrawerFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-3 border-t bg-muted/20 px-6 py-4 sm:px-8">
        <span className="mr-auto hidden text-xs text-muted-foreground sm:block">Settings are saved automatically</span>
        <Button variant="outline" disabled={!preview} onClick={() => navigator.clipboard.writeText(preview)}>
          <Copy /> Copy command
        </Button>
        <Button onClick={launch} disabled={!project.exists || !engineVersion}>
          <Play /> Launch project
        </Button>
      </DrawerFooter>
    </>
  );
}
