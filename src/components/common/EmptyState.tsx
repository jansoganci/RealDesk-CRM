import { ReactNode, memo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { COLORS } from '@/config/colors';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Info } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
  disabledAction?: boolean;
  actionTooltip?: string;
}

export const EmptyState = memo(({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  showAction = true,
  disabledAction = false,
  actionTooltip,
}: EmptyStateProps) => {
  const ActionButton = (
    <Button
      onClick={onAction}
      className={`${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover} shadow-md ${COLORS.primary.shadow}`}
      disabled={disabledAction}
    >
      {actionLabel}
    </Button>
  );

  return (
    <Card className={`p-8 shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur}`}>
      <div className="text-center">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <h3 className={`text-lg font-medium ${COLORS.gray.text900} mb-2`}>{title}</h3>
        <p className={`${COLORS.muted.textLight} mb-4`}>{description}</p>
        {showAction && onAction && actionLabel && (
          <div className="flex justify-center">
            {disabledAction && actionTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      {ActionButton}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {actionTooltip}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              ActionButton
            )}
          </div>
        )}
      </div>
    </Card>
  );
});

EmptyState.displayName = 'EmptyState';
