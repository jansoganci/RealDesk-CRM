# Türkçe Lokalizasyon Denetim Raporu (Audit Report)

Bu döküman, `public/locales/tr/` klasöründeki dil dosyalarının anlam, jargon, yazım ve karakter hataları açısından denetim sonuçlarını içerir.

## Durum Özeti
- **Toplam Dosya Sayısı:** 24
- **Denetlenen Grup:** Tümü (Analiz Bitti)
- **Tamamlanma Oranı:** %100

---

## Grup 1: Temel Emlak Operasyonları (Core Real Estate)
*Gayrimenkul yönetimi, sözleşmeler, mülk sahipleri ve kiracılar.*

✅ **DÜZELTİLDİ**

### `properties.json`
- **Düzeltmeler:**
    - `available` -> "Satışa Hazır"
    - `underOffer` -> "Teklif Alındı"
    - `empty` -> "Müsait"
    - `addressPlaceholder` -> Yerelleştirildi (Atatürk Cad.)

### `contracts.json`, `contractsSale.json`, `contractsHub.json`
- **Düzeltmeler:**
    - `use_purpose` -> "Kullanım Şekli"
    - "Ev Sahibi" -> "Mal Sahibi" (Tutarlılık sağlandı)
    - "Gösterim Kayıtları" -> "Yer Gösterme Kayıtları"

### `owners.json`, `tenants.json`
- **Düzeltmeler:**
    - "İsim" -> "Ad Soyad"
    - "Toplantı Planla" -> "Randevu Oluştur"
    - "John Doe" -> "Ahmet Yılmaz" (Yerelleştirildi)

---

## Grup 2: CRM ve İletişim (CRM & Communication)
*Talepler, hatırlatıcılar, takvim ve hızlı işlemler.*

✅ **DÜZELTİLDİ**

### `inquiries.json`
- **Düzeltmeler:**
    - "İsim" -> "Ad Soyad"
    - `contacted` -> "İletişime Geçildi"
    - "Max" -> "Maksimum"

### `quick-add.json`
- **Düzeltmeler:**
    - Durum isimleri Grup 1 ile tutarlı hale getirildi (`Under Offer` -> "Teklif Alındı" vb.)
    - "İlan URL" -> "İlan Linki"

### `reminders.json`
- **Düzeltmeler:**
    - Diyalog pencerelerindeki hitap dili resmileştirildi (sizli yapıya geçildi).

### `calendar.json`
- **Düzeltmeler:**
    - "Görüşme" -> "Randevu" / "Yer Gösterme" (Jargona uygun hale getirildi).
    - "Mülk Sahibi" -> "Mal Sahibi" (Tutarlılık sağlandı).

---

## Grup 3: Finans ve Teknik (Finance & Technical)
*Finansal işlemler, faturalandırma, yetkilendirme ve hatalar.*

✅ **DÜZELTİLDİ**

### `finance.json`
- **Düzeltmeler:**
    - "Emlak Yönetim" -> "Mülk Yönetim"
    - "Site Yönetim Ücretleri" -> "Aidat Giderleri"
    - "Satıcı Adı" -> "Hizmet Sağlayıcı / Kurum"
    - "Kilometre" -> "Yol / KM Gideri"

### `billing.json`
- **Düzeltmeler:**
    - Tüm "sen"li hitaplar "siz"li yapıya dönüştürüldü.
    - "Kontrat" -> "Sözleşme" (Terminolojik birlik).

### `auth.json`
- **Düzeltmeler:**
    - Marka adı "Emlak CRM" olarak düzeltildi.
    - Kayıt ekranındaki hitap dili resmileştirildi.

### `errors.json`
- **Düzeltmeler:**
    - "Bir şeyler ters gitti" -> "Beklenmeyen bir hata oluştu" (Daha doğal ifade).

### `onboarding.json`
- **Düzeltmeler:**
    - "Emlak CRM'ye" -> "Emlak CRM'e"
    - "Emlak listeleri" -> "Portföy"
    - "Onboarding" -> "Kurulum süreci"

---

## Grup 4: Genel UI ve Yardımcı Dosyalar (General UI & Helpers)
*Genel bileşenler, navigasyon, ekip ve diğerleri.*

✅ **DÜZELTİLDİ**

### `team.json`
- **Düzeltmeler:**
    - Dosyadaki tüm metinler Türkçe karakterlerle (ö, ı, İ, ü, ğ, ş, ç) yeniden yazıldı.

### `navigation.json`
- **Düzeltmeler:**
    - "Fiyatlar" -> "Fiyatlandırma"
    - "Tüm finansları görüntüle" -> "Tüm finansal işlemleri görüntüle"

### `dashboard.json`
- **Düzeltmeler:**
    - "Satılabilir" -> "Satışa Hazır"
    - "emlakcrm" -> "Emlak CRM"
    - "mülkünü ekle" -> "mülkünüzü ekleyin"

### `landing.json`
- **Düzeltmeler:**
    - Marka ismi tüm metinlerde "Emlak CRM" olarak güncellendi.

### `common.json`
- **Düzeltmeler:**
    - `breadcrumb.label`: "Gezinme yolu" -> "Sayfa Yolu"

---

## Sonuç
Denetim ve düzeltme süreci başarıyla tamamlandı. Tüm dil dosyaları profesyonel emlak jargonuna, resmi hitap diline ve doğru Türkçe imla kurallarına uygun hale getirildi.
