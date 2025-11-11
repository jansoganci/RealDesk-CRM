
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableHead, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { TenantDialog } from './TenantDialog';
import { EnhancedTenantDialog } from './EnhancedTenantDialog';
import { EnhancedTenantEditDialog } from './EnhancedTenantEditDialog';
import { tenantsService } from '../../lib/serviceProxy';
import { TenantWithProperty, TenantWithContractResult } from '../../types';
import { toast } from 'sonner';
import { Phone, Mail, Building2, UserX, Users, CalendarPlus } from 'lucide-react';

import { COLORS, getStatusBadgeClasses } from '@/config/colors';
import { TableActionButtons } from '../../components/common/TableActionButtons';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import * as z from 'zod';

import { getTenantSchema } from './tenantSchema';

export const Tenants = () => {
  const { t } = useTranslation(['tenants', 'common']);
  const navigate = useNavigate();
  const tenantSchema = getTenantSchema(t);
  type TenantFormData = z.infer<typeof tenantSchema>;

  const [tenants, setTenants] = useState<TenantWithProperty[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithProperty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enhancedDialogOpen, setEnhancedDialogOpen] = useState(false);
  const [enhancedEditDialogOpen, setEnhancedEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithProperty | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<TenantWithProperty | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    filterTenants();
  }, [searchQuery, assignmentFilter, tenants]);

  const filterTenants = () => {
    let filtered = [...tenants];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(query) ||
          tenant.phone?.toLowerCase().includes(query) ||
          tenant.email?.toLowerCase().includes(query) ||
          tenant.property?.address.toLowerCase().includes(query)
      );
    }

    if (assignmentFilter === 'assigned') {
      filtered = filtered.filter((tenant) => tenant.property_id !== null);
    } else if (assignmentFilter === 'unassigned') {
      filtered = filtered.filter((tenant) => tenant.property_id === null);
    }

    setFilteredTenants(filtered);
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantsService.getAll();
      setTenants(data);
      setFilteredTenants(data);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = () => {
    setSelectedTenant(null);
    setEnhancedDialogOpen(true);
  };

  const handleEditTenant = (tenant: TenantWithProperty) => {
    setSelectedTenant(tenant);
    setEnhancedEditDialogOpen(true); // Use enhanced edit dialog instead
  };

  const handleDeleteClick = (tenant: TenantWithProperty) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;

    try {
      setActionLoading(true);
      await tenantsService.delete(tenantToDelete.id);
      toast.success(t('toasts.deleteSuccess'));
      await loadTenants();
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      toast.error(t('toasts.deleteError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (data: TenantFormData) => {
    try {
      setActionLoading(true);
      if (selectedTenant) {
        await tenantsService.update(selectedTenant.id, data);
        toast.success(t('toasts.updateSuccess'));
      } else {
        await tenantsService.create(data);
        toast.success(t('toasts.addSuccess'));
      }
      await loadTenants();
      setDialogOpen(false);
      setSelectedTenant(null);
    } catch (error) {
      toast.error(selectedTenant ? t('toasts.updateError') : t('toasts.addError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnhancedSubmit = async (result: TenantWithContractResult) => {
    toast.success(t('toasts.addTenantWithContractSuccess', { tenantName: result.tenant.name }));
    await loadTenants();
    setEnhancedDialogOpen(false);
  };

  const handleEnhancedEditSuccess = async () => {
    await loadTenants();
    setEnhancedEditDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleScheduleMeeting = (tenant: TenantWithProperty) => {
    navigate(`/calendar?open_add_meeting=true&tenant_id=${tenant.id}`);
  };

  const getAssignmentBadge = (tenant: TenantWithProperty) => {
    if (tenant.property_id) {
      return <Badge className={getStatusBadgeClasses('assigned')}>{t('status.assigned')}</Badge>;
    }
    return <Badge className={getStatusBadgeClasses('unassigned')}>{t('status.unassigned')}</Badge>;
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
          <TableRow>
            <TableCell>
              <div>
                <div className="font-medium">{tenant.name}</div>
                {tenant.notes && (
                  <div className={`text-xs ${COLORS.muted.textLight} mt-1 line-clamp-1`}>
                    {tenant.notes}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className={`h-3 w-3 ${COLORS.muted.textLight}`} />
                    <span className={`${COLORS.gray.text600}`}>{tenant.phone}</span>
                  </div>
                )}
                {tenant.email && (
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <Mail className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
                    <span className={`${COLORS.gray.text600} truncate max-w-[150px] md:max-w-[250px]`}>{tenant.email}</span>
                  </div>
                )}
                {!tenant.phone && !tenant.email && (
                  <span className={`${COLORS.muted.textLight} text-sm`}>-</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {tenant.property ? (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Building2 className={`h-3 w-3 ${COLORS.primary.text} flex-shrink-0`} />
                  <span className={`${COLORS.gray.text700} truncate max-w-[150px] md:max-w-[250px]`}>{tenant.property.address}</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 text-sm ${COLORS.muted.textLight}`}>
                  <UserX className="h-3 w-3" />
                  <span>{t('noProperty')}</span>
                </div>
              )}
            </TableCell>
            <TableCell>
              {getAssignmentBadge(tenant)}
            </TableCell>
            <TableCell>
              <TableActionButtons
                onEdit={() => handleEditTenant(tenant)}
                onDelete={() => handleDeleteClick(tenant)}
                showView={false}
                customActions={[
                  {
                    icon: <CalendarPlus className="h-4 w-4" />,
                    tooltip: t('scheduleMeeting'),
                    onClick: () => handleScheduleMeeting(tenant),
                  },
                ]}
              />
            </TableCell>
          </TableRow>
        )}
        renderCardContent={(tenant) => (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className={`font-semibold text-base ${COLORS.gray.text900}`}>
                  {tenant.name}
                </span>
                {tenant.notes && (
                  <p className={`text-xs ${COLORS.gray.text500} mt-1 line-clamp-2`}>
                    {tenant.notes}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {getAssignmentBadge(tenant)}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2">
              {tenant.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text600}>{tenant.phone}</span>
                </div>
              )}
              
              {tenant.email && (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className={`h-4 w-4 ${COLORS.muted.textLight} flex-shrink-0`} />
                  <span className={`${COLORS.gray.text600} truncate`}>{tenant.email}</span>
                </div>
              )}

              {tenant.property ? (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Building2 className={`h-4 w-4 ${COLORS.primary.text} flex-shrink-0`} />
                  <span className={`${COLORS.gray.text700} truncate`}>{tenant.property.address}</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 text-sm ${COLORS.muted.textLight}`}>
                  <UserX className="h-4 w-4" />
                  <span>{t('noPropertyAssigned')}</span>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <TableActionButtons
                onEdit={() => handleEditTenant(tenant)}
                onDelete={() => handleDeleteClick(tenant)}
                showView={false}
                customActions={[
                  {
                    icon: <CalendarPlus className="h-4 w-4" />,
                    tooltip: t('scheduleMeeting'),
                    onClick: () => handleScheduleMeeting(tenant),
                  },
                ]}
              />
            </div>
          </div>
        )}
        deleteDialog={{
          open: deleteDialogOpen,
          title: t('deleteDialog.title'),
          description: t('deleteDialog.description', { tenantName: tenantToDelete?.name }),
          onConfirm: handleDeleteConfirm,
          onCancel: () => setDeleteDialogOpen(false),
          loading: actionLoading,
        }}
      />

      <TenantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenant={selectedTenant}
        onSubmit={handleSubmit}
        loading={actionLoading}
      />

      <EnhancedTenantDialog
        open={enhancedDialogOpen}
        onOpenChange={setEnhancedDialogOpen}
        onSuccess={handleEnhancedSubmit}
      />

      {selectedTenant && (
        <EnhancedTenantEditDialog
          open={enhancedEditDialogOpen}
          onOpenChange={setEnhancedEditDialogOpen}
          tenant={selectedTenant}
          onSuccess={handleEnhancedEditSuccess}
        />
      )}
    </>
  );
};
