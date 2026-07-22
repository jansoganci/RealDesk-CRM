import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ownersService, propertiesService, tenantsService } from '@/lib/serviceProxy';
import type { PropertyOwner, TenantWithContractData } from '@/types';
import { getQuickAddSchema, QuickAddFormData } from './quickAddSchema';
import { format } from 'date-fns';
import { buildPropertyListingAddress } from '@/features/properties/hooks/usePropertyFormSubmission';

export const useQuickAdd = (onSuccess?: () => void) => {
  const { t } = useTranslation('quick-add');
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
      state: '',
      zip_code: '',
      property_type: 'rental',
      status: 'Empty',
      rent_amount: undefined,
      sale_price: undefined,
      currency: 'USD',
      listing_url: '',
      notes: '',
      addTenant: false,
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      contractStart: undefined,
      contractEnd: undefined,
      contractRent: undefined,
    },
  });

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

      if (data.ownerMode === 'create') {
        const newOwner = await ownersService.create({
          name: data.ownerName!,
          phone: data.ownerPhone || null,
          email: data.ownerEmail || null,
        });
        ownerId = newOwner.id;
      }

      const street = data.address.trim();
      const cityTrim = data.city?.trim() || '';
      const stateTrim = data.state?.trim().toUpperCase() || '';
      const zipTrim = data.zip_code?.trim() || '';
      const composite = buildPropertyListingAddress({
        street_address: street,
        city: cityTrim,
        state: stateTrim || undefined,
        zip_code: zipTrim || undefined,
      });

      const propertyData = {
        owner_id: ownerId!,
        street_address: street,
        city: cityTrim.length > 0 ? cityTrim : null,
        state: stateTrim.length > 0 ? stateTrim : null,
        zip_code: zipTrim.length > 0 ? zipTrim : null,
        address: composite || street,
        district: null,
        property_type: data.property_type,
        status: data.addTenant ? 'Occupied' : data.status,
        currency: 'USD',
        listing_url: data.listing_url || null,
        notes: data.notes || null,
      };

      const withPrice =
        data.property_type === 'rental'
          ? { ...propertyData, rent_amount: data.rent_amount }
          : { ...propertyData, sale_price: data.sale_price };

      const newProperty = await propertiesService.create(withPrice);

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
              currency: 'USD',
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

      form.reset();

      if (data.ownerMode === 'create') {
        const updatedOwners = await ownersService.getAll();
        setOwners(updatedOwners);
      }

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
