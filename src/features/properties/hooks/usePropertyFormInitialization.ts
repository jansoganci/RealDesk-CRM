import { useEffect } from 'react';
import { UseFormReset, UseFormSetValue, FieldValues } from 'react-hook-form';
import { Property } from '@/types';

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
  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      const initForm = async () => {
        await loadOwners();
        
        if (property) {
          // Reset form with existing property data (Edit mode)
          if (propertyType === 'rental') {
            reset({
              property_type: 'rental',
              owner_id: property.owner_id || '',
              address: property.address || '',
              city: property.city || '',
              district: property.district || '',
              status: property.status as any,
              rent_amount: property.rent_amount || undefined,
              currency: (property.currency === 'USD' || property.currency === 'TRY' ? property.currency : 'USD') as 'USD' | 'TRY',
              notes: property.notes || '',
              listing_url: property.listing_url || '',
            } as any);
          } else {
            reset({
              property_type: 'sale',
              owner_id: property.owner_id || '',
              address: property.address || '',
              city: property.city || '',
              district: property.district || '',
              status: property.status as any,
              sale_price: (property as any).sale_price || undefined,
              currency: (property.currency === 'USD' || property.currency === 'TRY' ? property.currency : 'USD') as 'USD' | 'TRY',
              buyer_name: (property as any).buyer_name || '',
              buyer_phone: (property as any).buyer_phone || '',
              buyer_email: (property as any).buyer_email || '',
              offer_amount: (property as any).offer_amount || undefined,
              notes: property.notes || '',
              listing_url: property.listing_url || '',
            } as any);
          }
        } else {
          // Reset form with default values (Create mode)
          reset({
            property_type: propertyType,
            owner_id: '',
            address: '',
            city: '',
            district: '',
            status: propertyType === 'rental' ? 'Empty' : 'Available',
            rent_amount: undefined,
            currency: 'USD',
            notes: '',
            listing_url: '',
          } as any);
        }
      };
      initForm();
    }
  }, [open, property, propertyType, reset, loadOwners]);

  // Update form when property type changes (only for new properties)
  useEffect(() => {
    if (!property && open) {
      // Reset form with new property type defaults
      if (propertyType === 'rental') {
        setValue('property_type', 'rental' as any);
        setValue('status', 'Empty' as any);
      } else {
        setValue('property_type', 'sale' as any);
        setValue('status', 'Available' as any);
      }
    }
  }, [propertyType, property, open, setValue]);
}

