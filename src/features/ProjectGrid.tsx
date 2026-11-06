import type { ProjectInfo } from '../../shared/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  projects: ProjectInfo[];
  selected?: string;
  onSelect: (p: ProjectInfo) => void;
}

// No project images exist, so the header colour is derived from the name.
const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export function ProjectGrid({ projects, selected, onSelect }: Props) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Featured Projects</h2>
      {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects found.</p>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {projects.map((p) => (
          <Card
            key={p.path}
            onClick={() => onSelect(p)}
            className={cn('cursor-pointer overflow-hidden transition-colors hover:bg-accent', p.path === selected && 'ring-2 ring-ring')}
          >
            <div
              className="flex h-28 items-center justify-center text-5xl font-bold text-white"
              style={{ background: `hsl(${hue(p.name)} 45% 35%)` }}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col gap-1 p-3">
              <div className="truncate text-sm font-medium">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground" title={p.path}>{p.path}</div>
              <div className="flex gap-1 pt-1">
                {p.engineAssociation && <Badge variant="secondary">{p.engineAssociation}</Badge>}
                {!p.exists && <Badge variant="destructive">Missing</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
