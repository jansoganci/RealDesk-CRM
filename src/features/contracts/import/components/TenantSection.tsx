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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">👤 Kiracı Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tenant_name">
            İsim Soyisim <span className="text-red-500">*</span>
          </Label>
          <Input
            id="tenant_name"
            value={formData.tenant_name}
            onChange={(e) => onFieldUpdate('tenant_name', e.target.value)}
            placeholder={formData.tenant_name ? "" : "Bulunamadı - lütfen girin"}
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
              TC Kimlik No <span className="text-red-500">*</span>
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
            <Label htmlFor="tenant_phone">Telefon</Label>
            <Input
              id="tenant_phone"
              value={formData.tenant_phone}
              onChange={(e) => onFieldUpdate('tenant_phone', e.target.value)}
              placeholder="0555 123 4567"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tenant_email">Email</Label>
          <Input
            id="tenant_email"
            type="email"
            value={formData.tenant_email}
            onChange={(e) => onFieldUpdate('tenant_email', e.target.value)}
            placeholder="ornek@email.com"
          />
        </div>

        <div>
          <Label htmlFor="tenant_address">İkametgah Adresi</Label>
          <Textarea
            id="tenant_address"
            value={formData.tenant_address}
            onChange={(e) => onFieldUpdate('tenant_address', e.target.value)}
            placeholder="Tam adres..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}

