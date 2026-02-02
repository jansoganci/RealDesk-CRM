# 🎨 EmlakCRM - Tasarım Sistemi Analizi

**Hazırlanma Tarihi:** Ocak 2025  
**Versiyon:** 1.1.1

---

## 📋 Renk Paleti

### Ana Renkler

- **Primary Color:** `#2563EB` (Blue-600)
  - Light: `#3B82F6` (Blue-500)
  - Dark: `#1D4ED8` (Blue-700)
  - Darker: `#1E40AF` (Blue-800)
  - Background Light: `#EFF6FF` (Blue-50)

- **Secondary Color:** `#059669` (Emerald-600)
  - Light: `#10B981` (Emerald-500)
  - Dark: `#047857` (Emerald-700)
  - Background Light: `#ECFDF5` (Emerald-50)

- **Accent Color:** `#F97316` (Orange-500)
  - Light: `#FB923C` (Orange-400)
  - Dark: `#EA580C` (Orange-600)
  - Background Light: `#FFF7ED` (Orange-50)

### Durum Renkleri

- **Success:** `#059669` (Emerald-600)
  - Light: `#10B981` (Emerald-500)
  - Dark: `#047857` (Emerald-700)
  - Darker: `#065F46` (Emerald-800)

- **Danger:** `#DC2626` (Red-600)
  - Light: `#EF4444` (Red-500)
  - Dark: `#B91C1C` (Red-700)
  - Background Light: `#FEF2F2` (Red-50)

- **Warning:** `#D97706` (Amber-600)
  - Light: `#F59E0B` (Amber-500)
  - Dark: `#B45309` (Amber-700)
  - Background Light: `#FFFBEB` (Amber-50)

- **Info:** `#0EA5E9` (Sky-500)
  - Background Light: `#F0F9FF` (Sky-50)

### Arka Plan ve Yüzey Renkleri

- **Background:** `#F9FAFB` (Gray-50)
  - Gradient: `from-gray-50 to-white`

- **Card Background:** `#FFFFFF` (White)
  - Blur: `rgba(255, 255, 255, 0.8)` with backdrop-blur

- **Border:** `#E5E7EB` (Gray-200)
  - Light: `#F3F4F6` (Gray-100)
  - Dark: `#D1D5DB` (Gray-300)

### Metin Renkleri

- **Text Primary:** `#111827` (Gray-900)
- **Text Secondary:** `#4B5563` (Gray-600)
- **Text Muted:** `#6B7280` (Gray-500)
- **Text Disabled:** `#9CA3AF` (Gray-400)
- **Text Light:** `#D1D5DB` (Gray-300)
- **Text White:** `#FFFFFF`

### Durum Badge Renkleri

- **Empty (Boş):** `#F97316` (Orange-500)
- **Occupied (Dolu):** `#3B82F6` (Blue-500)
- **Active (Aktif):** `#059669` (Emerald-600)
- **Inactive (Pasif):** `#4B5563` (Gray-600)
- **Archived (Arşiv):** `#4B5563` (Gray-600)

### Dashboard Kart Renkleri

- **Properties Card:** `#2563EB` (Blue-600)
  - Gradient: `from-blue-600 via-blue-700 to-blue-800`
  - Shadow: `rgba(37, 99, 235, 0.2)`

- **Occupied Card:** `#059669` (Emerald-600)
  - Gradient: `from-emerald-600 via-emerald-700 to-emerald-800`
  - Shadow: `rgba(5, 150, 105, 0.2)`

- **Tenants Card:** `#2563EB` (Blue-600)
  - Gradient: `from-blue-600 via-blue-700 to-blue-800`
  - Shadow: `rgba(37, 99, 235, 0.2)`

- **Contracts Card:** `#F97316` (Orange-500)
  - Gradient: `from-orange-500 via-orange-600 to-orange-700`
  - Shadow: `rgba(249, 115, 22, 0.2)`

### Hatırlatıcı Renkleri

- **Overdue (Gecikmiş):** `#DC2626` (Red-600)
- **Upcoming (Yaklaşan):** `#2563EB` (Blue-600)
- **Scheduled (Planlanmış):** `#2563EB` (Blue-600)
- **Expired (Süresi Dolmuş):** `#4B5563` (Gray-600)

### PWA Theme Color

- **Theme Color:** `#2563EB` (Blue-600)
  - Manifest.json'da tanımlı
  - Mobil tarayıcılarda adres çubuğu rengi

---

## 🔤 Typography (Yazı Tipi)

### Ana Font Ailesi

- **Font Family:** `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`
  - Primary: **Inter**
  - Fallback: system-ui, Avenir, Helvetica, Arial
  - Type: Sans-serif

### Başlık Boyutları

- **H1:**
  - Font Size: `3.2em` (51.2px)
  - Line Height: `1.1`
  - Font Weight: `700` (Bold)
  - Letter Spacing: `-0.02em`

- **H2:**
  - Font Size: `2.4em` (38.4px)
  - Line Height: `1.2`
  - Font Weight: `700` (Bold)
  - Letter Spacing: `-0.01em`

- **H3:**
  - Font Size: `1.8em` (28.8px)
  - Line Height: `1.3`
  - Font Weight: `600` (Semi-bold)
  - Letter Spacing: `-0.01em`

### Varsayılan Metin

- **Body Text:**
  - Font Size: `1rem` (16px)
  - Line Height: `1.5`
  - Font Weight: `400` (Normal)

### Font Özellikleri

- **Font Synthesis:** `none` (sistem fontları kullanılır)
- **Text Rendering:** `optimizeLegibility`
- **Font Smoothing:**
  - WebKit: `antialiased`
  - Mozilla: `grayscale`
- **Font Features:**
  - `rlig: 1` (Required ligatures)
  - `calt: 1` (Contextual alternates)

### PDF Fontları

- **PDF Font Family:** **Roboto**
  - Normal: `Roboto-normal` (70KB embedded)
  - Bold: `Roboto-bold` (70KB embedded)
  - Türkçe karakter desteği: İ, ı, Ş, ş, Ğ, ğ, Ü, ü, Ö, ö, Ç, ç

---

## 🎨 Tailwind Config Brand Colors

### CSS Variables (HSL Format)

```css
--primary: 221.2 83.2% 53.3%;        /* blue-600 #2563EB */
--primary-foreground: 0 0% 100%;      /* white */

--secondary: 160 84.1% 39.4%;         /* emerald-600 #059669 */
--secondary-foreground: 0 0% 100%;   /* white */

--accent: 20.5 90.2% 48.2%;           /* orange-500 #F97316 */
--accent-foreground: 0 0% 100%;       /* white */

--background: 210 40% 98%;            /* gray-50 #F9FAFB */
--foreground: 222 47% 11%;            /* gray-900 #111827 */

--card: 0 0% 100%;                    /* white */
--card-foreground: 222 47% 11%;       /* gray-900 */

--muted: 210 40% 96%;                 /* gray-100 */
--muted-foreground: 215 16% 47%;      /* gray-500 */

--destructive: 0 84% 60%;             /* red-600 #DC2626 */
--destructive-foreground: 0 0% 98%;   /* almost white */

--border: 214 32% 91%;                /* gray-200 #E5E7EB */
--input: 214 32% 91%;                 /* gray-200 */

--ring: 221.2 83.2% 53.3%;            /* blue-600 focus ring */
```

### Chart Colors

- **Chart 1:** `221.2 83.2% 53.3%` (Blue-600)
- **Chart 2:** `160 84.1% 39.4%` (Emerald-600)
- **Chart 3:** `20.5 90.2% 48.2%` (Orange-500)
- **Chart 4:** `217 91% 60%`
- **Chart 5:** `142 71% 45%`

### Border Radius

- **Radius:** `0.75rem` (12px)
  - Large: `var(--radius)` (12px)
  - Medium: `calc(var(--radius) - 2px)` (10px)
  - Small: `calc(var(--radius) - 4px)` (8px)
  - Custom: `20px`

---

## 🎯 Logo/Marka Renkleri

### Primary Brand Color

- **Ana Marka Rengi:** `#2563EB` (Blue-600)
  - PWA manifest theme color
  - Primary button renkleri
  - Logo ve marka kimliği için kullanılan ana renk

### Secondary Brand Color

- **İkincil Marka Rengi:** `#059669` (Emerald-600)
  - Success durumları
  - Pozitif aksiyonlar
  - İkincil vurgu rengi

### Accent Brand Color

- **Vurgu Rengi:** `#F97316` (Orange-500)
  - Önemli aksiyonlar
  - Dikkat çekici elementler
  - Dashboard kartları

---

## 📐 Gölge Sistemi

### Özel Gölgeler

- **Luxury Shadow:**
  - `0 10px 30px -5px rgba(37, 99, 235, 0.2), 0 4px 6px -2px rgba(37, 99, 235, 0.05)`

- **Luxury Shadow Large:**
  - `0 20px 50px -10px rgba(37, 99, 235, 0.3), 0 8px 12px -4px rgba(37, 99, 235, 0.08)`

- **Emerald Shadow:**
  - `0 10px 30px -5px rgba(5, 150, 105, 0.3), 0 4px 6px -2px rgba(5, 150, 105, 0.1)`

- **Emerald Shadow Large:**
  - `0 20px 40px -10px rgba(5, 150, 105, 0.4), 0 10px 15px -3px rgba(5, 150, 105, 0.15)`

- **Card Shadow:**
  - `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`

- **Card Shadow Hover:**
  - `0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

---

## 🎨 Gradient Renkleri

### Primary Gradient

- **From:** `#3B82F6` (Blue-500)
- **To:** `#1D4ED8` (Blue-700)
- **Direction:** `to-r` (right)

### Secondary Gradient

- **From:** `#10B981` (Emerald-500)
- **To:** `#047857` (Emerald-700)
- **Direction:** `to-r` (right)

### Dashboard Card Gradients

- **Properties:** `from-blue-600 via-blue-700 to-blue-800`
- **Occupied:** `from-emerald-600 via-emerald-700 to-emerald-800`
- **Contracts:** `from-orange-500 via-orange-600 to-orange-700`

---

## 📱 Scrollbar Renkleri

- **Track:** `transparent`
- **Thumb:** `#CBD5E1` (Slate-300)
- **Thumb Hover:** `#94A3B8` (Slate-400)
- **Width:** `6px`
- **Border Radius:** `3px`

---

## 📊 Özet Tablo

| Kategori | Renk | Hex Kodu | Kullanım |
|----------|------|----------|----------|
| **Primary** | Blue-600 | `#2563EB` | Ana butonlar, linkler, vurgular |
| **Secondary** | Emerald-600 | `#059669` | Success durumları, ikincil aksiyonlar |
| **Accent** | Orange-500 | `#F97316` | Önemli vurgular, dashboard kartları |
| **Background** | Gray-50 | `#F9FAFB` | Ana arka plan |
| **Card** | White | `#FFFFFF` | Kart ve modal arka planları |
| **Text Primary** | Gray-900 | `#111827` | Ana metin rengi |
| **Text Secondary** | Gray-600 | `#4B5563` | İkincil metin rengi |
| **Border** | Gray-200 | `#E5E7EB` | Kenarlık rengi |
| **Success** | Emerald-600 | `#059669` | Başarılı işlemler |
| **Danger** | Red-600 | `#DC2626` | Hata ve uyarılar |
| **Warning** | Amber-600 | `#D97706` | Uyarı mesajları |
| **Info** | Sky-500 | `#0EA5E9` | Bilgilendirme mesajları |

---

## 🔍 Font Özeti

| Özellik | Değer |
|---------|-------|
| **Ana Font** | Inter, system-ui, Avenir, Helvetica, Arial, sans-serif |
| **PDF Font** | Roboto (Normal + Bold) |
| **H1 Size** | 3.2em (51.2px) |
| **H2 Size** | 2.4em (38.4px) |
| **H3 Size** | 1.8em (28.8px) |
| **Body Size** | 1rem (16px) |
| **Line Height** | 1.5 |
| **Font Weight Normal** | 400 |
| **Font Weight Bold** | 700 |

---

**Not:** Tüm renk kodları `src/config/colors.ts` dosyasında merkezi olarak yönetilmektedir. Tailwind CSS utility sınıfları ile birlikte kullanılmaktadır.
