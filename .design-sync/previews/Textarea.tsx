import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function Default() {
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="ds-notes">Showing notes</Label>
      <Textarea
        id="ds-notes"
        placeholder="Tenant mentioned interest in a 12-month lease starting next month."
        rows={4}
      />
    </div>
  );
}
