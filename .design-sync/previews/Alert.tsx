import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

export function Default() {
  return (
    <Alert className="max-w-md">
      <Info className="h-4 w-4" />
      <AlertTitle>Lease renews in 14 days</AlertTitle>
      <AlertDescription>
        123 Maple Street's current lease ends March 15, 2027. Send a renewal offer now.
      </AlertDescription>
    </Alert>
  );
}

export function Destructive() {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Rent payment failed</AlertTitle>
      <AlertDescription>
        The tenant's autopay was declined. Contact them before the grace period ends.
      </AlertDescription>
    </Alert>
  );
}
