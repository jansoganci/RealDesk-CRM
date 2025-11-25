# PDF Metin Çıkarma Entegrasyonu

Bu dokümantasyon, Flavius API'sini kullanarak PDF/EPUB dosyalarından metin çıkarma özelliğinin CRM sistemine nasıl entegre edileceğini açıklar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Entegrasyon Yöntemleri](#entegrasyon-yöntemleri)
3. [Kurulum](#kurulum)
4. [Kullanım](#kullanım)
5. [Örnek Kod](#örnek-kod)

## 🎯 Genel Bakış

Flavius API, PDF ve EPUB dosyalarından metin çıkarma özelliği sunar. Bu özellik, sözleşme PDF'lerinden otomatik olarak bilgi çıkarmak için kullanılabilir.

### Özellikler

- ✅ PDF ve EPUB desteği
- ✅ OCR desteği (taranmış belgeler için)
- ✅ 100 MB'a kadar dosya boyutu
- ✅ Hızlı işleme (genellikle <1 saniye)
- ✅ Token sayısı bilgisi

## 🔧 Entegrasyon Yöntemleri

### Yöntem 1: Supabase Edge Function Proxy (Önerilen) ⭐

**Avantajlar:**
- 🔒 Güvenli (Firebase token'ları backend'de saklanır)
- 🚫 CORS sorunları yok
- ✅ Supabase authentication entegrasyonu
- 🎯 Merkezi yönetim

**Dezavantajlar:**
- ⚙️ Edge Function kurulumu gerekir
- 🔑 Environment variable yönetimi

### Yöntem 2: Direkt API Çağrısı

**Avantajlar:**
- ⚡ Hızlı kurulum
- 📝 Basit implementasyon

**Dezavantajlar:**
- 🔓 Firebase token'ları frontend'de saklanmalı
- 🌐 CORS ayarları gerekebilir
- ⚠️ Güvenlik riski

## 📦 Kurulum

### Yöntem 1: Supabase Edge Function (Önerilen)

#### 1. Edge Function Oluştur

```bash
# Supabase CLI ile function oluştur
supabase functions new extract-text
```

#### 2. Function Kodunu Deploy Et

```bash
# Function'ı deploy et
supabase functions deploy extract-text
```

#### 3. Environment Variables Ayarla

```bash
# Firebase ID Token'ı ayarla
supabase secrets set FLAVIUS_FIREBASE_ID_TOKEN=your_firebase_id_token

# Firebase App Check Token'ı ayarla
supabase secrets set FLAVIUS_APP_CHECK_TOKEN=your_app_check_token
```

**Not:** Firebase token'larınızı Flavius API'den almanız gerekir.

#### 4. Frontend'de Kullan

```typescript
import { extractTextFromFileViaProxy } from '@/lib/serviceProxy';

const handleFileUpload = async (file: File) => {
  try {
    const result = await extractTextFromFileViaProxy(file);
    console.log('Extracted text:', result.text);
    console.log('Token count:', result.token_count);
  } catch (error) {
    console.error('Extraction failed:', error);
  }
};
```

### Yöntem 2: Direkt API Çağrısı

#### 1. Environment Variables Ayarla

`.env` dosyasına ekleyin:

```env
VITE_FLAVIUS_FIREBASE_ID_TOKEN=your_firebase_id_token
VITE_FLAVIUS_APP_CHECK_TOKEN=your_app_check_token
```

#### 2. Frontend'de Kullan

```typescript
import { extractTextFromFile } from '@/lib/serviceProxy';

const handleFileUpload = async (file: File) => {
  const firebaseIdToken = import.meta.env.VITE_FLAVIUS_FIREBASE_ID_TOKEN;
  const appCheckToken = import.meta.env.VITE_FLAVIUS_APP_CHECK_TOKEN;

  try {
    const result = await extractTextFromFile(file, firebaseIdToken, appCheckToken);
    console.log('Extracted text:', result.text);
  } catch (error) {
    console.error('Extraction failed:', error);
  }
};
```

## 💻 Kullanım

### Temel Kullanım

```typescript
import { extractTextFromFileViaProxy, parseContractFromText } from '@/lib/serviceProxy';

// 1. Dosyadan metin çıkar
const result = await extractTextFromFileViaProxy(file);

// 2. Çıkarılan metinden sözleşme bilgilerini parse et
const contractData = parseContractFromText(result.text);

// 3. Formu otomatik doldur
if (contractData.tenantName) {
  form.setValue('tenant_name', contractData.tenantName);
}
if (contractData.ownerName) {
  form.setValue('owner_name', contractData.ownerName);
}
if (contractData.rentAmount) {
  form.setValue('rent_amount', contractData.rentAmount);
}
// ... diğer alanlar
```

### Sözleşme Formuna Entegrasyon

```typescript
import { useState } from 'react';
import { extractTextFromFileViaProxy, parseContractFromText } from '@/lib/serviceProxy';
import { useForm } from 'react-hook-form';

function ContractCreateForm() {
  const [extracting, setExtracting] = useState(false);
  const form = useForm();

  const handlePDFUpload = async (file: File) => {
    setExtracting(true);
    try {
      // Metin çıkar
      const result = await extractTextFromFileViaProxy(file);
      
      // Sözleşme bilgilerini parse et
      const contractData = parseContractFromText(result.text);
      
      // Formu doldur
      if (contractData.tenantName) {
        form.setValue('tenant_name', contractData.tenantName);
      }
      if (contractData.ownerName) {
        form.setValue('owner_name', contractData.ownerName);
      }
      if (contractData.rentAmount) {
        form.setValue('rent_amount', contractData.rentAmount);
      }
      if (contractData.deposit) {
        form.setValue('deposit', contractData.deposit);
      }
      if (contractData.startDate) {
        form.setValue('start_date', new Date(contractData.startDate));
      }
      if (contractData.endDate) {
        form.setValue('end_date', new Date(contractData.endDate));
      }
      if (contractData.propertyAddress) {
        form.setValue('address', contractData.propertyAddress);
      }

      toast.success('Sözleşme bilgileri otomatik olarak dolduruldu!');
    } catch (error) {
      toast.error('PDF işlenirken bir hata oluştu: ' + error.message);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <form>
      {/* PDF Upload Input */}
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePDFUpload(file);
        }}
        disabled={extracting}
      />
      {extracting && <p>PDF işleniyor...</p>}
      
      {/* Form fields */}
    </form>
  );
}
```

## 📝 API Response Formatı

```typescript
interface ExtractTextResponse {
  success: boolean;
  text: string;                    // Çıkarılan metin
  token_count?: number;            // Token sayısı
  file_type?: string;              // Dosya tipi (PDF/EPUB)
  filename?: string;               // Dosya adı
  is_machine_readable?: boolean;   // Makine okunabilir mi?
  needs_ocr?: boolean;            // OCR gerekli mi?
  ocr_applied?: boolean;          // OCR uygulandı mı?
  page_count?: number;            // Sayfa sayısı
  processing_time_ms?: number;    // İşleme süresi (ms)
}
```

## 🔍 Metin Parse Fonksiyonu

`parseContractFromText` fonksiyonu, çıkarılan metinden şu bilgileri çıkarmaya çalışır:

- ✅ Kiracı adı
- ✅ Mal sahibi adı
- ✅ Kira bedeli
- ✅ Depozito
- ✅ Başlangıç tarihi
- ✅ Bitiş tarihi
- ✅ Mülk adresi

**Not:** Parse fonksiyonu basit regex pattern'leri kullanır. Daha gelişmiş parsing için AI/LLM entegrasyonu düşünülebilir.

## 🚀 Gelişmiş Kullanım Senaryoları

### Senaryo 1: Toplu İşleme

```typescript
const files = [file1, file2, file3];
const results = await Promise.all(
  files.map(file => extractTextFromFileViaProxy(file))
);
```

### Senaryo 2: Progress Tracking

```typescript
const handleFileUpload = async (file: File) => {
  setProgress(0);
  
  // Simulated progress (gerçek API progress tracking yok)
  const progressInterval = setInterval(() => {
    setProgress(prev => Math.min(prev + 10, 90));
  }, 100);

  try {
    const result = await extractTextFromFileViaProxy(file);
    setProgress(100);
    // ... process result
  } finally {
    clearInterval(progressInterval);
  }
};
```

### Senaryo 3: Hata Yönetimi

```typescript
try {
  const result = await extractTextFromFileViaProxy(file);
  
  if (!result.text || result.text.length === 0) {
    throw new Error('PDF\'den metin çıkarılamadı. Dosya boş olabilir.');
  }
  
  if (result.needs_ocr && !result.ocr_applied) {
    console.warn('OCR gerekli ama uygulanmadı');
  }
  
  // ... process result
} catch (error) {
  if (error.message.includes('file size')) {
    toast.error('Dosya boyutu çok büyük. Maksimum 100 MB.');
  } else if (error.message.includes('file type')) {
    toast.error('Desteklenmeyen dosya tipi. PDF veya EPUB yükleyin.');
  } else {
    toast.error('Metin çıkarma başarısız: ' + error.message);
  }
}
```

## 🔒 Güvenlik Notları

1. **Firebase Token'ları:** Asla frontend kodunda hardcode etmeyin. Environment variables kullanın.
2. **File Validation:** Her zaman dosya tipi ve boyut kontrolü yapın.
3. **Rate Limiting:** API rate limit'lerini göz önünde bulundurun.
4. **Error Handling:** Kullanıcıya anlamlı hata mesajları gösterin.

## 📚 Kaynaklar

- [Flavius API Dokümantasyonu](../extract_text_api.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Service Proxy Pattern](../src/lib/serviceProxy.ts)

## 🐛 Sorun Giderme

### Problem: "Unauthorized" hatası

**Çözüm:** Supabase session'ınızın geçerli olduğundan emin olun.

### Problem: "CORS" hatası

**Çözüm:** Edge Function proxy kullanın (Yöntem 1).

### Problem: "File too large" hatası

**Çözüm:** Dosya boyutu 100 MB'dan küçük olmalı.

### Problem: "Unsupported file type" hatası

**Çözüm:** Sadece PDF ve EPUB dosyaları desteklenir.

## ✅ Checklist

- [ ] Supabase Edge Function deploy edildi
- [ ] Environment variables ayarlandı
- [ ] Service proxy'ye eklendi
- [ ] UI'da PDF upload butonu eklendi
- [ ] Parse fonksiyonu test edildi
- [ ] Hata yönetimi implementasyonu yapıldı
- [ ] Kullanıcı dokümantasyonu güncellendi

---

**Son Güncelleme:** 2025-01-15


