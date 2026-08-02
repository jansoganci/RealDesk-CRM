import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function Default() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>123 Maple Street</CardTitle>
        <CardDescription>3 bed · 2 bath · Occupied</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Rent due on the 1st of each month. Lease renews March 2027.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View Property
        </Button>
      </CardFooter>
    </Card>
  );
}

export function WithBadgeAndIcon() {
  return (
    <Card className="max-w-sm cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-primary/10 p-3">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <Badge className="bg-primary/15 text-xs text-primary">New</Badge>
        </div>
        <CardTitle className="mt-4 text-lg">Lease Agreement</CardTitle>
        <CardDescription>Draft a US-state-compliant lease in minutes</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button className="w-full">Start Lease</Button>
      </CardContent>
    </Card>
  );
}
