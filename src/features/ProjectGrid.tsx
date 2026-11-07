import { useState } from 'react';
import { FolderOpen, ImageIcon } from 'lucide-react';
import type { ProjectInfo } from '../../shared/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

interface Props {
  projects: ProjectInfo[];
  selected?: string;
  onSelect: (p: ProjectInfo) => void;
}

function ProjectCard({ project, selected, onSelect, onOpenFolder }: {
  project: ProjectInfo;
  selected: boolean;
  onSelect: () => void;
  onOpenFolder: () => void;
}) {
  const [failedImage, setFailedImage] = useState<string>();
  const thumbnail = project.thumbnailUrl;

  return (
    <ContextMenu>
      <Card className={cn('overflow-hidden transition-colors hover:bg-accent', selected && 'ring-2 ring-ring')}>
        <ContextMenuTrigger asChild>
          <button type="button" aria-label={project.name} onClick={onSelect} className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            <div className="flex h-32 items-center justify-center overflow-hidden bg-muted/50">
              {thumbnail && thumbnail !== failedImage ? (
                <img src={thumbnail} alt="" draggable={false} className="h-full w-full object-cover" onError={() => {
                  setFailedImage(thumbnail);
                }} />
              ) : (
                <ImageIcon aria-hidden="true" className="h-9 w-9 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex flex-col gap-1 p-3">
              <div className="truncate text-sm font-medium">{project.name}</div>
              <div className="truncate text-xs text-muted-foreground">{project.path}</div>
              <div className="flex gap-1 pt-1">
                {project.engineAssociation && <Badge variant="secondary">{project.engineAssociation}</Badge>}
                {!project.exists && <Badge variant="destructive">Missing</Badge>}
              </div>
            </div>
          </button>
        </ContextMenuTrigger>
      </Card>
      <ContextMenuContent>
        <ContextMenuItem disabled={!project.exists} onSelect={onOpenFolder}>
          <FolderOpen /> Open folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function ProjectGrid({ projects, selected, onSelect }: Props) {
  const [error, setError] = useState('');

  async function openFolder(project: ProjectInfo) {
    setError('');
    try {
      await window.launcher.openProjectFolder(project.path);
    } catch (cause: unknown) {
      setError(`Could not open project folder: ${String(cause)}`);
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Featured Projects</h2>
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects found.</p>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {projects.map((project) => (
          <ProjectCard key={project.path} project={project} selected={project.path === selected} onSelect={() => {
            onSelect(project);
          }} onOpenFolder={() => {
            void openFolder(project);
          }} />
        ))}
      </div>
    </section>
  );
}
