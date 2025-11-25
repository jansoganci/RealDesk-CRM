import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewFormData, ParsedData } from '../types/reviewFormTypes';

interface PropertySectionProps {
  formData: ReviewFormData;
  fieldErrors: Record<string, string>;
  parsedData: ParsedData;
  onFieldUpdate: (field: keyof ReviewFormData, value: any) => void;
}

/**
 * Property Section Component
 * Displays form fields for property information
 */
export function PropertySection({ formData, fieldErrors, parsedData, onFieldUpdate }: PropertySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🏘️ Mülk Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedData.propertyAddress && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Bulunan adres:</strong> {parsedData.propertyAddress}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mahalle">
              Mahalle <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mahalle"
              value={formData.mahalle}
              onChange={(e) => onFieldUpdate('mahalle', e.target.value)}
              placeholder="Örn: Merkez Mahallesi"
              className={cn(fieldErrors.mahalle && "border-red-500")}
            />
            {fieldErrors.mahalle && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.mahalle}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cadde_sokak">Cadde/Sokak</Label>
            <Input
              id="cadde_sokak"
              value={formData.cadde_sokak}
              onChange={(e) => onFieldUpdate('cadde_sokak', e.target.value)}
              placeholder="Örn: Atatürk Caddesi"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="bina_no">Bina No</Label>
            <Input
              id="bina_no"
              value={formData.bina_no}
              onChange={(e) => onFieldUpdate('bina_no', e.target.value)}
              placeholder="5"
            />
          </div>

          <div>
            <Label htmlFor="daire_no">Daire No</Label>
            <Input
              id="daire_no"
              value={formData.daire_no}
              onChange={(e) => onFieldUpdate('daire_no', e.target.value)}
              placeholder="3"
            />
          </div>

          <div>
            <Label htmlFor="ilce">
              İlçe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ilce"
              value={formData.ilce}
              onChange={(e) => onFieldUpdate('ilce', e.target.value)}
              placeholder="Kadıköy"
              className={cn(fieldErrors.ilce && "border-red-500")}
            />
            {fieldErrors.ilce && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.ilce}</p>
            )}
          </div>

          <div>
            <Label htmlFor="il">
              İl <span className="text-red-500">*</span>
            </Label>
            <Input
              id="il"
              value={formData.il}
              onChange={(e) => onFieldUpdate('il', e.target.value)}
              placeholder="İstanbul"
              className={cn(fieldErrors.il && "border-red-500")}
            />
            {fieldErrors.il && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.il}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

