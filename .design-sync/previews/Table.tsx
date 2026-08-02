import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function Default() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Tenant</TableHead>
          <TableHead>Rent</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">123 Maple Street</TableCell>
          <TableCell>Jordan Casey</TableCell>
          <TableCell>$2,450</TableCell>
          <TableCell>
            <Badge>Occupied</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">48 Birchwood Ave</TableCell>
          <TableCell>—</TableCell>
          <TableCell>$1,975</TableCell>
          <TableCell>
            <Badge variant="warning">Empty</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
