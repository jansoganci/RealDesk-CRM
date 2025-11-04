
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableHead, TableRow } from '../../components/ui/table';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { PropertyDialog } from './PropertyDialog';
import { EnhancedTenantDialog } from '../tenants/EnhancedTenantDialog';
import { propertiesService } from '../../lib/serviceProxy';
import { PropertyWithOwner, TenantWithContractResult } from '../../types';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import { format } from 'date-fns';
import { getToday, daysDifference } from '../../lib/dates';
import { MapPin, Building2, User, Images, UserPlus, DollarSign, Calendar, AlertCircle, ExternalLink, CalendarPlus } from 'lucide-react';
import { COLORS, getStatusBadgeClasses } from '@/config/colors';
import { TableActionButtons } from '../../components/common/TableActionButtons';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import * as z from 'zod';
import { getPropertySchema } from './propertySchema';

export const Properties = () => {
  const { t } = useTranslation(['properties', 'common']);
  const { currency } = useAuth();
  const propertySchema = getPropertySchema(t);
  type PropertyFormData = z.infer<typeof propertySchema>;

  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithOwner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enhancedTenantDialogOpen, setEnhancedTenantDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [selectedPropertyForTenant, setSelectedPropertyForTenant] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyWithOwner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, statusFilter, properties]);

  const filterProperties = () => {
    let filtered = [...properties];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.address.toLowerCase().includes(query) ||
          property.city?.toLowerCase().includes(query) ||
          property.district?.toLowerCase().includes(query) ||
          property.owner?.name.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((property) => property.status === statusFilter);
    }

    setFilteredProperties(filtered);
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertiesService.getAll();
      // Debug: Check if listing_url is being fetched
      if (data.length > 0) {
        console.log('Sample property data:', {
          address: data[0].address,
          hasListingUrl: !!data[0].listing_url,
          listing_url: data[0].listing_url,
        });
      }
      setProperties(data);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setDialogOpen(true);
  };

  const handleEditProperty = (property: PropertyWithOwner) => {
    setSelectedProperty(property);
    setDialogOpen(true);
  };

  const handleDeleteClick = (property: PropertyWithOwner) => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    try {
      setActionLoading(true);
      await propertiesService.delete(propertyToDelete.id);
      toast.success(t('toasts.deleteSuccess'));
      await loadProperties();
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    } catch (error) {
      toast.error(t('toasts.deleteError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (data: PropertyFormData) => {
    try {
      setActionLoading(true);
      if (selectedProperty) {
        await propertiesService.update(selectedProperty.id, data);
        toast.success(t('toasts.updateSuccess'));
      } else {
        await propertiesService.create(data);
        toast.success(t('toasts.addSuccess'));
      }
      await loadProperties();
      setDialogOpen(false);
      setSelectedProperty(null);
    } catch (error) {
      toast.error(selectedProperty ? t('toasts.updateError') : t('toasts.addError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTenantToProperty = (propertyId: string) => {
    setSelectedPropertyForTenant(propertyId);
    setEnhancedTenantDialogOpen(true);
  };

  const handleTenantCreated = async (result: TenantWithContractResult) => {
    toast.success(t('toasts.addTenantToPropertySuccess', { tenantName: result.tenant.name }));
    await loadProperties();
    setEnhancedTenantDialogOpen(false);
    setSelectedPropertyForTenant(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Empty: { label: t('status.empty'), className: getStatusBadgeClasses('empty') },
      Occupied: { label: t('status.occupied'), className: getStatusBadgeClasses('occupied') },
      Inactive: { label: t('status.inactive'), className: getStatusBadgeClasses('inactive') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Empty;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <ListPageTemplate
        title={t('title')}
        items={filteredProperties}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('searchPlaceholder')}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { value: 'all', label: t('filters.all') },
          { value: 'Empty', label: t('status.empty') },
          { value: 'Occupied', label: t('status.occupied') },
          { value: 'Inactive', label: t('status.inactive') },
        ]}
        filterPlaceholder={t('filterPlaceholder')}
        onAdd={handleAddProperty}
        addButtonLabel={t('addPropertyButton')}
        emptyState={{
          title: searchQuery || statusFilter !== 'all' ? t('emptyState.noPropertiesFound') : t('emptyState.noPropertiesYet'),
          description: searchQuery || statusFilter !== 'all'
            ? t('emptyState.noPropertiesFoundDescription')
            : t('emptyState.noPropertiesYetDescription'),
          icon: <Building2 className={`h-16 w-16 ${COLORS.muted.text}`} />,
          actionLabel: t('emptyState.addActionLabel'),
          showAction: !searchQuery && statusFilter === 'all',
        }}
        renderTableHeaders={() => (
          <>
            <TableHead>{t('properties:table.address')}</TableHead>
            <TableHead>{t('properties:table.location')}</TableHead>
            <TableHead>{t('properties:table.owner')}</TableHead>
            <TableHead>{t('properties:table.tenant')}</TableHead>
            <TableHead>{t('properties:table.rent')}</TableHead>
            <TableHead className="whitespace-nowrap">{t('properties:table.contractEndDate')}</TableHead>
            <TableHead>{t('properties:table.status')}</TableHead>
            <TableHead className="text-right">{t('properties:table.actions')}</TableHead>
          </>
        )}
        renderTableRow={(property) => (
          <TableRow>
            <TableCell>
              <div className="flex items-start gap-2 min-w-0">
                <Building2 className={`h-4 w-4 ${COLORS.primary.text} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-medium truncate max-w-[200px] md:max-w-none`}>
                      {property.address}
                    </span>
                    {property.photos && property.photos.length > 0 && (
                      <span className={`inline-flex items-center gap-1 text-xs ${COLORS.gray.text500} flex-shrink-0`}>
                        <Images className="h-3 w-3" />
                        {t('photos', { count: property.photos.length })}
                      </span>
                    )}
                    {property.listing_url && property.listing_url.trim() !== '' && (
                      <a
                        href={property.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 min-w-[28px] min-h-[28px] rounded-md hover:bg-blue-50 transition-colors text-blue-600 hover:text-blue-700 cursor-pointer flex-shrink-0"
                        title={t('properties:table.viewListing')}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t('properties:table.viewListing')}
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                  {property.notes && (
                    <div className={`text-xs ${COLORS.gray.text500} mt-1 line-clamp-1`}>
                      {property.notes}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {property.city || property.district ? (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <MapPin className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
                  <span className={`${COLORS.gray.text600} truncate max-w-[150px] md:max-w-none`}>
                    {[property.city, property.district].filter(Boolean).join(', ')}
                  </span>
                </div>
              ) : (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('notAvailable')}</span>
              )}
            </TableCell>
            <TableCell>
              {property.owner ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className={`h-3 w-3 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text700}>{property.owner.name}</span>
                </div>
              ) : (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('notAvailable')}</span>
              )}
            </TableCell>
            <TableCell>
              {property.status === 'Inactive' ? (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.inactive')}</span>
              ) : property.activeTenant ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className={`h-3 w-3 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text700}>{property.activeTenant.name}</span>
                </div>
              ) : (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noTenant')}</span>
              )}
            </TableCell>
            <TableCell>
              {property.status === 'Inactive' || !property.activeContract?.rent_amount ? (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noRent')}</span>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
                  <span className={COLORS.gray.text700}>
                    {formatCurrency(
                      convertCurrency(
                        property.activeContract.rent_amount,
                        property.activeContract.currency || 'USD',
                        currency || 'USD'
                      ),
                      currency || 'USD'
                    )}
                    {t('properties:table.perMonth')}
                  </span>
                </div>
              )}
            </TableCell>
            <TableCell>
              {property.status === 'Inactive' || !property.activeContract?.end_date ? (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noContract')}</span>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />
                  <span className={COLORS.gray.text600}>
                    {format(new Date(property.activeContract.end_date), 'dd MMM yyyy')}
                  </span>
                  {(() => {
                    const today = getToday();
                    const endDate = new Date(property.activeContract.end_date);
                    const daysLeft = daysDifference(endDate, today);
                    if (daysLeft <= 30 && daysLeft >= 0) {
                      return (
                        <AlertCircle className={`h-3 w-3 ${COLORS.warning.text} flex-shrink-0`} />
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </TableCell>
            <TableCell>
              {getStatusBadge(property.status)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                {property.status === 'Empty' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTenantToProperty(property.id)}
                    className="text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    {t('addTenantButton')}
                  </Button>
                )}
                <TableActionButtons
                  onEdit={() => handleEditProperty(property)}
                  onDelete={() => handleDeleteClick(property)}
                  showView={false}
                />
              </div>
            </TableCell>
          </TableRow>
        )}
        renderCardContent={(property) => (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className={`h-4 w-4 ${COLORS.primary.text} flex-shrink-0`} />
                  <span className={`font-semibold text-base ${COLORS.gray.text900}`}>
                    {property.address}
                  </span>
                  {property.listing_url && (
                    <a
                      href={property.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-blue-50 transition-colors text-blue-600 hover:text-blue-700 cursor-pointer"
                      title={t('properties:table.viewListing')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {property.notes && (
                  <p className={`text-xs ${COLORS.gray.text500} mt-1 line-clamp-2`}>
                    {property.notes}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(property.status)}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2">
              {(property.city || property.district) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text600}>
                    {[property.city, property.district].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              
              {property.owner && (
                <div className="flex items-center gap-2 text-sm">
                  <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text700}>{property.owner.name}</span>
                </div>
              )}

              {property.status === 'Inactive' ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.muted.textLight}>{t('properties:table.inactive')}</span>
                </div>
              ) : property.activeTenant ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text700}>{property.activeTenant.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.muted.textLight}>{t('properties:table.noTenant')}</span>
                </div>
              )}

              {property.status !== 'Inactive' && property.activeContract?.rent_amount && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text700}>
                    {formatCurrency(
                      convertCurrency(
                        property.activeContract.rent_amount,
                        property.activeContract.currency || 'USD',
                        currency || 'USD'
                      ),
                      currency || 'USD'
                    )}
                    {t('properties:table.perMonth')}
                  </span>
                </div>
              )}

              {property.status !== 'Inactive' && property.activeContract?.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text600}>
                    {t('properties:table.contractEndDate')}: {format(new Date(property.activeContract.end_date), 'dd MMM yyyy')}
                  </span>
                  {(() => {
                    const today = getToday();
                    const endDate = new Date(property.activeContract.end_date);
                    const daysLeft = daysDifference(endDate, today);
                    if (daysLeft <= 30 && daysLeft >= 0) {
                      return (
                        <AlertCircle className={`h-4 w-4 ${COLORS.warning.text} flex-shrink-0`} />
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {property.photos && property.photos.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Images className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <span className={COLORS.gray.text600}>
                    {t('photos', { count: property.photos.length })}
                  </span>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              {property.status === 'Empty' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTenantToProperty(property.id)}
                  className="w-full justify-start"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('properties.addTenantButton')}
                </Button>
              )}
              <div className="flex gap-2">
                <TableActionButtons
                  onEdit={() => handleEditProperty(property)}
                  onDelete={() => handleDeleteClick(property)}
                  showView={false}
                />
              </div>
            </div>
          </div>
        )}
        deleteDialog={{
          open: deleteDialogOpen,
          title: t('deleteDialog.title'),
          description: t('deleteDialog.description', { propertyAddress: propertyToDelete?.address }),
          onConfirm: handleDeleteConfirm,
          onCancel: () => setDeleteDialogOpen(false),
          loading: actionLoading,
        }}
      />

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={selectedProperty}
        onSubmit={handleSubmit}
        loading={actionLoading}
      />

      <EnhancedTenantDialog
        open={enhancedTenantDialogOpen}
        onOpenChange={setEnhancedTenantDialogOpen}
        onSuccess={handleTenantCreated}
        preSelectedPropertyId={selectedPropertyForTenant}
      />
    </>
  );
};
