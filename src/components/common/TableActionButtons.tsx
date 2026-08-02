import { ReactNode, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Pencil, Trash2, Eye } from 'lucide-react';

interface ActionButton {
  icon?: ReactNode;
  tooltip: string;
  onClick: () => void;
  variant?: 'edit' | 'delete' | 'view' | 'custom';
  className?: string;
  disabled?: boolean;
}

interface TableActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  customActions?: ActionButton[];
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  disabledEdit?: boolean;
  disabledDelete?: boolean;
  disabledEditTooltip?: string;
  disabledDeleteTooltip?: string;
}

export const TableActionButtons = memo(({
  onEdit,
  onDelete,
  onView,
  customActions = [],
  showEdit = true,
  showDelete = true,
  showView = false,
  disabledEdit = false,
  disabledDelete = false,
  disabledEditTooltip,
  disabledDeleteTooltip,
}: TableActionButtonsProps) => {
  const { t } = useTranslation(['components.tableActions']);
  
  // M3 Standard: Square buttons with minimal hover
  // Mobile/Tablet: 44px for touch targets, Desktop: 40px for mouse

  // View button - muted border
  const viewButtonClasses = "h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-muted hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  // Edit button - primary border
  const editButtonClasses = "h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-md border border-primary/30 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  // Delete button - destructive border
  const deleteButtonClasses = "h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-md border border-destructive/40 bg-transparent text-foreground hover:bg-destructive/10 hover:border-destructive hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <TooltipProvider>
      <div className="flex justify-end gap-1.5">
        {showView && onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onView}
                className={viewButtonClasses}
                aria-label={t('viewDetails')}
              >
                <Eye className="h-6 w-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('viewDetails')}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showEdit && (onEdit || disabledEdit) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={disabledEdit ? undefined : onEdit}
                className={editButtonClasses}
                aria-label={disabledEdit ? disabledEditTooltip || t('edit') : t('edit')}
                disabled={disabledEdit}
              >
                <Pencil className="h-6 w-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{disabledEdit && disabledEditTooltip ? disabledEditTooltip : t('edit')}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {customActions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <button
                onClick={action.disabled ? undefined : action.onClick}
                className={`${action.className || viewButtonClasses} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={typeof action.tooltip === 'string' ? action.tooltip : t(action.tooltip)}
                disabled={action.disabled}
              >
                {action.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{typeof action.tooltip === 'string' ? action.tooltip : t(action.tooltip)}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {showDelete && (onDelete || disabledDelete) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={disabledDelete ? undefined : onDelete}
                className={deleteButtonClasses}
                aria-label={disabledDelete ? disabledDeleteTooltip || t('delete') : t('delete')}
                disabled={disabledDelete}
              >
                <Trash2 className="h-6 w-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{disabledDelete && disabledDeleteTooltip ? disabledDeleteTooltip : t('delete')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});

TableActionButtons.displayName = 'TableActionButtons';
