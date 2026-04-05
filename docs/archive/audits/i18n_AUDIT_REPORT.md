# i18n Implementation Audit Report
**Date:** February 9, 2026  
**Scope:** Complete EmlakCRM project  
**Total Files Analyzed:** 412 TypeScript/TSX files

---

## Executive Summary

This audit identified **significant hardcoded strings** across the codebase, particularly in:
- PDF generation services (contractPdf.service.ts)
- Text extraction services (textExtraction.service.ts)
- Contract templates and content
- Some UI components with conditional Turkish/English strings

**Overall Assessment:**
- ✅ Most UI components properly use `useTranslation` hook
- ⚠️ Service files and PDF generation contain many hardcoded Turkish strings
- ⚠️ Some components use conditional `isTurkish` checks instead of i18n
- ⚠️ Translation coverage is good but some keys may be missing

---

## Section 1: Hardcoded Strings Found

### 1.1 PDF Generation Service (`src/services/contractPdf.service.ts`)

**Priority: HIGH** - These strings appear in generated PDFs that users receive.

| Line | Hardcoded String | Category | Suggested Key |
|------|-----------------|----------|---------------|
| 56 | `'TÜRK LİRASI'` | Currency label | `contracts.pdf.currency.try` |
| 58 | `'AMERİKAN DOLARI'` | Currency label | `contracts.pdf.currency.usd` |
| 60 | `'EURO'` | Currency label | `contracts.pdf.currency.eur` |
| 79 | `'Müstakil Ev'` | Property type | `contracts.pdf.propertyType.detachedHouse` |
| 83 | `'İşyeri'` | Property type | `contracts.pdf.propertyType.workplace` |
| 91 | `'Dükkan'` | Property type | `contracts.pdf.propertyType.shop` |
| 112 | `'Kira_Sozlesmesi_'` | PDF filename | `contracts.pdf.filename` |
| 221 | `'KİRA SÖZLEŞMESİ'` | PDF header | `contracts.pdf.header` |
| 235 | `'MAHALLESİ/İLÇE/İL'` | PDF field label | `contracts.pdf.fields.location` |
| 236 | `'SOKAĞI/NUMARASI'` | PDF field label | `contracts.pdf.fields.address` |
| 237 | `'KİRALANAN ŞEYİN CİNSİ'` | PDF field label | `contracts.pdf.fields.propertyType` |
| 238 | `'KİRAYA VERENİN ADI SOYADI'` | PDF field label | `contracts.pdf.fields.ownerName` |
| 239 | `'KİRACININ ADI SOYADI'` | PDF field label | `contracts.pdf.fields.tenantName` |
| 240 | `'KİRACININ İKAMETGAHI'` | PDF field label | `contracts.pdf.fields.tenantAddress` |
| 241 | `'KİRACININ TELEFONU'` | PDF field label | `contracts.pdf.fields.tenantPhone` |
| 242 | `'BİR AYLIK KİRA KARŞILIĞI'` | PDF field label | `contracts.pdf.fields.monthlyRent` |
| 243 | `'BİR SENELİK KİRA KARŞILIĞI'` | PDF field label | `contracts.pdf.fields.yearlyRent` |
| 244 | `'KİRANIN NE ŞEKİLDE ÖDENECEĞİ'` | PDF field label | `contracts.pdf.fields.paymentMethod` |
| 245 | `'KİRA MÜDDETİ'` | PDF field label | `contracts.pdf.fields.rentDuration` |
| 246 | `'KİRANIN BAŞLANGICI'` | PDF field label | `contracts.pdf.fields.startDate` |
| 247 | `'DEPOZİTO'` | PDF field label | `contracts.pdf.fields.deposit` |
| 248 | `'KİRALANAN MECURUN NE İÇİN KULLANILACAĞI'` | PDF field label | `contracts.pdf.fields.propertyUsage` |
| 277 | `'TESLİM DURUMU'` | PDF section header | `contracts.pdf.sections.handoverStatus` |
| 292-293 | `'Mülk boyalı şekilde teslim edilmiştir...'` | PDF text | `contracts.pdf.handover.painted` / `contracts.pdf.handover.unpainted` |
| 299 | `'YILLIK ARTIŞ TÜFE...'` | PDF text | `contracts.pdf.annualIncrease` |
| 316 | `'GENEL ŞARTLAR'` | PDF section header | `contracts.pdf.sections.generalTerms` |
| 350 | `'ÖZEL ŞARTLAR'` | PDF section header | `contracts.pdf.sections.specialTerms` |
| 396 | `'TAHLİYE TAAHHÜTNAMESİ'` | PDF section header | `contracts.pdf.sections.evictionCommitment` |
| 409 | `'Taahhüt Edenin Adı Soyadı'` | PDF field label | `contracts.pdf.eviction.commitmentName` |
| 410 | `'Mal Sahibinin Adı Soyadı'` | PDF field label | `contracts.pdf.eviction.ownerName` |
| 411 | `'Tahliye Edilecek Kiralananın Adresi'` | PDF field label | `contracts.pdf.eviction.propertyAddress` |
| 449 | `'İMZA:'` | PDF label | `contracts.pdf.signature` |
| 463 | `'MÜLK TESLİM ÖNCESİ DURUM BELGELERİ'` | PDF section header | `contracts.pdf.sections.preHandoverDocuments` |
| 482 | `'Bu QR kodu akıllı telefonunuzla okutarak...'` | PDF description | `contracts.pdf.qrDescription` |
| 518 | `'KİRACI'` | PDF label | `contracts.pdf.tenant` |
| 522 | `'KİRAYA VEREN'` | PDF label | `contracts.pdf.owner` |

**Total:** ~35 hardcoded strings in PDF service

### 1.2 Text Extraction Service (`src/services/textExtraction.service.ts`)

**Priority: MEDIUM** - Error messages shown to users during file upload.

| Line | Hardcoded String | Category | Suggested Key |
|------|-----------------|----------|---------------|
| 57 | `'Desteklenmeyen dosya tipi. Lütfen PDF veya EPUB dosyası yükleyin.'` | Error message | `errors.fileType.unsupportedPdfEpub` |
| 63 | `'Dosya boyutu çok büyük. Maksimum 100 MB.'` | Error message | `errors.fileSize.exceedsLimit` |
| 82 | `'Bilinmeyen hata'` | Error message | `errors.general.unknown` |
| 89 | `'Metin çıkarma başarısız'` | Error message | `errors.textExtraction.failed` |
| 109 | `'Metin çıkarma sırasında bir hata oluştu'` | Error message | `errors.textExtraction.error` |
| 138 | `'Desteklenmeyen dosya tipi. Lütfen Word dosyası (.docx) yükleyin.'` | Error message | `errors.fileType.unsupportedDocx` |
| 144 | `'Dosya boyutu çok büyük. Maksimum 10 MB.'` | Error message | `errors.fileSize.exceedsLimitDocx` |
| 181 | `'Metin çıkarma başarısız'` | Error message (duplicate) | `errors.textExtraction.failed` |
| 201 | `'Metin çıkarma sırasında bir hata oluştu'` | Error message (duplicate) | `errors.textExtraction.error` |
| 664 | `'Kiracı adı bulunamadı'` | Warning message | `warnings.extraction.tenantNameMissing` |
| 665 | `'Mal sahibi adı bulunamadı'` | Warning message | `warnings.extraction.ownerNameMissing` |
| 666 | `'Kira bedeli bulunamadı'` | Warning message | `warnings.extraction.rentAmountMissing` |
| 667 | `'Başlangıç tarihi bulunamadı'` | Warning message | `warnings.extraction.startDateMissing` |

**Total:** 13 hardcoded strings

### 1.3 Contract PDF Handler (`src/features/contracts/hooks/useContractPdfHandler.ts`)

**Priority: MEDIUM**

| Line | Hardcoded String | Category | Suggested Key |
|------|-----------------|----------|---------------|
| 288 | `'Özel maddeler yüklenemedi'` | Error toast title | `contracts.pdf.errors.loadClausesFailed` |
| 289 | `'PDF oluşturulamadı. Lütfen tekrar deneyin.'` | Error toast description | `contracts.pdf.errors.generationFailed` |

**Total:** 2 hardcoded strings

### 1.4 Reminder Components (`src/features/reminders/components/ReminderTableRow.tsx`)

**Priority: LOW** - Tooltip text

| Line | Hardcoded String | Category | Suggested Key |
|------|-----------------|----------|---------------|
| 207 | `'Gizle'` / `'Göster'` | Button tooltip | `reminders.table.expandToggle` / `reminders.table.collapseToggle` |

**Total:** 2 hardcoded strings

### 1.5 Dashboard Component (`src/features/dashboard/Dashboard.tsx`)

**Priority: MEDIUM** - Uses conditional `isTurkish` instead of i18n

| Line | Hardcoded String | Category | Issue |
|------|-----------------|----------|-------|
| 53-56 | `'Abonelik Aktif!'` / `'Subscription Activated!'` | Toast title | Uses conditional instead of `t()` |
| 55 | `'Aboneliğiniz aktif hale geldi. Hoş geldiniz!'` | Toast description | Uses conditional instead of `t()` |

**Total:** 2 hardcoded strings (should use i18n)

### 1.6 Billing/Pricing Component (`src/features/billing/components/PricingSection.tsx`)

**Priority: MEDIUM** - Uses conditional `isTurkish` instead of i18n

| Line | Hardcoded String | Category | Issue |
|------|-----------------|----------|-------|
| 112 | `'Abonelik işleminiz iptal edildi...'` | Toast message | Uses conditional instead of `t()` |
| 115 | `'Ödeme İptal Edildi'` | Toast description | Uses conditional instead of `t()` |
| 138 | `'Abonelik satın almak için giriş yapmalısınız'` | Error message | Uses conditional instead of `t()` |
| 141 | `'Giriş Gerekli'` | Error description | Uses conditional instead of `t()` |
| 181 | `'Ödeme sayfası açılamadı'` | Error message | Uses conditional instead of `t()` |
| 335 | `'Yükleniyor...'` | Loading text | Uses conditional instead of `t()` |

**Total:** 6 hardcoded strings (should use i18n)

### 1.7 Contract Import Hook (`src/features/contracts/import/hooks/useContractImport.ts`)

**Priority: MEDIUM**

| Line | Hardcoded String | Category | Suggested Key |
|------|-----------------|----------|---------------|
| 50 | `'Dosyadan metin çıkarılamadı. Dosya boş veya okunamaz olabilir.'` | Error message | `errors.textExtraction.fileEmpty` |

**Total:** 1 hardcoded string

### 1.8 Contract Form Schema (`src/features/contracts/schemas/contractForm.schema.ts`)

**Priority: LOW** - Default value

| Line | Hardcoded String | Category | Issue |
|------|-----------------|----------|-------|
| 240 | `'İstanbul'` | Default city | Default value, acceptable |

**Total:** 1 (acceptable as default)

### 1.9 Contract Edit Data Hook (`src/features/contracts/hooks/useContractEditData.ts`)

**Priority: LOW** - Default value

| Line | Hardcoded String | Category | Issue |
|------|-----------------|----------|-------|
| 196 | `'İstanbul'` | Default city | Default value, acceptable |

**Total:** 1 (acceptable as default)

### 1.10 Contract Templates (`src/templates/contractContent.ts`, `src/templates/saleContractContent.ts`, `src/templates/salesContractContent.ts`)

**Priority: HIGH** - Legal contract content

| File | Hardcoded Strings | Category | Issue |
|------|------------------|----------|-------|
| `contractContent.ts` | Multiple Turkish legal clauses | Legal text | Should be translatable |
| `saleContractContent.ts` | Multiple Turkish legal clauses | Legal text | Should be translatable |
| `salesContractContent.ts` | Multiple Turkish legal clauses | Legal text | Should be translatable |

**Note:** These are legal contract templates. May need legal review before translation.

### 1.11 Sale Contract Builder (`src/features/contractsSale/SaleContractBuilder.tsx`)

**Priority: LOW** - Test data and placeholders

| Line | Hardcoded String | Category | Issue |
|------|-----------------|----------|-------|
| 87-104 | Various test data strings | Test data | Acceptable for demo/test |
| 212, 275, 283, 291, 299 | Placeholder texts | Placeholders | Should use i18n |

**Total:** ~5 placeholders should use i18n

### 1.12 Finance Service (`src/services/finance/reportCalculator.ts`, `src/services/commissions.service.ts`)

**Priority: LOW** - Month names

| File | Line | Hardcoded String | Category | Issue |
|------|------|-----------------|----------|-------|
| `reportCalculator.ts` | 181-182 | Turkish month names array | Date formatting | Should use i18n date formatting |
| `commissions.service.ts` | 7-8 | Turkish month names array | Date formatting | Should use i18n date formatting |

**Total:** 2 arrays (should use i18n date formatting)

### 1.13 SEO Component (`src/components/common/SEO.tsx`)

**Priority: LOW** - Meta tags (acceptable)

| Line | Hardcoded String | Category | Issue |
|------|-----------------|----------|-------|
| 29-31 | SEO meta tags | Meta content | Acceptable for SEO |

**Total:** Acceptable

### 1.14 Duplicate Check Service (`src/services/duplicateCheck.service.ts`)

**Priority: LOW** - Comments only

| Line | Hardcoded String | Category | Issue |
|------|-----------------|----------|-------|
| 40, 76, 128 | Turkish comments | Comments | Acceptable |

**Total:** Comments only (acceptable)

---

## Section 2: Translation Coverage Issues

### 2.1 Missing Translation Keys Analysis

**Method:** Comparing `public/locales/tr/` and `public/locales/en/` files

**Translation Files Present:**
- ✅ All 25 namespaces exist in both `tr/` and `en/` directories
- ✅ File structure is consistent

**Potential Issues to Verify:**
1. Empty string values in translation files
2. Keys present in one language but not the other
3. Missing keys for identified hardcoded strings

**Recommendation:** Run automated comparison script to identify exact mismatches.

### 2.2 Empty Translation Values

Need to check for empty strings like:
- `properties.table.noTenant: ""` (found in en/properties.json line 40)

**Action Required:** Review all translation files for empty values.

---

## Section 3: i18n Implementation Issues

### 3.1 Components Using Conditional Strings Instead of i18n

**Issue:** Some components check `i18n.language === 'tr'` and use conditional strings instead of `t()` function.

**Affected Files:**
1. `src/features/dashboard/Dashboard.tsx` (lines 50-56)
2. `src/features/billing/components/PricingSection.tsx` (multiple locations)

**Impact:** These strings won't change when user switches language dynamically.

**Recommendation:** Replace all conditional checks with `t()` calls.

### 3.2 Service Files Not Using i18n

**Issue:** Service files (`contractPdf.service.ts`, `textExtraction.service.ts`) don't have access to React hooks.

**Solution Options:**
1. Pass `t` function as parameter to service functions
2. Use `i18n.t()` directly (already imported in some files)
3. Refactor services to accept language parameter

**Recommendation:** Use `i18n.t()` directly in service files (already imported in `contractPdf.service.ts`).

### 3.3 String Concatenation Issues

**Found:** Some places use template literals with hardcoded strings:
- PDF generation combines translated and hardcoded strings
- Error messages concatenate error details

**Recommendation:** Use i18n interpolation: `t('key', { variable: value })`

### 3.4 Date/Number Formatting

**Issue:** Month names hardcoded in arrays instead of using i18n date formatting.

**Files:**
- `src/services/finance/reportCalculator.ts`
- `src/services/commissions.service.ts`

**Recommendation:** Use `Intl.DateTimeFormat` with locale or i18n date formatting utilities.

---

## Section 4: Statistics

### 4.1 Hardcoded Strings Summary

| Category | Count | Priority |
|----------|-------|----------|
| PDF Generation | ~35 | HIGH |
| Error Messages | ~15 | MEDIUM |
| UI Components (conditional) | ~8 | MEDIUM |
| Placeholders | ~5 | LOW |
| Test/Demo Data | ~5 | LOW |
| Default Values | ~3 | LOW |
| **TOTAL** | **~71** | |

### 4.2 Translation Coverage

- **Total Translation Files:** 25 namespaces × 2 languages = 50 files
- **Files Using i18n:** ~150+ components (estimated from grep results)
- **Components NOT Using i18n:** ~10-15 (service files, some utilities)

### 4.3 Most Affected Directories

1. **`src/services/`** - Highest concentration of hardcoded strings
   - `contractPdf.service.ts`: 35 strings
   - `textExtraction.service.ts`: 13 strings
   
2. **`src/features/billing/`** - Conditional strings instead of i18n
   - `PricingSection.tsx`: 6 strings

3. **`src/features/dashboard/`** - Conditional strings instead of i18n
   - `Dashboard.tsx`: 2 strings

4. **`src/templates/`** - Legal contract templates
   - Multiple files with Turkish legal text

---

## Section 5: Priority Recommendations

### 🔴 HIGH PRIORITY

1. **PDF Generation Service** (`src/services/contractPdf.service.ts`)
   - **Impact:** Generated PDFs contain hardcoded Turkish text
   - **Action:** Add i18n support for all PDF labels, headers, and text
   - **Effort:** Medium (need to pass language context to PDF generation)
   - **Files:** `contractPdf.service.ts`, create `contracts.pdf` namespace

2. **Text Extraction Error Messages** (`src/services/textExtraction.service.ts`)
   - **Impact:** Users see Turkish error messages regardless of language
   - **Action:** Replace all error messages with i18n keys
   - **Effort:** Low (already imports i18n)
   - **Files:** `textExtraction.service.ts`, add to `errors` namespace

3. **Contract PDF Handler Errors** (`src/features/contracts/hooks/useContractPdfHandler.ts`)
   - **Impact:** Error toasts show Turkish text
   - **Action:** Use `t()` function for toast messages
   - **Effort:** Low
   - **Files:** `useContractPdfHandler.ts`

### 🟡 MEDIUM PRIORITY

4. **Dashboard Component** (`src/features/dashboard/Dashboard.tsx`)
   - **Impact:** Subscription success message doesn't translate
   - **Action:** Replace conditional strings with `t()` calls
   - **Effort:** Low
   - **Files:** `Dashboard.tsx`

5. **Billing/Pricing Component** (`src/features/billing/components/PricingSection.tsx`)
   - **Impact:** Payment-related messages don't translate
   - **Action:** Replace all conditional `isTurkish` checks with `t()` calls
   - **Effort:** Low
   - **Files:** `PricingSection.tsx`

6. **Contract Import Hook** (`src/features/contracts/import/hooks/useContractImport.ts`)
   - **Impact:** Error message during file import
   - **Action:** Use i18n for error message
   - **Effort:** Low
   - **Files:** `useContractImport.ts`

### 🟢 LOW PRIORITY

7. **Reminder Table Row** (`src/features/reminders/components/ReminderTableRow.tsx`)
   - **Impact:** Tooltip text doesn't translate
   - **Action:** Use `t()` for tooltip text
   - **Effort:** Very Low
   - **Files:** `ReminderTableRow.tsx`

8. **Sale Contract Builder Placeholders** (`src/features/contractsSale/SaleContractBuilder.tsx`)
   - **Impact:** Form placeholders don't translate
   - **Action:** Use i18n for placeholder texts
   - **Effort:** Low
   - **Files:** `SaleContractBuilder.tsx`

9. **Date Formatting** (`src/services/finance/reportCalculator.ts`, `src/services/commissions.service.ts`)
   - **Impact:** Month names hardcoded in Turkish
   - **Action:** Use i18n date formatting or `Intl.DateTimeFormat`
   - **Effort:** Medium
   - **Files:** Both service files

### ⚪ LEGAL REVIEW REQUIRED

10. **Contract Templates** (`src/templates/*.ts`)
    - **Impact:** Legal contract text is hardcoded in Turkish
    - **Action:** Legal review required before translation
    - **Note:** These are legal documents - translation may require legal approval
    - **Files:** `contractContent.ts`, `saleContractContent.ts`, `salesContractContent.ts`

---

## Section 6: Implementation Guide

### 6.1 For PDF Generation Service

**Current Pattern:**
```typescript
doc.text('KİRA SÖZLEŞMESİ', ...);
```

**Recommended Pattern:**
```typescript
import i18n from '../i18n';
doc.text(i18n.t('contracts.pdf.header'), ...);
```

**Or pass language context:**
```typescript
function generateContractPDF(data: ContractPdfData, language: string = 'tr') {
  const t = (key: string) => i18n.getFixedT(language, 'contracts');
  doc.text(t('pdf.header'), ...);
}
```

### 6.2 For Service Files

**Current Pattern:**
```typescript
throw new Error('Desteklenmeyen dosya tipi...');
```

**Recommended Pattern:**
```typescript
import i18n from '../i18n';
throw new Error(i18n.t('errors.fileType.unsupportedPdfEpub'));
```

### 6.3 For Components with Conditional Strings

**Current Pattern:**
```typescript
const isTurkish = i18n.language === 'tr';
toast({
  title: isTurkish ? 'Abonelik Aktif!' : 'Subscription Activated!',
});
```

**Recommended Pattern:**
```typescript
const { t } = useTranslation('billing');
toast({
  title: t('subscription.activated.title'),
});
```

---

## Section 7: Translation Keys to Add

### 7.1 New Namespace: `contracts.pdf`

```json
{
  "pdf": {
    "header": "KİRA SÖZLEŞMESİ",
    "currency": {
      "try": "TÜRK LİRASI",
      "usd": "AMERİKAN DOLARI",
      "eur": "EURO"
    },
    "fields": {
      "location": "MAHALLESİ/İLÇE/İL",
      "address": "SOKAĞI/NUMARASI",
      "propertyType": "KİRALANAN ŞEYİN CİNSİ",
      "ownerName": "KİRAYA VERENİN ADI SOYADI",
      "tenantName": "KİRACININ ADI SOYADI",
      "tenantAddress": "KİRACININ İKAMETGAHI",
      "tenantPhone": "KİRACININ TELEFONU",
      "monthlyRent": "BİR AYLIK KİRA KARŞILIĞI",
      "yearlyRent": "BİR SENELİK KİRA KARŞILIĞI",
      "paymentMethod": "KİRANIN NE ŞEKİLDE ÖDENECEĞİ",
      "rentDuration": "KİRA MÜDDETİ",
      "startDate": "KİRANIN BAŞLANGICI",
      "deposit": "DEPOZİTO",
      "propertyUsage": "KİRALANAN MECURUN NE İÇİN KULLANILACAĞI"
    },
    "sections": {
      "handoverStatus": "TESLİM DURUMU",
      "generalTerms": "GENEL ŞARTLAR",
      "specialTerms": "ÖZEL ŞARTLAR",
      "evictionCommitment": "TAHLİYE TAAHHÜTNAMESİ",
      "preHandoverDocuments": "MÜLK TESLİM ÖNCESİ DURUM BELGELERİ"
    },
    "handover": {
      "painted": "Mülk boyalı şekilde teslim edilmiştir, aynı durumda teslim alınacaktır.",
      "unpainted": "Mülk boyasız şekilde teslim edilmiştir, aynı durumda teslim alınacaktır."
    },
    "annualIncrease": "YILLIK ARTIŞ TÜFE (Tüketici Fiyat Endeksi) ORANINDA OLACAKTIR",
    "signature": "İMZA:",
    "tenant": "KİRACI",
    "owner": "KİRAYA VEREN",
    "qrDescription": "Bu QR kodu akıllı telefonunuzla okutarak mülkün kiracıya teslim edilmeden önceki durumunu gösteren görsellere ulaşabilirsiniz.",
    "filename": "Kira_Sozlesmesi_",
    "errors": {
      "loadClausesFailed": "Özel maddeler yüklenemedi",
      "generationFailed": "PDF oluşturulamadı. Lütfen tekrar deneyin."
    }
  }
}
```

### 7.2 Update `errors` Namespace

```json
{
  "fileType": {
    "unsupportedPdfEpub": "Desteklenmeyen dosya tipi. Lütfen PDF veya EPUB dosyası yükleyin.",
    "unsupportedDocx": "Desteklenmeyen dosya tipi. Lütfen Word dosyası (.docx) yükleyin."
  },
  "fileSize": {
    "exceedsLimit": "Dosya boyutu çok büyük. Maksimum 100 MB.",
    "exceedsLimitDocx": "Dosya boyutu çok büyük. Maksimum 10 MB."
  },
  "textExtraction": {
    "failed": "Metin çıkarma başarısız",
    "error": "Metin çıkarma sırasında bir hata oluştu",
    "fileEmpty": "Dosyadan metin çıkarılamadı. Dosya boş veya okunamaz olabilir."
  }
}
```

### 7.3 Add `warnings` Namespace (or add to `errors`)

```json
{
  "extraction": {
    "tenantNameMissing": "Kiracı adı bulunamadı",
    "ownerNameMissing": "Mal sahibi adı bulunamadı",
    "rentAmountMissing": "Kira bedeli bulunamadı",
    "startDateMissing": "Başlangıç tarihi bulunamadı"
  }
}
```

### 7.4 Update `billing` Namespace

```json
{
  "subscription": {
    "activated": {
      "title": "Abonelik Aktif!",
      "description": "Aboneliğiniz aktif hale geldi. Hoş geldiniz!"
    },
    "canceled": {
      "title": "Ödeme İptal Edildi",
      "message": "Abonelik işleminiz iptal edildi. Hazır olduğunuzda tekrar deneyebilirsiniz."
    },
    "loginRequired": {
      "title": "Giriş Gerekli",
      "message": "Abonelik satın almak için giriş yapmalısınız"
    },
    "checkoutFailed": "Ödeme sayfası açılamadı",
    "loading": "Yükleniyor..."
  }
}
```

### 7.5 Update `reminders` Namespace

```json
{
  "table": {
    "expandToggle": "Göster",
    "collapseToggle": "Gizle"
  }
}
```

---

## Section 8: Testing Recommendations

1. **Language Switching Test**
   - Switch language and verify all UI elements update
   - Check PDF generation in both languages
   - Verify error messages appear in correct language

2. **PDF Generation Test**
   - Generate contract PDFs in Turkish and English
   - Verify all labels and text are translated
   - Check formatting is correct in both languages

3. **Error Handling Test**
   - Trigger various error conditions
   - Verify error messages appear in user's selected language
   - Check toast notifications are translated

4. **Date Formatting Test**
   - Verify month names appear correctly
   - Check date formats match locale expectations

---

## Conclusion

The EmlakCRM project has **good i18n foundation** with most UI components properly using the translation system. However, there are **~71 hardcoded strings** that need to be migrated, primarily in:

1. **PDF generation service** (highest priority - affects user-facing documents)
2. **Error messages in services** (medium priority - affects user experience)
3. **Components using conditional strings** (medium priority - breaks language switching)

**Estimated Effort:**
- High Priority: 2-3 days
- Medium Priority: 1-2 days  
- Low Priority: 1 day
- **Total: 4-6 days** of focused development

**Next Steps:**
1. Create new translation keys for identified strings
2. Update service files to use i18n
3. Replace conditional strings with `t()` calls
4. Test language switching across all features
5. Consider legal review for contract templates

---

**Report Generated:** February 9, 2026  
**Auditor:** AI Assistant  
**Next Review:** After implementation of high-priority fixes
