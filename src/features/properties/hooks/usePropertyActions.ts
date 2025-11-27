import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { propertiesService } from '@/lib/serviceProxy';
import type { PropertyWithOwner, PropertyStatus } from '@/types';
import * as z from 'zod';

interface UsePropertyActionsOptions {
  onSuccess?: () => void;
  onCloseCreate?: () => void;
  onCloseEdit?: () => void;
}

export function usePropertyActions(
  refreshProperties: () => Promise<void>,
  options?: UsePropertyActionsOptions
) {
  const { t } = useTranslation('properties');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (
    data: z.infer<ReturnType<typeof import('../propertySchemas').getPropertySchema>>,
    editingProperty?: PropertyWithOwner | null
  ) => {
    try {
      setIsLoading(true);
      if (editingProperty) {
        await propertiesService.update(editingProperty.id, data);
        toast.success(t('toasts.updateSuccess'));
        options?.onCloseEdit?.();
      } else {
        // user_id is injected automatically by the service
        await propertiesService.create(data);
        toast.success(t('toasts.addSuccess'));
        options?.onCloseCreate?.();
      }
      await refreshProperties();
      options?.onSuccess?.();
    } catch (error) {
      toast.error(editingProperty ? t('toasts.updateError') : t('toasts.addError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (
    propertyId: string,
    data: z.infer<ReturnType<typeof import('../propertySchemas').getPropertySchema>>
  ) => {
    try {
      setIsLoading(true);
      await propertiesService.update(propertyId, data);
      toast.success(t('toasts.updateSuccess'));
      await refreshProperties();
      options?.onCloseEdit?.();
      options?.onSuccess?.();
    } catch (error) {
      toast.error(t('toasts.updateError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      setIsLoading(true);
      await propertiesService.delete(propertyId);
      toast.success(t('toasts.deleteSuccess'));
      await refreshProperties();
      options?.onSuccess?.();
    } catch (error) {
      toast.error(t('toasts.deleteError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: PropertyStatus) => {
    try {
      setIsLoading(true);
      
      // Validate status value
      const validStatuses: PropertyStatus[] = ['Empty', 'Occupied', 'Inactive', 'Available', 'Under Offer', 'Sold'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid property status: ${newStatus}`);
      }
      
      await propertiesService.update(propertyId, { status: newStatus });
      toast.success(t('toasts.updateSuccess'));
      await refreshProperties();
      options?.onSuccess?.();
    } catch (error) {
      toast.error(t('toasts.updateError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refreshProperties();
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleStatusChange,
    handleRefresh,
    isLoading,
  };
}

