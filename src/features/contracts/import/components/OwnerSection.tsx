import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewFormData } from '../types/reviewFormTypes';

interface OwnerSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldUpdate: (field: keyof ReviewFormData, value: unknown) => void;
}

/**
 * Owner Section Component
 * Displays form fields for property owner information
 */
export function OwnerSection({ formData, fieldErrors, onFieldUpdate }: OwnerSectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('import.sections.owner')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="owner_name">
            {t('create.fields.owner_name')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => onFieldUpdate('owner_name', e.target.value)}
            placeholder={formData.owner_name ? '' : t('import.placeholders.notFound')}
            className={cn(fieldErrors.owner_name && 'border-red-500')}
          />
          {fieldErrors.owner_name && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {fieldErrors.owner_name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_tax_id">
              Tax ID (EIN/SSN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="owner_tax_id"
              value={formData.owner_tax_id}
              onChange={(e) => onFieldUpdate('owner_tax_id', e.target.value)}
              placeholder="XX-XXXXXXX or XXX-XX-XXXX"
              className={cn(fieldErrors.owner_tax_id && 'border-red-500')}
            />
            {fieldErrors.owner_tax_id && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.owner_tax_id}</p>
            )}
          </div>

          <div>
            <Label htmlFor="owner_phone">{t('create.fields.owner_phone')}</Label>
            <Input
              id="owner_phone"
              value={formData.owner_phone}
              onChange={(e) => onFieldUpdate('owner_phone', e.target.value)}
              placeholder={t('create.placeholders.owner_phone')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_email">{t('create.fields.owner_email')}</Label>
            <Input
              id="owner_email"
              type="email"
              value={formData.owner_email}
              onChange={(e) => onFieldUpdate('owner_email', e.target.value)}
              placeholder="ornek@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_routing_number">
              {t('create.fields.owner_routing_number')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="owner_routing_number"
              value={formData.owner_routing_number}
              onChange={(e) => onFieldUpdate('owner_routing_number', e.target.value)}
              placeholder={t('create.placeholders.owner_routing_number')}
              inputMode="numeric"
              className={cn(fieldErrors.owner_routing_number && 'border-red-500')}
            />
            {fieldErrors.owner_routing_number && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.owner_routing_number}</p>
            )}
          </div>
          <div>
            <Label htmlFor="owner_account_number">
              {t('create.fields.owner_account_number')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="owner_account_number"
              value={formData.owner_account_number}
              onChange={(e) => onFieldUpdate('owner_account_number', e.target.value)}
              placeholder={t('create.placeholders.owner_account_number')}
              inputMode="numeric"
              className={cn(fieldErrors.owner_account_number && 'border-red-500')}
            />
            {fieldErrors.owner_account_number && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.owner_account_number}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
