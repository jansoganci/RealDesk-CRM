import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function Open() {
  return (
    <Popover open>
      <PopoverTrigger asChild>
        <Button variant="outline">Filter by status</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <p className="text-sm font-medium">Property status</p>
          <p className="text-sm text-muted-foreground">
            Showing occupied, empty, and inactive properties.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
