import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { COLORS } from '@/config/colors';

interface CardSkeletonProps {
  variant?: 'simple' | 'detailed';
  count?: number;
  className?: string;
}

export const CardSkeleton = React.memo<CardSkeletonProps>(({
  variant = 'simple',
  count = 3,
  className,
}) => {
  if (variant === 'simple') {
    return (
      <div className={`space-y-3 ${className || ''}`}>
        {[...Array(count)].map((_, index) => (
          <Card 
            key={index} 
            className={`p-4 shadow-sm ${COLORS.border.light} ${COLORS.card.bg}`}
          >
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {[...Array(count)].map((_, index) => (
        <Card 
          key={index}
          className="p-5 shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-gray-200/50 backdrop-blur-sm bg-white/95"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Body - Multiple fields */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>

            {/* Footer - Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

CardSkeleton.displayName = 'CardSkeleton';

