import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { inquiriesService } from '@/lib/serviceProxy';
import type { PropertyInquiry } from '@/types';

interface UseInquiriesDataReturn {
  inquiries: PropertyInquiry[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

export function useInquiriesData(): UseInquiriesDataReturn {
  const { t } = useTranslation('inquiries');
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inquiriesService.getAll();
      const inquiriesArray = Array.isArray(data) ? data : [];
      setInquiries(inquiriesArray);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error(error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    inquiries,
    loading,
    refreshData,
  };
}

