
import { useTranslation } from 'react-i18next';
import { TableHead } from '../../components/ui/table';
import { EnhancedTenantDialog } from './EnhancedTenantDialog';
import { EnhancedTenantEditDialog } from './EnhancedTenantEditDialog';
import { TenantWithProperty } from '../../types';
import { useTenantsData } from './hooks/useTenantsData';
import { useTenantFilters } from './hooks/useTenantFilters';
import { useTenantDialogs } from './hooks/useTenantDialogs';
import { useTenantActions } from './hooks/useTenantActions';
import { TenantTableRow } from './components/TenantTableRow';
import { TenantCard } from './components/TenantCard';
import { Users } from 'lucide-react';

import { COLORS } from '@/config/colors';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';

export const Tenants = () => {
  const { t } = useTranslation(['tenants', 'common']);

  // Tenants data hook
  const { tenants, loading, refreshData: loadTenants } = useTenantsData();

  // Tenant filters hook
  const {
    filteredTenants,
    searchQuery,
    setSearchQuery,
    assignmentFilter,
    setAssignmentFilter,
  } = useTenantFilters({ tenants });

  // Tenant dialogs hook
  const {
    isCreateOpen,
    openCreate,
    closeCreate,
    isEditOpen,
    selectedTenant,
    openEdit,
    closeEdit,
    isDeleteDialogOpen,
    tenantToDelete,
    openDeleteDialog,
    closeDeleteDialog,
  } = useTenantDialogs();

  // Tenant actions hook
  const {
    handleDeleteConfirm: handleDeleteConfirmAction,
    handleEnhancedSubmit,
    handleEnhancedEditSuccess,
    handleScheduleMeeting,
    isLoading: actionLoading,
  } = useTenantActions({
    refreshData: loadTenants,
    onCloseCreate: closeCreate,
    onCloseEdit: closeEdit,
    onCloseDelete: closeDeleteDialog,
  });

  const handleAddTenant = () => {
    openCreate();
  };

  const handleEditTenant = (tenant: TenantWithProperty) => {
    openEdit(tenant);
  };

  const handleDeleteClick = (tenant: TenantWithProperty) => {
    openDeleteDialog(tenant);
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;
    await handleDeleteConfirmAction(tenantToDelete);
  };

  return (
    <>
      <ListPageTemplate
        title={t('title')}
        items={filteredTenants}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('searchPlaceholder')}
        filterValue={assignmentFilter}
        onFilterChange={setAssignmentFilter}
        filterOptions={[
          { value: 'all', label: t('filters.all') },
          { value: 'assigned', label: t('filters.assigned') },
          { value: 'unassigned', label: t('filters.unassigned') },
        ]}
        filterPlaceholder={t('filterPlaceholder')}
        onAdd={handleAddTenant}
        addButtonLabel={t('addTenantButton')}
        skeletonColumnCount={5}
        emptyState={{
          title: searchQuery || assignmentFilter !== 'all' ? t('emptyState.noTenantsFound') : t('emptyState.noTenantsYet'),
          description: searchQuery || assignmentFilter !== 'all'
            ? t('emptyState.noTenantsFoundDescription')
            : t('emptyState.noTenantsYetDescription'),
          icon: <Users className={`h-16 w-16 ${COLORS.muted.text}`} />,
          actionLabel: t('emptyState.addActionLabel'),
          showAction: !searchQuery && assignmentFilter === 'all',
        }}
        renderTableHeaders={() => (
          <>
            <TableHead>{t('table.name')}</TableHead>
            <TableHead>{t('table.contact')}</TableHead>
            <TableHead>{t('table.property')}</TableHead>
            <TableHead>{t('table.status')}</TableHead>
            <TableHead className="text-right">{t('table.actions')}</TableHead>
          </>
        )}
        renderTableRow={(tenant) => (
          <TenantTableRow
            tenant={tenant}
            onEdit={handleEditTenant}
            onDelete={handleDeleteClick}
            onScheduleMeeting={handleScheduleMeeting}
          />
        )}
        renderCardContent={(tenant) => (
          <TenantCard
            tenant={tenant}
            onEdit={handleEditTenant}
            onDelete={handleDeleteClick}
            onScheduleMeeting={handleScheduleMeeting}
          />
        )}
        deleteDialog={{
          open: isDeleteDialogOpen,
          title: t('deleteDialog.title'),
          description: t('deleteDialog.description', { tenantName: tenantToDelete?.name }),
          onConfirm: handleDeleteConfirm,
          onCancel: closeDeleteDialog,
          loading: actionLoading,
        }}
      />

      <EnhancedTenantDialog
        open={isCreateOpen}
        onOpenChange={(open) => (open ? openCreate() : closeCreate())}
        onSuccess={handleEnhancedSubmit}
      />

      {selectedTenant && (
        <EnhancedTenantEditDialog
          open={isEditOpen}
          onOpenChange={(open) => (open ? openEdit(selectedTenant) : closeEdit())}
          tenant={selectedTenant}
          onSuccess={handleEnhancedEditSuccess}
        />
      )}
    </>
  );
};
