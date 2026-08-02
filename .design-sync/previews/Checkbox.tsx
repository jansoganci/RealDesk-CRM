import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function States() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="ds-cb-unchecked" />
        <Label htmlFor="ds-cb-unchecked">Water heater included</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="ds-cb-checked" defaultChecked />
        <Label htmlFor="ds-cb-checked">Pets allowed</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="ds-cb-disabled" disabled />
        <Label htmlFor="ds-cb-disabled" className="text-muted-foreground">
          Lead paint disclosure required
        </Label>
      </div>
    </div>
  );
}
