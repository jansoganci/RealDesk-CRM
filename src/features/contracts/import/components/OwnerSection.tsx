import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewFormData } from '../types/reviewFormTypes';

interface OwnerSectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  onFieldUpdate: (field: keyof ReviewFormData, value: any) => void;
}

/**
 * Owner Section Component
 * Displays form fields for property owner information
 */
export function OwnerSection({ formData, fieldErrors, onFieldUpdate }: OwnerSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🏠 Ev Sahibi Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="owner_name">
            İsim Soyisim <span className="text-red-500">*</span>
          </Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => onFieldUpdate('owner_name', e.target.value)}
            placeholder={formData.owner_name ? "" : "Bulunamadı - lütfen girin"}
            className={cn(fieldErrors.owner_name && "border-red-500")}
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
            <Label htmlFor="owner_tc">
              TC Kimlik No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="owner_tc"
              value={formData.owner_tc}
              onChange={(e) => onFieldUpdate('owner_tc', e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="12345678901"
              maxLength={11}
              className={cn(fieldErrors.owner_tc && "border-red-500")}
            />
            {fieldErrors.owner_tc && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.owner_tc}</p>
            )}
          </div>

          <div>
            <Label htmlFor="owner_phone">Telefon</Label>
            <Input
              id="owner_phone"
              value={formData.owner_phone}
              onChange={(e) => onFieldUpdate('owner_phone', e.target.value)}
              placeholder="0555 123 4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner_email">Email</Label>
            <Input
              id="owner_email"
              type="email"
              value={formData.owner_email}
              onChange={(e) => onFieldUpdate('owner_email', e.target.value)}
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <Label htmlFor="owner_iban">IBAN</Label>
            <Input
              id="owner_iban"
              value={formData.owner_iban}
              onChange={(e) => onFieldUpdate('owner_iban', e.target.value)}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

