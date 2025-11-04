import { useEffect, useState } from 'react';
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
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Property, PropertyOwner, PropertyPhoto } from '../../types';
import { ownersService } from '../../lib/serviceProxy';
import { photosService } from '../../lib/serviceProxy';
import { PhotoManagement } from '../../components/properties/PhotoManagement';
import { PhotoGallery } from '../../components/properties/PhotoGallery';
import { Images } from 'lucide-react';
import { getPropertySchema } from './propertySchema';

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const PropertyDialog = ({
  open,
  onOpenChange,
  property,
  onSubmit,
  loading = false,
}: PropertyDialogProps) => {
  const { t } = useTranslation(['properties', 'common']);
  const propertySchema = getPropertySchema(t);
  type PropertyFormData = z.infer<typeof propertySchema>;
  
  // Type assertion for onSubmit to maintain type safety
  const typedOnSubmit = onSubmit as (data: PropertyFormData) => Promise<void>;
  
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [photoManagementOpen, setPhotoManagementOpen] = useState(false);
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

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
      status: 'Empty',
    },
  });

  const selectedStatus = watch('status');
  const selectedOwnerId = watch('owner_id');
  const selectedCurrency = watch('currency');

  useEffect(() => {
    if (open) {
      const initForm = async () => {
        await loadOwners();
        if (property) {
          loadPhotos();
          reset({
            owner_id: property.owner_id || '',
            address: property.address || '',
            city: property.city || '',
            district: property.district || '',
            status: property.status as 'Empty' | 'Occupied' | 'Inactive',
            rent_amount: property.rent_amount || undefined,
            currency: (property.currency === 'USD' || property.currency === 'TRY' ? property.currency : null) || undefined,
            notes: property.notes || '',
            listing_url: property.listing_url || '',
          });
        } else {
          setPhotos([]);
          reset({
            owner_id: '',
            address: '',
            city: '',
            district: '',
            status: 'Empty',
            rent_amount: undefined,
            currency: undefined,
            notes: '',
            listing_url: '',
          });
        }
      };
      initForm();
    } else {
      setPhotoManagementOpen(false);
    }
  }, [open, property, reset]);

  const loadOwners = async () => {
    try {
      setLoadingOwners(true);
      const data = await ownersService.getAll();
      setOwners(data);
    } catch (error) {
      console.error(t('toasts.loadOwnersError'), error);
    } finally {
      setLoadingOwners(false);
    }
  };

  const loadPhotos = async () => {
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
  };

  const handleFormSubmit = async (data: PropertyFormData) => {
    const cleanedData = {
      ...data,
      city: data.city?.trim() || undefined,
      district: data.district?.trim() || undefined,
      rent_amount: data.rent_amount || undefined,
      currency: (data.currency === 'USD' || data.currency === 'TRY' ? data.currency : null) || undefined,
      notes: data.notes?.trim() || undefined,
      listing_url: data.listing_url?.trim() || undefined,
    };
    await typedOnSubmit(cleanedData);
  };

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

        {property && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${COLORS.gray.text900}`}>{t('dialog.propertyPhotosTitle')}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPhotoManagementOpen(true)}
                disabled={loading}
              >
                <Images className="h-4 w-4 mr-2" />
                {t('dialog.managePhotosButton')}
              </Button>
            </div>
            <PhotoGallery
              photos={photos}
              onPhotosChange={loadPhotos}
              loading={loadingPhotos}
            />
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner_id">{t('dialog.form.owner')} *</Label>
            <Select
              value={selectedOwnerId || ''}
              onValueChange={(value) => setValue('owner_id', value)}
              disabled={loadingOwners || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('dialog.form.ownerPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.owner_id && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.owner_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('dialog.form.address')} *</Label>
            <Textarea
              id="address"
              placeholder={t('dialog.form.addressPlaceholder')}
              {...register('address')}
              disabled={loading}
              rows={2}
            />
            {errors.address && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t('dialog.form.city')}</Label>
              <Input
                id="city"
                placeholder={t('dialog.form.cityPlaceholder')}
                {...register('city')}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">{t('dialog.form.district')}</Label>
              <Input
                id="district"
                placeholder={t('dialog.form.districtPlaceholder')}
                {...register('district')}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('dialog.form.status')} *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setValue('status', value as 'Empty' | 'Occupied' | 'Inactive')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('dialog.form.statusPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Empty">{t('status.empty')}</SelectItem>
                <SelectItem value="Occupied">{t('status.occupied')}</SelectItem>
                <SelectItem value="Inactive">{t('status.inactive')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.status.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent_amount">{t('dialog.form.rentAmount')}</Label>
              <Input
                id="rent_amount"
                type="number"
                step="0.01"
                placeholder={t('dialog.form.rentAmountPlaceholder')}
                {...register('rent_amount', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.rent_amount && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.rent_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('dialog.form.currency')}</Label>
              <Select
                value={selectedCurrency || ''}
                onValueChange={(value) => setValue('currency', value as 'USD' | 'TRY')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dialog.form.currencyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="TRY">TRY</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.currency.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing_url">{t('dialog.form.listingUrl')}</Label>
            <Input
              id="listing_url"
              type="url"
              placeholder={t('dialog.form.listingUrlPlaceholder')}
              {...register('listing_url')}
              disabled={loading}
            />
            {errors.listing_url && (
              <p className={`text-sm ${COLORS.danger.text}`}>{errors.listing_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('dialog.form.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('dialog.form.notesPlaceholder')}
              {...register('notes')}
              disabled={loading}
              rows={3}
            />
          </div>

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

      {property && (
        <PhotoManagement
          open={photoManagementOpen}
          onOpenChange={setPhotoManagementOpen}
          propertyId={property.id}
          propertyAddress={property.address}
        />
      )}
    </Dialog>
  );
};
