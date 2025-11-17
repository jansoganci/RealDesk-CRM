import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TableCell, TableHead, TableRow } from '../../components/ui/table';
import { OwnerDialog } from './OwnerDialog';
import { ownersService } from '../../lib/serviceProxy';
import { PropertyOwner } from '../../types';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, User } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { TableActionButtons } from '../../components/common/TableActionButtons';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import * as z from 'zod';
import { getOwnerSchema } from './ownerSchema';

export const Owners = () => {
  const { t } = useTranslation(['owners', 'common']);
  const ownerSchema = getOwnerSchema(t);
  type OwnerFormData = z.infer<typeof ownerSchema>;

  const [owners, setOwners] = useState<(PropertyOwner & { property_count?: number })[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<(PropertyOwner & { property_count?: number })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<PropertyOwner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<PropertyOwner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOwners();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOwners(owners);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = owners.filter(
        (owner) =>
          owner.name.toLowerCase().includes(query) ||
          (owner.email && owner.email.toLowerCase().includes(query)) ||
          (owner.phone && owner.phone.toLowerCase().includes(query))
      );
      setFilteredOwners(filtered);
    }
  }, [searchQuery, owners]);

  const loadOwners = async () => {
    try {
      setLoading(true);
      const data = await ownersService.getOwnersWithPropertyCount();
      setOwners(data);
      setFilteredOwners(data);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOwner = () => {
    setSelectedOwner(null);
    setDialogOpen(true);
  };

  const handleEditOwner = (owner: PropertyOwner) => {
    setSelectedOwner(owner);
    setDialogOpen(true);
  };

  const handleDeleteClick = (owner: PropertyOwner) => {
    setOwnerToDelete(owner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ownerToDelete) return;

    try {
      setActionLoading(true);
      await ownersService.delete(ownerToDelete.id);
      toast.success(t('toasts.deleteSuccess'));
      await loadOwners();
      setDeleteDialogOpen(false);
      setOwnerToDelete(null);
    } catch (error) {
      toast.error(t('toasts.deleteError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (data: OwnerFormData) => {
    try {
      setActionLoading(true);
      if (selectedOwner) {
        await ownersService.update(selectedOwner.id, data);
        toast.success(t('toasts.updateSuccess'));
      } else {
        // user_id is injected automatically by the service
        await ownersService.create(data as any);
        toast.success(t('toasts.addSuccess'));
      }
      await loadOwners();
      setDialogOpen(false);
      setSelectedOwner(null);
    } catch (error) {
      toast.error(selectedOwner ? t('toasts.updateError') : t('toasts.addError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <ListPageTemplate
        title={t('title')}
        items={filteredOwners}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('searchPlaceholder')}
        onAdd={handleAddOwner}
        addButtonLabel={t('addOwnerButton')}
        skeletonColumnCount={5}
        emptyState={{
          title: searchQuery ? t('emptyState.noOwnersFound') : t('emptyState.noOwnersYet'),
          description: searchQuery
            ? t('emptyState.noOwnersFoundDescription')
            : t('emptyState.noOwnersYetDescription'),
          icon: <User className={`h-16 w-16 ${COLORS.muted.text}`} />,
          actionLabel: t('emptyState.addActionLabel'),
          showAction: !searchQuery,
        }}
        renderTableHeaders={() => (
          <>
            <TableHead>{t('table.name')}</TableHead>
            <TableHead>{t('table.contact')}</TableHead>
            <TableHead>{t('table.address')}</TableHead>
            <TableHead className="text-center">{t('table.properties')}</TableHead>
            <TableHead className="text-right">{t('table.actions')}</TableHead>
          </>
        )}
        renderTableRow={(owner) => (
          <TableRow>
            <TableCell className="font-medium">{owner.name}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
                  <span className={`truncate max-w-[150px] md:max-w-[250px]`}>{owner.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
                  <span>{owner.phone}</span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {owner.address ? (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <MapPin className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
                  <span className={`${COLORS.gray.text600} truncate max-w-[180px] md:max-w-[300px]`}>{owner.address}</span>
                </div>
              ) : (
                <span className={`${COLORS.muted.textLight} text-sm`}>-</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${COLORS.primary.bgGradient} ${COLORS.text.white} shadow-sm`}>
                {owner.property_count || 0}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <TableActionButtons
                onEdit={() => handleEditOwner(owner)}
                onDelete={() => handleDeleteClick(owner)}
                showView={false}
              />
            </TableCell>
          </TableRow>
        )}
        renderCardContent={(owner) => (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <span className={`font-semibold text-base ${COLORS.gray.text900}`}>
                {owner.name}
              </span>
              <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${COLORS.primary.bgGradient} ${COLORS.text.white} shadow-sm`}>
                {t('propertyCount', { count: owner.property_count || 0 })}
              </span>
            </div>

            {/* Body */}
            <div className="space-y-2">
              {owner.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={`${COLORS.gray.text600} truncate`}>{owner.email}</span>
                </div>
              )}
              
              {owner.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text600}>{owner.phone}</span>
                </div>
              )}

              {owner.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={`${COLORS.gray.text600} truncate`}>{owner.address}</span>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <TableActionButtons
                onEdit={() => handleEditOwner(owner)}
                onDelete={() => handleDeleteClick(owner)}
                showView={false}
              />
            </div>
          </div>
        )}
        deleteDialog={{
          open: deleteDialogOpen,
          title: t('deleteDialog.title'),
          description: t('deleteDialog.description', { ownerName: ownerToDelete?.name }),
          onConfirm: handleDeleteConfirm,
          onCancel: () => setDeleteDialogOpen(false),
          loading: actionLoading,
        }}
      />

      <OwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        owner={selectedOwner}
        onSubmit={handleSubmit}
        loading={actionLoading}
      />
    </>
  );
};
