import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Default() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-email">Email address</Label>
      <Input id="ds-email" type="email" placeholder="agent@closewell.app" />
    </div>
  );
}

export function WithValue() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-street">Street address</Label>
      <Input id="ds-street" defaultValue="123 Maple Street" />
    </div>
  );
}

export function Disabled() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-locked">Property ID</Label>
      <Input id="ds-locked" defaultValue="PROP-00482" disabled />
    </div>
  );
}
