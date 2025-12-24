/**
 * Contract Type Card Component
 * Displays a contract type option in the hub grid
 */

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContractTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
  actionLabel: string;
}

export function ContractTypeCard({
  icon: Icon,
  title,
  description,
  badge,
  disabled = false,
  onClick,
  actionLabel,
}: ContractTypeCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 h-full',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-lg hover:border-blue-200 cursor-pointer'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'p-3 rounded-xl',
              disabled ? 'bg-gray-100' : 'bg-blue-50'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                disabled ? 'text-gray-400' : 'text-blue-600'
              )}
            />
          </div>
          {badge && (
            <Badge
              variant={disabled ? 'secondary' : 'default'}
              className={cn(
                'text-xs',
                disabled ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-4">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant={disabled ? 'ghost' : 'default'}
          className="w-full"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && onClick) onClick();
          }}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
