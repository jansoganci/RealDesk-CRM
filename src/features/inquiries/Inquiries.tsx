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
  const inquirySchema = getInquirySchema(t);
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

  const handleAddInquiry = () => {
    openInquiryDialog();
  };

  const handleEditInquiry = (inquiry: PropertyInquiry) => {
    openEditInquiryDialog(inquiry);
  };

  const handleViewMatches = (inquiry: PropertyInquiry) => {
    handleLoadMatches(inquiry);
  };

  const handleDeleteClick = (inquiry: PropertyInquiry) => {
    openDeleteDialog(inquiry);
  };

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return;
    await handleDelete(inquiryToDelete.id);
  };

  const handleSubmit = async (data: InquiryFormData) => {
    await handleCreate(data, selectedInquiry);
  };


  const renderDesktopRow = (inquiry: PropertyInquiry) => (
    <InquiryTableRow
      inquiry={inquiry}
      onEdit={handleEditInquiry}
      onDelete={handleDeleteClick}
      onViewMatches={handleViewMatches}
      matchesLoading={matchesLoading}
    />
  );

  const renderMobileCard = (inquiry: PropertyInquiry) => (
    <InquiryCard
      inquiry={inquiry}
      onEdit={handleEditInquiry}
      onDelete={handleDeleteClick}
      onViewMatches={handleViewMatches}
      matchesLoading={matchesLoading}
    />
  );

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
                tabs={[
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
                ]}
                defaultTab={inquiryTypeFilter}
                onChange={(tabId) => setInquiryTypeFilter(tabId as 'all' | 'rental' | 'sale')}
              />
            }
            renderTableHeaders={() => (
              <>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.preferences')}</TableHead>
                <TableHead>{t('table.budget')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.actions')}</TableHead>
              </>
            )}
            renderTableRow={renderDesktopRow}
            renderCardContent={renderMobileCard}
            emptyState={{
              icon: <Inbox className="h-4 w-4" />,
              title: t('emptyState.noInquiriesYet'),
              description: t('emptyState.noInquiriesYetDescription'),
              actionLabel: t('emptyState.addActionLabel'),
              showAction: true,
            }}
            deleteDialog={{
              open: isDeleteDialogOpen,
              title: t('deleteDialog.title'),
              description: t('deleteDialog.description', {
                inquiryName: inquiryToDelete?.name || '',
              }),
              onConfirm: handleDeleteConfirm,
              onCancel: closeDeleteDialog,
              loading: actionLoading,
            }}
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
