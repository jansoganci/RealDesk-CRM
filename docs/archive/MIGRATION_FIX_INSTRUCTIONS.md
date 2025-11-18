# 🔧 Migration Düzeltme - Adım Adım

## Sorun
`property_type` kolonu yok - bu yüzden uygulama hata veriyor.

## ✅ Çözüm (2 dakika)

### Yöntem 1: Supabase Dashboard (En Kolay)

1. **Supabase Dashboard'a git**
   - https://supabase.com/dashboard
   - Projeni seç

2. **SQL Editor'ü aç**
   - Sol menüden **SQL Editor** seç

3. **Migration dosyasını aç**
   - `run_migration_property_type.sql` dosyasını aç
   - Tüm içeriği kopyala

4. **SQL Editor'de çalıştır**
   - SQL Editor'de **New Query** butonuna tıkla
   - Kopyaladığın SQL'i yapıştır
   - **Run** butonuna tıkla (veya `Cmd/Ctrl + Enter`)

5. **Başarıyı kontrol et**
   - "Migration successful!" mesajını görmeli
   - rental_count ve sale_count sayıları görünmeli

### Yöntem 2: Doğrudan SQL

Eğer dosya açmak istemiyorsan, aşağıdaki SQL'i çalıştır:

```sql
-- Add property_type column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS property_type text NOT NULL DEFAULT 'rental'
CHECK (property_type IN ('rental', 'sale'));

-- Add sale-specific columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS buyer_name text,
ADD COLUMN IF NOT EXISTS buyer_phone text,
ADD COLUMN IF NOT EXISTS buyer_email text,
ADD COLUMN IF NOT EXISTS offer_date timestamptz,
ADD COLUMN IF NOT EXISTS offer_amount numeric;

-- Update existing properties
UPDATE properties
SET property_type = CASE
  WHEN sold_at IS NOT NULL OR sold_price IS NOT NULL THEN 'sale'
  ELSE 'rental'
END;

-- Update status constraint
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS valid_property_status;

ALTER TABLE properties
ADD CONSTRAINT valid_property_status
CHECK (status IN ('Empty', 'Occupied', 'Inactive', 'Available', 'Under Offer', 'Sold'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_type_status ON properties(property_type, status);
```

## ✅ Sonra Ne Yapmalı?

1. **Uygulamayı yeniden yükle** (tarayıcıda refresh)
2. **Test et**: Bir mülk eklemeyi/düzenlemeyi dene
3. **Eğer hata devam ederse**: `check_migrations.sql` dosyasını çalıştır ve hangi kolonların eksik olduğunu kontrol et

## ⚠️ Önemli Not

- Bu migration **güvenlidir** - mevcut verileri silmez
- `IF NOT EXISTS` kullanıldığı için tekrar çalıştırmak sorun yaratmaz
- Tüm mevcut mülkler otomatik olarak 'rental' olarak sınıflandırılır (sold_at veya sold_price varsa 'sale')

