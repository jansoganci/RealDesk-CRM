import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Property } from '../../types';
import { usePropertyOwnerSelection } from './hooks/usePropertyOwnerSelection';
import { usePropertyPhotoManagement } from './hooks/usePropertyPhotoManagement';
import { usePropertyType } from './hooks/usePropertyType';
import { usePropertyFormInitialization } from './hooks/usePropertyFormInitialization';
import { usePropertyFormSubmission } from './hooks/usePropertyFormSubmission';
import { OwnerSelectField } from './components/OwnerSelectField';
import { PropertyPhotoSection } from './components/PropertyPhotoSection';
import { PropertyFormFields } from './components/PropertyFormFields';
import { PropertyTypeSelectorSection } from './components/PropertyTypeSelectorSection';
import { PropertyWithOwner } from '../../types';

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  onMarkAsSold?: (property: PropertyWithOwner) => void;
}

export const PropertyDialog = ({
  open,
  onOpenChange,
  property,
  onSubmit,
  loading = false,
  onMarkAsSold,
}: PropertyDialogProps) => {
  const { t } = useTranslation(['properties', 'common']);

  // Property type hook
  const { propertyType, setPropertyType, propertySchema } = usePropertyType({
    property,
    defaultType: 'rental',
  });

  type PropertyFormData = z.infer<typeof propertySchema>;

  // Type assertion for onSubmit to maintain type safety
  const typedOnSubmit = onSubmit as (data: PropertyFormData) => Promise<void>;

  // Owner selection hook
  const { owners, loadingOwners, loadOwners } = usePropertyOwnerSelection();

  // Photo management hook
  const {
    photos,
    loadingPhotos,
    photoManagementOpen,
    setPhotoManagementOpen,
    loadPhotos,
  } = usePropertyPhotoManagement({ open, property });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_type: propertyType,
      status: propertyType === 'rental' ? 'Empty' : 'Available',
    } as any,
  });

  const selectedOwnerId = watch('owner_id');

  // Form initialization hook
  usePropertyFormInitialization({
    open,
    property,
    propertyType,
    reset,
    setValue,
    loadOwners,
  });

  // Form submission hook
  const { handleFormSubmit } = usePropertyFormSubmission({
    onSubmit: typedOnSubmit,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? t('dialog.editTitle') : t('dialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {property
              ? t('dialog.editDescription')
              : t('dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <PropertyPhotoSection
          property={property}
          photos={photos}
          loadingPhotos={loadingPhotos}
          photoManagementOpen={photoManagementOpen}
          onPhotoManagementOpenChange={setPhotoManagementOpen}
          onManagePhotosClick={() => setPhotoManagementOpen(true)}
          onPhotosChange={loadPhotos}
          formLoading={loading}
        />

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Property Type Selector - Only show for new properties */}
          {!property && (
            <PropertyTypeSelectorSection
              value={propertyType}
              onChange={setPropertyType}
              disabled={loading}
            />
          )}

          <OwnerSelectField
            value={selectedOwnerId}
            onValueChange={(value) => setValue('owner_id', value)}
            owners={owners}
            loading={loadingOwners}
            disabled={loading}
            error={errors.owner_id?.message as string | undefined}
          />

          <PropertyFormFields
            propertyType={propertyType}
            property={property}
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            loading={loading}
            onMarkAsSold={onMarkAsSold}
          />

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
            >
              {loading ? t('saving', { ns: 'common' }) : property ? t('dialog.updateButton') : t('dialog.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
