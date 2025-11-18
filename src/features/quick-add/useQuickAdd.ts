import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ownersService, propertiesService, tenantsService } from '@/lib/serviceProxy';
import { PropertyOwner, PropertyOwnerInsert, TenantWithContractData } from '@/types';
import { getQuickAddSchema, QuickAddFormData } from './quickAddSchema';
import { format } from 'date-fns';

export const useQuickAdd = (onSuccess?: () => void) => {
  const { t } = useTranslation('quick-add');
  const { currency } = useAuth();
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);

  const quickAddSchema = getQuickAddSchema(t);

  const form = useForm<QuickAddFormData>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      ownerMode: 'select',
      owner_id: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      address: '',
      city: '',
      district: '',
      property_type: 'rental',
      status: 'Empty',
      rent_amount: undefined,
      sale_price: undefined,
      currency: currency as 'TRY' | 'USD' | 'EUR',
      listing_url: '',
      notes: '',
      addTenant: false,
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      contractStart: undefined,
      contractEnd: undefined,
      contractRent: undefined,
      contractCurrency: currency as 'TRY' | 'USD' | 'EUR',
    },
  });

  // Load owners on mount
  useEffect(() => {
    const loadOwners = async () => {
      try {
        const data = await ownersService.getAll();
        setOwners(data);
      } catch (error) {
        console.error('Failed to load owners:', error);
        toast.error(t('messages.error'));
      } finally {
        setLoadingOwners(false);
      }
    };

    loadOwners();
  }, [t]);

  const handleSubmit = async (data: QuickAddFormData) => {
    setLoading(true);

    try {
      let ownerId = data.owner_id;

      // Step 1: Create owner if needed
      if (data.ownerMode === 'create') {
        const newOwner = await ownersService.create({
          name: data.ownerName!,
          phone: data.ownerPhone || null,
          email: data.ownerEmail || null,
        } as PropertyOwnerInsert);
        ownerId = newOwner.id;
      }

      // Step 2: Create property
      const propertyData: any = {
        owner_id: ownerId!,
        address: data.address,
        city: data.city || null,
        district: data.district || null,
        property_type: data.property_type,
        status: data.addTenant ? 'Occupied' : data.status,
        currency: data.currency,
        listing_url: data.listing_url || null,
        notes: data.notes || null,
      };

      if (data.property_type === 'rental') {
        propertyData.rent_amount = data.rent_amount;
      } else {
        propertyData.sale_price = data.sale_price;
      }

      const newProperty = await propertiesService.create(propertyData);

      // Step 3: Create tenant and contract if requested
      if (data.addTenant && data.property_type === 'rental') {
        try {
          await tenantsService.createTenantWithContract({
            tenant: {
              name: data.tenantName!,
              phone: data.tenantPhone || null,
              email: data.tenantEmail || null,
            },
            contract: {
              property_id: newProperty.id,
              start_date: format(data.contractStart!, 'yyyy-MM-dd'),
              end_date: format(data.contractEnd!, 'yyyy-MM-dd'),
              rent_amount: data.contractRent || data.rent_amount || 0,
              currency: data.contractCurrency || data.currency,
              status: 'Active',
            },
          } as TenantWithContractData);

          toast.success(t('messages.successWithTenant'));
        } catch (tenantError) {
          console.error('Failed to create tenant:', tenantError);
          toast.warning(t('messages.partialSuccess'));
        }
      } else {
        toast.success(t('messages.success'));
      }

      // Reset form
      form.reset();

      // Refresh owners list if new owner was created
      if (data.ownerMode === 'create') {
        const updatedOwners = await ownersService.getAll();
        setOwners(updatedOwners);
      }

      // Call success callback
      onSuccess?.();

    } catch (error) {
      console.error('Failed to create:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    owners,
    loading,
    loadingOwners,
    handleSubmit: form.handleSubmit(handleSubmit),
  };
};
