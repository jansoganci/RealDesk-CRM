import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

export function Variants() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button>Save Changes</Button>
      <Button variant="destructive">Delete Property</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="secondary">View Details</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="link">Learn more</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}

export function States() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button disabled>Disabled</Button>
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Saving…
      </Button>
    </div>
  );
}

export function WithIcon() {
  return (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Property
    </Button>
  );
}
