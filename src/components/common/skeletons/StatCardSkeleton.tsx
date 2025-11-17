import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardSkeletonProps {
  count?: number;
  className?: string;
}

export const StatCardSkeleton = React.memo<StatCardSkeletonProps>(({
  count = 4,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
      {[...Array(count)].map((_, index) => (
        <Card
          key={index}
          className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in border-gray-200/50 backdrop-blur-sm bg-white/90"
        >
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            {/* Icon placeholder */}
            <Skeleton className="h-10 w-10 rounded-xl" />
            {/* Title */}
            <CardTitle className="flex-1">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Value - Large */}
            <Skeleton className="h-9 w-20 mb-2" />
            {/* Description */}
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

StatCardSkeleton.displayName = 'StatCardSkeleton';

