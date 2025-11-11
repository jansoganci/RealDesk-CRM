# Frontend Technical Design: Property Management Module

**Project:** Emlak CRM  
**Module:** Property Management (Rental + Sale Split)  
**Version:** 2.0  
**Last Updated:** January 11, 2025

---

## 1. Overview

This document outlines the frontend architecture for the redesigned Property Management module. The system now separates rental and sale workflows into distinct, context-aware interfaces using a tab-based navigation pattern.

### Key Changes from v1.0

- **Before:** Single `status` field (`Empty` | `Occupied` | `Inactive`) with mixed rental/sale logic
- **After:** Dual status model with independent `rental_status` and `sale_status` columns
- **UI Impact:** Two separate tabs (Kiralık, Satılık) with context-specific actions and filters

---

## 2. Architecture Overview

### File Structure

```
src/features/properties/
├── Properties.tsx                    # Main container with tab controller
├── RentalPropertiesTab.tsx          # Rental-specific view
├── SalePropertiesTab.tsx            # Sale-specific view
├── PropertyDialog.tsx               # Create/Edit modal (supports both statuses)
├── MarkAsSoldDialog.tsx             # Sale completion flow (existing)
├── components/
│   ├── PropertyCard.tsx             # Shared card component (mode-aware)
│   ├── PropertyTableRow.tsx         # Shared table row (mode-aware)
│   ├── RentalActionButtons.tsx      # Rental-specific actions
│   ├── SaleActionButtons.tsx        # Sale-specific actions
│   ├── PropertyFiltersBar.tsx       # Contextual filter UI
│   └── PropertyStatusBadge.tsx      # Status display component
├── hooks/
│   ├── useRentalProperties.ts       # Rental data fetching + state
│   └── useSaleProperties.ts         # Sale data fetching + state
└── utils/
    ├── propertyHelpers.ts           # Status checks, formatters
    └── propertyValidation.ts        # Form validation schemas
```

---

## 3. Navigation & Tab System

### Tab Controller (`Properties.tsx`)

**Responsibilities:**
- Mount tab components
- Manage active tab state
- Display property counts per tab
- Provide global "Add Property" action

**Implementation:**

```tsx
export const Properties = () => {
  const [activeTab, setActiveTab] = useState<'rental' | 'sale'>('rental');
  const { t } = useTranslation('properties');

  // Fetch counts for tab badges
  const { data: rentalCount } = useQuery(['rental-count'], 
    () => propertiesService.getRentalPropertiesCount()
  );
  const { data: saleCount } = useQuery(['sale-count'], 
    () => propertiesService.getSalePropertiesCount()
  );

  return (
    <PageContainer>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rental">
            <Home className="h-4 w-4 mr-2" />
            {t('tabs.rental')} ({rentalCount || 0})
          </TabsTrigger>
          <TabsTrigger value="sale">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('tabs.sale')} ({saleCount || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rental">
          <RentalPropertiesTab />
        </TabsContent>

        <TabsContent value="sale">
          <SalePropertiesTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};
```

**Why Tabs vs Routes:**
- ✅ Faster switching (no page reload)
- ✅ Preserves scroll position and filter state
- ✅ Matches Sahibinden.com mental model
- ✅ Easy to share state between tabs if needed

---

## 4. Data Fetching Strategy

### Service Layer Methods

**New methods in `propertiesService.ts`:**

```typescript
class PropertiesService {
  // Fetch only rental-relevant properties
  async getRentalProperties(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*),
        contracts(id, status, rent_amount, currency, end_date, tenant:tenants(*))
      `)
      .in('rental_status', ['available', 'rented']) // Exclude 'not_for_rent'
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.transformPropertiesWithContracts(data);
  }

  // Fetch only sale-relevant properties
  async getSaleProperties(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*)
      `)
      .in('sale_status', ['available', 'sold']) // Exclude 'not_for_sale'
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get counts for tab badges
  async getRentalPropertiesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('rental_status', ['available', 'rented']);
    
    return count || 0;
  }

  async getSalePropertiesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('sale_status', ['available', 'sold']);
    
    return count || 0;
  }
}
```

---

### Custom Hooks for State Management

**`hooks/useRentalProperties.ts`:**

```typescript
export const useRentalProperties = () => {
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertiesService.getRentalProperties();
      setProperties(data);
    } catch (error) {
      toast.error('Failed to load rental properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Client-side filtering
  const filteredProperties = useMemo(() => {
    let result = properties;

    if (statusFilter !== 'all') {
      result = result.filter(p => p.rental_status === statusFilter);
    }

    if (searchQuery) {
      result = result.filter(p =>
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.owner?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [properties, statusFilter, searchQuery]);

  return {
    properties: filteredProperties,
    loading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    refetch: loadProperties,
  };
};
```

**`hooks/useSaleProperties.ts`:** (Similar structure, but filters on `sale_status`)

---

## 5. Component Responsibilities

### 5.1 Tab Components

**`RentalPropertiesTab.tsx`**

**Responsibilities:**
- Use `useRentalProperties` hook for data
- Render filters specific to rental context
- Display rental-specific status badges
- Pass `mode="rental"` to shared components

```tsx
export const RentalPropertiesTab = () => {
  const { t } = useTranslation('properties');
  const {
    properties,
    loading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useRentalProperties();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);

  return (
    <div className="space-y-4">
      <PropertyFiltersBar
        mode="rental"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { value: 'all', label: t('filters.all') },
          { value: 'available', label: t('status.rental.available') },
          { value: 'rented', label: t('status.rental.rented') },
        ]}
        onAdd={() => setDialogOpen(true)}
      />

      {loading ? (
        <LoadingSpinner />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={<Home className="h-16 w-16" />}
          title={t('emptyState.rental.title')}
          description={t('emptyState.rental.description')}
          action={{
            label: t('addPropertyButton'),
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <PropertyList
          properties={properties}
          mode="rental"
          onEdit={setSelectedProperty}
          onRefetch={refetch}
        />
      )}

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={selectedProperty}
        defaultMode="rental"
        onSuccess={refetch}
      />
    </div>
  );
};
```

**`SalePropertiesTab.tsx`:** (Mirror structure with sale-specific logic)

---

### 5.2 Shared Display Components

**`components/PropertyCard.tsx`**

**Responsibilities:**
- Display property info (address, location, photos)
- Adapt displayed fields based on `mode` prop
- Render mode-specific status badges
- Trigger mode-specific actions

```tsx
interface PropertyCardProps {
  property: PropertyWithOwner;
  mode: 'rental' | 'sale';
  onEdit: (property: PropertyWithOwner) => void;
  onDelete: (property: PropertyWithOwner) => void;
  onAddTenant?: (propertyId: string) => void;     // Rental only
  onMarkAsSold?: (property: PropertyWithOwner) => void; // Sale only
}

export const PropertyCard = ({
  property,
  mode,
  onEdit,
  onDelete,
  onAddTenant,
  onMarkAsSold,
}: PropertyCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Property Image */}
      <div className="relative h-48">
        {property.photos?.[0] ? (
          <img src={property.photos[0].url} alt={property.address} />
        ) : (
          <div className="bg-gray-200 flex items-center justify-center h-full">
            <Building2 className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <PropertyStatusBadge
          status={mode === 'rental' ? property.rental_status : property.sale_status}
          mode={mode}
          className="absolute top-2 left-2"
        />
      </div>

      {/* Property Info */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg truncate">{property.address}</h3>
        
        {property.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{[property.city, property.district].filter(Boolean).join(', ')}</span>
          </div>
        )}

        {property.owner && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{property.owner.name}</span>
          </div>
        )}

        {/* Mode-specific content */}
        {mode === 'rental' && (
          <>
            {property.activeTenant && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <User className="h-4 w-4" />
                <span>{property.activeTenant.name}</span>
              </div>
            )}
            {property.activeContract?.rent_amount && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm text-gray-600">Monthly Rent:</span>
                <span className="font-bold text-amber-700">
                  {formatCurrency(property.activeContract.rent_amount, property.activeContract.currency)}
                </span>
              </div>
            )}
          </>
        )}

        {mode === 'sale' && (
          <>
            {property.sale_price && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600">Sale Price:</span>
                <span className="font-bold text-purple-700">
                  {formatCurrency(property.sale_price, property.currency)}
                </span>
              </div>
            )}
            {property.sold_at && (
              <div className="text-xs text-gray-500">
                Sold on: {format(new Date(property.sold_at), 'dd MMM yyyy')}
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        {mode === 'rental' ? (
          <RentalActionButtons
            property={property}
            onEdit={() => onEdit(property)}
            onDelete={() => onDelete(property)}
            onAddTenant={onAddTenant}
          />
        ) : (
          <SaleActionButtons
            property={property}
            onEdit={() => onEdit(property)}
            onDelete={() => onDelete(property)}
            onMarkAsSold={onMarkAsSold}
          />
        )}
      </div>
    </Card>
  );
};
```

---

**`components/PropertyTableRow.tsx`**

**Responsibilities:**
- Render property as table row (desktop view)
- Show mode-specific columns
- Handle hover states for quick actions

```tsx
interface PropertyTableRowProps {
  property: PropertyWithOwner;
  mode: 'rental' | 'sale';
  onEdit: () => void;
  onDelete: () => void;
  onAddTenant?: () => void;
  onMarkAsSold?: () => void;
}

export const PropertyTableRow = ({
  property,
  mode,
  ...actions
}: PropertyTableRowProps) => {
  return (
    <TableRow className="hover:bg-gray-50 group">
      {/* Thumbnail */}
      <TableCell className="w-16">
        {property.photos?.[0] ? (
          <img src={property.photos[0].url} className="w-12 h-12 rounded object-cover" />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </TableCell>

      {/* Address */}
      <TableCell>
        <div className="font-medium">{property.address}</div>
        {property.listing_url && (
          <a href={property.listing_url} target="_blank" className="text-xs text-blue-600">
            View Listing
          </a>
        )}
      </TableCell>

      {/* Location */}
      <TableCell>
        {[property.city, property.district].filter(Boolean).join(', ')}
      </TableCell>

      {/* Owner */}
      <TableCell>{property.owner?.name}</TableCell>

      {/* Mode-specific columns */}
      {mode === 'rental' ? (
        <>
          <TableCell>
            {property.activeTenant?.name || <span className="text-gray-400">—</span>}
          </TableCell>
          <TableCell>
            {property.activeContract?.rent_amount
              ? formatCurrency(property.activeContract.rent_amount, property.activeContract.currency)
              : <span className="text-gray-400">—</span>
            }
          </TableCell>
          <TableCell>
            {property.activeContract?.end_date
              ? format(new Date(property.activeContract.end_date), 'dd MMM yyyy')
              : <span className="text-gray-400">—</span>
            }
          </TableCell>
        </>
      ) : (
        <>
          <TableCell>
            {property.sale_price
              ? formatCurrency(property.sale_price, property.currency)
              : <span className="text-gray-400">—</span>
            }
          </TableCell>
          <TableCell>
            {property.sold_at
              ? format(new Date(property.sold_at), 'dd MMM yyyy')
              : <span className="text-gray-400">—</span>
            }
          </TableCell>
        </>
      )}

      {/* Status */}
      <TableCell>
        <PropertyStatusBadge
          status={mode === 'rental' ? property.rental_status : property.sale_status}
          mode={mode}
        />
      </TableCell>

      {/* Actions */}
      <TableCell>
        {mode === 'rental' ? (
          <RentalActionButtons property={property} {...actions} />
        ) : (
          <SaleActionButtons property={property} {...actions} />
        )}
      </TableCell>
    </TableRow>
  );
};
```

---

### 5.3 Action Button Components

**`components/RentalActionButtons.tsx`**

**Responsibilities:**
- Show actions relevant to rental properties
- Conditional rendering based on `rental_status`
- Trigger appropriate dialogs/flows

```tsx
interface RentalActionButtonsProps {
  property: PropertyWithOwner;
  onEdit: () => void;
  onDelete: () => void;
  onAddTenant?: (propertyId: string) => void;
}

export const RentalActionButtons = ({
  property,
  onEdit,
  onDelete,
  onAddTenant,
}: RentalActionButtonsProps) => {
  const { t } = useTranslation('properties');

  return (
    <div className="flex items-center gap-2">
      {/* Add Tenant - only for available properties without active contract */}
      {property.rental_status === 'available' && !property.activeContract && onAddTenant && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddTenant(property.id)}
        >
          <UserPlus className="h-3 w-3 mr-1" />
          {t('addTenantButton')}
        </Button>
      )}

      {/* View Contract - for rented properties */}
      {property.rental_status === 'rented' && property.activeContract && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {/* Navigate to contract details */}}
        >
          <FileText className="h-3 w-3 mr-1" />
          {t('viewContractButton')}
        </Button>
      )}

      {/* Standard actions */}
      <TableActionButtons
        onEdit={onEdit}
        onDelete={onDelete}
        showView={false}
      />
    </div>
  );
};
```

**`components/SaleActionButtons.tsx`**

```tsx
interface SaleActionButtonsProps {
  property: PropertyWithOwner;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsSold?: (property: PropertyWithOwner) => void;
}

export const SaleActionButtons = ({
  property,
  onEdit,
  onDelete,
  onMarkAsSold,
}: SaleActionButtonsProps) => {
  const { t } = useTranslation('properties');

  return (
    <div className="flex items-center gap-2">
      {/* Mark as Sold - only for available properties */}
      {property.sale_status === 'available' && !property.sold_at && onMarkAsSold && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMarkAsSold(property)}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 hover:from-amber-100"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          {t('markAsSold.button')}
        </Button>
      )}

      {/* View Sale Details - for sold properties */}
      {property.sale_status === 'sold' && property.sold_at && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {/* Show sale details modal */}}
        >
          <DollarSign className="h-3 w-3 mr-1" />
          {t('viewSaleButton')}
        </Button>
      )}

      {/* Standard actions */}
      <TableActionButtons
        onEdit={onEdit}
        onDelete={onDelete}
        showView={false}
      />
    </div>
  );
};
```

---

### 5.4 Status Badge Component

**`components/PropertyStatusBadge.tsx`**

**Responsibilities:**
- Display color-coded status badges
- Support both rental and sale modes
- Maintain consistent styling

```tsx
interface PropertyStatusBadgeProps {
  status: RentalStatus | SaleStatus;
  mode: 'rental' | 'sale';
  className?: string;
}

export const PropertyStatusBadge = ({
  status,
  mode,
  className,
}: PropertyStatusBadgeProps) => {
  const { t } = useTranslation('properties');

  const getConfig = () => {
    if (mode === 'rental') {
      const rentalConfigs: Record<RentalStatus, { label: string; className: string }> = {
        available: {
          label: t('status.rental.available'),
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        rented: {
          label: t('status.rental.rented'),
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        not_for_rent: {
          label: t('status.rental.notForRent'),
          className: 'bg-gray-50 text-gray-600 border-gray-200',
        },
      };
      return rentalConfigs[status as RentalStatus];
    } else {
      const saleConfigs: Record<SaleStatus, { label: string; className: string }> = {
        available: {
          label: t('status.sale.available'),
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        },
        sold: {
          label: t('status.sale.sold'),
          className: 'bg-purple-50 text-purple-700 border-purple-200',
        },
        not_for_sale: {
          label: t('status.sale.notForSale'),
          className: 'bg-gray-50 text-gray-600 border-gray-200',
        },
      };
      return saleConfigs[status as SaleStatus];
    }
  };

  const config = getConfig();

  return (
    <Badge className={cn('border font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
};
```

---

### 5.5 Property Dialog (Create/Edit)

**`PropertyDialog.tsx`**

**Responsibilities:**
- Create new properties or edit existing ones
- Support both rental and sale status fields
- Context-aware defaults based on active tab
- Validation for both status types

```tsx
interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: PropertyWithOwner | null;
  defaultMode?: 'rental' | 'sale';
  onSuccess: () => void;
}

export const PropertyDialog = ({
  open,
  onOpenChange,
  property,
  defaultMode = 'rental',
  onSuccess,
}: PropertyDialogProps) => {
  const { t } = useTranslation('properties');
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      // Existing fields
      address: property?.address || '',
      city: property?.city || '',
      district: property?.district || '',
      owner_id: property?.owner_id || '',
      
      // NEW: Dual status fields
      rental_status: property?.rental_status || (defaultMode === 'rental' ? 'available' : 'not_for_rent'),
      sale_status: property?.sale_status || (defaultMode === 'sale' ? 'available' : 'not_for_sale'),
      
      rent_amount: property?.rent_amount || null,
      sale_price: property?.sale_price || null,
      currency: property?.currency || 'USD',
    },
  });

  const watchRentalStatus = form.watch('rental_status');
  const watchSaleStatus = form.watch('sale_status');

  const handleSubmit = async (data: PropertyFormData) => {
    try {
      if (property) {
        await propertiesService.update(property.id, data);
        toast.success(t('toasts.updateSuccess'));
      } else {
        await propertiesService.create(data);
        toast.success(t('toasts.addSuccess'));
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(t('toasts.addError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {property ? t('dialog.editTitle') : t('dialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Existing fields: address, owner, location */}
          
          {/* NEW: Dual Status Section */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="rental_status">
                {t('dialog.form.rentalStatus')}
              </Label>
              <Select
                value={watchRentalStatus}
                onValueChange={(val) => form.setValue('rental_status', val as RentalStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    {t('status.rental.available')}
                  </SelectItem>
                  <SelectItem value="rented">
                    {t('status.rental.rented')}
                  </SelectItem>
                  <SelectItem value="not_for_rent">
                    {t('status.rental.notForRent')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_status">
                {t('dialog.form.saleStatus')}
              </Label>
              <Select
                value={watchSaleStatus}
                onValueChange={(val) => form.setValue('sale_status', val as SaleStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    {t('status.sale.available')}
                  </SelectItem>
                  <SelectItem value="sold">
                    {t('status.sale.sold')}
                  </SelectItem>
                  <SelectItem value="not_for_sale">
                    {t('status.sale.notForSale')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Fields Based on Status */}
          {watchRentalStatus !== 'not_for_rent' && (
            <div className="space-y-2">
              <Label htmlFor="rent_amount">
                {t('dialog.form.rentAmount')}
              </Label>
              <Input
                id="rent_amount"
                type="number"
                {...form.register('rent_amount', { valueAsNumber: true })}
              />
            </div>
          )}

          {watchSaleStatus !== 'not_for_sale' && (
            <div className="space-y-2">
              <Label htmlFor="sale_price">
                {t('dialog.form.salePrice')}
              </Label>
              <Input
                id="sale_price"
                type="number"
                {...form.register('sale_price', { valueAsNumber: true })}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="submit">
              {property ? t('dialog.updateButton') : t('dialog.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 6. Responsive Layout Strategy

### Desktop View (≥1024px)

**Layout:** Table with sticky header
- **Component:** `<Table>` with `PropertyTableRow` children
- **Columns:** Photo, Address, Location, Owner, [Mode-specific], Status, Actions
- **Interactions:** Hover shows action buttons, click row for details

### Tablet View (768-1023px)

**Layout:** 2-column grid of cards
- **Component:** `<div className="grid grid-cols-2 gap-4">`
- **Cards:** Compact `PropertyCard` with reduced padding
- **Actions:** Visible by default (no hover required)

### Mobile View (<768px)

**Layout:** Single-column card stack
- **Component:** `<div className="space-y-4">`
- **Cards:** Full-width `PropertyCard`
- **Swipe Actions:** Optional enhancement (swipe left → delete, right → edit)
- **Bottom Nav:** Sticky tab switcher at bottom of screen

**Implementation:**

```tsx
// In RentalPropertiesTab.tsx or SalePropertiesTab.tsx
const PropertyList = ({ properties, mode, ...actions }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  if (isMobile || isTablet) {
    return (
      <div className={cn(
        'grid gap-4',
        isTablet ? 'grid-cols-2' : 'grid-cols-1'
      )}>
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            mode={mode}
            {...actions}
          />
        ))}
      </div>
    );
  }

  // Desktop: Table view
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Photo</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Owner</TableHead>
          {mode === 'rental' ? (
            <>
              <TableHead>Tenant</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Contract End</TableHead>
            </>
          ) : (
            <>
              <TableHead>Sale Price</TableHead>
              <TableHead>Sold Date</TableHead>
            </>
          )}
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property) => (
          <PropertyTableRow
            key={property.id}
            property={property}
            mode={mode}
            {...actions}
          />
        ))}
      </TableBody>
    </Table>
  );
};
```

---

## 7. UX Interaction Flows

### 7.1 Adding a Property

**Flow:**
1. User clicks `[+ Mülk Ekle]` button (available on all tabs)
2. `PropertyDialog` opens with `defaultMode` set to active tab context
   - If on Rental tab → `rental_status` defaults to `'available'`
   - If on Sale tab → `sale_status` defaults to `'available'`
3. User fills form (address, owner, location)
4. User sets both `rental_status` and `sale_status` (dual listing supported)
5. Conditional fields appear based on status:
   - If `rental_status !== 'not_for_rent'` → Show rent amount field
   - If `sale_status !== 'not_for_sale'` → Show sale price field
6. On submit:
   - `propertiesService.create()` called with both status values
   - Success toast shown
   - Property appears in relevant tab(s)

---

### 7.2 Filtering Properties

**Flow:**
1. User interacts with `PropertyFiltersBar`
2. Changes to filters update local state (no page reload)
3. Custom hook (`useRentalProperties` or `useSaleProperties`) recomputes filtered list
4. Active filters shown as removable pills
5. "Clear All" button appears when filters active

**Implementation:**
```tsx
// In custom hook
const filteredProperties = useMemo(() => {
  let result = properties;

  if (statusFilter !== 'all') {
    result = result.filter(p => p.rental_status === statusFilter);
  }

  if (searchQuery) {
    result = result.filter(p =>
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return result;
}, [properties, statusFilter, searchQuery]);
```

---

### 7.3 Adding a Tenant (Rental Flow)

**Flow:**
1. User clicks `[Kiracı Ekle]` button on available rental property
2. `EnhancedTenantDialog` opens (existing component)
3. Property ID pre-filled in contract form
4. User completes tenant + contract creation
5. On success:
   - Backend RPC updates `rental_status` to `'rented'`
   - Frontend refetches property list
   - Property badge changes from "Kiralıkta" to "Kirada"
   - "Kiracı Ekle" button disappears, replaced with "View Contract"

**Backend Integration:**
```typescript
// tenantsService.createTenantWithContract() 
// calls rpc_create_tenant_with_contract
// which should now UPDATE properties SET rental_status = 'rented'
```

---

### 7.4 Marking as Sold (Sale Flow)

**Flow:**
1. User clicks `[Satıldı Olarak İşaretle]` button on available sale property
2. `MarkAsSoldDialog` opens (existing component)
3. User enters sale price + currency
4. Commission preview shown (4% of sale price)
5. On confirm:
   - `commissionsService.createSaleCommission()` called
   - Backend RPC creates commission AND updates `sale_status` to `'sold'`
   - Frontend refetches property list
   - Property badge changes to "Satıldı"
   - "Satıldı" button disappears

**Backend Integration:**
```typescript
// commissionsService.createSaleCommission()
// calls create_sale_commission RPC
// which should now UPDATE properties SET sale_status = 'sold'
```

---

### 7.5 Editing a Property

**Flow:**
1. User clicks `[Düzenle]` action button
2. `PropertyDialog` opens with pre-filled values
3. User can change BOTH `rental_status` and `sale_status` independently
4. Conditional fields update based on new status values
5. On submit:
   - `propertiesService.update()` called
   - Property refetched
   - If property moved from one status to another (e.g., `not_for_rent` → `available`), it appears in relevant tab

**Edge Case Handling:**
- If user sets BOTH statuses to "not_for_X", property becomes invisible in both tabs
- Consider adding "All Properties" tab to show everything including unlisted

---

## 8. Type Definitions

### Core Types

```typescript
// types/index.ts additions

export type RentalStatus = 'available' | 'rented' | 'not_for_rent';
export type SaleStatus = 'available' | 'sold' | 'not_for_sale';

export interface Property {
  id: string;
  address: string;
  city: string | null;
  district: string | null;
  owner_id: string;
  
  // NEW: Dual status fields
  rental_status: RentalStatus;
  sale_status: SaleStatus;
  
  // Pricing fields
  rent_amount: number | null;
  sale_price: number | null;
  currency: string | null;
  
  // Sale tracking
  sold_at: string | null;
  sold_price: number | null;
  
  // Metadata
  listing_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string;
}

export interface PropertyInsert {
  address: string;
  city?: string | null;
  district?: string | null;
  owner_id: string;
  rental_status?: RentalStatus;
  sale_status?: SaleStatus;
  rent_amount?: number | null;
  sale_price?: number | null;
  currency?: string | null;
  listing_url?: string | null;
  notes?: string | null;
}

export interface PropertyUpdate extends Partial<PropertyInsert> {
  rental_status?: RentalStatus;
  sale_status?: SaleStatus;
}
```

---

## 9. Translation Keys

### New Translation Structure

```json
// public/locales/en/properties.json
{
  "tabs": {
    "rental": "For Rent",
    "sale": "For Sale",
    "all": "All Properties"
  },
  "status": {
    "rental": {
      "available": "Available",
      "rented": "Rented",
      "notForRent": "Not for Rent"
    },
    "sale": {
      "available": "For Sale",
      "sold": "Sold",
      "notForSale": "Not for Sale"
    }
  },
  "filters": {
    "all": "All",
    "rental": {
      "available": "Available",
      "rented": "Rented"
    },
    "sale": {
      "available": "For Sale",
      "sold": "Sold"
    }
  },
  "dialog": {
    "form": {
      "rentalStatus": "Rental Status",
      "saleStatus": "Sale Status",
      "rentAmount": "Monthly Rent",
      "salePrice": "Sale Price"
    }
  },
  "emptyState": {
    "rental": {
      "title": "No rental properties yet",
      "description": "Add your first rental property to start managing tenants and contracts"
    },
    "sale": {
      "title": "No properties for sale",
      "description": "Add properties to track your sales and commissions"
    }
  }
}
```

---

## 10. Performance Considerations

### Data Fetching Optimization

1. **Separate queries per tab** (avoid over-fetching)
   - Rental tab: Only fetch properties with `rental_status IN ('available', 'rented')`
   - Sale tab: Only fetch properties with `sale_status IN ('available', 'sold')`

2. **Lazy loading for images**
   - Use `<img loading="lazy" />` for property thumbnails
   - Consider thumbnail service for optimized image sizes

3. **Virtual scrolling** (for large datasets)
   - Implement `react-window` if property count exceeds 100 per tab
   - Renders only visible rows/cards

4. **Debounced search**
   - Search input triggers filter after 300ms pause
   - Prevents excessive re-renders during typing

### State Management

- **Client-side filtering** for simple criteria (status, search)
- **Server-side filtering** for complex queries (price range, multi-city)
- **React Query** for caching and auto-refetch
  - `staleTime: 30000` (30 seconds)
  - `cacheTime: 300000` (5 minutes)

---

## 11. Testing Considerations

### Unit Tests

- **`useRentalProperties` hook:** Verify filtering logic
- **`useSaleProperties` hook:** Verify filtering logic
- **`PropertyStatusBadge`:** Correct colors/labels per mode
- **`RentalActionButtons`:** Conditional rendering based on status
- **`SaleActionButtons`:** Conditional rendering based on status

### Integration Tests

- **Adding a property:** Opens dialog, submits form, appears in correct tab
- **Filtering:** Apply filter → list updates correctly
- **Switching tabs:** Rental ↔ Sale preserves individual filter states
- **Adding tenant:** Updates rental_status to 'rented', removes "Add Tenant" button
- **Marking as sold:** Updates sale_status to 'sold', removes "Mark as Sold" button

### E2E Tests (Playwright)

1. Complete rental workflow: Add property → Add tenant → View contract
2. Complete sale workflow: Add property → Mark as sold → Verify commission
3. Dual listing: Property appears in both tabs with different badges

---

## 12. Migration Plan (Frontend)

### Phase 1: Add New Components (Parallel)
- Create `RentalPropertiesTab.tsx` and `SalePropertiesTab.tsx`
- Build custom hooks (`useRentalProperties`, `useSaleProperties`)
- Update `PropertyDialog` with dual status fields
- Keep old `Properties.tsx` as fallback

### Phase 2: Update Services
- Add `getRentalProperties()` and `getSaleProperties()` methods
- Update TypeScript types with `RentalStatus` and `SaleStatus`
- Ensure backward compatibility (read both old `status` and new fields)

### Phase 3: Switch Navigation
- Replace old `Properties.tsx` with new tab-based version
- Update routing if needed
- Add feature flag for gradual rollout

### Phase 4: Update Action Flows
- Ensure "Add Tenant" updates `rental_status`
- Ensure "Mark as Sold" updates `sale_status`
- Test edge cases (dual listings, status transitions)

### Phase 5: Cleanup
- Remove old `status` field references
- Archive old components
- Update documentation

---

## 13. Future Enhancements

### Potential Features
1. **View Mode Toggle:** Table ⇄ Grid ⇄ Kanban
2. **Bulk Actions:** Select multiple → Change status / Delete
3. **Advanced Filters:** Price range, property type, date range
4. **Saved Filters:** "My Active Rentals", "Expiring Soon"
5. **Export:** CSV/PDF export of filtered properties
6. **Property Details Page:** Dedicated route for full property info
7. **Property Timeline:** Activity log (created, rented, sold, etc.)
8. **Duplicate Property:** Quick copy with status reset

---

## 14. Dependencies

### Required Packages
- `react-hook-form` + `@hookform/resolvers/zod` (already installed)
- `@tanstack/react-query` (for data fetching)
- `lucide-react` (icons)
- `date-fns` (date formatting)
- `react-i18next` (translations)
- `sonner` (toast notifications)
- `@radix-ui/react-tabs` (tab component)

### Internal Dependencies
- `src/services/properties.service.ts` (backend integration)
- `src/services/tenants.service.ts` (for "Add Tenant" flow)
- `src/services/commissions.service.ts` (for "Mark as Sold" flow)
- `src/components/ui/*` (ShadCN components)
- `src/lib/currency.ts` (formatCurrency helper)
- `src/lib/dates.ts` (date utilities)

---

## 15. Developer Checklist

### Before Implementation
- [ ] Review backend migration plan (ensure `rental_status` + `sale_status` columns exist)
- [ ] Confirm Supabase RPCs updated to set new status fields
- [ ] Update TypeScript types from database schema
- [ ] Create feature branch from `main`

### During Implementation
- [ ] Create folder structure under `features/properties/`
- [ ] Build custom hooks first (easier to test in isolation)
- [ ] Implement `PropertyStatusBadge` (reusable across components)
- [ ] Create tab components with hardcoded data first (validate UI)
- [ ] Connect to real services
- [ ] Add translations for all new labels
- [ ] Test on desktop, tablet, mobile viewports

### After Implementation
- [ ] Update `README.md` with new architecture notes
- [ ] Add storybook stories for key components
- [ ] Write unit tests for hooks and utility functions
- [ ] Run E2E tests
- [ ] Get UX review from product team
- [ ] Deploy to staging for QA

---

## 16. Contact & Support

For questions about this technical design:
- **Architecture:** Refer to `/docs/ARCHITECTURE.md`
- **Backend:** See `/docs/BACKEND_TECH_DOC.md` (pending)
- **UX Research:** See `/docs/FRONTEND_TECH_DOC.md` (this document)
- **API Docs:** See `/docs/API.md`

---

**Document Status:** ✅ Ready for Implementation  
**Last Updated:** January 11, 2025  
**Version:** 2.0

