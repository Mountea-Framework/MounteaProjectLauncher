import { useState, type ReactNode } from 'react';
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import type { GlobalSettings, StoreData } from '../../shared/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

export function SettingsDialog({ global, onSaved, children }: { global: GlobalSettings; onSaved: (s: StoreData) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [roots, setRoots] = useState('');
  const [engines, setEngines] = useState<string[]>([]);
  const [pickingFolder, setPickingFolder] = useState(false);
  const [night, setNight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function onOpenChange(o: boolean) {
    if (saving || pickingFolder) {
      return;
    }
    if (o) {
      setError('');
      setRoots(global.scanRoots.join('\n'));
      setEngines([...global.enginePaths]);
      setNight(global.nightMode);
    }
    setOpen(o);
  }

  async function pickEngineFolder(index?: number) {
    setError('');
    setPickingFolder(true);
    try {
      const selected = await window.launcher.pickEngineFolder(index === undefined ? undefined : engines.at(index));
      if (!selected) {
        return;
      }
      const comparable = (entry: string) => entry.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase();
      if (engines.some((entry, position) => position !== index && comparable(entry) === comparable(selected))) {
        setError('That engine folder is already listed.');
        return;
      }
      setEngines((current) => {
        if (index === undefined) {
          return [...current, selected];
        }
        return current.map((entry, position) => position === index ? selected : entry);
      });
    } catch (cause: unknown) {
      setError(`Could not select engine folder: ${String(cause)}`);
    } finally {
      setPickingFolder(false);
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      onSaved(await window.launcher.setGlobal({ scanRoots: lines(roots), enginePaths: engines, nightMode: night }));
      setOpen(false);
    } catch (cause: unknown) {
      setError(`Could not save settings: ${String(cause)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="roots">Scan roots</Label>
            <Textarea id="roots" rows={3} className="font-mono text-xs" value={roots} onChange={(e) => {
              setRoots(e.target.value);
            }} />
            <p className="text-xs text-muted-foreground">Folders searched for .uproject files, one per line.</p>
          </div>
          <section className="space-y-3" aria-labelledby="engine-paths-label">
            <div className="flex items-center justify-between gap-3">
              <h3 id="engine-paths-label" className="text-sm font-medium">Engine paths</h3>
              <Button type="button" variant="outline" size="sm" disabled={saving || pickingFolder} onClick={() => {
                void pickEngineFolder();
              }}><Plus /> Add</Button>
            </div>
            <ul className="max-h-52 space-y-2 overflow-y-auto">
              {engines.map((enginePath, index) => (
                <li key={`${index}:${enginePath}`} className="flex items-center gap-2 rounded-md border p-2">
                  <FolderOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 break-all font-mono text-xs">{enginePath}</span>
                  <Button type="button" variant="ghost" size="sm" aria-label={`Edit ${enginePath}`} disabled={saving || pickingFolder} onClick={() => {
                    void pickEngineFolder(index);
                  }}><Pencil /> Edit</Button>
                  <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${enginePath}`} disabled={saving || pickingFolder} onClick={() => {
                    setError('');
                    setEngines((current) => current.filter((_, position) => position !== index));
                  }}><Trash2 /> Remove</Button>
                </li>
              ))}
            </ul>
            {engines.length === 0 && <p className="text-sm text-muted-foreground">No engine folders. Add a folder to find installed engines.</p>}
            <p className="text-xs text-muted-foreground">Choose an Unreal Engine installation or a folder containing engine installations.</p>
          </section>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="night">Night mode</Label>
              <p className="text-xs text-muted-foreground">Use a dark color theme.</p>
            </div>
            <Switch id="night" checked={night} onCheckedChange={setNight} />
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter><Button disabled={saving || pickingFolder} onClick={() => {
          void save();
        }}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
