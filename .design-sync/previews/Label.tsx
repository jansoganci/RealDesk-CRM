import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function Default() {
  return (
    <div className="space-y-2">
      <Label htmlFor="ds-label-input">Monthly rent</Label>
      <Input id="ds-label-input" defaultValue="$2,450" className="w-48" />
    </div>
  );
}
