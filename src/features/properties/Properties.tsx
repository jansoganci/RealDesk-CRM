
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedTabs } from '../../components/ui/animated-tabs';
import { PropertyDialog } from './PropertyDialog';
import { EnhancedTenantDialog } from '../tenants/EnhancedTenantDialog';
import { MarkAsSoldDialog } from './MarkAsSoldDialog';
import { propertiesService } from '../../lib/serviceProxy';
import { PropertyWithOwner, TenantWithContractResult } from '../../types';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, TrendingUp, Home } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import * as z from 'zod';
import { getPropertySchema } from './propertySchemas';
import { usePropertyFilters } from './hooks/usePropertyFilters';
import { usePropertyDialogs } from './hooks/usePropertyDialogs';
import { usePropertyActions } from './hooks/usePropertyActions';
import { usePropertyCommission } from './hooks/usePropertyCommission';
import { PropertyCard } from './components/PropertyCard';
import { PropertyTableRow } from './components/PropertyTableRow';
import { PropertyTableHeaders } from './components/PropertyTableHeaders';
import { getStatusFilterOptions } from './utils/statusUtils';

export const Properties = () => {
  const { t } = useTranslation(['properties', 'common']);
  const { currency, commissionRate } = useAuth();
  const propertySchema = getPropertySchema(t);
  type PropertyFormData = z.infer<typeof propertySchema>;

  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'all' | 'rental' | 'sale'>('all');
  const [loading, setLoading] = useState(true);

  // Dialog hook
  const {
    isCreateOpen,
    openCreate,
    closeCreate,
    isEditOpen,
    editingProperty,
    openEdit,
    closeEdit,
    isCommissionOpen,
    commissionProperty,
    openCommission,
    closeCommission,
    isTenantDialogOpen,
    selectedPropertyForTenant,
    openTenantDialog,
    closeTenantDialog,
    isDeleteDialogOpen,
    propertyToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    isMarkAsSoldDialogOpen,
    propertyToSell,
    openMarkAsSoldDialog,
    closeMarkAsSoldDialog,
  } = usePropertyDialogs();

  // Filter hook
  const {
    filteredProperties: baseFilteredProperties,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    ownerFilter,
    setOwnerFilter,
  } = usePropertyFilters(properties);

  // Apply property type filter on top of other filters
  const filteredProperties = useMemo(() => {
    if (propertyTypeFilter === 'all') {
      return baseFilteredProperties;
    }
    return baseFilteredProperties.filter((property) => property.property_type === propertyTypeFilter);
  }, [baseFilteredProperties, propertyTypeFilter]);

  const loadProperties = useCallback(async () => {
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
  }, [t]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Actions hook
  const {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleStatusChange,
    handleRefresh,
    isLoading: actionLoading,
  } = usePropertyActions(loadProperties, {
    onCloseCreate: closeCreate,
    onCloseEdit: closeEdit,
  });

  const handleAddProperty = () => {
    openCreate();
  };

  const handleEditProperty = (property: PropertyWithOwner) => {
    openEdit(property);
  };

  const handleDeleteClick = (property: PropertyWithOwner) => {
    openDeleteDialog(property);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;
    await handleDelete(propertyToDelete.id);
    closeDeleteDialog();
  };

  const handleSubmit = async (data: PropertyFormData) => {
    await handleCreate(data, editingProperty);
  };

  const handleAddTenantToProperty = (propertyId: string) => {
    openTenantDialog(propertyId);
  };

  const handleTenantCreated = async (result: TenantWithContractResult) => {
    toast.success(t('toasts.addTenantToPropertySuccess', { tenantName: result.tenant.name }));
    await loadProperties();
    closeTenantDialog();
  };

  const handleMarkAsSoldClick = (property: PropertyWithOwner) => {
    openMarkAsSoldDialog(property);
  };

  // Commission hook
  const { handleSaveCommission, isSubmitting: markAsSoldLoading } = usePropertyCommission({
    commissionRate,
    onSuccess: async () => {
      await loadProperties();
      closeMarkAsSoldDialog();
    },
  });

  const handleMarkAsSoldConfirm = async (salePrice: number, saleCurrency: string) => {
    if (!propertyToSell) return;
    await handleSaveCommission(propertyToSell, salePrice, saleCurrency);
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
        filterOptions={getStatusFilterOptions(propertyTypeFilter, t)}
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
        renderTableHeaders={() => <PropertyTableHeaders />}
        renderTableRow={(property) => (
          <PropertyTableRow
            property={property}
            onEdit={handleEditProperty}
            onDelete={handleDeleteClick}
            onAddTenant={handleAddTenantToProperty}
            currency={currency}
          />
        )}
        renderCardContent={(property) => (
          <PropertyCard
            property={property}
            onEdit={handleEditProperty}
            onCommission={(property) => {
              // Commission dialog can be opened here if needed
            }}
            onDelete={(id) => handleDeleteClick(property)}
            onStatusChange={handleStatusChange}
            onAddTenant={handleAddTenantToProperty}
            currency={currency}
          />
        )}
        deleteDialog={{
          open: isDeleteDialogOpen,
          title: t('deleteDialog.title'),
          description: t('deleteDialog.description', { propertyAddress: propertyToDelete?.address }),
          onConfirm: handleDeleteConfirm,
          onCancel: closeDeleteDialog,
          loading: actionLoading,
        }}
        />

        <PropertyDialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (isEditOpen) closeEdit();
            if (isCreateOpen) closeCreate();
          }
        }}
        property={editingProperty}
        onSubmit={handleSubmit}
        loading={actionLoading}
        onMarkAsSold={(property) => handleMarkAsSoldClick(property)}
        />

        <EnhancedTenantDialog
        open={isTenantDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeTenantDialog();
        }}
        onSuccess={handleTenantCreated}
        preSelectedPropertyId={selectedPropertyForTenant}
        />

        <MarkAsSoldDialog
        open={isMarkAsSoldDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeMarkAsSoldDialog();
        }}
        property={propertyToSell}
        onConfirm={handleMarkAsSoldConfirm}
        loading={markAsSoldLoading}
        />
      </>
    );
  };
