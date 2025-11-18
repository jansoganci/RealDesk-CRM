
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TableCell, TableHead, TableRow } from '../../components/ui/table';
import { AnimatedTabs } from '../../components/ui/animated-tabs';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { PropertyDialog } from './PropertyDialog';
import { EnhancedTenantDialog } from '../tenants/EnhancedTenantDialog';
import { MarkAsSoldDialog } from './MarkAsSoldDialog';
import { propertiesService, commissionsService } from '../../lib/serviceProxy';
import { PropertyWithOwner, TenantWithContractResult } from '../../types';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import { format } from 'date-fns';
import { getToday, daysDifference } from '../../lib/dates';
import { MapPin, Building2, User, Images, DollarSign, Calendar, AlertCircle, ExternalLink, TrendingUp, Home } from 'lucide-react';
import { COLORS, getStatusBadgeClasses } from '@/config/colors';
import { TableActionButtons } from '../../components/common/TableActionButtons';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import * as z from 'zod';
import { getPropertySchema } from './propertySchemas';

export const Properties = () => {
  const { t } = useTranslation(['properties', 'common']);
  const { currency, commissionRate } = useAuth();
  const propertySchema = getPropertySchema(t);
  type PropertyFormData = z.infer<typeof propertySchema>;

  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithOwner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'all' | 'rental' | 'sale'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enhancedTenantDialogOpen, setEnhancedTenantDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [selectedPropertyForTenant, setSelectedPropertyForTenant] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyWithOwner | null>(null);
  const [markAsSoldDialogOpen, setMarkAsSoldDialogOpen] = useState(false);
  const [propertyToSell, setPropertyToSell] = useState<PropertyWithOwner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, propertyTypeFilter, statusFilter, properties]);

  const filterProperties = () => {
    let filtered = [...properties];

    // Filter by property type
    if (propertyTypeFilter !== 'all') {
      filtered = filtered.filter((property) => property.property_type === propertyTypeFilter);
    }

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
        // user_id is injected automatically by the service
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

  const handleMarkAsSoldClick = (property: PropertyWithOwner) => {
    setPropertyToSell(property);
    setMarkAsSoldDialogOpen(true);
  };

  const handleMarkAsSoldConfirm = async (salePrice: number, saleCurrency: string) => {
    if (!propertyToSell) return;

    try {
      setActionLoading(true);
      // Create sale commission (4% of sale price)
      await commissionsService.createSaleCommission(
        propertyToSell.id,
        salePrice,
        saleCurrency
      );

      const commission = salePrice * (commissionRate / 100);
      toast.success(
        t('markAsSold.successToast', {
          commission: formatCurrency(commission, saleCurrency),
        })
      );

      await loadProperties();
      setMarkAsSoldDialogOpen(false);
      setPropertyToSell(null);
    } catch (error) {
      toast.error(t('markAsSold.errorToast'));
      console.error('Failed to mark property as sold:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Rental statuses
      Empty: { label: t('status.rental.empty'), className: getStatusBadgeClasses('empty') },
      Occupied: { label: t('status.rental.occupied'), className: getStatusBadgeClasses('occupied') },
      // Sale statuses
      Available: { label: t('status.sale.available'), className: 'bg-emerald-600 text-white shadow-md' },
      'Under Offer': { label: t('status.sale.underOffer'), className: 'bg-orange-500 text-white shadow-md' },
      Sold: { label: t('status.sale.sold'), className: 'bg-purple-600 text-white shadow-md' },
      // Shared status
      Inactive: { label: t('status.inactive'), className: getStatusBadgeClasses('inactive') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Empty;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Helper function to get status filter options based on property type
  const getStatusFilterOptions = () => {
    const allOption = { value: 'all', label: t('filters.all') };

    if (propertyTypeFilter === 'rental') {
      return [
        allOption,
        { value: 'Empty', label: t('status.rental.empty') },
        { value: 'Occupied', label: t('status.rental.occupied') },
        { value: 'Inactive', label: t('status.inactive') },
      ];
    } else if (propertyTypeFilter === 'sale') {
      return [
        allOption,
        { value: 'Available', label: t('status.sale.available') },
        { value: 'Under Offer', label: t('status.sale.underOffer') },
        { value: 'Sold', label: t('status.sale.sold') },
        { value: 'Inactive', label: t('status.inactive') },
      ];
    } else {
      // All properties - show all statuses
      return [
        allOption,
        { value: 'Empty', label: t('status.rental.empty') },
        { value: 'Occupied', label: t('status.rental.occupied') },
        { value: 'Available', label: t('status.sale.available') },
        { value: 'Under Offer', label: t('status.sale.underOffer') },
        { value: 'Sold', label: t('status.sale.sold') },
        { value: 'Inactive', label: t('status.inactive') },
      ];
    }
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
        filterOptions={getStatusFilterOptions()}
        filterPlaceholder={t('filterPlaceholder')}
        onAdd={handleAddProperty}
        addButtonLabel={t('addPropertyButton')}
        skeletonColumnCount={8}
        headerContent={
          <AnimatedTabs
            tabs={[
              { 
                id: 'all', 
                label: t('typeFilter.all'),
                icon: <Building2 className="h-4 w-4" />
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
            defaultTab={propertyTypeFilter}
            onChange={(tabId) => setPropertyTypeFilter(tabId as 'all' | 'rental' | 'sale')}
          />
        }
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
            {/* Address - Always visible */}
            <TableHead>
              <div className="flex items-center gap-2">
                <Building2 className={`h-4 w-4 ${COLORS.primary.text}`} />
                <span>{t('properties:table.address')}</span>
              </div>
            </TableHead>
            {/* Location - Hidden on tablet, visible on laptop+ */}
            <TableHead className="hidden lg:table-cell">
              <div className="flex items-center gap-2">
                <MapPin className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                <span>{t('properties:table.location')}</span>
              </div>
            </TableHead>
            {/* Owner - Always visible */}
            <TableHead>
              <div className="flex items-center gap-2">
                <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                <span>{t('properties:table.owner')}</span>
              </div>
            </TableHead>
            {/* Tenant - Hidden on tablet/laptop, visible on desktop */}
            <TableHead className="hidden xl:table-cell">
              <div className="flex items-center gap-2">
                <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                <span>{t('properties:table.tenant')}</span>
              </div>
            </TableHead>
            {/* Price - Always visible */}
            <TableHead>
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                <span>{t('properties:table.price')}</span>
              </div>
            </TableHead>
            {/* Contract End - Hidden on tablet, visible on laptop+ */}
            <TableHead className="hidden lg:table-cell whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                <span>{t('properties:table.contractEndDate')}</span>
              </div>
            </TableHead>
            {/* Status - Always visible */}
            <TableHead>{t('properties:table.status')}</TableHead>
            {/* Actions - Always visible */}
            <TableHead className="text-right">{t('properties:table.actions')}</TableHead>
          </>
        )}
        renderTableRow={(property) => (
          <TableRow>
            <TableCell>
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
            </TableCell>
            {/* Location - Hidden on tablet, visible on laptop+ */}
            <TableCell className="hidden lg:table-cell">
              {property.city || property.district ? (
                <span className={`${COLORS.gray.text600} text-sm truncate max-w-[150px] md:max-w-none block`}>
                  {[property.city, property.district].filter(Boolean).join(', ')}
                </span>
              ) : (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('notAvailable')}</span>
              )}
            </TableCell>
            {/* Owner - Always visible */}
            <TableCell>
              {property.owner ? (
                <span className={`${COLORS.gray.text700} text-sm`}>{property.owner.name}</span>
              ) : (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('notAvailable')}</span>
              )}
            </TableCell>
            {/* Tenant - Hidden on tablet/laptop, visible on desktop */}
            <TableCell className="hidden xl:table-cell">
              {property.status === 'Inactive' ? (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.inactive')}</span>
              ) : property.activeTenant ? (
                <span className={`${COLORS.gray.text700} text-sm`}>{property.activeTenant.name}</span>
              ) : (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noTenant')}</span>
              )}
            </TableCell>
            <TableCell>
              {(() => {
                const isRental = property.property_type === 'rental';
                const isSale = property.property_type === 'sale';

                if (property.status === 'Inactive') {
                  return <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noPrice')}</span>;
                }

                if (isRental) {
                  // Show rental price
                  if (!property.activeContract?.rent_amount) {
                    return <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noRent')}</span>;
                  }
                  return (
                    <span className={`${COLORS.gray.text700} text-sm`}>
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
                  );
                } else if (isSale) {
                  // Show sale price
                  const salePrice = propertyTyped.sale_price;
                  if (!salePrice) {
                    return <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noPrice')}</span>;
                  }
                  return (
                    <span className={`${COLORS.gray.text700} text-sm`}>
                      {formatCurrency(
                        convertCurrency(
                          salePrice,
                          propertyTyped.currency || 'USD',
                          currency || 'USD'
                        ),
                        currency || 'USD'
                      )}
                    </span>
                  );
                }

                return <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noPrice')}</span>;
              })()}
            </TableCell>
            {/* Contract End - Hidden on tablet, visible on laptop+ */}
            <TableCell className="hidden lg:table-cell">
              {property.status === 'Inactive' || !property.activeContract?.end_date ? (
                <span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.noContract')}</span>
              ) : (
                <div className="flex items-center gap-2 text-sm">
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
            {/* Status - Always visible */}
            <TableCell>
              {getStatusBadge(property.status)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                {property.status === 'Empty' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddTenantToProperty(property.id)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    + Tenant
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
          <div className="space-y-4">
            {/* Header with Image Placeholder */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-base text-slate-900 truncate">
                    {property.address}
                  </span>
                  {property.listing_url && (
                    <a
                      href={property.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-50 transition-all text-blue-600 hover:text-blue-700 cursor-pointer hover:shadow-md"
                      title={t('properties:table.viewListing')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {property.notes && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {property.notes}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(property.status)}
              </div>
            </div>

            {/* Property Details Grid */}
            <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200/50">
              {(property.city || property.district) && (
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">
                    {[property.city, property.district].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {property.owner && (
                <div className="flex items-center gap-2.5 text-sm">
                  <User className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">
                    <span className="text-slate-500 mr-1.5">Owner:</span>
                    {property.owner.name}
                  </span>
                </div>
              )}

              {property.status === 'Inactive' ? (
                <div className="flex items-center gap-2.5 text-sm">
                  <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500">{t('properties:table.inactive')}</span>
                </div>
              ) : property.activeTenant ? (
                <div className="flex items-center gap-2.5 text-sm">
                  <User className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">
                    <span className="text-slate-500 mr-1.5">Tenant:</span>
                    {property.activeTenant.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-sm">
                  <User className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="text-amber-700 font-medium">{t('properties:table.noTenant')}</span>
                </div>
              )}

              {property.status !== 'Inactive' && (() => {
                const isRental = property.property_type === 'rental';
                const isSale = property.property_type === 'sale';

                if (isRental && property.activeContract?.rent_amount) {
                  return (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200/50 shadow-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-600 font-medium">Monthly Rent:</span>
                      </div>
                      <span className="font-bold text-blue-700">
                        {formatCurrency(
                          convertCurrency(
                            property.activeContract.rent_amount,
                            property.activeContract.currency || 'USD',
                            currency || 'USD'
                          ),
                          currency || 'USD'
                        )}
                      </span>
                    </div>
                  );
                } else if (isSale && propertyTyped.sale_price) {
                  return (
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200/50 shadow-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-slate-600 font-medium">Sale Price:</span>
                      </div>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(
                          convertCurrency(
                            propertyTyped.sale_price,
                            propertyTyped.currency || 'USD',
                            currency || 'USD'
                          ),
                          currency || 'USD'
                        )}
                      </span>
                    </div>
                  );
                }

                return null;
              })()}

              {property.status !== 'Inactive' && property.activeContract?.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  <span className="text-slate-600 font-medium">
                    Contract ends: <span className="text-slate-900">{format(new Date(property.activeContract.end_date), 'dd MMM yyyy')}</span>
                  </span>
                  {(() => {
                    const today = getToday();
                    const endDate = new Date(property.activeContract.end_date);
                    const daysLeft = daysDifference(endDate, today);
                    if (daysLeft <= 30 && daysLeft >= 0) {
                      return (
                        <div className="ml-auto">
                          <Badge className="bg-red-600 text-white shadow-md text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {daysLeft} days left
                          </Badge>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {property.photos && property.photos.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Images className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-600 font-medium">
                    {t('photos', { count: property.photos.length })} photo{property.photos.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Footer - Actions */}
            <div className="flex flex-col gap-2.5 pt-1">
              {property.status === 'Empty' && (
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => handleAddTenantToProperty(property.id)}
                  className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  + {t('addTenantButton')}
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
        onMarkAsSold={(property) => handleMarkAsSoldClick(property)}
        />

        <EnhancedTenantDialog
        open={enhancedTenantDialogOpen}
        onOpenChange={setEnhancedTenantDialogOpen}
        onSuccess={handleTenantCreated}
        preSelectedPropertyId={selectedPropertyForTenant}
        />

        <MarkAsSoldDialog
        open={markAsSoldDialogOpen}
        onOpenChange={setMarkAsSoldDialogOpen}
        property={propertyToSell}
        onConfirm={handleMarkAsSoldConfirm}
        loading={actionLoading}
        />
      </>
    );
  };
