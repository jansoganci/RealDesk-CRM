import { Badge } from '@/components/ui/badge';

export function Variants() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Active</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Overdue</Badge>
      <Badge variant="outline">Unassigned</Badge>
      <Badge variant="warning">Pending Review</Badge>
      <Badge variant="success">Closed Won</Badge>
    </div>
  );
}
