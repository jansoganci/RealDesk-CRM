# Legacy Contract Import Feature - UX & Implementation Plan

## Executive Summary

**User Persona**: 50-year-old real estate agent named "Ayşe Hanım"
- Has 200 paper contracts from last 5 years
- Not comfortable with computers
- Gets overwhelmed by multi-step processes
- Just wants: "Upload PDF → Magic happens → Done"

**Key Insight**: Don't make users think. One screen, clear progress, obvious next action.

---

## 1. UX Recommendation

### ✅ Recommended Approach: **Dedicated Import Page with Inline Wizard**

**Why**:
- ✅ Separate from regular contract creation (no confusion)
- ✅ Can focus 100% on import UX
- ✅ Clear mental model: "This is the import tool"
- ✅ Can show progress without cluttering main UI

**Location**: `/contracts/import`

**Sidebar Item**:
```
📁 Sözleşmeler (Contracts)
  ├─ Tüm Sözleşmeler (All Contracts)
  ├─ Yeni Sözleşme (New Contract)
  └─ 📥 Eski Sözleşmeleri Aktar (Import Legacy) ← NEW
```

---

## 2. UX Flow Design

### The "3-Click Rule" Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Upload (Single Screen)                                 │
│                                                                  │
│  [Huge Dropzone Area - 80% of screen]                          │
│  "Sözleşme PDF'ini buraya sürükleyin veya tıklayın"            │
│  📄 Drag & drop visual                                          │
│                                                                  │
│  OR                                                              │
│                                                                  │
│  [Browse Computer Button - Big & Obvious]                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
          ↓ (Automatic - no button needed)
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Extracting (Automatic Progress)                        │
│                                                                  │
│  [Big Spinner Animation]                                        │
│  "PDF okunuyor..." (5 seconds)                                  │
│  Progress bar: 33% → 66% → 100%                                │
│                                                                  │
│  Visual:                                                         │
│  📄 → 🔍 → ✅ (PDF → Scanning → Done)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
          ↓ (Automatic - data extracted)
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Review & Confirm (Inline Form)                         │
│                                                                  │
│  ✅ Başarıyla çıkarıldı! (Success banner)                       │
│                                                                  │
│  [Side-by-Side Layout]                                          │
│  ┌────────────────┬──────────────────────────────────────┐    │
│  │ PDF Preview    │ Extracted Data (Editable Form)       │    │
│  │ (Thumbnail)    │                                        │    │
│  │                │ Ev Sahibi: [Mehmet Yılmaz] ✏️        │    │
│  │ [Page 1]       │ Kiracı: [Ali Veli] ✏️                │    │
│  │                │ Kira: [15,000 TL] ✏️                 │    │
│  │                │ ...                                    │    │
│  └────────────────┴──────────────────────────────────────┘    │
│                                                                  │
│  [HUGE GREEN BUTTON - Full Width]                              │
│  "✅ Onayla ve Kaydet" (Confirm & Save)                        │
│                                                                  │
│  [Small Gray Button]                                            │
│  "İptal" (Cancel)                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
          ↓ (User clicks confirm)
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Success (Confirmation Screen)                          │
│                                                                  │
│  [Big Checkmark Animation] ✅                                  │
│                                                                  │
│  "Sözleşme başarıyla kaydedildi!"                               │
│                                                                  │
│  [Summary Card]                                                 │
│  ✓ Ev sahibi: Mehmet Yılmaz (Yeni oluşturuldu)                │
│  ✓ Kiracı: Ali Veli (Yeni oluşturuldu)                        │
│  ✓ Mülk: Merkez Mah. Atatürk Cad. No:5 (Yeni)                 │
│  ✓ PDF kaydedildi ✅                                            │
│                                                                  │
│  [Start Over Button]                                            │
│  "Başka Sözleşme Aktar"                                        │
│                                                                  │
│  [View Contract Button]                                         │
│  "Sözleşmeyi Görüntüle"                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key UX Principles

1. **No Tabs, No Wizards** - Single scrollable page, everything visible
2. **Automatic Progression** - User doesn't click "Next", system auto-advances
3. **Big Visual Feedback** - Emojis, icons, colors (green = good, red = error)
4. **Inline Editing** - Don't hide data in modals, show it directly
5. **One Primary Action** - Only ONE big green button per screen

---

## 3. Detailed User Journey

### Persona: Ayşe Hanım (50, Real Estate Agent, Not Tech-Savvy)

#### Monday Morning: 9:00 AM
**Goal**: Import 5 contracts from last month

**Journey**:

```
1. Opens CRM → Sees "Sözleşmeler" (Contracts)
2. Clicks "Eski Sözleşmeleri Aktar" (Import Legacy)
3. Lands on import page

   Screen shows:
   ┌────────────────────────────────────────┐
   │ 📥 Eski Sözleşme Aktarma                │
   │                                         │
   │ [Huge Dropzone - Takes 60% of screen] │
   │                                         │
   │ 📄 PDF dosyanızı buraya sürükleyin     │
   │    veya tıklayarak seçin               │
   │                                         │
   │ [Bilgisayardan Seç Button - Big]      │
   └────────────────────────────────────────┘

4. Ayşe doesn't understand "sürükle" (drag)
   → She clicks the big button ✅

5. File picker opens → She selects "Sozlesme_01.pdf"

6. Screen automatically changes (no "Next" button):
   ┌────────────────────────────────────────┐
   │ 📄 → 🔍 Okunuyor...                    │
   │                                         │
   │ [Big Spinner]                          │
   │ [Progress Bar: ████░░░░░░ 40%]        │
   │                                         │
   │ PDF dosyanız okunuyor, lütfen bekleyin │
   └────────────────────────────────────────┘

7. After 5 seconds, screen updates:
   ┌────────────────────────────────────────┐
   │ ✅ Başarıyla okundu!                   │
   │                                         │
   │ [Left: PDF thumbnail]  [Right: Form]   │
   │                                         │
   │ Ev Sahibi: [Ahmet Yılmaz] ✏️          │
   │ TC No: [12345678901] ✏️               │
   │ Telefon: [0555 123 4567] ✏️           │
   │                                         │
   │ Kiracı: [Mehmet Demir] ✏️              │
   │ ...                                     │
   │                                         │
   │ [HUGE GREEN BUTTON]                    │
   │ ✅ Onayla ve Kaydet                    │
   └────────────────────────────────────────┘

8. Ayşe sees data looks correct
   → She clicks the big green button ✅

9. Screen shows:
   ┌────────────────────────────────────────┐
   │ [Big Checkmark Animation] ✅           │
   │                                         │
   │ Tebrikler! Sözleşme kaydedildi.        │
   │                                         │
   │ Ne oluşturuldu:                         │
   │ ✓ Ev sahibi: Ahmet Yılmaz              │
   │ ✓ Kiracı: Mehmet Demir                 │
   │ ✓ Mülk: Merkez Mah...                  │
   │                                         │
   │ [Başka Sözleşme Aktar] [Görüntüle]    │
   └────────────────────────────────────────┘

10. Ayşe clicks "Başka Sözleşme Aktar"
    → Back to step 3 (upload screen)

11. Repeats for remaining 4 contracts
```

**Total Time**: ~2 minutes per contract = 10 minutes for 5 contracts

**Confusion Points**: NONE - Every screen has one obvious action

---

## 4. Component Structure

### High-Level Architecture

```
/contracts/import  (New Route)
    ↓
ContractImportPage.tsx (Main Container)
    ↓
┌─────────────────────────────────────────────────┐
│ State Management (One Component)                │
├─────────────────────────────────────────────────┤
│ - currentStep: 'upload' | 'extracting' | 'review' | 'success' │
│ - uploadedFile: File | null                     │
│ - extractedText: string                          │
│ - parsedData: ContractParsedData                │
│ - validationErrors: string[]                     │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ Conditional Rendering (Based on currentStep)    │
├─────────────────────────────────────────────────┤
│ if (step === 'upload')      → <UploadStep />    │
│ if (step === 'extracting')  → <ExtractingStep />│
│ if (step === 'review')      → <ReviewStep />    │
│ if (step === 'success')     → <SuccessStep />   │
└─────────────────────────────────────────────────┘
```

### Component Breakdown

```
src/features/contracts/import/
├── ContractImportPage.tsx          # Main page component
├── components/
│   ├── UploadStep.tsx              # Step 1: File upload (dropzone + button)
│   ├── ExtractingStep.tsx          # Step 2: Progress animation
│   ├── ReviewStep.tsx              # Step 3: Review extracted data
│   │   ├── PDFPreview.tsx          # Left side: PDF thumbnail
│   │   └── ExtractedDataForm.tsx   # Right side: Editable form
│   ├── SuccessStep.tsx             # Step 4: Success confirmation
│   └── ErrorBoundary.tsx           # Catch OCR/parsing failures
└── hooks/
    └── useContractImport.ts        # Business logic hook
```

---

## 5. Component Details

### 5.1 UploadStep.tsx

**Purpose**: Dead-simple file upload

**UI**:
```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh]">
  {/* Huge Dropzone */}
  <div
    className="border-4 border-dashed border-blue-400 rounded-3xl
                w-full max-w-2xl h-96
                flex flex-col items-center justify-center
                cursor-pointer hover:border-blue-600 hover:bg-blue-50
                transition-all"
    onClick={() => fileInputRef.current?.click()}
    onDragOver={handleDragOver}
    onDrop={handleDrop}
  >
    {/* Big Icon */}
    <FileText className="h-24 w-24 text-blue-400 mb-4" />

    {/* Primary Text */}
    <p className="text-2xl font-semibold text-gray-700 mb-2">
      PDF dosyanızı buraya sürükleyin
    </p>

    {/* Secondary Text */}
    <p className="text-lg text-gray-500 mb-6">
      veya bilgisayarınızdan seçin
    </p>

    {/* Big Button */}
    <Button size="lg" className="h-14 px-8 text-lg">
      <Upload className="mr-2 h-5 w-5" />
      Bilgisayardan Seç
    </Button>
  </div>

  {/* Hidden File Input */}
  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf,.docx"
    onChange={handleFileSelect}
    className="hidden"
  />

  {/* Help Text */}
  <p className="mt-6 text-sm text-gray-500">
    PDF veya Word dosyası yükleyebilirsiniz (Maks 10 MB)
  </p>
</div>
```

**Logic**:
```typescript
const handleFileSelect = async (file: File) => {
  // Validate
  if (!file.name.match(/\.(pdf|docx)$/i)) {
    toast.error('Sadece PDF veya Word dosyası yükleyebilirsiniz');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('Dosya çok büyük (maks 10 MB)');
    return;
  }

  // Auto-advance to extracting step
  setUploadedFile(file);
  setCurrentStep('extracting');

  // Start extraction (automatic)
  await extractText(file);
};
```

---

### 5.2 ExtractingStep.tsx

**Purpose**: Show progress (no user action needed)

**UI**:
```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh]">
  {/* Big Animated Spinner */}
  <Loader2 className="h-32 w-32 text-blue-600 animate-spin mb-6" />

  {/* Status Text */}
  <h2 className="text-3xl font-semibold text-gray-800 mb-2">
    PDF okunuyor...
  </h2>

  {/* Progress Bar */}
  <div className="w-96 h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
    <div
      className="h-full bg-blue-600 transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>

  {/* Progress Percentage */}
  <p className="text-xl text-gray-600">
    {progress}% tamamlandı
  </p>

  {/* Visual Progress Steps */}
  <div className="flex gap-8 mt-8">
    <div className={cn("flex flex-col items-center", progress >= 33 && "opacity-100", "opacity-30")}>
      <FileText className="h-12 w-12 mb-2" />
      <span className="text-sm">PDF Yüklendi</span>
    </div>
    <div className={cn("flex flex-col items-center", progress >= 66 && "opacity-100", "opacity-30")}>
      <Search className="h-12 w-12 mb-2" />
      <span className="text-sm">Metin Çıkarılıyor</span>
    </div>
    <div className={cn("flex flex-col items-center", progress >= 100 && "opacity-100", "opacity-30")}>
      <CheckCircle className="h-12 w-12 mb-2" />
      <span className="text-sm">Hazır</span>
    </div>
  </div>
</div>
```

**Logic**:
```typescript
useEffect(() => {
  if (currentStep === 'extracting') {
    extractAndParse();
  }
}, [currentStep]);

const extractAndParse = async () => {
  try {
    // Progress: 0 → 33% (Uploading)
    setProgress(33);

    // Extract text via Flavius API
    const result = await extractTextFromFileViaProxy(uploadedFile);
    setExtractedText(result.text);

    // Progress: 33 → 66% (Parsing)
    setProgress(66);

    // Parse contract data
    const parsed = parseContractFromText(result.text);
    setParsedData(parsed);

    // Progress: 66 → 100% (Done)
    setProgress(100);

    // Wait 500ms for user to see 100%
    await new Promise(resolve => setTimeout(resolve, 500));

    // Auto-advance to review
    setCurrentStep('review');

  } catch (error) {
    setCurrentStep('upload');
    toast.error('PDF okunamadı. Lütfen başka dosya deneyin.');
  }
};
```

---

### 5.3 ReviewStep.tsx

**Purpose**: Show extracted data, allow edits

**UI Layout**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
  {/* LEFT SIDE: PDF Preview */}
  <div className="space-y-4">
    <h3 className="text-xl font-semibold">📄 Yüklenen PDF</h3>

    {/* PDF Thumbnail */}
    <div className="border rounded-lg p-4 bg-gray-50">
      <img
        src={pdfThumbnailUrl}
        alt="PDF Preview"
        className="w-full rounded shadow-sm"
      />
      <p className="mt-2 text-sm text-gray-600 text-center">
        {uploadedFile.name}
      </p>
    </div>

    {/* Raw Text (Collapsible) */}
    <Accordion>
      <AccordionItem value="raw-text">
        <AccordionTrigger>
          Çıkarılan Metin (Tümünü Göster)
        </AccordionTrigger>
        <AccordionContent>
          <Textarea
            value={extractedText}
            readOnly
            rows={10}
            className="font-mono text-xs"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>

  {/* RIGHT SIDE: Extracted Data Form */}
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <CheckCircle className="h-6 w-6 text-green-600" />
      <h3 className="text-xl font-semibold">✅ Çıkarılan Bilgiler</h3>
    </div>

    {/* Owner Section */}
    <Card>
      <CardHeader>
        <CardTitle>🏠 Ev Sahibi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>İsim *</Label>
          <Input
            value={formData.owner_name}
            onChange={(e) => updateField('owner_name', e.target.value)}
            className={cn(!formData.owner_name && "border-red-500")}
          />
          {!formData.owner_name && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ Bu alan boş kalamaz
            </p>
          )}
        </div>

        <div>
          <Label>TC Kimlik No *</Label>
          <Input
            value={formData.owner_tc}
            onChange={(e) => updateField('owner_tc', e.target.value)}
            maxLength={11}
            placeholder="12345678901"
          />
        </div>

        <div>
          <Label>Telefon</Label>
          <Input
            value={formData.owner_phone}
            onChange={(e) => updateField('owner_phone', e.target.value)}
            placeholder="0555 123 4567"
          />
        </div>
      </CardContent>
    </Card>

    {/* Tenant Section */}
    <Card>
      <CardHeader>
        <CardTitle>👤 Kiracı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Similar fields */}
      </CardContent>
    </Card>

    {/* Property Section */}
    <Card>
      <CardHeader>
        <CardTitle>🏘️ Mülk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address fields */}
      </CardContent>
    </Card>

    {/* Contract Section */}
    <Card>
      <CardHeader>
        <CardTitle>📋 Sözleşme Detayları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Başlangıç Tarihi *</Label>
            <Input type="date" value={formData.start_date} />
          </div>
          <div>
            <Label>Bitiş Tarihi *</Label>
            <Input type="date" value={formData.end_date} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Kira Bedeli (₺) *</Label>
            <Input
              type="number"
              value={formData.rent_amount}
              className={cn(!formData.rent_amount && "border-red-500")}
            />
          </div>
          <div>
            <Label>Depozito (₺)</Label>
            <Input type="number" value={formData.deposit} />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Big Submit Button */}
    <Button
      size="lg"
      className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      onClick={handleSubmit}
      disabled={!isFormValid}
    >
      <CheckCircle className="mr-2 h-5 w-5" />
      ✅ Onayla ve Kaydet
    </Button>

    {/* Cancel Button */}
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setCurrentStep('upload')}
    >
      İptal
    </Button>
  </div>
</div>
```

**Validation Logic**:
```typescript
const requiredFields = [
  'owner_name', 'owner_tc',
  'tenant_name', 'tenant_tc',
  'property_address',
  'start_date', 'end_date', 'rent_amount'
];

const isFormValid = requiredFields.every(field => !!formData[field]);

// Real-time validation
const updateField = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));

  // Clear error when user fixes it
  if (value && validationErrors.includes(field)) {
    setValidationErrors(prev => prev.filter(f => f !== field));
  }
};
```

---

### 5.4 SuccessStep.tsx

**Purpose**: Confirm success, allow next action

**UI**:
```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
  {/* Big Success Animation */}
  <div className="mb-8">
    <CheckCircle className="h-32 w-32 text-green-600 animate-bounce" />
  </div>

  {/* Success Message */}
  <h2 className="text-4xl font-bold text-gray-800 mb-2">
    Tebrikler! 🎉
  </h2>
  <p className="text-xl text-gray-600 mb-8">
    Sözleşme başarıyla kaydedildi
  </p>

  {/* Summary Card */}
  <Card className="w-full max-w-2xl mb-8">
    <CardHeader>
      <CardTitle>📋 Oluşturulan Kayıtlar</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium">Ev Sahibi</p>
          <p className="text-sm text-gray-600">
            {createdData.owner_name}
            {createdData.created_owner && (
              <Badge className="ml-2" variant="outline">Yeni</Badge>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium">Kiracı</p>
          <p className="text-sm text-gray-600">
            {createdData.tenant_name}
            {createdData.created_tenant && (
              <Badge className="ml-2" variant="outline">Yeni</Badge>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium">Mülk</p>
          <p className="text-sm text-gray-600">
            {createdData.property_address}
            {createdData.created_property && (
              <Badge className="ml-2" variant="outline">Yeni</Badge>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium">PDF Dosyası</p>
          <p className="text-sm text-gray-600">Sisteme kaydedildi ✅</p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Action Buttons */}
  <div className="flex gap-4">
    <Button
      size="lg"
      className="h-14 px-8"
      onClick={() => {
        // Reset state
        setCurrentStep('upload');
        setUploadedFile(null);
        setExtractedText('');
        setParsedData(null);
      }}
    >
      <Upload className="mr-2 h-5 w-5" />
      Başka Sözleşme Aktar
    </Button>

    <Button
      size="lg"
      variant="outline"
      className="h-14 px-8"
      onClick={() => navigate(`/contracts`)}
    >
      <Eye className="mr-2 h-5 w-5" />
      Sözleşmeleri Görüntüle
    </Button>
  </div>
</div>
```

---

## 6. Integration Plan

### 6.1 Service Integration

```typescript
// useContractImport.ts
export const useContractImport = () => {
  const [state, setState] = useState({
    step: 'upload',
    file: null,
    text: '',
    parsed: {},
    formData: {},
    loading: false,
    error: null
  });

  // 1. Extract text from PDF
  const extractText = async (file: File) => {
    setState(prev => ({ ...prev, loading: true, step: 'extracting' }));

    try {
      const result = await extractTextFromFileViaProxy(file);
      setState(prev => ({ ...prev, text: result.text }));
      return result.text;
    } catch (error) {
      setState(prev => ({ ...prev, error, step: 'upload' }));
      throw error;
    }
  };

  // 2. Parse contract data
  const parseData = (text: string) => {
    const parsed = parseContractFromText(text);

    // Transform to form format
    const formData = {
      owner_name: parsed.ownerName || '',
      owner_tc: '',
      owner_phone: '',
      tenant_name: parsed.tenantName || '',
      tenant_tc: '',
      tenant_phone: '',
      mahalle: '',
      cadde_sokak: '',
      // ... extract address components
      start_date: parsed.startDate || '',
      end_date: parsed.endDate || '',
      rent_amount: parsed.rentAmount || 0,
      deposit: parsed.deposit || 0
    };

    setState(prev => ({
      ...prev,
      parsed,
      formData,
      step: 'review'
    }));
  };

  // 3. Create contract with entities
  const submitContract = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // Create contract via RPC
      const result = await createContractWithEntities(
        state.formData,
        userId
      );

      // Upload PDF to storage
      await contractsService.uploadContractPdfAndPersist(
        state.file,
        result.contract_id
      );

      setState(prev => ({
        ...prev,
        step: 'success',
        createdData: result
      }));

    } catch (error) {
      toast.error('Sözleşme kaydedilemedi');
      setState(prev => ({ ...prev, loading: false, error }));
    }
  };

  return { state, extractText, parseData, submitContract };
};
```

---

### 6.2 Existing Entity Handling

**Strategy**: Show user what's happening, let them decide

**UI for Existing Entities**:
```tsx
{/* In ReviewStep.tsx */}
{existingOwner && (
  <Alert className="mb-4">
    <Info className="h-4 w-4" />
    <AlertTitle>Mevcut Ev Sahibi Bulundu</AlertTitle>
    <AlertDescription>
      <p className="mb-2">
        <strong>{existingOwner.name}</strong> isimli ev sahibi sistemde mevcut.
      </p>
      <p className="text-sm text-gray-600">
        Bu sözleşme mevcut ev sahibine bağlanacak.
        Telefon ve email bilgileri güncellenecek.
      </p>
    </AlertDescription>
  </Alert>
)}
```

**Logic**:
```typescript
// Check for existing entities AFTER form is filled
const checkExistingEntities = async () => {
  // Check owner by TC hash
  const ownerHash = await hashTC(formData.owner_tc);
  const existingOwner = await checkOwnerExists(ownerHash);

  if (existingOwner) {
    setExistingOwner(existingOwner);
    // Show alert, but don't block submission
  }

  // Similar for tenant, property
};
```

---

## 7. Edge Case Handling

### 7.1 Partial Extraction (Missing Fields)

**Scenario**: OCR found owner but not tenant

**UI**:
```tsx
{/* Show warning for empty required fields */}
{!formData.tenant_name && (
  <Alert variant="destructive" className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Kiracı İsmi Bulunamadı</AlertTitle>
    <AlertDescription>
      PDF'den kiracı ismi çıkarılamadı. Lütfen manuel olarak girin.
    </AlertDescription>
  </Alert>
)}
```

**Logic**: Allow submission, but show warnings for empty required fields

---

### 7.2 OCR Failure (Can't Extract Anything)

**Scenario**: Scanned PDF with poor quality

**UI**:
```tsx
{/* In ExtractingStep.tsx */}
{ocrFailed && (
  <div className="text-center">
    <XCircle className="h-24 w-24 text-red-500 mx-auto mb-4" />
    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
      PDF Okunamadı
    </h3>
    <p className="text-gray-600 mb-6">
      Bu PDF'den metin çıkarılamadı. Dosya taranmış veya düşük kalitede olabilir.
    </p>

    <div className="flex gap-4 justify-center">
      <Button onClick={() => setCurrentStep('upload')}>
        Başka Dosya Dene
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          // Go to manual form
          setCurrentStep('review');
          setFormData(emptyFormData);
        }}
      >
        Manuel Gir
      </Button>
    </div>
  </div>
)}
```

---

### 7.3 Invalid Data (Wrong Format)

**Scenario**: TC number is 10 digits instead of 11

**UI**: Real-time validation with helpful messages

```tsx
<Input
  value={formData.owner_tc}
  onChange={(e) => {
    const value = e.target.value;
    updateField('owner_tc', value);

    // Validate
    if (value && value.length !== 11) {
      setFieldError('owner_tc', 'TC Kimlik No 11 rakam olmalı');
    } else {
      clearFieldError('owner_tc');
    }
  }}
/>
{fieldErrors.owner_tc && (
  <p className="text-sm text-red-600 mt-1">
    ⚠️ {fieldErrors.owner_tc}
  </p>
)}
```

---

### 7.4 File Too Large

**UI**: Show error immediately

```tsx
const handleFileSelect = (file: File) => {
  if (file.size > 10 * 1024 * 1024) {
    toast.error('Dosya çok büyük', {
      description: `Dosya boyutu: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maksimum: 10 MB.`
    });
    return;
  }
  // ... continue
};
```

---

### 7.5 Network Failure

**UI**: Retry mechanism

```tsx
{networkError && (
  <Alert variant="destructive" className="mb-4">
    <Wifi className="h-4 w-4" />
    <AlertTitle>İnternet Bağlantısı Kesildi</AlertTitle>
    <AlertDescription>
      <p className="mb-4">PDF yüklenirken bağlantı kesildi.</p>
      <Button onClick={retryUpload} size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Tekrar Dene
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

## 8. Bulk Import (Future Enhancement)

### Phase 1: Single File (Current Recommendation)

**Why**: Simpler for non-tech users

### Phase 2: Batch Upload (Future)

**UI Concept**:
```
┌─────────────────────────────────────────┐
│ Toplu Aktarım (Batch Import)           │
│                                         │
│ [Dropzone - Multiple files allowed]   │
│                                         │
│ Yüklenen Dosyalar:                     │
│ ┌───────────────────────────────────┐ │
│ │ ✓ Sozlesme_01.pdf [Process]      │ │
│ │ ✓ Sozlesme_02.pdf [Process]      │ │
│ │ ⏳ Sozlesme_03.pdf [Processing]  │ │
│ │ ❌ Sozlesme_04.pdf [Failed]      │ │
│ └───────────────────────────────────┘ │
│                                         │
│ [Tümünü İşle Button]                   │
└─────────────────────────────────────────┘
```

**Implementation**: Queue system, process one-by-one, show progress

---

## 9. Mobile Responsiveness

### Mobile-First Approach

```tsx
{/* ReviewStep.tsx - Mobile Layout */}
<div className="flex flex-col gap-6 p-4">  {/* Stack vertically on mobile */}

  {/* PDF Preview - Collapsible on mobile */}
  <Accordion type="single" collapsible>
    <AccordionItem value="pdf">
      <AccordionTrigger>
        📄 PDF Önizleme (Göster/Gizle)
      </AccordionTrigger>
      <AccordionContent>
        <img src={pdfThumbnail} alt="PDF" />
      </AccordionContent>
    </AccordionItem>
  </Accordion>

  {/* Form - Always visible */}
  <div className="space-y-4">
    {/* Form fields */}
  </div>
</div>
```

**Touch Targets**: Minimum 44px height for all buttons

---

## 10. Success Metrics

### How to Measure Success

1. **Time to Import**: < 2 minutes per contract
2. **Error Rate**: < 5% require manual correction
3. **Completion Rate**: > 90% finish the flow
4. **User Satisfaction**: "Bu çok kolay!" (This is so easy!)

### Analytics to Track

```typescript
// Track user journey
analytics.track('import_started', { source: 'sidebar' });
analytics.track('file_uploaded', { file_type: 'pdf', file_size: 1.2 });
analytics.track('extraction_completed', { fields_found: 8, fields_missing: 2 });
analytics.track('review_step_shown', { confidence: 0.85 });
analytics.track('manual_edits', { fields_edited: ['tenant_phone'] });
analytics.track('import_completed', { time_taken: 120 });
```

---

## 11. Implementation Phases

### Phase 1: MVP (Week 1) ✅ Priority

**Features**:
- Single file upload (PDF only)
- Basic OCR extraction
- Review & edit form
- Create contract with all entities
- Store PDF

**Scope**: Exactly as described above

**Effort**: 3-4 days

---

### Phase 2: Enhancements (Week 2)

**Features**:
- DOCX support (Word documents)
- Better regex patterns (more PDF formats)
- Field confidence scores (AI prediction)
- Existing entity detection with alerts

**Effort**: 2-3 days

---

### Phase 3: Advanced (Week 3+)

**Features**:
- OpenAI GPT-4 parsing (high accuracy)
- Batch upload (multiple files)
- Template learning (improve over time)
- Export report (summary of imports)

**Effort**: 1 week

---

## 12. Final Recommendation

### ✅ Go With This Approach

**Why**:
1. **Dead Simple UX**: One screen, obvious actions, no confusion
2. **Visual Feedback**: User always knows what's happening
3. **Forgiving**: Mistakes are easy to fix (inline editing)
4. **Fast**: < 2 minutes per contract
5. **Scalable**: Can add bulk import later

### Implementation Order

```
Day 1-2: Build component structure + routing
Day 3: Integrate OCR + parsing
Day 4: Create contract submission flow
Day 5: Polish UI + mobile responsive
Day 6: Testing with real PDFs
Day 7: User testing with Ayşe Hanım 😊
```

---

## 13. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| OCR fails | Show "Manuel Gir" option |
| Wrong data extracted | Allow inline editing before save |
| User gets confused | One big button per screen, clear labels |
| Network timeout | Retry mechanism + offline queue |
| PDF too complex | Fall back to manual entry |
| User makes mistake | Easy to delete and re-import |

---

## 14. User Feedback Loop

### Beta Testing Plan

1. **Week 1**: Internal testing (you + team)
2. **Week 2**: 3 real estate agents (hand-picked, friendly)
3. **Week 3**: 10 agents (pay attention to confusion points)
4. **Week 4**: Full rollout

### What to Ask Users

- "Hangi adımda zorlandınız?" (Where did you struggle?)
- "Bir şey eksik mi?" (Is something missing?)
- "Daha basit olabilir mi?" (Could it be simpler?)

---

## Conclusion

This design prioritizes **simplicity over features**. For Ayşe Hanım (our persona), the goal is:

> "Upload PDF → Review data → Click big green button → Done"

No tabs, no wizards, no confusion. Just a smooth, obvious flow that makes importing 200 contracts feel like a breeze.

**Next Step**: Approve this plan → Start implementation → Ship MVP in 1 week 🚀

---

**Created**: 2025-11-24
**Status**: UX Plan Complete - Ready for Implementation
**Estimated Effort**: 5-7 days for MVP
