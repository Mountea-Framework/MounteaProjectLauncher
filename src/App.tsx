import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import type { ProjectInfo, StoreData } from '../shared/types';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ProjectGrid } from '@/features/ProjectGrid';
import { ProjectList, type View } from '@/features/ProjectList';
import { ProjectPanel } from '@/features/ProjectPanel';

export default function App() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [selected, setSelected] = useState<ProjectInfo | null>(null);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState('');
  const [view, setView] = useState<View>('all');
  const [engineCount, setEngineCount] = useState(0);

  const refresh = useCallback(async () => {
    setScanning(true);
    try {
      setProjects(await window.launcher.scanProjects());
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    window.launcher.getStore().then(setStore);
    refresh();
  }, [refresh]);

  // Engines are global; any project's details lists them all.
  useEffect(() => {
    if (projects[0]) window.launcher.getProjectDetails(projects[0].path).then((d) => setEngineCount(d.engines.length));
  }, [projects]);

  // Night mode drives the shadcn .dark class.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!store?.global.nightMode);
  }, [store?.global.nightMode]);

  const shown = projects
    .filter((p) => (view === 'missing' ? !p.exists : true))
    .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <SidebarProvider>
      <ProjectList
        projects={projects}
        selected={selected?.path}
        view={view}
        engineCount={engineCount}
        global={store?.global}
        onView={setView}
        onSelect={setSelected}
        onSaved={setStore}
      />
      <SidebarInset className="h-svh min-w-0">
        <header className="flex items-center gap-3 border-b px-6 py-3">
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Button variant="outline" onClick={refresh} disabled={scanning}>
            <RefreshCw className={scanning ? 'animate-spin' : ''} /> Refresh
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <ProjectGrid projects={shown} selected={selected?.path} onSelect={setSelected} />
          </div>
        </main>
        <Drawer open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
          <DrawerContent className="max-h-[85vh]">
            {selected && store && <ProjectPanel key={selected.path} project={selected} store={store} onStore={setStore} />}
          </DrawerContent>
        </Drawer>
      </SidebarInset>
    </SidebarProvider>
  );
}
