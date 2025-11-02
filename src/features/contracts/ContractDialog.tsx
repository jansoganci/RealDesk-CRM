import { useEffect, useMemo, useState } from 'react';
import { COLORS } from '@/config/colors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
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
import { Switch } from '../../components/ui/switch';
import { Contract, Tenant, Property, ContractStatus } from '../../types';
import { tenantsService } from '../../lib/serviceProxy';
import { propertiesService } from '../../lib/serviceProxy';
import { FileText, X, Bell } from 'lucide-react';

const createContractFormSchema = (t: TFunction<'contracts'>) =>
  z
    .object({
      tenant_id: z.string().min(1, t('contracts.validation.required')),
      property_id: z.string().min(1, t('contracts.validation.required')),
      start_date: z.string().min(1, t('contracts.validation.required')),
      end_date: z.string().min(1, t('contracts.validation.required')),
      rent_amount: z.string().optional(),
      currency: z.string().optional(),
      status: z.enum(['Active', 'Archived', 'Inactive']),
      notes: z.string().optional(),
      rent_increase_reminder_enabled: z.boolean().optional(),
      rent_increase_reminder_days: z.string().optional(),
      expected_new_rent: z.string().optional(),
      reminder_notes: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.start_date && data.end_date) {
          return new Date(data.end_date) > new Date(data.start_date);
        }
        return true;
      },
      {
        message: t('contracts.validation.endDateAfterStart'),
        path: ['end_date'],
      }
    );

type ContractFormData = z.infer<ReturnType<typeof createContractFormSchema>>;

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onSubmit: (data: ContractFormData, pdfFile?: File) => Promise<void>;
  loading?: boolean;
}

export const ContractDialog = ({
  open,
  onOpenChange,
  contract,
  onSubmit,
  loading = false,
}: ContractDialogProps) => {
  const { t } = useTranslation(['contracts', 'common']);
  const contractSchema = useMemo(() => createContractFormSchema(t), [t]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      status: 'Active',
    },
  });

  const selectedTenantId = watch('tenant_id');
  const selectedPropertyId = watch('property_id');
  const selectedStatus = watch('status');
  const reminderEnabled = watch('rent_increase_reminder_enabled');

  useEffect(() => {
    if (open) {
      const initForm = async () => {
        await loadData();
        if (contract) {
          reset({
            tenant_id: contract.tenant_id || '',
            property_id: contract.property_id || '',
            start_date: contract.start_date || '',
            end_date: contract.end_date || '',
            rent_amount: contract.rent_amount?.toString() || '',
            currency: contract.currency || 'USD',
            status: contract.status as ContractStatus,
            notes: contract.notes || '',
            rent_increase_reminder_enabled: contract.rent_increase_reminder_enabled || false,
            rent_increase_reminder_days: contract.rent_increase_reminder_days?.toString() || '90',
            expected_new_rent: contract.expected_new_rent?.toString() || '',
            reminder_notes: contract.reminder_notes || '',
          });
          setPdfFile(null);
        } else {
          reset({
            tenant_id: '',
            property_id: '',
            start_date: '',
            end_date: '',
            rent_amount: '',
            currency: 'USD',
            status: 'Active',
            notes: '',
            rent_increase_reminder_enabled: false,
            rent_increase_reminder_days: '90',
            expected_new_rent: '',
            reminder_notes: '',
          });
          setPdfFile(null);
        }
      };
      initForm();
    }
  }, [open, contract, reset]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [tenantsData, propertiesData] = await Promise.all([
        tenantsService.getAll(),
        propertiesService.getAll(),
      ]);
      setTenants(tenantsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFormSubmit = async (data: ContractFormData) => {
    const cleanedData = {
      ...data,
      rent_amount: data.rent_amount?.trim() || undefined,
      currency: data.currency || 'USD',
      notes: data.notes?.trim() || undefined,
      expected_new_rent: data.expected_new_rent?.trim() || undefined,
      reminder_notes: data.reminder_notes?.trim() || undefined,
    };
    await onSubmit(cleanedData, pdfFile || undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setPdfFile(null);
      if (file) {
        alert(t('contracts.dialog.form.pdfSelectError'));
      }
    }
  };

  const removePdfFile = () => {
    setPdfFile(null);
    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? t('contracts.dialog.editTitle') : t('contracts.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {contract
              ? t('contracts.dialog.editDescription')
              : t('contracts.dialog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_id">{t('contracts.dialog.form.tenantLabel')}</Label>
              <Select
                value={selectedTenantId || ''}
                onValueChange={(value) => setValue('tenant_id', value)}
                disabled={loadingData || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('contracts.dialog.form.tenantPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                      {tenant.email && ` (${tenant.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenant_id && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.tenant_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">{t('contracts.dialog.form.propertyLabel')}</Label>
              <Select
                value={selectedPropertyId || ''}
                onValueChange={(value) => setValue('property_id', value)}
                disabled={loadingData || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('contracts.dialog.form.propertyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address} - {property.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_id && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.property_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t('contracts.dialog.form.startDateLabel')}</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
                disabled={loading}
              />
              {errors.start_date && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">{t('contracts.dialog.form.endDateLabel')}</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
                disabled={loading}
              />
              {errors.end_date && (
                <p className={`text-sm ${COLORS.danger.text}`}>{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent_amount">{t('contracts.dialog.form.rentAmountLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="rent_amount"
                  type="number"
                  step="0.01"
                  placeholder={t('contracts.dialog.form.rentAmountPlaceholder')}
                  {...register('rent_amount')}
                  disabled={loading}
                  className="flex-1"
                />
                <Select
                  value={watch('currency') || 'USD'}
                  onValueChange={(value) => setValue('currency', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder={t('contracts.dialog.form.currencyPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="TRY">TRY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('contracts.dialog.form.statusLabel')}</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as ContractStatus)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('contracts.dialog.form.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('contracts.status.active')}</SelectItem>
                  <SelectItem value="Archived">{t('contracts.status.archived')}</SelectItem>
                  <SelectItem value="Inactive">{t('contracts.status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-upload">{t('contracts.dialog.form.pdfLabel')}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </div>
              {pdfFile && (
                <div className={`flex items-center gap-2 px-3 py-2 ${COLORS.primary.bgLight} rounded-lg border ${COLORS.primary.border}`}>
                  <FileText className={`h-4 w-4 ${COLORS.primary.text}`} />
                  <span className={`text-sm ${COLORS.primary.textLight} truncate max-w-[150px]`}>
                    {pdfFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removePdfFile}
                    className={`min-h-[44px] min-w-[44px] md:h-auto md:w-auto p-2 md:p-0 ${COLORS.primary.text} hover:${COLORS.primary.dark}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className={`text-xs ${COLORS.muted.textLight}`}>
              {t('contracts.dialog.form.pdfHelper')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('contracts.dialog.form.notesLabel')}</Label>
            <Textarea
              id="notes"
              placeholder={t('contracts.dialog.form.notesPlaceholder')}
              {...register('notes')}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className={`h-5 w-5 ${COLORS.warning.text}`} />
                <div>
                  <Label htmlFor="rent_increase_reminder_enabled" className="text-base font-semibold">
                    {t('contracts.dialog.form.reminderTitle')}
                  </Label>
                  <p className={`text-xs ${COLORS.muted.textLight}`}>
                    {t('contracts.dialog.form.reminderDescription')}
                  </p>
                </div>
              </div>
              <Switch
                id="rent_increase_reminder_enabled"
                checked={reminderEnabled || false}
                onCheckedChange={(checked) => setValue('rent_increase_reminder_enabled', checked)}
                disabled={loading}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-4 pl-7 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rent_increase_reminder_days">
                      {t('contracts.dialog.form.reminderDaysLabel')}
                    </Label>
                    <Select
                      value={watch('rent_increase_reminder_days') || '90'}
                      onValueChange={(value) => setValue('rent_increase_reminder_days', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('contracts.dialog.form.reminderDaysPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">
                          {t('contracts.dialog.form.reminderDaysOption.30')}
                        </SelectItem>
                        <SelectItem value="60">
                          {t('contracts.dialog.form.reminderDaysOption.60')}
                        </SelectItem>
                        <SelectItem value="90">
                          {t('contracts.dialog.form.reminderDaysOption.90')}
                        </SelectItem>
                        <SelectItem value="120">
                          {t('contracts.dialog.form.reminderDaysOption.120')}
                        </SelectItem>
                        <SelectItem value="180">
                          {t('contracts.dialog.form.reminderDaysOption.180')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_new_rent">
                      {t('contracts.dialog.form.expectedRentLabel')}
                    </Label>
                    <Input
                      id="expected_new_rent"
                      type="number"
                      step="0.01"
                      placeholder={t('contracts.dialog.form.expectedRentPlaceholder')}
                      {...register('expected_new_rent')}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder_notes">
                    {t('contracts.dialog.form.reminderNotesLabel')}
                  </Label>
                  <Textarea
                    id="reminder_notes"
                    placeholder={t('contracts.dialog.form.reminderNotesPlaceholder')}
                    {...register('reminder_notes')}
                    disabled={loading}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingData}
              className={`${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
            >
              {loading
                ? t('common.saving')
                : contract
                ? t('contracts.dialog.updateButton')
                : t('contracts.dialog.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
