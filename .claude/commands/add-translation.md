---
description: Add i18n translation keys (English only)
---

# Add Translation Keys

You are adding translation keys to the Real Estate CRM i18n system. The product is **English-only** (`en`). Do not add `public/locales/tr/`.

## Translation Structure

Translations are organized by namespace in:
- `public/locales/en/[namespace].json`

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
3. **English copy** (final US-market strings — no other locale files)

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

Add to `public/locales/en/navigation.json` only:

```json
{
  "dashboard": "Dashboard",
  "properties": "Properties",
  "[new-item]": "New feature"
}
```

## Copy guidelines (English, US market)

1. **Titles**: Title case where it fits the design system (e.g. page headers).
2. **Actions**: Short imperatives — "Add", "Save", "Cancel".
3. **Status**: Same terms across features (Active, Vacant, Under contract, etc.).
4. **Dates**: Prefer formatting in code (`date-fns` + `enUS`); strings can say "Closing date", "Due date", etc.
5. **Messages**: Clear, professional; avoid idioms that confuse non-native readers.

Use standard US real estate terms (listing, lease, earnest money, closing, MLS) consistently.

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

If adding a new feature:

1. Create `public/locales/en/[feature-name].json`
2. Register the namespace in `src/i18n.ts` `ns` array if it is new

## Translation Checklist

- [ ] Created/updated `public/locales/en/[namespace].json`
- [ ] No hardcoded user-visible strings in components (use `t(...)`)
- [ ] Added to `en/navigation.json` if it's a nav item
- [ ] No missing keys or typos
- [ ] Keys use camelCase

## Example: Adding Property Type Translations

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
