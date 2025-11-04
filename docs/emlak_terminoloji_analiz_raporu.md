# Emlak CRM - Türkçe Terminoloji Analiz Raporu

## 📋 Genel Bakış

Bu rapor, emlak CRM uygulamasının Türkçe çeviri dosyalarını emlakçıların kullandığı terminoloji açısından analiz etmektedir. Web araştırması ve sektör standartlarına göre değerlendirmeler yapılmıştır.

**Hazırlanma Tarihi:** 2025-01-05  
**Analiz Edilen Dosyalar:** `/public/locales/tr/` klasöründeki tüm JSON dosyaları

---

## 🔍 Bulgular ve Öneriler

### ✅ Doğru Kullanılan Terimler

Aşağıdaki terimler emlak sektörü terminolojisine uygundur:

- **"Kiracı"** - Doğru kullanım
- **"Mal Sahibi"** - Doğru kullanım (bazı yerlerde "Emlak Sahibi" de kullanılabilir)
- **"Kira Sözleşmesi"** - Doğru kullanım
- **"Mülk"** - Doğru kullanım (emlakçılar hem "mülk" hem "emlak" kullanır)
- **"Görüşme"** - Doğru kullanım (toplantı yerine)
- **"Gayrimenkul Danışmanı"** - landing.json'da testimonial'da kullanılmış, profesyonel terim

---

## ⚠️ Değiştirilmesi Önerilen Terimler

### 1. **"Müşteri" → "Alıcı" veya "Talep Eden"**

**Dosya:** `inquiries.json`

**Mevcut Kullanım:**
- `"namePlaceholder": "Müşteri adını girin"`
- `"addDescription": "Müşteri talep detaylarını aşağıda doldurun."`
- `"editDescription": "Müşteri talep bilgilerini güncelleyin."`
- `"noInquiriesYetDescription": "İlk müşteri talebinizi ekleyerek başlayın"`

**Önerilen Değişiklik:**
- Emlakçılar genelde "müşteri" yerine "alıcı", "talep eden" veya "danışan" terimlerini kullanır.
- "Müşteri" genel bir terimdir, emlak sektöründe daha spesifik terimler tercih edilir.

**Öneri:** 
- "Müşteri" → "Alıcı" veya "Talep Eden"
- Örnek: `"Alıcı adını girin"`, `"İlk alıcı talebinizi ekleyerek başlayın"`

---

### 2. **"Mülk Talepleri" → "Alıcı Talepleri" veya "Müşteri Talepleri"**

**Dosya:** `inquiries.json`

**Mevcut Kullanım:**
- `"title": "Mülk Talepleri"`

**Önerilen Değişiklik:**
- Emlakçılar genelde "Alıcı Talepleri" veya "Müşteri Talepleri" derler.
- "Mülk Talepleri" terimi biraz belirsizdir.

**Öneri:** 
- `"title": "Alıcı Talepleri"` veya `"title": "Müşteri Talepleri"`

---

### 3. **"Talep" → "Alıcı Talebi" veya "Müşteri Talebi"**

**Dosya:** `inquiries.json`

**Mevcut Kullanım:**
- `"addNew": "Yeni Talep Ekle"`
- `"viewMatches": "Eşleşmeleri Gör"`
- `"addButton": "Talep Ekle"`
- `"updateButton": "Talebi Güncelle"`

**Önerilen Değişiklik:**
- "Talep" çok genel bir terimdir. Emlakçılar daha spesifik olarak "alıcı talebi" veya "müşteri talebi" derler.

**Öneri:**
- "Yeni Talep Ekle" → "Yeni Alıcı Talebi Ekle"
- "Talep Ekle" → "Alıcı Talebi Ekle"
- "Talebi Güncelle" → "Alıcı Talebini Güncelle"

---

### 4. **"Mülk Gösterimi" → "Mülk Görüntüleme" veya "Emlak Gösterimi"**

**Dosya:** `calendar.json`

**Mevcut Kullanım:**
- `"property": "Mülk gösterimi"`

**Önerilen Değişiklik:**
- "Mülk gösterimi" biraz teknik geliyor. Emlakçılar genelde "mülk görüntüleme" veya "emlak gösterimi" derler.

**Öneri:**
- `"property": "Mülk görüntüleme"` veya `"property": "Emlak gösterimi"`

---

### 5. **"İlgili Kişi/Mülk" → "İlgili Kişi veya Mülk"**

**Dosya:** `calendar.json`

**Mevcut Kullanım:**
- `"relatedTo": "İlgili Kişi/Mülk"`

**Önerilen Değişiklik:**
- Emlakçılar genelde "/" yerine "veya" kullanırlar, daha profesyonel görünür.

**Öneri:**
- `"relatedTo": "İlgili Kişi veya Mülk"`

---

### 6. **"Mülk" ve "Emlak" Tutarsızlığı**

**Dosyalar:** Tüm dosyalar

**Mevcut Durum:**
- Bazı yerlerde "mülk", bazı yerlerde "emlak" kullanılıyor.
- `landing.json`'da "Emlak Yönetimi", diğer dosyalarda genelde "Mülk"

**Önerilen Değişiklik:**
- Tutarlılık için tüm dosyalarda aynı terimi kullanmak önemli.
- Emlakçılar genelde "emlak" terimini daha profesyonel bulur, ama "mülk" de yaygın kullanılır.

**Öneri:**
- Tüm dosyalarda "emlak" terimini kullanmak (daha profesyonel)
- VEYA tüm dosyalarda "mülk" terimini kullanmak (daha basit ve anlaşılır)
- Karar verilmesi gereken: Hangi terim kullanılacak?

---

### 7. **"Kira Bedeli" → "Kira Tutarı" veya "Aylık Kira"**

**Dosya:** `properties.json`

**Mevcut Kullanım:**
- `"rentAmount": "Kira Bedeli"`

**Önerilen Değişiklik:**
- Emlakçılar genelde "kira tutarı" veya "aylık kira" derler. "Kira bedeli" daha resmi bir terim.

**Öneri:**
- `"rentAmount": "Kira Tutarı"` veya `"rentAmount": "Aylık Kira"`

---

### 8. **"İlan Linki" → "İlan URL'i" veya "İlan Bağlantısı"**

**Dosya:** `properties.json`

**Mevcut Kullanım:**
- `"listingUrl": "İlan Linki"`

**Önerilen Değişiklik:**
- "Link" İngilizce kökenli bir terim. "URL" veya "bağlantı" daha profesyonel görünür.

**Öneri:**
- `"listingUrl": "İlan URL'i"` veya `"listingUrl": "İlan Bağlantısı"`

---

### 9. **"Müsait" → "Boş" veya "Kiralamaya Hazır"**

**Dosyalar:** `properties.json`, `dashboard.json`

**Mevcut Kullanım:**
- `"empty": "Müsait"`
- `"emptyProperties": "Müsait Mülkler"`
- `"emptyPropertiesDescription": "Kiralamaya hazır"`

**Önerilen Değişiklik:**
- "Müsait" terimi biraz belirsiz. Emlakçılar genelde "boş" veya "kiralamaya hazır" derler.

**Öneri:**
- `"empty": "Boş"` veya `"empty": "Kiralamaya Hazır"`
- `"emptyProperties": "Boş Mülkler"` veya `"emptyProperties": "Kiralamaya Hazır Mülkler"`

---

### 10. **"Kirada" → "Kiracılı" veya "Kiraya Verilmiş"**

**Dosyalar:** `properties.json`, `dashboard.json`

**Mevcut Kullanım:**
- `"occupied": "Kirada"`
- `"occupiedDescription": "Şu anda kiralık"`

**Önerilen Değişiklik:**
- "Kirada" terimi biraz belirsiz. "Kiracılı" veya "kiraya verilmiş" daha açıklayıcı.

**Öneri:**
- `"occupied": "Kiracılı"` veya `"occupied": "Kiraya Verilmiş"`

---

## 📊 Öncelik Sıralaması

### Yüksek Öncelik (Mutlaka Değiştirilmeli)
1. **"Müşteri" → "Alıcı"** (inquiries.json) - Sektör terminolojisine daha uygun
2. **"Mülk/Emlak" tutarsızlığı** - Tüm dosyalarda tutarlılık sağlanmalı
3. **"Mülk Talepleri" → "Alıcı Talepleri"** - Daha profesyonel

### Orta Öncelik (Önerilir)
4. **"Talep" → "Alıcı Talebi"** - Daha spesifik
5. **"Kira Bedeli" → "Kira Tutarı"** - Daha yaygın kullanım
6. **"Müsait" → "Boş"** - Daha açıklayıcı

### Düşük Öncelik (İsteğe Bağlı)
7. **"İlan Linki" → "İlan URL'i"** - Küçük bir iyileştirme
8. **"Kirada" → "Kiracılı"** - Küçük bir iyileştirme
9. **"Mülk gösterimi" → "Mülk görüntüleme"** - Küçük bir iyileştirme

---

## 🔗 Sektör Standartları

Web araştırması sonucunda emlak sektöründe yaygın kullanılan terimler:

- **"Alıcı"** veya **"Talep Eden"** - Müşteri yerine
- **"Emlak"** - Genelde "mülk"ten daha profesyonel kabul edilir
- **"Görüşme"** - Toplantı yerine (zaten değiştirilmiş ✅)
- **"Gayrimenkul Danışmanı"** - Emlakçı yerine (zaten kullanılıyor ✅)
- **"Kira Tutarı"** - Kira bedeli yerine
- **"Boş"** - Müsait yerine

---

## 📝 Sonuç ve Öneriler

1. **Tutarlılık:** Tüm dosyalarda "mülk" veya "emlak" terimlerinden birini seçip tutarlı kullanmak önemli.

2. **Profesyonellik:** "Müşteri" yerine "alıcı" veya "talep eden" kullanmak daha profesyonel.

3. **Sektör Uyumu:** Emlakçıların kullandığı günlük terimleri kullanmak kullanıcı deneyimini iyileştirir.

4. **Basitlik:** Gereksiz karmaşık terimlerden kaçınmak, basit ve anlaşılır terimler kullanmak önemli.

---

## 📌 Notlar

- Bu rapor sadece analiz amaçlıdır, hiçbir değişiklik yapılmamıştır.
- Tüm değişiklikler kullanıcı onayı ile yapılmalıdır.
- Öncelik sıralamasına göre değişiklikler yapılabilir.

---

**Rapor Hazırlayan:** AI Assistant  
**Tarih:** 2025-01-05

