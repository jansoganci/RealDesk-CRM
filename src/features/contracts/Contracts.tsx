import { useContractsData } from './hooks/useContractsData';
import { useContractsFilters } from './hooks/useContractsFilters';
import { useContractsActions } from './hooks/useContractsActions';
import { useContractsPdfActions } from './hooks/useContractsPdfActions';
import { ContractPdfActionButtons } from './components/ContractPdfActionButtons';
import { ContractStatusBadge } from './components/ContractStatusBadge';
import { ContractImportBanner } from './components/ContractImportBanner';
import { TableCell, TableHead, TableRow } from '../../components/ui/table';
import { FileText, AlertCircle, Bell, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { COLORS } from '@/config/colors';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import { useTranslation } from 'react-i18next';
import { isExpiringSoon } from './utils/contractUtils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants';

export const Contracts = () => {
  const { t } = useTranslation(['contracts', 'common']);
  const { currency } = useAuth();
  const navigate = useNavigate();

  // Contracts data fetching hook
  const { contracts, loading, refreshData } = useContractsData();

  // Contracts filter hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredContracts,
  } = useContractsFilters({ contracts });

  // Contracts actions hook
  const {
    deleteDialogOpen,
    contractToDelete,
    actionLoading,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleAddContract,
    handleEditContract,
  } = useContractsActions({ refreshData });

  // Contracts PDF actions hook
  const {
    uploadingContractId,
    pdfActionLoading,
    handleDownloadPdf,
    handleUploadPdfClick,
  } = useContractsPdfActions({ refreshData });

  return (
    <>
      <ListPageTemplate
        title={t('title')}
        items={filteredContracts}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('searchPlaceholder')}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { value: 'all', label: t('filters.all') },
          { value: 'Active', label: t('status.active') },
          { value: 'Inactive', label: t('status.inactive') },
          { value: 'Archived', label: t('status.archived') },
        ]}
        filterPlaceholder={t('filterPlaceholder')}
        onAdd={handleAddContract}
        addButtonLabel={t('actions.add')}
        skeletonColumnCount={7}
        headerContent={
          <ContractImportBanner
            onImportClick={() => navigate(ROUTES.CONTRACT_IMPORT)}
          />
        }
        emptyState={{
          title:
            searchQuery || statusFilter !== 'all'
              ? t('emptyState.titleFiltered')
              : t('emptyState.title'),
          description: searchQuery || statusFilter !== 'all'
            ? t('emptyState.descriptionFiltered')
            : t('emptyState.description'),
          icon: <FileText className={`h-16 w-16 ${COLORS.muted.text}`} />,
          actionLabel: t('actions.createFirst'),
          showAction: !searchQuery && statusFilter === 'all',
        }}
        renderTableHeaders={() => (
          <>
            <TableHead>{t('table.tenant')}</TableHead>
            <TableHead>{t('table.property')}</TableHead>
            <TableHead>{t('table.period')}</TableHead>
            <TableHead>{t('table.rent')}</TableHead>
            <TableHead>{t('table.status')}</TableHead>
            <TableHead>{t('table.reminder')}</TableHead>
            <TableHead className="text-right">{t('table.actions')}</TableHead>
          </>
        )}
        renderTableRow={(contract) => (
          <TableRow>
            <TableCell>
              <div className="font-medium truncate max-w-[180px] md:max-w-none">
                {contract.tenant?.name || t('table.unknownTenant')}
              </div>
              {contract.tenant?.email && (
                <div className={`text-xs ${COLORS.muted.textLight} truncate max-w-[180px] md:max-w-none`}>{contract.tenant.email}</div>
              )}
            </TableCell>
            <TableCell>
              <div className={`text-sm ${COLORS.gray.text700} truncate max-w-[150px] md:max-w-[250px]`}>
                {contract.property?.address || t('table.unknownProperty')}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{format(new Date(contract.start_date), 'MMM dd, yyyy')}</div>
                <div className={`${COLORS.muted.textLight}`}>{t('table.datesTo')}</div>
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
                  {t('table.perMonth', {
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
              <ContractStatusBadge
                status={contract.status}
                hasPdf={!!contract.contract_pdf_path}
              />
            </TableCell>
            <TableCell>
              {contract.rent_increase_reminder_enabled ? (
                <div
                  className="flex items-center gap-1"
                  title={t('reminder.tooltip', {
                    days: contract.rent_increase_reminder_days,
                  })}
                >
                  <Bell className={`h-4 w-4 ${COLORS.warning.text}`} />
                  <span className={`text-xs ${COLORS.warning.text}`}>
                    {t('reminder.badge', {
                      days: contract.rent_increase_reminder_days,
                    })}
                  </span>
                </div>
              ) : (
                <span className={`${COLORS.muted.textLight} text-xs`}>
                  {t('reminder.none')}
                </span>
              )}
            </TableCell>
                <TableCell className="text-right">
                  <ContractPdfActionButtons
                    contract={contract}
                    uploadingContractId={uploadingContractId}
                    actionLoading={actionLoading}
                    pdfActionLoading={pdfActionLoading}
                    onDownload={handleDownloadPdf}
                    onUpload={handleUploadPdfClick}
                    onEdit={handleEditContract}
                    onDelete={handleDeleteClick}
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
                  {contract.tenant?.name || t('table.unknownTenant')}
                </div>
                {contract.tenant?.email && (
                  <div className={`text-xs ${COLORS.gray.text500} mt-0.5`}>
                    {contract.tenant.email}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ContractStatusBadge
                  status={contract.status}
                  hasPdf={!!contract.contract_pdf_path}
                />
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className={`text-sm ${COLORS.gray.text700} truncate`}>
                {contract.property?.address || t('table.unknownProperty')}
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
                    {t('table.perMonth', {
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
                    {t('reminder.label', {
                      days: contract.rent_increase_reminder_days,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <ContractPdfActionButtons
                contract={contract}
                uploadingContractId={uploadingContractId}
                actionLoading={actionLoading}
                pdfActionLoading={pdfActionLoading}
                onDownload={handleDownloadPdf}
                onUpload={handleUploadPdfClick}
                onEdit={handleEditContract}
                onDelete={handleDeleteClick}
              />
            </div>
          </div>
        )}
        deleteDialog={{
          open: deleteDialogOpen,
          title: t('dialog.deleteTitle'),
          description: t('dialog.deleteDescription', {
            name: contractToDelete?.tenant?.name || t('table.unknownTenant'),
          }),
          onConfirm: handleDeleteConfirm,
          onCancel: handleDeleteCancel,
          loading: actionLoading,
        }}
      />
    </>
  );
};
