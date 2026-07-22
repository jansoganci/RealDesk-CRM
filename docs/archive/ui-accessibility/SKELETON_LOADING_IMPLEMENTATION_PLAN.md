# 🎨 Skeleton Loading Implementation Plan
## Tüm Sayfalara Skeleton Loading Ekleme Projesi

**Tarih:** 2024  
**Hedef:** Tüm sayfalarda spinner yerine skeleton loading kullanımı  
**Durum:** Planlama Aşaması

---

## 📊 Mevcut Durum Analizi

### ✅ Skeleton Kullanan (1 sayfa)
- **Reminders** (`src/features/reminders/Reminders.tsx`)
  - ✅ `LoadingSkeleton` component'i mevcut
  - ✅ Kart yapısını yansıtan skeleton
  - ✅ İyi uygulanmış, örnek alınabilir

### ❌ Spinner Kullanan (4 sayfa - ListPageTemplate üzerinden)
- **Owners** (`src/features/owners/Owners.tsx`)
  - ❌ `ListPageTemplate` → spinner (satır 136-140)
  - ❌ Tablo skeleton'ı yok
  
- **Properties** (`src/features/properties/Properties.tsx`)
  - ❌ `ListPageTemplate` → spinner
  - ❌ Tablo skeleton'ı yok
  
- **Tenants** (`src/features/tenants/Tenants.tsx`)
  - ❌ `ListPageTemplate` → spinner
  - ❌ Tablo skeleton'ı yok
  
- **Inquiries** (`src/features/inquiries/Inquiries.tsx`)
  - ❌ `ListPageTemplate` → spinner
  - ❌ Tablo skeleton'ı yok

### ⚠️ Basit Loading Gösteren (4 sayfa)
- **Dashboard** (`src/features/dashboard/Dashboard.tsx`)
  - ⚠️ StatCard'larda `loading` prop var ama skeleton yok
  - ⚠️ Sadece "-" gösteriyor (satır 75)
  - ⚠️ Sayfa seviyesinde skeleton yok
  
- **Calendar** (`src/features/calendar/CalendarPage.tsx`)
  - ⚠️ Basit text loading: `{t('common:loading')}...` (satır 179)
  - ⚠️ Skeleton yok
  
- **Finance** (`src/features/finance/FinanceDashboard.tsx`)
  - ⚠️ Component'lerde `loading` prop var
  - ⚠️ Sayfa seviyesinde skeleton yok
  - ⚠️ `FinancialSummaryCards`, `TransactionsTable` gibi component'ler loading gösteriyor ama skeleton değil
  
- **Profile** (`src/features/profile/Profile.tsx`)
  - ⚠️ Form submit'te spinner var (satır 407)
  - ⚠️ Sayfa yükleme için skeleton yok (ama gerekli değil, form zaten var)

---

## 🎯 Hedefler

1. **Tutarlı UX**: Tüm sayfalarda aynı skeleton yaklaşımı
2. **Profesyonel Görünüm**: Spinner yerine içerik yapısını gösteren skeleton'lar
3. **Beklenti Yönetimi**: Kullanıcıya ne geleceğini göster
4. **Hız Algısı**: Skeleton loading daha hızlı algılanır
5. **Modüler Yapı**: Reusable skeleton component'leri

---

## 🏗️ Teknik Yaklaşım

### 1. Reusable Skeleton Component'leri Oluştur

#### `src/components/common/skeletons/TableSkeleton.tsx`
- Tablo yapısı için skeleton
- Header + satırlar
- `columnCount` prop ile dinamik

#### `src/components/common/skeletons/CardSkeleton.tsx`
- Kart yapısı için skeleton
- Mobile card view için kullanılacak
- `variant` prop (simple, detailed)

#### `src/components/common/skeletons/StatCardSkeleton.tsx`
- Dashboard StatCard için skeleton
- Icon + title + value + description yapısı

#### `src/components/common/skeletons/CalendarSkeleton.tsx`
- Takvim grid için skeleton
- Haftalık görünüm için 7 sütun

### 2. Mevcut Component'leri İyileştir

#### `src/components/ui/skeleton.tsx`
- ✅ Zaten var, kullanılabilir
- `bg-primary/10` yerine `bg-gray-200` veya `bg-gray-300` daha görünür olabilir

#### `src/components/templates/ListPageTemplate.tsx`
- Spinner'ı kaldır (satır 136-140)
- `TableSkeleton` ekle
- Desktop ve mobile için ayrı skeleton'lar

#### `src/components/common/MobileCardView.tsx`
- ✅ Zaten skeleton var ama `Skeleton` component'i kullanmıyor
- Manuel `bg-gray-200 animate-pulse` yerine `Skeleton` component'i kullan

#### `src/components/dashboard/StatCard.tsx`
- `loading` prop'u var ama skeleton yok
- `StatCardSkeleton` kullan veya inline skeleton ekle

---

## 📋 Yapılacaklar Listesi

### Faz 1: Reusable Component'ler (Öncelik: Yüksek)

- [ ] **1.1** `TableSkeleton.tsx` oluştur
  - Header skeleton (5-6 sütun)
  - Row skeleton (5-6 satır)
  - Responsive (mobile'da card skeleton'a dönüşebilir)

- [ ] **1.2** `CardSkeleton.tsx` oluştur
  - Simple variant (3 satır)
  - Detailed variant (başlık + 4-5 alan)
  - MobileCardView için kullanılacak

- [ ] **1.3** `StatCardSkeleton.tsx` oluştur
  - Icon placeholder
  - Title skeleton
  - Value skeleton (büyük)
  - Description skeleton

- [ ] **1.4** `CalendarSkeleton.tsx` oluştur
  - 7 sütunlu grid (haftalık görünüm)
  - Her sütunda 2-3 meeting card skeleton'ı

### Faz 2: ListPageTemplate İyileştirmesi (Öncelik: Çok Yüksek)

- [ ] **2.1** `ListPageTemplate.tsx` güncelle
  - Spinner'ı kaldır (satır 136-140)
  - Desktop için `TableSkeleton` ekle
  - Mobile için `CardSkeleton` ekle (zaten MobileCardView'da var ama iyileştir)
  - `renderTableHeaders` fonksiyonundan sütun sayısını çıkar veya prop olarak al

- [ ] **2.2** `MobileCardView.tsx` iyileştir
  - Manuel skeleton yerine `CardSkeleton` component'i kullan
  - `Skeleton` component'ini import et

### Faz 3: Sayfa Bazlı Implementasyonlar

#### 3.1 Dashboard (Öncelik: Yüksek)
- [ ] **3.1.1** `StatCard.tsx` güncelle
  - `loading` prop'u true olduğunda `StatCardSkeleton` göster
  - Veya inline skeleton ekle (daha basit)

- [ ] **3.1.2** `Dashboard.tsx` güncelle
  - Sayfa yükleme için skeleton ekle (isteğe bağlı, StatCard skeleton'ları yeterli olabilir)
  - Reminders kartı için skeleton (isteğe bağlı)

#### 3.2 Calendar (Öncelik: Orta)
- [ ] **3.2.1** `CalendarPage.tsx` güncelle
  - Basit text loading yerine `CalendarSkeleton` kullan
  - Haftalık görünüm için 7 sütunlu skeleton
  - Mobile için günlük görünüm skeleton'ı

#### 3.3 Finance (Öncelik: Orta)
- [ ] **3.3.1** `FinancialSummaryCards.tsx` kontrol et
  - Zaten loading prop var, skeleton ekle

- [ ] **3.3.2** `TransactionsTable.tsx` kontrol et
  - Zaten loading prop var, skeleton ekle

- [ ] **3.3.3** Diğer finance component'leri kontrol et
  - `FinancialRatios.tsx`
  - `FinancialTrends.tsx`
  - `TopCategories.tsx`
  - `BudgetComparison.tsx`
  - `UpcomingBills.tsx`

#### 3.4 Profile (Öncelik: Düşük)
- [ ] **3.4.1** Form submit spinner'ı bırak (OK)
- [ ] Sayfa yükleme için skeleton gerekmez (form zaten var)

### Faz 4: İyileştirmeler ve Optimizasyon

- [ ] **4.1** `Skeleton` component'i iyileştir
  - Renk: `bg-gray-200` veya `bg-gray-300` daha görünür
  - Animasyon: `animate-pulse` zaten var, iyi

- [ ] **4.2** Tutarlılık kontrolü
  - Tüm skeleton'lar aynı renk paletini kullanmalı
  - Tüm skeleton'lar aynı animasyon hızını kullanmalı

- [ ] **4.3** Performance
  - Skeleton component'leri memoize edilmeli
  - Gereksiz re-render'ları önle

---

## 🔄 Uygulama Sırası (Öncelik Sırasına Göre)

### 1. Adım: Reusable Component'ler
**Süre:** ~30 dakika
1. `TableSkeleton.tsx` oluştur
2. `CardSkeleton.tsx` oluştur
3. `StatCardSkeleton.tsx` oluştur
4. `CalendarSkeleton.tsx` oluştur

### 2. Adım: ListPageTemplate (En Yüksek Etki)
**Süre:** ~20 dakika
1. `ListPageTemplate.tsx` güncelle (spinner → skeleton)
2. `MobileCardView.tsx` iyileştir (Skeleton component kullan)

**Etkilenen Sayfalar:** Owners, Properties, Tenants, Inquiries (4 sayfa)

### 3. Adım: Dashboard
**Süre:** ~15 dakika
1. `StatCard.tsx` güncelle (skeleton ekle)

### 4. Adım: Calendar
**Süre:** ~15 dakika
1. `CalendarPage.tsx` güncelle (skeleton ekle)

### 5. Adım: Finance
**Süre:** ~30 dakika
1. Tüm finance component'lerini kontrol et ve skeleton ekle

### 6. Adım: Test ve İyileştirme
**Süre:** ~20 dakika
1. Tüm sayfaları test et
2. Tutarlılık kontrolü
3. Performance optimizasyonu

**Toplam Süre:** ~2 saat

---

## 📝 Detaylı Implementation Notları

### TableSkeleton Component Tasarımı

```tsx
// Örnek kullanım
<TableSkeleton 
  columnCount={5} 
  rowCount={5}
  showHeader={true}
/>
```

**Özellikler:**
- Dinamik sütun sayısı
- Dinamik satır sayısı
- Header göster/gizle
- Responsive (mobile'da card'a dönüşebilir)

### CardSkeleton Component Tasarımı

```tsx
// Örnek kullanım
<CardSkeleton 
  variant="detailed" // "simple" | "detailed"
  count={3}
/>
```

**Özellikler:**
- Simple variant: 3 satır skeleton
- Detailed variant: Başlık + 4-5 alan
- Count prop ile kaç kart gösterileceği

### StatCardSkeleton Component Tasarımı

```tsx
// Örnek kullanım
<StatCardSkeleton count={8} />
```

**Özellikler:**
- Icon placeholder (kare)
- Title skeleton
- Value skeleton (büyük, bold)
- Description skeleton

### CalendarSkeleton Component Tasarımı

```tsx
// Örnek kullanım
<CalendarSkeleton 
  view="week" // "week" | "day"
  meetingCount={2} // Her gün için kaç meeting
/>
```

**Özellikler:**
- Week view: 7 sütunlu grid
- Day view: Tek sütun, daha fazla meeting
- Her gün için meeting card skeleton'ları

---

## ✅ Başarı Kriterleri

1. ✅ Tüm sayfalarda spinner yerine skeleton kullanılıyor
2. ✅ Skeleton'lar gerçek içerik yapısını yansıtıyor
3. ✅ Tutarlı görünüm (aynı renk, animasyon)
4. ✅ Responsive çalışıyor (desktop + mobile)
5. ✅ Performance sorunları yok
6. ✅ Code review'da onaylandı

---

## 🐛 Potansiyel Sorunlar ve Çözümler

### Sorun 1: Sütun Sayısını Dinamik Almak
**Çözüm:** 
- `renderTableHeaders` fonksiyonunu çağırıp kaç `TableHead` döndüğünü say
- Veya `columnCount` prop'u ekle `ListPageTemplate`'e

### Sorun 2: Mobile Card Skeleton Detayları
**Çözüm:**
- Her sayfa için farklı card yapısı var
- Generic `CardSkeleton` yeterli olmalı
- Gerekirse sayfa bazlı özelleştirme

### Sorun 3: Performance
**Çözüm:**
- Skeleton component'lerini `React.memo` ile sarmala
- Gereksiz re-render'ları önle

---

## 📚 Referanslar

- **Mevcut İyi Örnek:** `src/features/reminders/Reminders.tsx` (satır 239-277)
- **Mevcut Skeleton Component:** `src/components/ui/skeleton.tsx`
- **Mevcut Mobile Skeleton:** `src/components/common/MobileCardView.tsx` (satır 16-29)

---

## 🎨 Tasarım Prensipleri

1. **Gerçekçilik**: Skeleton gerçek içerik yapısını yansıtmalı
2. **Tutarlılık**: Tüm sayfalarda aynı stil
3. **Performans**: Hafif ve hızlı
4. **Erişilebilirlik**: Screen reader'lar için uygun
5. **Responsive**: Desktop ve mobile'da çalışmalı

---

## 📅 Timeline

- **Faz 1 (Reusable Components):** 30 dakika
- **Faz 2 (ListPageTemplate):** 20 dakika
- **Faz 3 (Sayfa Implementasyonları):** 60 dakika
- **Faz 4 (Test & İyileştirme):** 20 dakika

**Toplam:** ~2 saat

---

## 🚀 Başlangıç

İlk adım: Reusable skeleton component'lerini oluştur!

1. `src/components/common/skeletons/` klasörü oluştur
2. `TableSkeleton.tsx` oluştur
3. `CardSkeleton.tsx` oluştur
4. `StatCardSkeleton.tsx` oluştur
5. `CalendarSkeleton.tsx` oluştur

Sonra: `ListPageTemplate.tsx` güncelle ve 4 sayfayı birden düzelt!

---

**Son Güncelleme:** 2024  
**Durum:** Planlama Tamamlandı, Implementation Bekliyor

