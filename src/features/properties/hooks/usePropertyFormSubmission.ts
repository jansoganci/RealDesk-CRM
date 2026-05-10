import { useCallback } from 'react';
import { FieldValues } from 'react-hook-form';

interface UsePropertyFormSubmissionOptions<T extends FieldValues> {
  onSubmit: (data: T) => Promise<void>;
}

/** Single-line address for legacy `properties.address` + search (US). */
export function buildPropertyListingAddress(parts: {
  street_address: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}): string {
  const street = (parts.street_address ?? '').trim();
  const stateZip = [parts.state?.trim(), parts.zip_code?.trim()].filter(Boolean).join(' ');
  const tail = [parts.city?.trim(), stateZip].filter(Boolean).join(', ');
  return tail ? `${street}, ${tail}` : street;
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
      const d = data as Record<string, unknown>;
      const isRental = d.property_type === 'rental';
      const isSale = d.property_type === 'sale';

      const street = String(d.street_address ?? '').trim();
      const cityTrim = typeof d.city === 'string' ? d.city.trim() : '';
      const stateTrim = typeof d.state === 'string' ? d.state.trim().toUpperCase() : '';
      const zipTrim = typeof d.zip_code === 'string' ? d.zip_code.trim() : '';
      const mlsTrim =
        typeof d.mls_id === 'string' && d.mls_id.trim() !== ''
          ? d.mls_id.trim()
          : undefined;

      let yearBuilt: number | null = null;
      if (typeof d.year_built === 'number' && !Number.isNaN(d.year_built)) {
        yearBuilt = d.year_built;
      }

      const listingAddress =
        street.length > 0
          ? buildPropertyListingAddress({
              street_address: street,
              city: cityTrim,
              state: stateTrim,
              zip_code: zipTrim,
            })
          : '';

      const cleanedData: Record<string, unknown> = {
        property_type: d.property_type,
        owner_id: d.owner_id,
        street_address: street,
        city: cityTrim || undefined,
        state: stateTrim || undefined,
        zip_code: zipTrim || undefined,
        mls_id: mlsTrim,
        year_built: yearBuilt,
        address: listingAddress || street,
        district: null,
        status: d.status,
        notes: typeof d.notes === 'string' ? d.notes.trim() || undefined : undefined,
        listing_url: typeof d.listing_url === 'string' ? d.listing_url.trim() || undefined : undefined,
        currency: 'USD',
      };

      if (isRental) {
        cleanedData.rent_amount = typeof d.rent_amount === 'number' ? d.rent_amount : undefined;
        cleanedData.sale_price = undefined;
        cleanedData.buyer_name = undefined;
        cleanedData.buyer_phone = undefined;
        cleanedData.buyer_email = undefined;
        cleanedData.offer_amount = undefined;
      } else if (isSale) {
        cleanedData.sale_price = typeof d.sale_price === 'number' ? d.sale_price : undefined;
        cleanedData.buyer_name =
          typeof d.buyer_name === 'string' ? d.buyer_name.trim() || undefined : undefined;
        cleanedData.buyer_phone =
          typeof d.buyer_phone === 'string' ? d.buyer_phone.trim() || undefined : undefined;
        cleanedData.buyer_email =
          typeof d.buyer_email === 'string' ? d.buyer_email.trim() || undefined : undefined;
        cleanedData.offer_amount =
          typeof d.offer_amount === 'number' ? d.offer_amount : undefined;
        cleanedData.rent_amount = undefined;
      }

      await onSubmit(cleanedData as T);
    },
    [onSubmit],
  );

  return {
    handleFormSubmit,
  };
}
