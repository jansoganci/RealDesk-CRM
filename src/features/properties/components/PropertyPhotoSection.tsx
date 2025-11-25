import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Images } from 'lucide-react';
import { PhotoGallery } from '@/components/properties/PhotoGallery';
import { PhotoManagement } from '@/components/properties/PhotoManagement';
import { Property, PropertyPhoto } from '@/types';

interface PropertyPhotoSectionProps {
  property: Property | null;
  photos: PropertyPhoto[];
  loadingPhotos: boolean;
  photoManagementOpen: boolean;
  onPhotoManagementOpenChange: (open: boolean) => void;
  onManagePhotosClick: () => void;
  onPhotosChange: () => void;
  formLoading?: boolean;
}

/**
 * Property Photo Section Component
 * Displays photo gallery and photo management button
 */
export function PropertyPhotoSection({
  property,
  photos,
  loadingPhotos,
  photoManagementOpen,
  onPhotoManagementOpenChange,
  onManagePhotosClick,
  onPhotosChange,
  formLoading = false,
}: PropertyPhotoSectionProps) {
  const { t } = useTranslation(['properties', 'common']);

  // Only show photo section if editing existing property
  if (!property) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('dialog.form.photos')}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManagePhotosClick}
            disabled={formLoading}
          >
            <Images className="h-4 w-4 mr-2" />
            {t('dialog.managePhotosButton')}
          </Button>
        </div>
        <PhotoGallery
          photos={photos}
          onPhotosChange={onPhotosChange}
          loading={loadingPhotos}
        />
      </div>

      <PhotoManagement
        open={photoManagementOpen}
        onOpenChange={onPhotoManagementOpenChange}
        propertyId={property.id}
        propertyAddress={property.address}
      />
    </>
  );
}

