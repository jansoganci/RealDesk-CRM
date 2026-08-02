import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DollarSign, TrendingUp } from 'lucide-react';
import { PropertyWithOwner } from '../../types';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';

interface MarkAsSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PropertyWithOwner | null;
  onConfirm: (salePrice: number, currency: string) => void;
  loading?: boolean;
}

const saleSchema = z.object({
  salePrice: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Sale price must be a positive number'),
});

type SaleFormData = z.infer<typeof saleSchema>;

export const MarkAsSoldDialog = ({
  open,
  onOpenChange,
  property,
  onConfirm,
  loading = false,
}: MarkAsSoldDialogProps) => {
  const { t } = useTranslation(['properties', 'common']);
  const { commissionRate } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      salePrice: '',
    },
  });

  const salePrice = watch('salePrice');

  const onSubmit = (data: SaleFormData) => {
    onConfirm(parseFloat(data.salePrice), 'USD');
    reset();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const calculateCommission = () => {
    const price = parseFloat(salePrice || '0');
    if (isNaN(price) || price <= 0) return 0;
    return price * (commissionRate / 100);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 bg-secondary rounded-lg shadow-md">
              <TrendingUp className="h-5 w-5 text-secondary-foreground" />
            </div>
            {t('properties:markAsSold.title')}
          </DialogTitle>
          <DialogDescription className="text-foreground/80">
            {t('properties:markAsSold.description', { address: property?.address || '' })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5 py-4">
            {/* Property Info */}
            <div className="bg-gradient-to-br from-muted/50 to-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-foreground/80" />
                <span className="text-sm font-semibold text-foreground">
                  {t('properties:markAsSold.propertyInfo')}
                </span>
              </div>
              <p className="text-sm text-foreground/80 font-medium">{property?.address}</p>
              {(property?.city || property?.state || property?.zip_code) && (
                <p className="text-xs text-foreground/80 mt-1">
                  {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Sale Price Input */}
            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-foreground font-semibold">
                {t('properties:markAsSold.salePrice')} *
              </Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                placeholder="4000000"
                {...register('salePrice')}
                className={errors.salePrice ? 'border-destructive' : ''}
              />
              {errors.salePrice && (
                <p className="text-sm text-destructive">{errors.salePrice.message}</p>
              )}
            </div>

            {/* Commission Preview */}
            {salePrice && !isNaN(parseFloat(salePrice)) && parseFloat(salePrice) > 0 && (
              <div className="bg-secondary/15 border border-secondary/40 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-foreground/80 font-medium">
                      {t('properties:markAsSold.yourCommission')}
                    </p>
                    <p className="text-2xl font-bold text-secondary-foreground">
                      {formatCurrency(calculateCommission(), 'USD')}
                    </p>
                    <p className="text-xs text-foreground/80 mt-1">
                      {t('properties:markAsSold.commissionRate')}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg shadow-md">
                    <TrendingUp className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md"
            >
              {loading ? t('common:saving') : t('properties:markAsSold.confirmButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
