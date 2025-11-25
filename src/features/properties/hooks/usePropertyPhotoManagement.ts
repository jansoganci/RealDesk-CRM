import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Property, PropertyPhoto } from '@/types';
import { photosService } from '@/lib/serviceProxy';

interface UsePropertyPhotoManagementOptions {
  open: boolean;
  property: Property | null;
}

interface UsePropertyPhotoManagementReturn {
  photos: PropertyPhoto[];
  loadingPhotos: boolean;
  photoManagementOpen: boolean;
  setPhotoManagementOpen: (open: boolean) => void;
  loadPhotos: () => Promise<void>;
}

/**
 * Hook for managing property photos
 * Handles photo fetching, loading state, and photo management dialog state
 */
export function usePropertyPhotoManagement({
  open,
  property,
}: UsePropertyPhotoManagementOptions): UsePropertyPhotoManagementReturn {
  const { t } = useTranslation(['properties', 'common']);
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photoManagementOpen, setPhotoManagementOpen] = useState(false);

  const loadPhotos = useCallback(async () => {
    if (!property) return;
    try {
      setLoadingPhotos(true);
      const data = await photosService.getPhotosByPropertyId(property.id);
      setPhotos(data);
    } catch (error) {
      console.error(t('toasts.loadPhotosError'), error);
    } finally {
      setLoadingPhotos(false);
    }
  }, [property, t]);

  // Load photos when dialog opens and property exists
  useEffect(() => {
    if (open && property) {
      loadPhotos();
    } else if (!open) {
      // Reset photos and close photo management when dialog closes
      setPhotos([]);
      setPhotoManagementOpen(false);
    }
  }, [open, property, loadPhotos]);

  return {
    photos,
    loadingPhotos,
    photoManagementOpen,
    setPhotoManagementOpen,
    loadPhotos,
  };
}

