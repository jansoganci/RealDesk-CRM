import { useState, useEffect } from 'react';
import { TableCell, TableHead, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { ContractDialog } from './ContractDialog';
import { contractsService } from '../../lib/serviceProxy';
import { ContractWithDetails } from '../../types';
import { toast } from 'sonner';
import { FileText, AlertCircle, Bell, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { COLORS, getStatusBadgeClasses } from '@/config/colors';
import { TableActionButtons } from '../../components/common/TableActionButtons';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import { useTranslation } from 'react-i18next';
import { getToday, parseDateToStartOfDay, daysDifference } from '../../lib/dates';

type ContractFormData = {
  tenant_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  rent_amount?: string;
  status: 'Active' | 'Archived' | 'Inactive';
  notes?: string;
  rent_increase_reminder_enabled?: boolean;
  rent_increase_reminder_days?: string;
  expected_new_rent?: string;
  reminder_notes?: string;
};

export const Contracts = () => {
  const { t } = useTranslation(['contracts', 'common']);
  const { currency } = useAuth();
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<ContractWithDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [searchQuery, statusFilter, contracts]);

  const filterContracts = () => {
    let filtered = [...contracts];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.tenant?.name?.toLowerCase().includes(query) ||
          contract.property?.address?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((contract) => contract.status === statusFilter);
    }

    setFilteredContracts(filtered);
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await contractsService.getAll();
      setContracts(data);
    } catch (error) {
      toast.error(t('contracts.errors.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = () => {
    setSelectedContract(null);
    setDialogOpen(true);
  };

  const handleEditContract = (contract: ContractWithDetails) => {
    setSelectedContract(contract);
    setDialogOpen(true);
  };

  const handleDeleteClick = (contract: ContractWithDetails) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;

    try {
      setActionLoading(true);

      if (contractToDelete.contract_pdf_path) {
        try {
          await contractsService.deleteContractPdf(contractToDelete.contract_pdf_path);
        } catch (error) {
          console.warn('Failed to delete PDF:', error);
        }
      }

      await contractsService.delete(contractToDelete.id);
      toast.success(t('contracts.toasts.deleted'));
      await loadContracts();
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      toast.error(t('contracts.errors.deleteFailed'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (data: ContractFormData, pdfFile?: File) => {
    try {
      setActionLoading(true);

      const contractData = {
        ...data,
        rent_amount: data.rent_amount ? parseFloat(data.rent_amount) : null,
        rent_increase_reminder_enabled: data.rent_increase_reminder_enabled || false,
        rent_increase_reminder_days: data.rent_increase_reminder_days ? parseInt(data.rent_increase_reminder_days) : 90,
        rent_increase_reminder_contacted: false,
        expected_new_rent: data.expected_new_rent ? parseFloat(data.expected_new_rent) : null,
        reminder_notes: data.reminder_notes || null,
      };

      let contract;
      if (selectedContract) {
        contract = await contractsService.update(selectedContract.id, contractData);
        toast.success(t('contracts.toasts.updated'));
      } else {
        // user_id is injected automatically by the service
        contract = await contractsService.createWithStatusUpdate(contractData as any);
        toast.success(t('contracts.toasts.created'));
      }

      if (pdfFile && contract) {
        try {
          await contractsService.uploadContractPdfAndPersist(pdfFile, contract.id.toString());
          toast.success(t('contracts.toasts.pdfUploaded'));
        } catch (error) {
          toast.error(t('contracts.toasts.pdfUploadPartial'));
          console.error(error);
        }
      }

      await loadContracts();
      setDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      toast.error(
        selectedContract
          ? t('contracts.errors.updateFailed')
          : t('contracts.errors.createFailed')
      );
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { label: t('contracts.status.active'), className: getStatusBadgeClasses('active') },
      Inactive: { label: t('contracts.status.inactive'), className: getStatusBadgeClasses('inactive') },
      Archived: { label: t('contracts.status.archived'), className: getStatusBadgeClasses('archived') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const isExpiringSoon = (endDate: string, status: string): boolean => {
    if (status !== 'Active') return false;
    const end = parseDateToStartOfDay(endDate);
    const today = getToday();
    const daysUntilExpiry = daysDifference(end, today);
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  return (
    <>
      <ListPageTemplate
        title={t('contracts.title')}
        items={filteredContracts}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('contracts.searchPlaceholder')}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { value: 'all', label: t('contracts.filters.all') },
          { value: 'Active', label: t('contracts.status.active') },
          { value: 'Inactive', label: t('contracts.status.inactive') },
          { value: 'Archived', label: t('contracts.status.archived') },
        ]}
        filterPlaceholder={t('contracts.filterPlaceholder')}
        onAdd={handleAddContract}
        addButtonLabel={t('contracts.actions.add')}
        skeletonColumnCount={7}
        emptyState={{
          title:
            searchQuery || statusFilter !== 'all'
              ? t('contracts.emptyState.titleFiltered')
              : t('contracts.emptyState.title'),
          description: searchQuery || statusFilter !== 'all'
            ? t('contracts.emptyState.descriptionFiltered')
            : t('contracts.emptyState.description'),
          icon: <FileText className={`h-16 w-16 ${COLORS.muted.text}`} />,
          actionLabel: t('contracts.actions.createFirst'),
          showAction: !searchQuery && statusFilter === 'all',
        }}
        renderTableHeaders={() => (
          <>
            <TableHead>{t('contracts.table.tenant')}</TableHead>
            <TableHead>{t('contracts.table.property')}</TableHead>
            <TableHead>{t('contracts.table.period')}</TableHead>
            <TableHead>{t('contracts.table.rent')}</TableHead>
            <TableHead>{t('contracts.table.status')}</TableHead>
            <TableHead>{t('contracts.table.reminder')}</TableHead>
            <TableHead className="text-right">{t('contracts.table.actions')}</TableHead>
          </>
        )}
        renderTableRow={(contract) => (
          <TableRow>
            <TableCell>
              <div className="font-medium truncate max-w-[180px] md:max-w-none">
                {contract.tenant?.name || t('contracts.table.unknownTenant')}
              </div>
              {contract.tenant?.email && (
                <div className={`text-xs ${COLORS.muted.textLight} truncate max-w-[180px] md:max-w-none`}>{contract.tenant.email}</div>
              )}
            </TableCell>
            <TableCell>
              <div className={`text-sm ${COLORS.gray.text700} truncate max-w-[150px] md:max-w-[250px]`}>
                {contract.property?.address || t('contracts.table.unknownProperty')}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{format(new Date(contract.start_date), 'MMM dd, yyyy')}</div>
                <div className={`${COLORS.muted.textLight}`}>{t('contracts.table.datesTo')}</div>
                <div className="flex items-center gap-1">
                  {format(new Date(contract.end_date), 'MMM dd, yyyy')}
                  {isExpiringSoon(contract.end_date, contract.status) && (
                    <AlertCircle className={`h-3 w-3 ${COLORS.warning.text}`} />
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {contract.rent_amount ? (
                <div className="font-medium">
                  {t('contracts.table.perMonth', {
                    amount: formatCurrency(
                      convertCurrency(contract.rent_amount, contract.currency || 'USD', currency),
                      currency
                    ),
                  })}
                </div>
              ) : (
                <span className={`${COLORS.muted.textLight}`}>-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusBadge(contract.status)}
                {contract.contract_pdf_path && (
                  <span title={t('contracts.table.pdfAttached')}>
                    <FileText className={`h-4 w-4 ${COLORS.primary.text}`} />
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {contract.rent_increase_reminder_enabled ? (
                <div
                  className="flex items-center gap-1"
                  title={t('contracts.reminder.tooltip', {
                    days: contract.rent_increase_reminder_days,
                  })}
                >
                  <Bell className={`h-4 w-4 ${COLORS.warning.text}`} />
                  <span className={`text-xs ${COLORS.warning.text}`}>
                    {t('contracts.reminder.badge', {
                      days: contract.rent_increase_reminder_days,
                    })}
                  </span>
                </div>
              ) : (
                <span className={`${COLORS.muted.textLight} text-xs`}>
                  {t('contracts.reminder.none')}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <TableActionButtons
                onEdit={() => handleEditContract(contract)}
                onDelete={() => handleDeleteClick(contract)}
                showView={false}
              />
            </TableCell>
          </TableRow>
        )}
        renderCardContent={(contract) => (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className={`font-semibold text-base ${COLORS.gray.text900}`}>
                  {contract.tenant?.name || t('contracts.table.unknownTenant')}
                </div>
                {contract.tenant?.email && (
                  <div className={`text-xs ${COLORS.gray.text500} mt-0.5`}>
                    {contract.tenant.email}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(contract.status)}
                {contract.contract_pdf_path && (
                  <span title={t('contracts.table.pdfAttached')}>
                    <FileText className={`h-4 w-4 ${COLORS.primary.text}`} />
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className={`text-sm ${COLORS.gray.text700} truncate`}>
                {contract.property?.address || t('contracts.table.unknownProperty')}
              </div>

              <div className="text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className={`h-3 w-3 ${COLORS.muted.textLight}`} />
                  <span>{format(new Date(contract.start_date), 'MMM dd, yyyy')}</span>
                  <span className={COLORS.muted.textLight}>→</span>
                  <div className="flex items-center gap-1">
                    <span>{format(new Date(contract.end_date), 'MMM dd, yyyy')}</span>
                    {isExpiringSoon(contract.end_date, contract.status) && (
                      <AlertCircle className={`h-3 w-3 ${COLORS.warning.text}`} />
                    )}
                  </div>
                </div>
              </div>

              {contract.rent_amount && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={`font-medium ${COLORS.gray.text900}`}>
                    {t('contracts.table.perMonth', {
                      amount: formatCurrency(
                        convertCurrency(contract.rent_amount, contract.currency || 'USD', currency),
                        currency
                      ),
                    })}
                  </span>
                </div>
              )}

              {contract.rent_increase_reminder_enabled && (
                <div className="flex items-center gap-2 text-sm">
                  <Bell className={`h-4 w-4 ${COLORS.warning.text}`} />
                  <span className={COLORS.warning.text}>
                    {t('contracts.reminder.label', {
                      days: contract.rent_increase_reminder_days,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <TableActionButtons
                onEdit={() => handleEditContract(contract)}
                onDelete={() => handleDeleteClick(contract)}
                showView={false}
              />
            </div>
          </div>
        )}
        deleteDialog={{
          open: deleteDialogOpen,
          title: t('contracts.dialog.deleteTitle'),
          description: t('contracts.dialog.deleteDescription', {
            name: contractToDelete?.tenant?.name || t('contracts.table.unknownTenant'),
          }),
          onConfirm: handleDeleteConfirm,
          onCancel: () => setDeleteDialogOpen(false),
          loading: actionLoading,
        }}
      />

      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contract={selectedContract}
        onSubmit={handleSubmit}
        loading={actionLoading}
      />
    </>
  );
};
