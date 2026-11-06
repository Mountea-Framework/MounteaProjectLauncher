import { Folder, FolderX, Settings } from 'lucide-react';
import launcherIcon from '../../Icons/MPLIcon.png';
import type { GlobalSettings, ProjectInfo, StoreData } from '../../shared/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SettingsDialog } from '@/features/SettingsDialog';

export type View = 'all' | 'missing';

interface Props {
  projects: ProjectInfo[];
  selected?: string;
  view: View;
  engineCount: number;
  global?: GlobalSettings;
  onView: (v: View) => void;
  onSelect: (p: ProjectInfo) => void;
  onSaved: (s: StoreData) => void;
}

export function ProjectList({ projects, selected, view, engineCount, global, onView, onSelect, onSaved }: Props) {
  const missing = projects.filter((p) => !p.exists).length;

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 p-4">
        <div className="flex items-center gap-2 font-semibold">
          <img src={launcherIcon} alt="" className="h-6 w-6 shrink-0 object-contain" /> Mountea Launcher
        </div>
        <Card>
          <CardContent className="p-3">
            <div className="text-sm font-medium">{engineCount} engine{engineCount === 1 ? '' : 's'}</div>
            <div className="text-xs text-muted-foreground">{projects.length} projects found</div>
          </CardContent>
        </Card>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={view === 'all'} onClick={() => {
                onView('all');
              }}><Folder /> Projects</SidebarMenuButton>
              <SidebarMenuBadge>{projects.length}</SidebarMenuBadge>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={view === 'missing'} onClick={() => {
                onView('missing');
              }}><FolderX /> Missing</SidebarMenuButton>
              <SidebarMenuBadge>{missing}</SidebarMenuBadge>
            </SidebarMenuItem>
            {global && (
              <SidebarMenuItem>
                <SettingsDialog global={global} onSaved={onSaved}>
                  <SidebarMenuButton><Settings /> Settings</SidebarMenuButton>
                </SettingsDialog>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarMenu>
            {projects.slice(0, 5).map((p) => (
              <SidebarMenuItem key={p.path}>
                <SidebarMenuButton isActive={p.path === selected} onClick={() => {
                  onSelect(p);
                }} className="justify-between">
                  <span className="truncate">{p.name}</span>
                  {p.engineAssociation && <Badge variant="secondary">{p.engineAssociation}</Badge>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
