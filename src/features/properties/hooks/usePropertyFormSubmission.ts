import { useCallback } from 'react';
import { FieldValues } from 'react-hook-form';

interface UsePropertyFormSubmissionOptions<T extends FieldValues> {
  onSubmit: (data: T) => Promise<void>;
}

/**
 * Hook for managing property form submission
 * Handles data cleaning logic, property type specific field handling, and form submission
 */
export function usePropertyFormSubmission<T extends FieldValues>({
  onSubmit,
}: UsePropertyFormSubmissionOptions<T>) {
  const handleFormSubmit = useCallback(
    async (data: T) => {
      const isRental = (data as any).property_type === 'rental';
      const isSale = (data as any).property_type === 'sale';

      // Clean common fields
      const cleanedData: any = {
        property_type: data.property_type,
        owner_id: data.owner_id,
        address: data.address,
        status: data.status,
        city: (data as any).city?.trim() || undefined,
        district: (data as any).district?.trim() || undefined,
        notes: (data as any).notes?.trim() || undefined,
        listing_url: (data as any).listing_url?.trim() || undefined,
        currency: (data as any).currency,
      };

      // Property type specific fields
      if (isRental) {
        cleanedData.rent_amount = (data as any).rent_amount || undefined;
        // Remove sale-specific fields for rental properties
        cleanedData.sale_price = undefined;
        cleanedData.buyer_name = undefined;
        cleanedData.buyer_phone = undefined;
        cleanedData.buyer_email = undefined;
        cleanedData.offer_amount = undefined;
      } else if (isSale) {
        cleanedData.sale_price = (data as any).sale_price || undefined;
        // Clean buyer fields - empty strings become undefined
        cleanedData.buyer_name = (data as any).buyer_name?.trim() || undefined;
        cleanedData.buyer_phone = (data as any).buyer_phone?.trim() || undefined;
        cleanedData.buyer_email = (data as any).buyer_email?.trim() || undefined;
        cleanedData.offer_amount = (data as any).offer_amount || undefined;
        // Remove rental-specific fields for sale properties
        cleanedData.rent_amount = undefined;
      }

      await onSubmit(cleanedData as T);
    },
    [onSubmit]
  );

  return {
    handleFormSubmit,
  };
}

