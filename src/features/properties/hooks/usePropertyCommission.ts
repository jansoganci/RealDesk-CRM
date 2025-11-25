import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { commissionsService } from '@/lib/serviceProxy';
import { formatCurrency } from '@/lib/currency';
import type { PropertyWithOwner } from '@/types';

interface UsePropertyCommissionOptions {
  onSuccess?: () => void;
  commissionRate?: number;
}

export function usePropertyCommission(options?: UsePropertyCommissionOptions) {
  const { t } = useTranslation('properties');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveCommission = async (
    property: PropertyWithOwner,
    salePrice: number,
    saleCurrency: string
  ) => {
    try {
      setIsSubmitting(true);
      
      // Create sale commission (uses commission rate from user preferences via RPC)
      await commissionsService.createSaleCommission(
        property.id,
        salePrice,
        saleCurrency
      );

      // Calculate commission for display (using provided rate or default 4%)
      const rate = options?.commissionRate || 4.0;
      const commission = salePrice * (rate / 100);
      
      toast.success(
        t('markAsSold.successToast', {
          commission: formatCurrency(commission, saleCurrency),
        })
      );

      options?.onSuccess?.();
    } catch (error) {
      toast.error(t('markAsSold.errorToast'));
      console.error('Failed to save commission:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSaveCommission,
    isSubmitting,
  };
}

