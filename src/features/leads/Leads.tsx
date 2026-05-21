import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { TableHead } from '@/components/ui/table';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { InquiryDialog } from '@/features/inquiries/InquiryDialog';
import type { InquirySubmitPayload } from '@/features/inquiries/inquirySchema';
import { InquiryMatchesDialog } from '@/features/inquiries/InquiryMatchesDialog';
import { PropertyInquiry } from '@/types';
import { Inbox, Home, TrendingUp, LayoutGrid, List } from 'lucide-react';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { useOrg } from '@/contexts/OrgContext';
import { useInquiriesData } from '@/features/inquiries/hooks/useInquiriesData';
import { useInquiryFilters } from '@/features/inquiries/hooks/useInquiryFilters';
import { useInquiryDialogs } from '@/features/inquiries/hooks/useInquiryDialogs';
import { useInquiryActions } from '@/features/inquiries/hooks/useInquiryActions';
import { InquiryTableRow } from '@/features/inquiries/components/InquiryTableRow';
import { InquiryCard } from '@/features/inquiries/components/InquiryCard';
import { useLeadsPipeline } from '@/features/leads/hooks/useLeadsPipeline';
import { LeadPipelineBoard } from '@/features/leads/components/LeadPipelineBoard';
import { LeadDetailSheet } from '@/features/leads/components/LeadDetailSheet';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export const Leads = () => {
  const { t } = useTranslation(['leads', 'common']);
  const { isMember } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline');
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    inquiries,
    loading,
    refreshData: loadInquiries,
  } = useInquiriesData();

  const { pipeline, loading: pipelineLoading, refresh: refreshPipeline } = useLeadsPipeline();

  const refreshAll = useCallback(async () => {
    await loadInquiries();
    await refreshPipeline();
  }, [loadInquiries, refreshPipeline]);

  const {
    filteredInquiries,
    searchQuery,
    setSearchQuery,
    inquiryTypeFilter,
    setInquiryTypeFilter,
  } = useInquiryFilters(inquiries);

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

  const {
    handleCreate,
    handleDelete,
    handleLoadMatches,
    isLoading: actionLoading,
    matchesLoading,
  } = useInquiryActions(refreshAll, {
    onCloseInquiryDialog: closeInquiryDialog,
    onCloseDeleteDialog: closeDeleteDialog,
    onOpenMatchesDialog: openMatchesDialog,
  });

  const openLeadDetail = useCallback((lead: PropertyInquiry) => {
    setDetailLeadId(lead.id);
    setDetailOpen(true);
  }, []);

  const handleAddLead = useCallback(() => {
    openInquiryDialog();
  }, [openInquiryDialog]);

  useEffect(() => {
    if (searchParams.get('action') === 'add' && !isMember) {
      openInquiryDialog();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [isMember, openInquiryDialog, searchParams, setSearchParams]);

  const handleEditLead = useCallback((inquiry: PropertyInquiry) => {
    openEditInquiryDialog(inquiry);
  }, [openEditInquiryDialog]);

  const handleViewMatches = useCallback(
    (inquiry: PropertyInquiry) => {
      handleLoadMatches(inquiry);
    },
    [handleLoadMatches]
  );

  const handleDeleteClick = useCallback(
    (inquiry: PropertyInquiry) => {
      openDeleteDialog(inquiry);
    },
    [openDeleteDialog]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!inquiryToDelete) return;
    await handleDelete(inquiryToDelete.id);
  }, [inquiryToDelete, handleDelete]);

  const handleSubmit = useCallback(
    async (data: InquirySubmitPayload) => {
      await handleCreate(data, selectedInquiry);
    },
    [handleCreate, selectedInquiry],
  );

  const renderDesktopRow = useCallback(
    (inquiry: PropertyInquiry) => (
      <InquiryTableRow
        key={inquiry.id}
        inquiry={inquiry}
        onEdit={handleEditLead}
        onDelete={handleDeleteClick}
        onViewMatches={handleViewMatches}
        matchesLoading={matchesLoading}
        onOpenDetail={openLeadDetail}
      />
    ),
    [handleEditLead, handleDeleteClick, handleViewMatches, matchesLoading, openLeadDetail]
  );

  const renderMobileCard = useCallback(
    (inquiry: PropertyInquiry) => (
      <InquiryCard
        key={inquiry.id}
        inquiry={inquiry}
        onEdit={handleEditLead}
        onDelete={handleDeleteClick}
        onViewMatches={handleViewMatches}
        matchesLoading={matchesLoading}
        onOpenDetail={openLeadDetail}
      />
    ),
    [handleEditLead, handleDeleteClick, handleViewMatches, matchesLoading, openLeadDetail]
  );

  const filterOptions = useMemo(
    () => [
      {
        id: 'all',
        label: t('typeFilter.all'),
        icon: <Inbox className="h-4 w-4" />,
      },
      {
        id: 'rental',
        label: t('typeFilter.rental'),
        icon: <Home className="h-4 w-4" />,
      },
      {
        id: 'sale',
        label: t('typeFilter.sale'),
        icon: <TrendingUp className="h-4 w-4" />,
      },
    ],
    [t]
  );

  const tableHeaders = useCallback(
    () => (
      <>
        <TableHead>{t('table.name')}</TableHead>
        <TableHead>{t('table.preferences')}</TableHead>
        <TableHead>{t('table.budget')}</TableHead>
        <TableHead>{t('table.status')}</TableHead>
        <TableHead>{t('table.actions')}</TableHead>
      </>
    ),
    [t]
  );

  const emptyStateConfig = useMemo(
    () => ({
      icon: <Inbox className="h-4 w-4" />,
      title: t('emptyState.noInquiriesYet'),
      description: t('emptyState.noInquiriesYetDescription'),
      actionLabel: t('emptyState.addActionLabel'),
      showAction: true,
    }),
    [t]
  );

  const deleteDialogConfig = useMemo(
    () => ({
      open: isDeleteDialogOpen,
      title: t('deleteDialog.title'),
      description: t('deleteDialog.description', {
        inquiryName: inquiryToDelete?.name || '',
      }),
      onConfirm: handleDeleteConfirm,
      onCancel: closeDeleteDialog,
      loading: actionLoading,
    }),
    [
      isDeleteDialogOpen,
      inquiryToDelete?.name,
      handleDeleteConfirm,
      closeDeleteDialog,
      actionLoading,
      t,
    ]
  );

  const viewToggle = (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(v) => {
        if (v === 'pipeline' || v === 'list') setView(v);
      }}
      variant="outline"
      size="sm"
      className="justify-start"
    >
      <ToggleGroupItem value="pipeline" aria-label={t('view.pipeline')}>
        <LayoutGrid className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">{t('view.pipeline')}</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label={t('view.list')}>
        <List className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">{t('view.list')}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );

  const listSection = (
    <ListPageTemplate
      title={t('title')}
      items={filteredInquiries}
      loading={loading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={t('searchPlaceholder')}
      onAdd={handleAddLead}
      addButtonLabel={t('addNew')}
      disabledAdd={isMember}
      addDisabledTooltip={isMember ? t('common:readOnlyMode') : undefined}
      skeletonColumnCount={5}
      leftAction={viewToggle}
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
  );

  const pipelineSection = (
    <MainLayout title={t('title')}>
      <PageContainer className="min-h-[600px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {viewToggle}
            {isMember && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Info className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t('common:readOnlyMode')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {isMember ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed">
                    <Button disabled className="h-10">
                      {t('addNew')}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t('common:readOnlyMode')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button onClick={handleAddLead} className="h-10">
              {t('addNew')}
            </Button>
          )}
        </div>
        <LeadPipelineBoard
          pipeline={pipeline}
          loading={pipelineLoading}
          onOpenLead={(lead) => openLeadDetail(lead)}
          onRefresh={refreshPipeline}
          readOnly={isMember}
        />
      </PageContainer>
    </MainLayout>
  );

  return (
    <>
      {view === 'list' ? listSection : pipelineSection}

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
        onInquiryUpdate={refreshAll}
      />

      <LeadDetailSheet
        leadId={detailLeadId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailLeadId(null);
        }}
        onEdit={(lead) => {
          setDetailOpen(false);
          openEditInquiryDialog(lead);
        }}
        onViewMatches={(lead) => {
          setDetailOpen(false);
          void handleLoadMatches(lead);
        }}
        onUpdated={refreshAll}
      />
    </>
  );
};
