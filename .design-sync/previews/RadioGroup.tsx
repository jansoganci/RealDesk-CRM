import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function Default() {
  return (
    <RadioGroup defaultValue="lease" className="space-y-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="lease" id="ds-rg-lease" />
        <Label htmlFor="ds-rg-lease">Lease agreement</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="purchase" id="ds-rg-purchase" />
        <Label htmlFor="ds-rg-purchase">Purchase agreement</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="showing" id="ds-rg-showing" disabled />
        <Label htmlFor="ds-rg-showing" className="text-muted-foreground">
          Showing log (coming soon)
        </Label>
      </div>
    </RadioGroup>
  );
}
