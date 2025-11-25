import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

/**
 * Tenant Edit Loading State Component
 * Displays a loading dialog while tenant and contract data is being fetched
 */

interface TenantEditLoadingStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantEditLoadingState({
  open,
  onOpenChange,
}: TenantEditLoadingStateProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loading...</DialogTitle>
          <DialogDescription>
            Loading tenant and contract information...
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

