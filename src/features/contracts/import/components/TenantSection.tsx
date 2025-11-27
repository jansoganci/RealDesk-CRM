import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewFormData } from '../types/reviewFormTypes';

interface TenantSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldUpdate: (field: keyof ReviewFormData, value: any) => void;
}

/**
 * Tenant Section Component
 * Displays form fields for tenant information
 */
export function TenantSection({ formData, fieldErrors, onFieldUpdate }: TenantSectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('import.sections.tenant')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tenant_name">
            {t('create.fields.tenant_name')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="tenant_name"
            value={formData.tenant_name}
            onChange={(e) => onFieldUpdate('tenant_name', e.target.value)}
            placeholder={formData.tenant_name ? "" : t('import.placeholders.notFound')}
            className={cn(fieldErrors.tenant_name && "border-red-500")}
          />
          {fieldErrors.tenant_name && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {fieldErrors.tenant_name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tenant_tc">
              {t('create.fields.tenant_tc')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tenant_tc"
              value={formData.tenant_tc}
              onChange={(e) => onFieldUpdate('tenant_tc', e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="12345678901"
              maxLength={11}
              className={cn(fieldErrors.tenant_tc && "border-red-500")}
            />
            {fieldErrors.tenant_tc && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.tenant_tc}</p>
            )}
          </div>

          <div>
            <Label htmlFor="tenant_phone">{t('create.fields.tenant_phone')}</Label>
            <Input
              id="tenant_phone"
              value={formData.tenant_phone}
              onChange={(e) => onFieldUpdate('tenant_phone', e.target.value)}
              placeholder="0555 123 4567"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tenant_email">{t('create.fields.tenant_email')}</Label>
          <Input
            id="tenant_email"
            type="email"
            value={formData.tenant_email}
            onChange={(e) => onFieldUpdate('tenant_email', e.target.value)}
            placeholder="ornek@email.com"
          />
        </div>

        <div>
          <Label htmlFor="tenant_address">{t('create.fields.tenant_address')}</Label>
          <Textarea
            id="tenant_address"
            value={formData.tenant_address}
            onChange={(e) => onFieldUpdate('tenant_address', e.target.value)}
            placeholder={t('import.placeholders.fullAddress')}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}

