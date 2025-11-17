import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CalendarSkeletonProps {
  view?: 'week' | 'day';
  meetingCount?: number;
  className?: string;
}

export const CalendarSkeleton = React.memo<CalendarSkeletonProps>(({
  view = 'week',
  meetingCount = 2,
  className,
}) => {
  if (view === 'day') {
    // Day view - Single column with more meetings
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(meetingCount)].map((_, index) => (
          <Card key={index} className="mb-3 shadow-sm">
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Week view - 7 columns grid
  return (
    <div className={cn('hidden md:grid md:grid-cols-7 md:gap-2', className)}>
      {[...Array(7)].map((_, dayIndex) => (
        <div 
          key={dayIndex} 
          className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200"
        >
          {/* Day header */}
          <div className="text-center py-2 border-b">
            <Skeleton className="h-4 w-12 mx-auto mb-1" />
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
          
          {/* Meetings */}
          <div className="p-2 space-y-2 flex-1">
            {[...Array(meetingCount)].map((_, meetingIndex) => (
              <Card key={meetingIndex} className="mb-2 shadow-sm">
                <CardHeader className="p-2">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-16" />
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

CalendarSkeleton.displayName = 'CalendarSkeleton';

