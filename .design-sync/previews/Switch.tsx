import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function States() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch id="ds-sw-on" defaultChecked />
        <Label htmlFor="ds-sw-on">Email notifications</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="ds-sw-off" />
        <Label htmlFor="ds-sw-off">SMS reminders</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="ds-sw-disabled" disabled />
        <Label htmlFor="ds-sw-disabled" className="text-muted-foreground">
          Essential cookies (always active)
        </Label>
      </div>
    </div>
  );
}
