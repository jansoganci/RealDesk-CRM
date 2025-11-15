---
description: Add i18n translation keys for Turkish and English
---

# Add Translation Keys

You are adding translation keys to the Real Estate CRM i18n system. The application supports Turkish (tr) and English (en).

## Translation Structure

Translations are organized by namespace in:
- `public/locales/tr/[namespace].json` (Turkish)
- `public/locales/en/[namespace].json` (English)

## Available Namespaces

- **common** - Common UI elements, buttons, actions
- **navigation** - Menu and navigation items
- **properties** - Property management
- **owners** - Owner management
- **tenants** - Tenant management
- **contracts** - Contract management
- **finance** - Financial tracking
- **calendar** - Calendar and meetings
- **dashboard** - Dashboard statistics
- **reminders** - Reminders system
- **inquiries** - Property inquiries
- **profile** - User profile settings
- **auth** - Authentication
- **errors** - Error messages
- **components.tableActions** - Table action buttons

## Required Information

Ask the user:
1. **Which namespace?** (or create new one for new feature)
2. **What keys to add?** (provide the structure)
3. **Turkish translations**
4. **English translations**

## Translation Key Structure

Follow these patterns:

### Standard Feature Structure

```json
{
  "title": "Feature Title",
  "subtitle": "Feature subtitle",
  "description": "Feature description",

  "add": "Add New",
  "addNew": "Add New Item",
  "edit": "Edit",
  "delete": "Delete",
  "save": "Save",
  "cancel": "Cancel",
  "close": "Close",
  "search": "Search",
  "filter": "Filter",
  "export": "Export",

  "confirmDelete": "Are you sure you want to delete this item?",
  "confirmDeleteMessage": "This action cannot be undone.",

  "success": "Success",
  "error": "Error occurred",
  "created": "Created successfully",
  "updated": "Updated successfully",
  "deleted": "Deleted successfully",

  "empty": "No items found",
  "emptyDescription": "Get started by adding your first item",

  "fields": {
    "name": "Name",
    "description": "Description",
    "status": "Status",
    "date": "Date",
    "amount": "Amount",
    "notes": "Notes"
  },

  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "archived": "Archived"
  },

  "validation": {
    "required": "This field is required",
    "invalid": "Invalid value",
    "tooShort": "Too short",
    "tooLong": "Too long"
  }
}
```

### Navigation Items

Add to `public/locales/tr/navigation.json` and `public/locales/en/navigation.json`:

```json
{
  "dashboard": "Panel / Dashboard",
  "properties": "Mülkler / Properties",
  "owners": "Mülk Sahipleri / Owners",
  "tenants": "Kiracılar / Tenants",
  "contracts": "Sözleşmeler / Contracts",
  "finance": "Finans / Finance",
  "calendar": "Takvim / Calendar",
  "inquiries": "Talepler / Inquiries",
  "reminders": "Hatırlatmalar / Reminders",
  "profile": "Profil / Profile",
  "[new-item]": "Turkish / English"
}
```

## Common Translation Patterns

### Turkish Patterns

1. **Titles**: Use title case
   - "Mülk Listesi", "Kiracı Ekle", "Sözleşme Detayları"

2. **Actions**: Use imperative form
   - "Ekle" (Add), "Düzenle" (Edit), "Sil" (Delete), "Kaydet" (Save)

3. **Status**: Use descriptive adjectives
   - "Aktif" (Active), "Pasif" (Inactive), "Arşivlendi" (Archived)

4. **Dates**: Use Turkish format
   - "Gün/Ay/Yıl" format

5. **Messages**: Be polite and clear
   - "Silmek istediğinize emin misiniz?"
   - "İşlem başarıyla tamamlandı"

### English Patterns

1. **Titles**: Use title case
   - "Property List", "Add Tenant", "Contract Details"

2. **Actions**: Use imperative verbs
   - "Add", "Edit", "Delete", "Save"

3. **Status**: Use descriptive adjectives
   - "Active", "Inactive", "Archived"

4. **Messages**: Be clear and concise
   - "Are you sure you want to delete?"
   - "Operation completed successfully"

## Real Estate Specific Terms

Common real estate terminology:

| English | Turkish |
|---------|---------|
| Property | Mülk / Gayrimenkul |
| Owner | Mülk Sahibi |
| Tenant | Kiracı |
| Contract | Sözleşme |
| Rent | Kira |
| Lease | Kiralama |
| Deposit | Depozito / Kapora |
| Commission | Komisyon |
| Listing | İlan |
| Inquiry | Talep |
| Vacant | Boş |
| Occupied | Dolu |
| Address | Adres |
| District | İlçe / Semt |
| City | Şehir / İl |
| Price | Fiyat |
| Monthly Rent | Aylık Kira |
| Square Meters | Metrekare (m²) |
| Bedroom | Yatak Odası |
| Bathroom | Banyo |
| Floor | Kat |
| Building | Bina |
| Apartment | Daire |
| Villa | Villa |
| Office | Ofis |

## Usage in Components

### Import and Use

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('namespace-name');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('add')}</button>
    </div>
  );
}
```

### Nested Keys

```typescript
// Access nested keys with dot notation
{t('fields.name')}
{t('status.active')}
{t('validation.required')}
```

### Interpolation

```typescript
// In translation file:
"welcome": "Welcome, {{name}}!"

// In component:
{t('welcome', { name: user.name })}
```

### Pluralization

```typescript
// In translation file:
"items_one": "{{count}} item"
"items_other": "{{count}} items"

// In component:
{t('items', { count: itemCount })}
```

## Creating New Namespace

If adding a new feature, create both files:

1. Create `public/locales/tr/[feature-name].json`
2. Create `public/locales/en/[feature-name].json`
3. Add same keys to both files
4. Translate appropriately

## Translation Checklist

- [ ] Created/updated Turkish translation file
- [ ] Created/updated English translation file
- [ ] Both files have identical key structure
- [ ] Used appropriate terminology
- [ ] Added to navigation.json if it's a nav item
- [ ] Tested in UI with both languages
- [ ] No missing keys or typos
- [ ] Follows naming conventions (camelCase for keys)

## Example: Adding Property Type Translations

**File**: `public/locales/tr/properties.json`
```json
{
  "types": {
    "apartment": "Daire",
    "villa": "Villa",
    "office": "Ofis",
    "commercial": "Ticari",
    "land": "Arsa"
  }
}
```

**File**: `public/locales/en/properties.json`
```json
{
  "types": {
    "apartment": "Apartment",
    "villa": "Villa",
    "office": "Office",
    "commercial": "Commercial",
    "land": "Land"
  }
}
```

**Usage**:
```typescript
const { t } = useTranslation('properties');
<Select>
  {Object.keys(propertyTypes).map(type => (
    <option key={type} value={type}>
      {t(`types.${type}`)}
    </option>
  ))}
</Select>
```

Now, please provide the translations you'd like to add and I'll create/update the necessary files!
