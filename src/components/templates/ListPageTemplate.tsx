import React, { ReactNode, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../layout/MainLayout';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Card } from '../ui/card';
import { EmptyState } from '../common/EmptyState';
import { MobileCardView } from '../common/MobileCardView';
import { TableSkeleton } from '../common/skeletons';
import { Search, Plus, Info } from 'lucide-react';
import { COLORS } from '@/config/colors';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export interface FilterOption {
  value: string;
  label: string;
}

export interface EmptyStateConfig {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel?: string;
  showAction?: boolean;
}

export interface DeleteDialogConfig {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface ListPageTemplateProps<T> {
  title: string;
  items: T[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  onAdd: () => void;
  addButtonLabel: string;
  addButtonLabelShort?: string; // Optional: Short label for mobile
  disabledAdd?: boolean; // Added for member role
  addDisabledTooltip?: string; // Added for member role
  emptyState: EmptyStateConfig;
  renderTableHeaders: () => ReactNode;
  renderTableRow: (item: T, index: number) => ReactNode;
  renderCardContent?: (item: T, index: number) => ReactNode;
  deleteDialog?: DeleteDialogConfig;
  skeletonColumnCount?: number; // Optional: Number of columns for skeleton (default: 5)
  headerContent?: ReactNode; // Optional: Content to render above search/filter row
  leftAction?: ReactNode; // Optional: Content to render to the left of the main add button
}

function ListPageTemplateInner<T>({
  title,
  items,
  loading,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = 'Filter',
  onAdd,
  addButtonLabel,
  addButtonLabelShort,
  disabledAdd = false,
  addDisabledTooltip,
  emptyState,
  renderTableHeaders,
  renderTableRow,
  renderCardContent,
  deleteDialog,
  skeletonColumnCount = 5,
  headerContent,
  leftAction,
}: ListPageTemplateProps<T>) {
  const { t } = useTranslation('common');

  const AddButton = (
    <Button
      onClick={onAdd}
      variant="default"
      className="h-8 md:h-10 px-2 md:px-4 text-xs md:text-sm"
      disabled={disabledAdd}
    >
      <Plus className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
      {addButtonLabelShort ? (
        <>
          <span className="hidden sm:inline">{addButtonLabel}</span>
          <span className="sm:hidden">{addButtonLabelShort}</span>
        </>
      ) : (
        <span>{addButtonLabel}</span>
      )}
    </Button>
  );

  return (
    <MainLayout title={title}>
      <PageContainer className="min-h-[600px]">
        {headerContent && <div className="mb-6">{headerContent}</div>}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${COLORS.muted.textLight}`} />
              <Input
                placeholder={searchPlaceholder || t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            {filterOptions && onFilterChange && filterValue !== undefined && (
              <Select value={filterValue} onValueChange={onFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={filterPlaceholder || t('filterPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            {leftAction}
            {disabledAdd && addDisabledTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      {AddButton}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {addDisabledTooltip}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              AddButton
            )}
          </div>
        </div>

        {loading ? (
          <>
            {/* Desktop Table Skeleton - Hidden on mobile */}
            <div className="hidden md:block">
              <TableSkeleton 
                columnCount={skeletonColumnCount} 
                rowCount={5}
                showHeader={true}
              />
            </div>
            {/* Mobile Card Skeleton - Hidden on desktop */}
            {renderCardContent && (
              <div className="md:hidden">
                <MobileCardView
                  items={[]}
                  renderCardContent={renderCardContent}
                  loading={true}
                />
              </div>
            )}
          </>
        ) : items.length === 0 ? (
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            icon={emptyState.icon}
            actionLabel={emptyState.actionLabel}
            onAction={emptyState.showAction ? onAdd : undefined}
            showAction={emptyState.showAction}
            disabledAction={disabledAdd}
            actionTooltip={disabledAdd ? addDisabledTooltip : undefined}
          />
        ) : (
          <>
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block">
              <Card className="shadow-luxury hover:shadow-luxury-lg transition-shadow duration-300 border-gray-200/50 backdrop-blur-sm bg-white/95 overflow-hidden animate-fade-in">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {renderTableHeaders()}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <React.Fragment key={`item-${index}`}>
                        {renderTableRow(item, index)}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Cards - Hidden on desktop */}
            {renderCardContent && (
              <div className="md:hidden">
                <MobileCardView
                  items={items}
                  renderCardContent={renderCardContent}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}
      </PageContainer>

      {deleteDialog && (
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && deleteDialog.onCancel()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteDialog.title || t('deleteDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialog.description || t('deleteDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={deleteDialog.onCancel}>
                {t('deleteDialog.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteDialog.onConfirm}
                disabled={deleteDialog.loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteDialog.loading ? t('deleting', 'Deleting...') : t('deleteDialog.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </MainLayout>
  );
}

// Preserve generic type through memo using type assertion
export const ListPageTemplate = memo(ListPageTemplateInner) as typeof ListPageTemplateInner;
