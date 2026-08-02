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
  /** Optional second action (e.g. lease wizard on rent card). Clicks do not trigger card `onClick`. */
  secondaryAction?: { label: string; onClick: () => void };
}

export function ContractTypeCard({
  icon: Icon,
  title,
  description,
  badge,
  disabled = false,
  onClick,
  actionLabel,
  secondaryAction,
}: ContractTypeCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 h-full',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-lg hover:border-primary/30 cursor-pointer'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'p-3 rounded-xl',
              disabled ? 'bg-muted' : 'bg-primary/10'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                disabled ? 'text-muted-foreground' : 'text-primary'
              )}
            />
          </div>
          {badge && (
            <Badge
              variant={disabled ? 'secondary' : 'default'}
              className={cn(
                'text-xs',
                disabled ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-4">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <Button
          variant={disabled ? 'ghost' : 'default'}
          className={cn(
            'w-full',
            disabled && 'text-muted-foreground'
          )}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && onClick) onClick();
          }}
        >
          {actionLabel}
        </Button>
        {secondaryAction && !disabled && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              secondaryAction.onClick();
            }}
          >
            {secondaryAction.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
