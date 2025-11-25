import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { inquiriesService } from '@/lib/serviceProxy';
import type { PropertyInquiry, InquiryWithMatches } from '@/types';
import * as z from 'zod';

interface UseInquiryActionsOptions {
  onSuccess?: () => void;
  onCloseInquiryDialog?: () => void;
  onCloseDeleteDialog?: () => void;
  onOpenMatchesDialog?: (inquiry: InquiryWithMatches) => void;
}

export function useInquiryActions(
  refreshInquiries: () => Promise<void>,
  options?: UseInquiryActionsOptions
) {
  const { t } = useTranslation('inquiries');
  const [isLoading, setIsLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState<string | null>(null);

  type InquiryFormData = z.infer<ReturnType<typeof import('../inquirySchema').getInquirySchema>>;

  const handleCreate = async (
    data: InquiryFormData,
    editingInquiry?: PropertyInquiry | null
  ) => {
    try {
      setIsLoading(true);
      if (editingInquiry) {
        await inquiriesService.update(editingInquiry.id, data);
        toast.success(t('toasts.updateSuccess'));
      } else {
        // user_id is injected automatically by the service
        await inquiriesService.create(data);
        toast.success(t('toasts.addSuccess'));
      }
      options?.onCloseInquiryDialog?.();
      await refreshInquiries();
      options?.onSuccess?.();
    } catch (error) {
      toast.error(editingInquiry ? t('toasts.updateError') : t('toasts.addError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (inquiryId: string) => {
    try {
      setIsLoading(true);
      await inquiriesService.delete(inquiryId);
      toast.success(t('toasts.deleteSuccess'));
      await refreshInquiries();
      options?.onCloseDeleteDialog?.();
      options?.onSuccess?.();
    } catch (error) {
      toast.error(t('toasts.deleteError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMatches = async (inquiry: PropertyInquiry) => {
    try {
      setMatchesLoading(inquiry.id);
      const inquiryWithMatches = await inquiriesService.getById(inquiry.id);
      if (inquiryWithMatches && options?.onOpenMatchesDialog) {
        options.onOpenMatchesDialog(inquiryWithMatches);
      }
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error(error);
    } finally {
      setMatchesLoading(null);
    }
  };

  return {
    handleCreate,
    handleDelete,
    handleLoadMatches,
    isLoading,
    matchesLoading,
  };
}

