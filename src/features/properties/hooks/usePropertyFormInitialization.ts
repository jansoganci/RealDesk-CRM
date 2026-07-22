import { useEffect } from 'react';
import type { FieldValues, Path, UseFormReset, UseFormSetValue } from 'react-hook-form';
import type { Property } from '@/types';

interface UsePropertyFormInitializationOptions<T extends FieldValues> {
  open: boolean;
  property: Property | null;
  propertyType: 'rental' | 'sale';
  reset: UseFormReset<T>;
  setValue: UseFormSetValue<T>;
  loadOwners: () => Promise<void>;
}

/**
 * Hook for managing property form initialization
 * Handles form reset logic, conditional default values based on property type and edit/create mode
 * Also handles form updates when property type changes (for new properties only)
 */
export function usePropertyFormInitialization<T extends FieldValues>({
  open,
  property,
  propertyType,
  reset,
  setValue,
  loadOwners,
}: UsePropertyFormInitializationOptions<T>) {
  useEffect(() => {
    if (open) {
      const initForm = async () => {
        await loadOwners();

        if (property) {
          const street =
            (property.street_address && property.street_address.trim()) ||
            (property.address && property.address.trim()) ||
            '';

          const baseFields = {
            owner_id: property.owner_id || '',
            street_address: street,
            city: property.city?.trim() || '',
            state: (property.state || '').trim().toUpperCase() || '',
            zip_code: property.zip_code?.trim() || '',
            mls_id: property.mls_id?.trim() || '',
            year_built:
              typeof property.year_built === 'number' && !Number.isNaN(property.year_built)
                ? property.year_built
                : undefined,
            notes: property.notes || '',
            listing_url: property.listing_url || '',
            currency: 'USD',
          };

          if (propertyType === 'rental') {
            reset({
              ...baseFields,
              property_type: 'rental',
              status: property.status,
              rent_amount: property.rent_amount || undefined,
            } as unknown as Parameters<UseFormReset<T>>[0]);
          } else {
            reset({
              ...baseFields,
              property_type: 'sale',
              status: property.status,
              sale_price: property.sale_price ?? undefined,
              buyer_name: property.buyer_name ?? '',
              buyer_phone: property.buyer_phone ?? '',
              buyer_email: property.buyer_email ?? '',
              offer_amount: property.offer_amount ?? undefined,
            } as unknown as Parameters<UseFormReset<T>>[0]);
          }
        } else {
          reset({
            property_type: propertyType,
            owner_id: '',
            street_address: '',
            city: '',
            state: '',
            zip_code: '',
            mls_id: '',
            year_built: undefined,
            status: propertyType === 'rental' ? 'Empty' : 'Available',
            rent_amount: undefined,
            sale_price: undefined,
            currency: 'USD',
            notes: '',
            listing_url: '',
            buyer_name: '',
            buyer_phone: '',
            buyer_email: '',
            offer_amount: undefined,
          } as unknown as Parameters<UseFormReset<T>>[0]);
        }
      };
      initForm();
    }
  }, [open, property, propertyType, reset, loadOwners]);

  useEffect(() => {
    if (!property && open) {
      if (propertyType === 'rental') {
        setValue('property_type' as Path<T>, 'rental' as T[Path<T>]);
        setValue('status' as Path<T>, 'Empty' as T[Path<T>]);
      } else {
        setValue('property_type' as Path<T>, 'sale' as T[Path<T>]);
        setValue('status' as Path<T>, 'Available' as T[Path<T>]);
      }
    }
  }, [propertyType, property, open, setValue]);
}
