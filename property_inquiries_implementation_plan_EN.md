# Property Inquiries & Matching System - Implementation Plan

## 📋 Overview

This document contains the implementation plan for the Property Inquiries (Customer Requests) and automatic matching system. The system enables real estate agents to record potential customers and receive automatic match notifications when a suitable property is added.

---

## 🎯 Business Logic (Workflow)

### Scenario 1: Creating an Inquiry
1. Agent → Navigates to "Inquiries" page
2. Clicks "Add New Inquiry" button
3. Form opens with the following fields:
   - Name (required)
   - Phone (required)
   - Email (optional)
   - Preferred City (optional)
   - Preferred District (optional)
   - Min Budget (optional)
   - Max Budget (optional)
   - Notes (optional)
4. Saves → Inquiry is saved with `active` status

### Scenario 2: Automatic Matching When Property is Added
1. Agent adds a new property (including rent_amount)
2. After `propertiesService.create()` → `inquiriesService.checkMatchesForNewProperty(propertyId)` is automatically called
3. Matching algorithm runs:
   - Fetches all `active` inquiries
   - For each inquiry, checks:
     - Property `status = 'Empty'` must be true
     - City match (exact, case-insensitive)
     - District match (optional, if specified, exact)
     - Budget check (if inquiry has min/max, and property has rent_amount)
4. If match is found:
   - Record is added to `inquiry_matches` table
   - `notification_sent = false` is marked
   - `inquiry.status` → becomes `matched` (automatic)

### Scenario 3: Notification Display
1. **Navbar Bell Icon:**
   - Reminders count + Unread matches count = Total badge count
   - Unread matches = matches where `notification_sent = false`
2. **Dashboard:**
   - "Active Inquiries" stat card: Count of inquiries with `active` status
   - "Unassigned Tenants" card is kept (existing)

### Scenario 4: Agent Views Matches
1. Enters from Dashboard or Inquiries page
2. Inquiries page → "Matched" tab
3. Matches are listed (inquiry + matched property)
4. Clicks "Contact" button → Phone link opens
5. "Mark as Contacted" → `status = 'contacted'` + `inquiry_matches.contacted = true`
6. Optionally "Close Inquiry" → `status = 'closed'`

---

## 📊 Database Changes

### New Migration File
`supabase/migrations/[timestamp]_create_property_inquiries_system.sql`

#### Table 1: `property_inquiries`
```sql
CREATE TABLE property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  preferred_city text,
  preferred_district text,
  min_budget numeric,
  max_budget numeric,
  status text NOT NULL DEFAULT 'active', 
    -- 'active' | 'matched' | 'contacted' | 'closed'
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_inquiry_status 
    CHECK (status IN ('active', 'matched', 'contacted', 'closed'))
);

-- Indexes
CREATE INDEX idx_inquiries_status ON property_inquiries(status);
CREATE INDEX idx_inquiries_city ON property_inquiries(preferred_city);
CREATE INDEX idx_inquiries_district ON property_inquiries(preferred_district);
CREATE INDEX idx_inquiries_active ON property_inquiries(status) 
  WHERE status = 'active';

-- RLS Policies
ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inquiries"
  ON property_inquiries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create inquiries"
  ON property_inquiries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update inquiries"
  ON property_inquiries FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inquiries"
  ON property_inquiries FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON property_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Table 2: `inquiry_matches`
```sql
CREATE TABLE inquiry_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES property_inquiries(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  matched_at timestamptz DEFAULT now(),
  notification_sent boolean DEFAULT false,
  contacted boolean DEFAULT false,
  
  -- An inquiry can only match with a property once
  UNIQUE(inquiry_id, property_id)
);

-- Indexes
CREATE INDEX idx_matches_inquiry ON inquiry_matches(inquiry_id);
CREATE INDEX idx_matches_property ON inquiry_matches(property_id);
CREATE INDEX idx_matches_notification ON inquiry_matches(notification_sent) 
  WHERE notification_sent = false;

-- RLS Policies
ALTER TABLE inquiry_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view matches"
  ON inquiry_matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create matches"
  ON inquiry_matches FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update matches"
  ON inquiry_matches FOR UPDATE TO authenticated 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete matches"
  ON inquiry_matches FOR DELETE TO authenticated USING (true);
```

#### Table 3: `properties` Update
```sql
-- Add rent amount and currency (currently not present)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS rent_amount numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD' 
    CHECK (currency IN ('USD', 'TRY'));

-- Index for matching performance
CREATE INDEX IF NOT EXISTS idx_properties_status_city_district 
  ON properties(status, city, district) 
  WHERE status = 'Empty';
```

---

## 🔧 TypeScript Types

### `src/types/database.ts` Update
**NOTE:** The following tables should be added to the existing Database interface:
- `property_inquiries` table (Row, Insert, Update)
- `inquiry_matches` table (Row, Insert, Update)
- `rent_amount` and `currency` fields should be added to `properties` table

### `src/types/index.ts` Update
**NOTE:** The following new types should be added:
```typescript
export type PropertyInquiry = Database['public']['Tables']['property_inquiries']['Row'];
export type PropertyInquiryInsert = Database['public']['Tables']['property_inquiries']['Insert'];
export type PropertyInquiryUpdate = Database['public']['Tables']['property_inquiries']['Update'];

export type InquiryMatch = Database['public']['Tables']['inquiry_matches']['Row'];
export type InquiryMatchInsert = Database['public']['Tables']['inquiry_matches']['Insert'];
export type InquiryMatchUpdate = Database['public']['Tables']['inquiry_matches']['Update'];

export type InquiryStatus = 'active' | 'matched' | 'contacted' | 'closed';

// Extended types
export interface InquiryWithMatches extends PropertyInquiry {
  matches?: InquiryMatchWithProperty[];
}

export interface InquiryMatchWithProperty extends InquiryMatch {
  property?: Property;
}
```

---

## 💼 Service Layer

### New Service: `src/services/inquiries.service.ts`
**NOTE:** Should contain the following methods:
- `getAll()`: Fetches all inquiries
- `getById(id)`: Fetches a single inquiry
- `create(inquiry)`: Creates a new inquiry
- `update(id, inquiry)`: Updates an inquiry
- `delete(id)`: Deletes an inquiry
- `checkMatchesForNewProperty(propertyId)`: Performs matching for a new property
- `checkMatchesForPropertyUpdate(propertyId)`: Matching check for property update
- `matchInquiryToProperty(property, inquiries)`: Matching algorithm (private)
- `markAsContacted(inquiryId)`: Marks inquiry as contacted
- `markNotificationSent(matchId)`: Marks match as viewed
- `getStats()`: Statistics (total, active, matched, contacted, closed)
- `getActiveInquiries()`: Fetches only active inquiries
- `getUnreadMatchesCount()`: Count of matches where `notification_sent = false`
- `getMatchesByInquiry(inquiryId)`: Fetches all matches for an inquiry

### Mock Service: `src/services/mockServices/mockInquiries.service.ts`
**NOTE:** Implement the same interface as real service, using mock data.

### `src/lib/serviceProxy.ts` Update
**NOTE:** `inquiriesService` should be added:
```typescript
export const inquiriesService = isDemoMode 
  ? mockInquiriesService 
  : realInquiriesService;
```

### `src/services/properties.service.ts` Update
**NOTE:** Matching trigger should be added to `create()` and `update()` methods:
```typescript
async create(property: PropertyInsert): Promise<Property> {
  const newProperty = await insertRow('properties', property);
  
  // NEW: Matching trigger
  if (newProperty.status === 'Empty') {
    await inquiriesService.checkMatchesForNewProperty(newProperty.id);
  }
  
  return newProperty;
}

async update(id: string, property: PropertyUpdate): Promise<Property> {
  const oldProperty = await this.getById(id);
  const updatedProperty = await updateRow('properties', id, property);
  
  // NEW: Matching trigger (if status changed to Empty)
  if (oldProperty?.status !== 'Empty' && updatedProperty.status === 'Empty') {
    await inquiriesService.checkMatchesForNewProperty(id);
  }
  
  return updatedProperty;
}
```

---

## 🎨 UI Components

### New Page: `src/features/inquiries/Inquiries.tsx`
**NOTE:** Should contain:
- Main list page
- Tabs: All, Active, Matched, Contacted, Closed
- Table view (desktop) + Card view (mobile)
- Columns: Name, Phone, Preferences, Matches Count, Status, Actions
- "Add New Inquiry" button
- Search/filter functionality

### New Dialog: `src/features/inquiries/InquiryDialog.tsx`
**NOTE:** Create/Edit form dialog, should contain the following fields:
- Name (required)
- Phone (required)
- Email (optional)
- Preferred City (input)
- Preferred District (input)
- Min Budget (numeric, optional)
- Max Budget (numeric, optional)
- Notes (textarea, optional)

### New Dialog: `src/features/inquiries/InquiryMatchesDialog.tsx`
**NOTE:** Inquiry detail modal, should display:
- Inquiry information
- Matched properties list
- For each match:
  - Property address, city, district
  - Rent amount (if available)
  - "View Property" link
  - "Contact" button (phone link)
  - "Mark as Contacted" button

### New Schema: `src/features/inquiries/inquirySchema.ts`
**NOTE:** For Zod schema validation:
```typescript
export const getInquirySchema = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    phone: z.string().min(1, t('validations.phoneRequired')),
    email: z.string().email(t('validations.invalidEmail')).optional().nullable(),
    preferred_city: z.string().optional().nullable(),
    preferred_district: z.string().optional().nullable(),
    min_budget: z.number().positive().optional().nullable(),
    max_budget: z.number().positive().optional().nullable(),
    notes: z.string().optional().nullable(),
  });
};
```

---

## 🛣️ Routing and Navigation

### `src/config/constants.ts` Update
**NOTE:** The following routes should be added:
```typescript
export const ROUTES = {
  // ... existing routes
  INQUIRIES: '/inquiries',
  INQUIRY_DETAIL: '/inquiries/:id',
} as const;
```

### `src/App.tsx` Update
**NOTE:** Route should be added:
```typescript
import { Inquiries } from './features/inquiries/Inquiries';

<Route
  path={ROUTES.INQUIRIES}
  element={
    <ProtectedRoute>
      <Inquiries />
    </ProtectedRoute>
  }
/>
```

### `src/components/layout/Sidebar.tsx` Update
**NOTE:** Navigation item should be added:
```typescript
const navigationItems = [
  // ... existing items
  { key: 'inquiries', href: ROUTES.INQUIRIES, icon: Search }, // or appropriate icon
];
```

---

## 🔔 Navbar Notification Badge

### `src/components/layout/Navbar.tsx` Update
**NOTE:** The following changes should be made:
- Add `unreadMatchesCount` state
- Add `loadUnreadMatchesCount()` function
- Call `loadUnreadMatchesCount()` in `useEffect`
- Badge display: `reminderCount + unreadMatchesCount` total

### `src/components/layout/Sidebar.tsx` Update
**NOTE:** Badge display on Inquiries navigation item (similar to reminders):
```typescript
{item.key === 'inquiries' && unreadMatchesCount > 0 && (
  <Badge>{unreadMatchesCount > 9 ? '9+' : unreadMatchesCount}</Badge>
)}
```

---

## 📊 Dashboard Updates

### `src/features/dashboard/Dashboard.tsx` Update
**NOTE:** The following changes should be made:
- Add `inquiryStats` state
- Call `inquiriesService.getStats()` in `loadStats()`
- Add new StatCard:
  ```typescript
  <StatCard
    title={t('stats.activeInquiries')}
    value={inquiryStats.active}
    description={t('stats.activeInquiriesDescription')}
    icon={<Search className={`h-4 w-4 ${COLORS.text.white}`} />}
    iconColor="blue"
    loading={loading}
  />
  ```

---

## 🏠 Property Dialog Update

### `src/features/properties/PropertyDialog.tsx` Update
**NOTE:** The following fields should be added:
- Rent Amount (numeric input, optional)
- Currency (select: USD/TRY, optional)

### `src/features/properties/propertySchema.ts` Update
**NOTE:** The following validations should be added:
```typescript
rent_amount: z.number().positive().optional().nullable(),
currency: z.enum(['USD', 'TRY']).optional().nullable(),
```

---

## 🌐 i18n Translations

### New Files (4 files)
**NOTE:** The following files should be created:
- `public/locales/en/inquiries.json`
- `public/locales/tr/inquiries.json`
- `src/locales/en/inquiries.json`
- `src/locales/tr/inquiries.json`

### Files to Update (12 files)
**NOTE:** Keys should be added to the following files:

1. `public/locales/en/navigation.json` → `"inquiries"` key
2. `public/locales/tr/navigation.json` → `"inquiries"` key
3. `src/locales/en/navigation.json` → `"inquiries"` key
4. `src/locales/tr/navigation.json` → `"inquiries"` key
5. `public/locales/en/dashboard.json` → `stats.activeInquiries` and `stats.activeInquiriesDescription` keys
6. `public/locales/tr/dashboard.json` → `stats.activeInquiries` and `stats.activeInquiriesDescription` keys
7. `src/locales/en/dashboard.json` → `stats.activeInquiries` and `stats.activeInquiriesDescription` keys
8. `src/locales/tr/dashboard.json` → `stats.activeInquiries` and `stats.activeInquiriesDescription` keys
9. `public/locales/en/properties.json` → `dialog.form.rentAmount`, `dialog.form.rentAmountPlaceholder`, `dialog.form.currency` keys
10. `public/locales/tr/properties.json` → `dialog.form.rentAmount`, `dialog.form.rentAmountPlaceholder`, `dialog.form.currency` keys
11. `src/locales/en/properties.json` → `dialog.form.rentAmount`, `dialog.form.rentAmountPlaceholder`, `dialog.form.currency` keys
12. `src/locales/tr/properties.json` → `dialog.form.rentAmount`, `dialog.form.rentAmountPlaceholder`, `dialog.form.currency` keys

### Example i18n Keys (`inquiries.json`)
```json
{
  "title": "Property Inquiries",
  "addNew": "Add New Inquiry",
  "table": {
    "name": "Name",
    "phone": "Phone",
    "preferences": "Preferences",
    "matches": "Matches",
    "status": "Status",
    "actions": "Actions"
  },
  "status": {
    "active": "Active",
    "matched": "Matched",
    "contacted": "Contacted",
    "closed": "Closed"
  },
  "dialog": {
    "addTitle": "Add New Inquiry",
    "editTitle": "Edit Inquiry",
    "form": {
      "name": "Name",
      "phone": "Phone",
      "email": "Email",
      "preferredCity": "Preferred City",
      "preferredDistrict": "Preferred District",
      "minBudget": "Min Budget",
      "maxBudget": "Max Budget",
      "notes": "Notes"
    }
  },
  "matches": {
    "title": "Matched Properties",
    "noMatches": "No matches found",
    "viewProperty": "View Property",
    "contact": "Contact",
    "markAsContacted": "Mark as Contacted"
  },
  "validations": {
    "nameRequired": "Name is required",
    "phoneRequired": "Phone is required",
    "invalidEmail": "Invalid email address"
  },
  "toasts": {
    "addSuccess": "Inquiry added successfully",
    "updateSuccess": "Inquiry updated successfully",
    "deleteSuccess": "Inquiry deleted successfully",
    "loadError": "Failed to load inquiries"
  }
}
```

---

## 🧠 Matching Algorithm Details

### In `inquiries.service.ts`
**NOTE:** `matchInquiryToProperty()` function should work with the following logic:

```typescript
private async matchInquiryToProperty(
  property: Property,
  activeInquiries: PropertyInquiry[]
): Promise<string[]> {
  // 1. Status check
  if (property.status !== 'Empty') {
    return [];
  }
  
  const matchedInquiryIds: string[] = [];
  
  for (const inquiry of activeInquiries) {
    let matches = true;
    
    // 2. City match (exact, case-insensitive)
    if (inquiry.preferred_city && property.city) {
      if (inquiry.preferred_city.toLowerCase().trim() !== 
          property.city.toLowerCase().trim()) {
        matches = false;
        continue;
      }
    }
    
    // 3. District match (optional, if specified, exact)
    if (inquiry.preferred_district && property.district) {
      if (inquiry.preferred_district.toLowerCase().trim() !== 
          property.district.toLowerCase().trim()) {
        matches = false;
        continue;
      }
    }
    
    // 4. Budget check (if both are present)
    if (inquiry.min_budget || inquiry.max_budget) {
      const propertyRent = property.rent_amount;
      if (propertyRent) {
        if (inquiry.min_budget && propertyRent < inquiry.min_budget) {
          matches = false;
          continue;
        }
        if (inquiry.max_budget && propertyRent > inquiry.max_budget) {
          matches = false;
          continue;
        }
      }
    }
    
    if (matches) {
      matchedInquiryIds.push(inquiry.id);
    }
  }
  
  return matchedInquiryIds;
}
```

**NOTE:** When a match is found:
1. Add record to `inquiry_matches` table
2. Update `inquiry.status` → `matched`
3. Mark `notification_sent = false`

---

## 📝 Implementation Sequence (Phases)

### ✅ Phase 1: Database & Types
**NOTE:** The following steps should be completed:
1. ✅ Create migration file (`create_property_inquiries_system.sql`)
2. ✅ Run migration and test
3. ✅ Update `src/types/database.ts` (new tables and property fields)
4. ✅ Update `src/types/index.ts` (new types)
5. ✅ Test types (TypeScript compile)

---

### ✅ Phase 2: Service Layer
**NOTE:** The following steps should be completed:
1. ✅ Create `src/services/inquiries.service.ts`
   - Implement all methods
   - Write matching algorithm
2. ✅ Create `src/services/mockServices/mockInquiries.service.ts`
   - Implement same interface with mock data
3. ✅ Update `src/lib/serviceProxy.ts`
   - Add `inquiriesService`
4. ✅ Update `src/services/properties.service.ts`
   - Add matching trigger to `create()` method
   - Add matching trigger to `update()` method
5. ✅ Test services (with mock data)

---

### ✅ Phase 3: Property Dialog Update
**NOTE:** The following steps should be completed:
1. ✅ Update `src/features/properties/PropertyDialog.tsx`
   - Add rent amount input field
   - Add currency select field
2. ✅ Update `src/features/properties/propertySchema.ts`
   - Add `rent_amount` and `currency` validation
3. ✅ Add i18n keys (properties.json - 4 files)
   - `dialog.form.rentAmount`
   - `dialog.form.rentAmountPlaceholder`
   - `dialog.form.currency`
4. ✅ Test Property Dialog (form submit, validation)

---

### ✅ Phase 4: Matching Algorithm Test
**NOTE:** The following steps should be completed:
1. ✅ Test matching algorithm with mock data
2. ✅ Check edge cases:
   - City match (case-insensitive)
   - District match (optional)
   - Budget check (min/max)
   - Status Empty check
3. ✅ Performance test (with many inquiries)

---

### ✅ Phase 5: UI Components - Inquiries Page
**NOTE:** The following steps should be completed:
1. ✅ Create `src/features/inquiries/Inquiries.tsx`
   - List page
   - Tabs: All, Active, Matched, Contacted, Closed
   - Table view (desktop) + Card view (mobile)
   - Search/filter functionality
2. ✅ Create `src/features/inquiries/InquiryDialog.tsx`
   - Create/Edit form
   - Add all fields
3. ✅ Create `src/features/inquiries/InquiryMatchesDialog.tsx`
   - Matched properties list
   - Contact and Mark as Contacted buttons
4. ✅ Create `src/features/inquiries/inquirySchema.ts`
   - Zod validation schema
5. ✅ Test Inquiries page (CRUD operations)

---

### ✅ Phase 6: Routing & Navigation
**NOTE:** The following steps should be completed:
1. ✅ Update `src/config/constants.ts`
   - Add `INQUIRIES` route
2. ✅ Update `src/App.tsx`
   - Add route
3. ✅ Update `src/components/layout/Sidebar.tsx`
   - Add navigation item
   - Add badge display (unreadMatchesCount)
4. ✅ Add i18n keys (navigation.json - 4 files)
   - `"inquiries"` key
   - `"viewAllInquiries"` key (optional)
5. ✅ Test navigation (is routing working)

---

### ✅ Phase 7: Navbar Notification Badge
**NOTE:** The following steps should be completed:
1. ✅ Update `src/components/layout/Navbar.tsx`
   - Add `unreadMatchesCount` state
   - Add `loadUnreadMatchesCount()` function
   - Update badge display (reminderCount + unreadMatchesCount)
2. ✅ Update `src/components/layout/Sidebar.tsx`
   - Badge display on Inquiries item
3. ✅ Test notification badge (with mock data)

---

### ✅ Phase 8: Dashboard
**NOTE:** The following steps should be completed:
1. ✅ Update `src/features/dashboard/Dashboard.tsx`
   - Add `inquiryStats` state
   - Call `inquiriesService.getStats()` in `loadStats()`
   - Add "Active Inquiries" StatCard
2. ✅ Add i18n keys (dashboard.json - 4 files)
   - `stats.activeInquiries`
   - `stats.activeInquiriesDescription`
3. ✅ Test Dashboard (is stat card visible, is data correct)

---

### ✅ Phase 9: i18n Translations
**NOTE:** The following steps should be completed:
1. ✅ Create `public/locales/en/inquiries.json`
   - Add all keys (title, table, status, dialog, matches, validations, toasts)
2. ✅ Create `public/locales/tr/inquiries.json`
   - Add Turkish translations
3. ✅ Create `src/locales/en/inquiries.json`
   - Add English keys (same as public)
4. ✅ Create `src/locales/tr/inquiries.json`
   - Add Turkish translations (same as public)
5. ✅ Test all i18n keys (language switching, are keys visible)

---

### ✅ Phase 10: Testing & Polish
**NOTE:** The following steps should be completed:
1. ✅ End-to-end test:
   - Create inquiry
   - Add property (matching trigger)
   - View matches
   - Contact
   - Close inquiry
2. ✅ Bug fix (if any)
3. ✅ UI/UX polish:
   - Loading states
   - Error handling
   - Empty states
   - Mobile responsive
4. ✅ Final review and documentation

---

## ⚠️ Important Notes

### 1. Matching Trigger
- Runs asynchronously after property create/update
- Should not block user experience
- Error handling should be added (property save should succeed even if matching fails)

### 2. Currency Conversion
- Currently, budget matching assumes inquiry and property have the same currency
- Currency conversion logic can be added in the future (USD ↔ TRY)

### 3. Performance
- Indexes are critical for matching when there are many inquiries
- Matching algorithm should be optimized (queries, filtering)

### 4. Notification Sent
- `notification_sent = true` is set when agent views the match
- When `InquiryMatchesDialog` is opened or match list is viewed

### 5. Status Transition
- `active` → `matched`: Automatic (when match is found)
- `matched` → `contacted`: Manual (when agent clicks "Mark as Contacted")
- `contacted` → `closed`: Manual (when agent clicks "Close Inquiry")

### 6. Multiple Matches
- An inquiry can match with multiple properties
- Each match is stored as a separate record in `inquiry_matches` table

---

## 📌 Checklist Summary

### Database
- [ ] Migration file created
- [ ] `property_inquiries` table created
- [ ] `inquiry_matches` table created
- [ ] `rent_amount` and `currency` added to `properties` table
- [ ] Indexes created
- [ ] RLS policies added

### Types
- [ ] `database.ts` updated
- [ ] `index.ts` updated
- [ ] New types added

### Services
- [ ] `inquiries.service.ts` created
- [ ] `mockInquiries.service.ts` created
- [ ] `serviceProxy.ts` updated
- [ ] `properties.service.ts` updated (matching trigger)

### UI Components
- [ ] `Inquiries.tsx` created
- [ ] `InquiryDialog.tsx` created
- [ ] `InquiryMatchesDialog.tsx` created
- [ ] `inquirySchema.ts` created

### Property Dialog
- [ ] Rent amount field added
- [ ] Currency field added
- [ ] Schema updated

### Routing & Navigation
- [ ] Route added
- [ ] Sidebar navigation added
- [ ] Badge display added

### Navbar
- [ ] Notification badge updated
- [ ] Unread matches count added

### Dashboard
- [ ] Active Inquiries stat card added
- [ ] Stats loading added

### i18n
- [ ] `inquiries.json` files created (4 files)
- [ ] `navigation.json` updated (4 files)
- [ ] `dashboard.json` updated (4 files)
- [ ] `properties.json` updated (4 files)

### Testing
- [ ] Matching algorithm tested
- [ ] UI components tested
- [ ] End-to-end test completed
- [ ] Bug fix completed

---

## 🎯 Conclusion

This plan contains all implementation steps for the Property Inquiries & Matching System. Each phase should be completed sequentially and tested. By following this plan, development can proceed systematically.

**Good luck! 🚀**

