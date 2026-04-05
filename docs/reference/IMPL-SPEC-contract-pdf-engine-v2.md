# Implementation Specification: Contract PDF Engine v2

**Parent Document:** `docs/reference/ADR-002-contract-engine-v2-architecture.md`
**Status:** Ready for Implementation
**Date:** 2024-12-24
**Scope:** PDF generation, storage, and download for v2 contract types

---

## 1. Overview

This specification defines the implementation details for adding PDF functionality to the Contract Engine v2. It covers database changes, service implementation, storage conventions, UI hooks, and integration points.

**In Scope:**
- Sale Contracts PDF (immediate)
- Commission, Showing contracts PDF (future-ready)

**Out of Scope:**
- Rent Contracts (isolated per ADR-002)

---

## 2. Database Changes

### 2.1 Migration: Add pdf_path Column

**File:** `supabase/migrations/[timestamp]_add_pdf_path_to_contract_instances_v2.sql`

```sql
-- Add PDF storage path to contract_instances_v2
ALTER TABLE contract_instances_v2
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add index for queries filtering by PDF existence
CREATE INDEX IF NOT EXISTS idx_contract_instances_v2_has_pdf
ON contract_instances_v2 (user_id, type)
WHERE pdf_path IS NOT NULL;

-- Comment
COMMENT ON COLUMN contract_instances_v2.pdf_path IS 'Supabase Storage path to generated PDF file';
```

### 2.2 Type Updates

**File:** `src/types/contractBuilder.types.ts`

Add to `ContractInstanceV2` interface:
```typescript
pdf_path: string | null;
```

Add to `UpdateContractInstanceRequest` interface:
```typescript
pdf_path?: string | null;
```

---

## 3. Storage Configuration

### 3.1 Bucket Structure

**Bucket Name:** `contract-pdfs` (existing bucket, shared with Rent but separate folders)

**Folder Convention:**
```
contract-pdfs/
├── rent/           ← Rent contracts (DO NOT TOUCH)
└── v2/             ← All v2 contract types
    ├── sale/
    │   └── {user_id}/
    │       └── {instance_id}.pdf
    ├── commission/
    │   └── {user_id}/
    │       └── {instance_id}.pdf
    └── showing/
        └── {user_id}/
            └── {instance_id}.pdf
```

### 3.2 File Naming Convention

**Pattern:** `v2/{type}/{user_id}/{instance_id}.pdf`

**Example:** `v2/sale/abc123-user-id/def456-instance-id.pdf`

**Rationale:**
- `v2/` prefix separates from legacy rent folder
- `{type}/` enables type-specific queries if needed
- `{user_id}/` supports RLS-based access control
- `{instance_id}.pdf` ensures uniqueness, enables easy lookup

---

## 4. PDF Generation Library

### 4.1 Library Choice: jsPDF + html2canvas

**Decision:** Use `jsPDF` with `html2canvas` for client-side PDF generation.

**Rationale:**
| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| jsPDF | Client-side, no server needed, already in bundle | Limited styling | **Selected** |
| React-PDF | React-native approach | Complex for simple contracts | Rejected |
| Puppeteer | Pixel-perfect | Requires server/edge function | Rejected |
| html2pdf.js | Simple API | Wrapper around jsPDF anyway | Use jsPDF directly |

**Dependencies:** Already installed (`jsPDF` is used by existing Rent module).

### 4.2 PDF Template Strategy

Each contract type has a **template function** that returns structured content for jsPDF.

**Template Interface:**
```typescript
interface PdfTemplateSection {
  type: 'title' | 'heading' | 'paragraph' | 'table' | 'signature' | 'spacer';
  content?: string;
  data?: Record<string, string>[];
  options?: {
    fontSize?: number;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
  };
}

interface PdfTemplate {
  metadata: {
    title: string;
    author: string;
    subject: string;
  };
  sections: PdfTemplateSection[];
}

type TemplateGenerator<T> = (formData: T, instanceId: string) => PdfTemplate;
```

---

## 5. Service Implementation

### 5.1 Service File Structure

**File:** `src/services/contractPdfEngine.service.ts`

```
contractPdfEngine.service.ts
├── Types & Interfaces
├── Template Registry
├── PDF Generation (private)
├── Storage Operations (private)
└── Public API
```

### 5.2 Type Definitions

```typescript
// ============================================================================
// Types
// ============================================================================

export type V2ContractType = 'sale' | 'commission' | 'showing';

export interface PdfGenerationResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export interface PdfUploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

export interface PdfDownloadResult {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

export interface GenerateAndSaveResult {
  success: boolean;
  storagePath?: string;
  downloadTriggered: boolean;
  error?: string;
}
```

### 5.3 Template Registry

```typescript
// ============================================================================
// Template Registry
// ============================================================================

import { generateSalePdfTemplate } from '@/templates/salePdf.template';
// Future: import { generateCommissionPdfTemplate } from '@/templates/commissionPdf.template';
// Future: import { generateShowingPdfTemplate } from '@/templates/showingPdf.template';

const templateRegistry: Record<V2ContractType, TemplateGenerator<any>> = {
  sale: generateSalePdfTemplate,
  commission: () => { throw new Error('Commission template not implemented'); },
  showing: () => { throw new Error('Showing template not implemented'); },
};
```

### 5.4 Public API Methods

```typescript
class ContractPdfEngineService {
  /**
   * Generate PDF blob from contract instance data
   */
  async generatePdf(
    type: V2ContractType,
    formData: Record<string, unknown>,
    instanceId: string
  ): Promise<PdfGenerationResult>;

  /**
   * Upload PDF blob to Supabase Storage
   */
  async uploadPdf(
    blob: Blob,
    type: V2ContractType,
    userId: string,
    instanceId: string
  ): Promise<PdfUploadResult>;

  /**
   * Get signed download URL for existing PDF
   */
  async getDownloadUrl(
    storagePath: string
  ): Promise<PdfDownloadResult>;

  /**
   * Delete PDF from storage
   */
  async deletePdf(
    storagePath: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Full pipeline: generate + upload + update DB + trigger download
   */
  async generateAndSave(
    type: V2ContractType,
    formData: Record<string, unknown>,
    instanceId: string,
    userId: string,
    triggerDownload: boolean
  ): Promise<GenerateAndSaveResult>;
}

export const contractPdfEngineService = new ContractPdfEngineService();
```

### 5.5 Implementation Details

#### generatePdf()
```typescript
async generatePdf(
  type: V2ContractType,
  formData: Record<string, unknown>,
  instanceId: string
): Promise<PdfGenerationResult> {
  try {
    // 1. Get template generator for type
    const templateGenerator = templateRegistry[type];
    if (!templateGenerator) {
      return { success: false, error: `No template for type: ${type}` };
    }

    // 2. Generate template structure
    const template = templateGenerator(formData, instanceId);

    // 3. Create jsPDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 4. Set metadata
    doc.setProperties({
      title: template.metadata.title,
      author: template.metadata.author,
      subject: template.metadata.subject,
    });

    // 5. Render sections
    let yPosition = 20;
    for (const section of template.sections) {
      yPosition = this.renderSection(doc, section, yPosition);
    }

    // 6. Output as blob
    const blob = doc.output('blob');

    return { success: true, blob };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF generation failed'
    };
  }
}
```

#### uploadPdf()
```typescript
async uploadPdf(
  blob: Blob,
  type: V2ContractType,
  userId: string,
  instanceId: string
): Promise<PdfUploadResult> {
  try {
    const storagePath = `v2/${type}/${userId}/${instanceId}.pdf`;

    const { error } = await supabase.storage
      .from('contract-pdfs')
      .upload(storagePath, blob, {
        contentType: 'application/pdf',
        upsert: true, // Replace if exists (for regeneration)
      });

    if (error) throw error;

    return { success: true, storagePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
```

#### getDownloadUrl()
```typescript
async getDownloadUrl(storagePath: string): Promise<PdfDownloadResult> {
  try {
    const { data, error } = await supabase.storage
      .from('contract-pdfs')
      .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry

    if (error) throw error;

    return { success: true, signedUrl: data.signedUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get download URL',
    };
  }
}
```

#### generateAndSave() - Full Pipeline
```typescript
async generateAndSave(
  type: V2ContractType,
  formData: Record<string, unknown>,
  instanceId: string,
  userId: string,
  triggerDownload: boolean = true
): Promise<GenerateAndSaveResult> {
  // Step 1: Generate PDF
  const genResult = await this.generatePdf(type, formData, instanceId);
  if (!genResult.success || !genResult.blob) {
    return { success: false, downloadTriggered: false, error: genResult.error };
  }

  // Step 2: Upload to storage
  const uploadResult = await this.uploadPdf(genResult.blob, type, userId, instanceId);
  if (!uploadResult.success) {
    // Storage failed - still trigger download so user has the PDF
    if (triggerDownload) {
      this.triggerBrowserDownload(genResult.blob, `${type}_contract_${instanceId.slice(0, 8)}.pdf`);
    }
    return {
      success: false,
      downloadTriggered: triggerDownload,
      error: `Upload failed: ${uploadResult.error}. PDF downloaded locally.`
    };
  }

  // Step 3: Update database with pdf_path
  await contractBuilderService.updateInstance(instanceId, {
    pdf_path: uploadResult.storagePath,
  });

  // Step 4: Trigger browser download
  let downloadTriggered = false;
  if (triggerDownload) {
    this.triggerBrowserDownload(genResult.blob, `${type}_contract_${instanceId.slice(0, 8)}.pdf`);
    downloadTriggered = true;
  }

  return {
    success: true,
    storagePath: uploadResult.storagePath,
    downloadTriggered,
  };
}

private triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

---

## 6. PDF Template Implementation

### 6.1 Sale Contract Template

**File:** `src/templates/salePdf.template.ts`

```typescript
import type { SaleContractFormData } from '@/features/contractsSale/schemas/saleContractForm.schema';
import type { PdfTemplate, TemplateGenerator } from '@/services/contractPdfEngine.service';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const generateSalePdfTemplate: TemplateGenerator<SaleContractFormData> = (
  formData,
  instanceId
): PdfTemplate => {
  const contractDate = format(new Date(), 'dd MMMM yyyy', { locale: tr });
  const contractNumber = instanceId.slice(0, 8).toUpperCase();

  return {
    metadata: {
      title: `Satis Sozlesmesi - ${contractNumber}`,
      author: 'EmlakCRM',
      subject: 'Gayrimenkul Satis Sozlesmesi',
    },
    sections: [
      {
        type: 'title',
        content: 'GAYRIMENKUL SATIS SOZLESMESI',
        options: { fontSize: 18, bold: true, align: 'center' },
      },
      {
        type: 'paragraph',
        content: `Sozlesme No: ${contractNumber}`,
        options: { align: 'right' },
      },
      {
        type: 'paragraph',
        content: `Tarih: ${contractDate}`,
        options: { align: 'right' },
      },
      { type: 'spacer' },

      // Seller Section
      {
        type: 'heading',
        content: 'SATICI BILGILERI',
        options: { fontSize: 12, bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'Ad Soyad', value: formData.seller_name },
          { label: 'TC Kimlik No', value: formData.seller_tc },
          { label: 'Telefon', value: formData.seller_phone },
          { label: 'E-posta', value: formData.seller_email || '-' },
          { label: 'Adres', value: formData.seller_address },
        ],
      },
      { type: 'spacer' },

      // Buyer Section
      {
        type: 'heading',
        content: 'ALICI BILGILERI',
        options: { fontSize: 12, bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'Ad Soyad', value: formData.buyer_name },
          { label: 'TC Kimlik No', value: formData.buyer_tc },
          { label: 'Telefon', value: formData.buyer_phone },
          { label: 'E-posta', value: formData.buyer_email || '-' },
          { label: 'Adres', value: formData.buyer_address },
        ],
      },
      { type: 'spacer' },

      // Property Section
      {
        type: 'heading',
        content: 'TASINMAZ BILGILERI',
        options: { fontSize: 12, bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'Adres', value: formData.property_address },
          { label: 'Tapu No', value: formData.title_deed_no || '-' },
          { label: 'Ada/Parsel', value: formData.parcel_info || '-' },
          { label: 'Alan', value: formData.square_meters ? `${formData.square_meters} m²` : '-' },
        ],
      },
      { type: 'spacer' },

      // Sale Terms Section
      {
        type: 'heading',
        content: 'SATIS SARTLARI',
        options: { fontSize: 12, bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'Satis Bedeli', value: `${Number(formData.sale_price).toLocaleString('tr-TR')} ${formData.currency}` },
          { label: 'Odeme Yontemi', value: getPaymentMethodLabel(formData.payment_method) },
          { label: 'Kapora', value: formData.deposit_amount ? `${Number(formData.deposit_amount).toLocaleString('tr-TR')} ${formData.currency}` : '-' },
          { label: 'Tapu Devir Tarihi', value: formData.closing_date || '-' },
        ],
      },
      { type: 'spacer' },

      // Special Conditions
      ...(formData.special_conditions ? [
        {
          type: 'heading' as const,
          content: 'OZEL SARTLAR',
          options: { fontSize: 12, bold: true },
        },
        {
          type: 'paragraph' as const,
          content: formData.special_conditions,
        },
        { type: 'spacer' as const },
      ] : []),

      // Signatures
      {
        type: 'signature',
        data: [
          { role: 'SATICI', name: formData.seller_name },
          { role: 'ALICI', name: formData.buyer_name },
        ],
      },
    ],
  };
};

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Nakit',
    bank_transfer: 'Havale/EFT',
    installment: 'Taksit',
    mortgage: 'Kredi',
  };
  return labels[method] || method;
}
```

---

## 7. UI Hook Implementation

### 7.1 Hook File

**File:** `src/features/contractsSale/hooks/useSaleContractPdf.ts`

```typescript
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { contractPdfEngineService } from '@/services/contractPdfEngine.service';
import { contractBuilderService } from '@/services/contractBuilder.service';
import type { ContractInstanceV2 } from '@/types/contractBuilder.types';

interface UseSaleContractPdfReturn {
  isGenerating: boolean;
  isDownloading: boolean;
  generatePdf: (instance: ContractInstanceV2) => Promise<boolean>;
  downloadPdf: (instance: ContractInstanceV2) => Promise<void>;
  regeneratePdf: (instance: ContractInstanceV2) => Promise<boolean>;
}

export function useSaleContractPdf(): UseSaleContractPdfReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useTranslation('contractsSale');

  const generatePdf = useCallback(async (instance: ContractInstanceV2): Promise<boolean> => {
    setIsGenerating(true);
    toast.info(t('pdf.generating'));

    try {
      const result = await contractPdfEngineService.generateAndSave(
        'sale',
        instance.form_data,
        instance.id,
        instance.user_id,
        true // trigger download
      );

      if (result.success) {
        toast.success(t('pdf.generated'));
        return true;
      } else {
        toast.error(t('pdf.generateFailed'), { description: result.error });
        return false;
      }
    } catch (error) {
      toast.error(t('pdf.generateFailed'));
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [t]);

  const downloadPdf = useCallback(async (instance: ContractInstanceV2): Promise<void> => {
    if (!instance.pdf_path) {
      toast.error(t('pdf.notFound'));
      return;
    }

    setIsDownloading(true);

    try {
      const result = await contractPdfEngineService.getDownloadUrl(instance.pdf_path);

      if (result.success && result.signedUrl) {
        window.open(result.signedUrl, '_blank');
        toast.success(t('pdf.downloading'));
      } else {
        toast.error(t('pdf.downloadFailed'), { description: result.error });
      }
    } catch (error) {
      toast.error(t('pdf.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  }, [t]);

  const regeneratePdf = useCallback(async (instance: ContractInstanceV2): Promise<boolean> => {
    // Same as generate, but user explicitly requested regeneration
    toast.info(t('pdf.regenerating'));
    return generatePdf(instance);
  }, [generatePdf, t]);

  return {
    isGenerating,
    isDownloading,
    generatePdf,
    downloadPdf,
    regeneratePdf,
  };
}
```

---

## 8. UI Integration Points

### 8.1 SaleContractsList.tsx - PDF Action Buttons

Add to each contract card's action area:

```typescript
// Import
import { useSaleContractPdf } from './hooks/useSaleContractPdf';
import { FileDown, RefreshCw, Loader2 } from 'lucide-react';

// In component
const { isGenerating, isDownloading, downloadPdf, regeneratePdf } = useSaleContractPdf();

// In card actions
<div className="flex gap-1">
  {instance.pdf_path ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => { e.stopPropagation(); downloadPdf(instance); }}
      disabled={isDownloading}
      title={t('pdf.download')}
    >
      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => { e.stopPropagation(); regeneratePdf(instance); }}
      disabled={isGenerating}
      title={t('pdf.generate')}
    >
      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
    </Button>
  )}
  {/* Existing edit/delete buttons */}
</div>
```

### 8.2 SaleContractBuilder.tsx - Auto-Generate on Save

Modify `handleSave` function:

```typescript
const handleSave = useCallback(async (status: 'draft' | 'final') => {
  try {
    setSaving(true);
    const values = form.getValues();

    // Create contract instance
    const instance = await contractBuilderService.createInstance({
      type: 'sale',
      form_data: values,
      rendered_content: renderedContent,
      title: values.title || t('builder.defaultTitle', { address: values.property_address }),
      status,
      parties: { /* ... */ },
    });

    // Generate PDF only for 'final' status
    if (status === 'final') {
      toast.info(t('pdf.generating'));

      const pdfResult = await contractPdfEngineService.generateAndSave(
        'sale',
        values,
        instance.id,
        instance.user_id,
        true // trigger download
      );

      if (pdfResult.success) {
        toast.success(t('toasts.builder.savedFinalWithPdf'));
      } else {
        toast.warning(t('toasts.builder.savedFinalNoPdf'), {
          description: pdfResult.error
        });
      }
    } else {
      toast.success(t('toasts.builder.savedDraft'));
    }

    navigate(ROUTES.CONTRACTS_SALE);
  } catch (error) {
    toast.error(t('toasts.builder.saveFailed'));
  } finally {
    setSaving(false);
  }
}, [/* deps */]);
```

---

## 9. Error Handling Strategy

### 9.1 Error Categories

| Category | Handling | User Message |
|----------|----------|--------------|
| Template not found | Throw, don't generate | "PDF template not available for this contract type" |
| Generation failed | Return error result | "PDF generation failed. Please try again." |
| Upload failed | Download locally, warn | "Could not save to cloud. PDF downloaded to your device." |
| Download URL failed | Show error | "Could not download PDF. Please try again." |
| DB update failed | Log, continue | Silent (PDF exists even if path not saved) |

### 9.2 Retry Logic

No automatic retries. User-initiated retry via "Regenerate PDF" button.

---

## 10. i18n Keys Required

**File:** `public/locales/tr/contractsSale.json` (additions)

```json
{
  "pdf": {
    "generating": "PDF olusturuluyor...",
    "generated": "PDF olusturuldu ve indirildi",
    "generateFailed": "PDF olusturulamadi",
    "regenerating": "PDF yeniden olusturuluyor...",
    "downloading": "PDF indiriliyor...",
    "downloadFailed": "PDF indirilemedi",
    "notFound": "Bu sozlesme icin PDF bulunamadi",
    "download": "PDF Indir",
    "generate": "PDF Olustur"
  },
  "toasts": {
    "builder": {
      "savedFinalWithPdf": "Sozlesme kaydedildi ve PDF olusturuldu",
      "savedFinalNoPdf": "Sozlesme kaydedildi ancak PDF olusturulamadi"
    }
  }
}
```

---

## 11. Implementation Checklist

### Phase 1: Foundation
- [ ] Create migration: add `pdf_path` column
- [ ] Update `ContractInstanceV2` type with `pdf_path`
- [ ] Create `src/services/contractPdfEngine.service.ts` (skeleton)
- [ ] Add i18n keys

### Phase 2: PDF Engine
- [ ] Implement `generatePdf()` method
- [ ] Implement `uploadPdf()` method
- [ ] Implement `getDownloadUrl()` method
- [ ] Implement `deletePdf()` method
- [ ] Implement `generateAndSave()` pipeline

### Phase 3: Templates
- [ ] Create `src/templates/salePdf.template.ts`
- [ ] Implement jsPDF section renderer
- [ ] Test PDF output quality

### Phase 4: UI Integration
- [ ] Create `useSaleContractPdf` hook
- [ ] Add PDF buttons to `SaleContractsList.tsx`
- [ ] Add auto-generate to `SaleContractBuilder.tsx`
- [ ] Add regenerate option to `SaleContractEdit.tsx`

### Phase 5: Testing
- [ ] Test generate flow (new contract)
- [ ] Test download flow (existing contract)
- [ ] Test regenerate flow
- [ ] Test error scenarios (storage failure, etc.)
- [ ] Verify Rent Contracts unaffected

---

## 12. File Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/[ts]_add_pdf_path.sql` | Create | Add pdf_path column |
| `src/types/contractBuilder.types.ts` | Modify | Add pdf_path to types |
| `src/services/contractPdfEngine.service.ts` | Create | PDF generation service |
| `src/templates/salePdf.template.ts` | Create | Sale contract PDF template |
| `src/features/contractsSale/hooks/useSaleContractPdf.ts` | Create | UI hook for PDF actions |
| `src/features/contractsSale/SaleContractsList.tsx` | Modify | Add PDF buttons |
| `src/features/contractsSale/SaleContractBuilder.tsx` | Modify | Add auto-generate |
| `public/locales/tr/contractsSale.json` | Modify | Add i18n keys |
| `public/locales/en/contractsSale.json` | Modify | Add i18n keys |

---

*End of Implementation Specification*
