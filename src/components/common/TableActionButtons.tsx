import { ReactNode, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { COLORS } from '@/config/colors';

interface ActionButton {
  icon?: ReactNode;
  tooltip: string;
  onClick: () => void;
  variant?: 'edit' | 'delete' | 'view' | 'custom';
  className?: string;
}

interface TableActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  customActions?: ActionButton[];
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
}

export const TableActionButtons = memo(({
  onEdit,
  onDelete,
  onView,
  customActions = [],
  showEdit = true,
  showDelete = true,
  showView = false,
}: TableActionButtonsProps) => {
  const { t } = useTranslation(['components.tableActions']);
  const getButtonClasses = (variant: string) => {
    switch (variant) {
      case 'view':
        return `hover:${COLORS.success.bgLight} hover:${COLORS.success.text} hover:${COLORS.success.border}`;
      case 'edit':
        return `hover:${COLORS.primary.bgLight} hover:${COLORS.primary.text} hover:${COLORS.primary.border}`;
      case 'delete':
        return `${COLORS.danger.borderLight} ${COLORS.danger.text} hover:${COLORS.danger.bgLight} hover:${COLORS.danger.textDark} hover:${COLORS.danger.borderHover}`;
      default:
        return '';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex justify-end gap-2">
        {showView && onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onView}
                className={getButtonClasses('view')}
                aria-label={t('viewDetails')}
                title={t('viewDetailsTooltip')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('viewDetails')}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onEdit}
                className={getButtonClasses('edit')}
                aria-label={t('edit')}
                title={t('editTooltip')}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('edit')}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {customActions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={action.onClick}
                className={action.className || getButtonClasses(action.variant || 'custom')}
              >
                {action.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{typeof action.tooltip === 'string' ? action.tooltip : t(action.tooltip)}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {showDelete && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onDelete}
                className={getButtonClasses('delete')}
                aria-label={t('delete')}
                title={t('deleteTooltip')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('delete')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});

TableActionButtons.displayName = 'TableActionButtons';
