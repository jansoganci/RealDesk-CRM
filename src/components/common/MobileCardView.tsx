import { ReactNode } from 'react';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { COLORS } from '@/config/colors';

interface MobileCardViewProps<T> {
  items: T[];
  renderCardContent: (item: T, index: number) => ReactNode;
  loading?: boolean;
}

export const MobileCardView = <T,>({
  items,
  renderCardContent,
  loading = false,
}: MobileCardViewProps<T>) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className={`p-4 shadow-sm ${COLORS.border.light} ${COLORS.card.bg}`}>
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

  if (items.length === 0) {
    return null; // Empty state is handled by parent
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card
          key={`mobile-card-${index}`}
          className="p-5 shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:-translate-y-0.5 border-gray-200/50 backdrop-blur-sm bg-white/95 animate-fade-in"
        >
          {renderCardContent(item, index)}
        </Card>
      ))}
    </div>
  );
};

