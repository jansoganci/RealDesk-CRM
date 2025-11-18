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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
  currency: z.string(),
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
    setValue,
    watch,
    reset,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      salePrice: '',
      currency: 'USD',
    },
  });

  const currency = watch('currency');
  const salePrice = watch('salePrice');

  const onSubmit = (data: SaleFormData) => {
    onConfirm(parseFloat(data.salePrice), data.currency);
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
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            {t('properties:markAsSold.title')}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {t('properties:markAsSold.description', { address: property?.address || '' })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5 py-4">
            {/* Property Info */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-200/50">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-900">
                  {t('properties:markAsSold.propertyInfo')}
                </span>
              </div>
              <p className="text-sm text-slate-700 font-medium">{property?.address}</p>
              {property?.city && (
                <p className="text-xs text-slate-600 mt-1">
                  {[property.city, property.district].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Sale Price Input */}
            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-slate-900 font-semibold">
                {t('properties:markAsSold.salePrice')} *
              </Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                placeholder="4000000"
                {...register('salePrice')}
                className={errors.salePrice ? 'border-red-500' : ''}
              />
              {errors.salePrice && (
                <p className="text-sm text-red-500">{errors.salePrice.message}</p>
              )}
            </div>

            {/* Currency Select */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-slate-900 font-semibold">
                {t('properties:markAsSold.currency')} *
              </Label>
              <Select
                value={currency}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="TRY">TRY (₺)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Commission Preview */}
            {salePrice && !isNaN(parseFloat(salePrice)) && parseFloat(salePrice) > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">
                      {t('properties:markAsSold.yourCommission')}
                    </p>
                    <p className="text-2xl font-bold text-amber-700">
                      {formatCurrency(calculateCommission(), currency)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {t('properties:markAsSold.commissionRate')}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
                    <TrendingUp className="h-6 w-6 text-white" />
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
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 text-white shadow-md"
            >
              {loading ? t('common:saving') : t('properties:markAsSold.confirmButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
