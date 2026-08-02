import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function Default() {
  return (
    <div className="w-64 space-y-2">
      <Label htmlFor="ds-select">Property status</Label>
      <Select defaultValue="occupied">
        <SelectTrigger id="ds-select">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="empty">Empty</SelectItem>
          <SelectItem value="occupied">Occupied</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Open() {
  return (
    <div className="w-64 space-y-2">
      <Label htmlFor="ds-select-open">Property status</Label>
      <Select defaultValue="occupied" defaultOpen>
        <SelectTrigger id="ds-select-open">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="empty">Empty</SelectItem>
          <SelectItem value="occupied">Occupied</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
