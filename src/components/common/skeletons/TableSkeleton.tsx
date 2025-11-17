import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  showHeader?: boolean;
  className?: string;
}

export const TableSkeleton = React.memo<TableSkeletonProps>(({
  columnCount = 5,
  rowCount = 5,
  showHeader = true,
  className,
}) => {
  return (
    <Card className={`shadow-luxury hover:shadow-luxury-lg transition-shadow duration-300 border-gray-200/50 backdrop-blur-sm bg-white/95 overflow-hidden ${className || ''}`}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {[...Array(columnCount)].map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {[...Array(rowCount)].map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {[...Array(columnCount)].map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton 
                    className={`h-4 ${
                      colIndex === 0 ? 'w-32' : 
                      colIndex === columnCount - 1 ? 'w-20' : 
                      'w-24'
                    }`} 
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

