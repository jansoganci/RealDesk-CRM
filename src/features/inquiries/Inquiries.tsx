import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableHead } from '../../components/ui/table';
import { AnimatedTabs } from '../../components/ui/animated-tabs';
import { InquiryDialog } from './InquiryDialog';
import { InquiryMatchesDialog } from './InquiryMatchesDialog';
import { PropertyInquiry } from '../../types';
import { Inbox, Home, TrendingUp } from 'lucide-react';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import * as z from 'zod';
import { getInquirySchema } from './inquirySchema';
import { useInquiriesData } from './hooks/useInquiriesData';
import { useInquiryFilters } from './hooks/useInquiryFilters';
import { useInquiryDialogs } from './hooks/useInquiryDialogs';
import { useInquiryActions } from './hooks/useInquiryActions';
import { InquiryTableRow } from './components/InquiryTableRow';
import { InquiryCard } from './components/InquiryCard';

export const Inquiries = () => {
  const { t } = useTranslation(['inquiries', 'common']);
  const inquirySchema = useMemo(() => getInquirySchema(t), [t]);
  type InquiryFormData = z.infer<typeof inquirySchema>;

  // Data fetching hook
  const {
    inquiries,
    loading,
    refreshData: loadInquiries,
  } = useInquiriesData();

  // Filter hook
  const {
    filteredInquiries,
    searchQuery,
    setSearchQuery,
    inquiryTypeFilter,
    setInquiryTypeFilter,
  } = useInquiryFilters(inquiries);

  // Dialog hook
  const {
    isInquiryDialogOpen,
    selectedInquiry,
    openInquiryDialog,
    closeInquiryDialog,
    openEditInquiryDialog,
    isMatchesDialogOpen,
    selectedInquiryForMatches,
    openMatchesDialog,
    closeMatchesDialog,
    isDeleteDialogOpen,
    inquiryToDelete,
    openDeleteDialog,
    closeDeleteDialog,
  } = useInquiryDialogs();

  // Actions hook
  const {
    handleCreate,
    handleDelete,
    handleLoadMatches,
    isLoading: actionLoading,
    matchesLoading,
  } = useInquiryActions(loadInquiries, {
    onCloseInquiryDialog: closeInquiryDialog,
    onCloseDeleteDialog: closeDeleteDialog,
    onOpenMatchesDialog: openMatchesDialog,
  });

  const handleAddInquiry = useCallback(() => {
    openInquiryDialog();
  }, [openInquiryDialog]);

  const handleEditInquiry = useCallback((inquiry: PropertyInquiry) => {
    openEditInquiryDialog(inquiry);
  }, [openEditInquiryDialog]);

  const handleViewMatches = useCallback((inquiry: PropertyInquiry) => {
    handleLoadMatches(inquiry);
  }, [handleLoadMatches]);

  const handleDeleteClick = useCallback((inquiry: PropertyInquiry) => {
    openDeleteDialog(inquiry);
  }, [openDeleteDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!inquiryToDelete) return;
    await handleDelete(inquiryToDelete.id);
  }, [inquiryToDelete, handleDelete]);

  const handleSubmit = useCallback(async (data: InquiryFormData) => {
    await handleCreate(data, selectedInquiry);
  }, [handleCreate, selectedInquiry]);

  const renderDesktopRow = useCallback((inquiry: PropertyInquiry) => (
    <InquiryTableRow
      key={inquiry.id}
      inquiry={inquiry}
      onEdit={handleEditInquiry}
      onDelete={handleDeleteClick}
      onViewMatches={handleViewMatches}
      matchesLoading={matchesLoading}
    />
  ), [handleEditInquiry, handleDeleteClick, handleViewMatches, matchesLoading]);

  const renderMobileCard = useCallback((inquiry: PropertyInquiry) => (
    <InquiryCard
      key={inquiry.id}
      inquiry={inquiry}
      onEdit={handleEditInquiry}
      onDelete={handleDeleteClick}
      onViewMatches={handleViewMatches}
      matchesLoading={matchesLoading}
    />
  ), [handleEditInquiry, handleDeleteClick, handleViewMatches, matchesLoading]);

  const filterOptions = useMemo(() => [
    { 
      id: 'all', 
      label: t('typeFilter.all'),
      icon: <Inbox className="h-4 w-4" />
    },
    { 
      id: 'rental', 
      label: t('typeFilter.rental'),
      icon: <Home className="h-4 w-4" />
    },
    { 
      id: 'sale', 
      label: t('typeFilter.sale'),
      icon: <TrendingUp className="h-4 w-4" />
    },
  ], [t]);

  const tableHeaders = useCallback(() => (
    <>
      <TableHead>{t('table.name')}</TableHead>
      <TableHead>{t('table.preferences')}</TableHead>
      <TableHead>{t('table.budget')}</TableHead>
      <TableHead>{t('table.status')}</TableHead>
      <TableHead>{t('table.actions')}</TableHead>
    </>
  ), [t]);

  const emptyStateConfig = useMemo(() => ({
    icon: <Inbox className="h-4 w-4" />,
    title: t('emptyState.noInquiriesYet'),
    description: t('emptyState.noInquiriesYetDescription'),
    actionLabel: t('emptyState.addActionLabel'),
    showAction: true,
  }), [t]);

  const deleteDialogConfig = useMemo(() => ({
    open: isDeleteDialogOpen,
    title: t('deleteDialog.title'),
    description: t('deleteDialog.description', {
      inquiryName: inquiryToDelete?.name || '',
    }),
    onConfirm: handleDeleteConfirm,
    onCancel: closeDeleteDialog,
    loading: actionLoading,
  }), [isDeleteDialogOpen, inquiryToDelete?.name, handleDeleteConfirm, closeDeleteDialog, actionLoading, t]);

  return (
    <>
      <ListPageTemplate
            title={t('title')}
            items={filteredInquiries}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('searchPlaceholder')}
            onAdd={handleAddInquiry}
            addButtonLabel={t('addNew')}
            skeletonColumnCount={5}
            headerContent={
              <AnimatedTabs
                tabs={filterOptions}
                defaultTab={inquiryTypeFilter}
                onChange={(tabId) => setInquiryTypeFilter(tabId as 'all' | 'rental' | 'sale')}
              />
            }
            renderTableHeaders={tableHeaders}
            renderTableRow={renderDesktopRow}
            renderCardContent={renderMobileCard}
            emptyState={emptyStateConfig}
            deleteDialog={deleteDialogConfig}
          />

      <InquiryDialog
        open={isInquiryDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeInquiryDialog();
        }}
        inquiry={selectedInquiry}
        onSubmit={handleSubmit}
        loading={actionLoading}
      />

      <InquiryMatchesDialog
        open={isMatchesDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeMatchesDialog();
        }}
        inquiry={selectedInquiryForMatches}
        onInquiryUpdate={loadInquiries}
      />
    </>
  );
};
