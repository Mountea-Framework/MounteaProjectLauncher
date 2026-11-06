import { useState, type ReactNode } from 'react';
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
  const [engines, setEngines] = useState('');
  const [night, setNight] = useState(false);

  function onOpenChange(o: boolean) {
    if (o) {
      setRoots(global.scanRoots.join('\n'));
      setEngines(global.enginePaths.join('\n'));
      setNight(global.nightMode);
    }
    setOpen(o);
  }

  async function save() {
    onSaved(await window.launcher.setGlobal({ scanRoots: lines(roots), enginePaths: lines(engines), nightMode: night }));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="roots">Scan roots</Label>
            <Textarea id="roots" rows={3} className="font-mono text-xs" value={roots} onChange={(e) => setRoots(e.target.value)} />
            <p className="text-xs text-muted-foreground">Folders searched for .uproject files, one per line.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="engines">Engine paths</Label>
            <Textarea id="engines" rows={3} className="font-mono text-xs" value={engines} onChange={(e) => setEngines(e.target.value)} />
            <p className="text-xs text-muted-foreground">Extra Unreal Engine install folders, one per line.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="night">Night mode</Label>
              <p className="text-xs text-muted-foreground">Use a dark color theme.</p>
            </div>
            <Switch id="night" checked={night} onCheckedChange={setNight} />
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
