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
  
  // M3 Standard: Square buttons with minimal hover
  // Mobile/Tablet: 44px for touch targets, Desktop: 40px for mouse

  // View button - Gray border
  const viewButtonClasses = "h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-md border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  // Edit button - Light blue border
  const editButtonClasses = "h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-md border border-blue-300 bg-transparent text-gray-700 hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  // Delete button - Red border
  const deleteButtonClasses = "h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-md border border-red-300 bg-transparent text-gray-700 hover:bg-red-50 hover:border-red-400 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

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

        {showEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onEdit}
                className={editButtonClasses}
                aria-label={t('edit')}
              >
                <Pencil className="h-6 w-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('edit')}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {customActions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <button
                onClick={action.onClick}
                className={action.className || viewButtonClasses}
                aria-label={typeof action.tooltip === 'string' ? action.tooltip : t(action.tooltip)}
              >
                {action.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{typeof action.tooltip === 'string' ? action.tooltip : t(action.tooltip)}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {showDelete && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDelete}
                className={deleteButtonClasses}
                aria-label={t('delete')}
              >
                <Trash2 className="h-6 w-6" />
              </button>
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
