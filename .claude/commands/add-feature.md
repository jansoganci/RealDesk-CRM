---
description: Generate complete feature boilerplate following Real Estate CRM patterns
---

# Add New Feature

You are helping to create a new feature for the Real Estate CRM application. Follow these steps to generate all necessary files following the established patterns:

## Required Information

First, ask the user for:
1. **Feature name** (e.g., "appointments", "documents", "reports")
2. **Feature display name** (e.g., "Appointments", "Documents", "Reports")
3. **Turkish translation** of the feature name
4. **Main entities** the feature will manage (if applicable)

## Steps to Complete

### 1. Create Feature Directory Structure

Create the following structure in `src/features/[feature-name]/`:
```
src/features/[feature-name]/
├── [FeatureName].tsx          # Main page component
├── components/                 # Feature-specific components
│   ├── [FeatureName]List.tsx  # List view
│   ├── [FeatureName]Form.tsx  # Form dialog
│   └── [FeatureName]Card.tsx  # Mobile card view
└── hooks/                      # Feature-specific hooks (if needed)
```

### 2. Create Service Layer

Create `src/services/[feature-name].service.ts` following this pattern:
- Use TypeScript class with proper typing
- Implement standard CRUD methods: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Always inject `user_id` using `getAuthenticatedUserId()` for RLS
- Use helper functions from `src/lib/db.ts` (`insertRow`, `updateRow`)
- Export singleton instance: `export const [featureName]Service = new [FeatureName]Service();`

### 3. Add to Service Proxy

Update `src/lib/serviceProxy.ts`:
- Import real service
- Create mock service (optional, for demo mode)
- Add Proxy wrapper following existing pattern
- Export type and proxied service

### 4. Create Database Migration

Create `supabase/migrations/[timestamp]_create_[feature-name]_table.sql`:
- Add comprehensive header comment explaining the table
- Include `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- Include `user_id uuid NOT NULL` for RLS
- Include `created_at` and `updated_at` timestamps
- Add proper foreign key constraints with `ON DELETE CASCADE`
- Add check constraints for enum fields
- Create indexes on foreign keys and frequently queried columns
- Enable RLS: `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;`
- Create RLS policies for SELECT, INSERT, UPDATE, DELETE using `auth.uid() = user_id`

### 5. Update TypeScript Types

Add types to `src/types/index.ts`:
```typescript
export interface [FeatureName] {
  id: string;
  user_id: string;
  // ... other fields
  created_at: string;
  updated_at: string;
}

export type [FeatureName]Insert = Omit<[FeatureName], 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type [FeatureName]Update = Partial<[FeatureName]Insert>;
```

### 6. Add Route Configuration

Update `src/config/constants.ts`:
```typescript
export const ROUTES = {
  // ... existing routes
  [FEATURE_NAME_UPPER]: '/[feature-name]',
  [FEATURE_NAME_UPPER]_DETAIL: '/[feature-name]/:id',
  [FEATURE_NAME_UPPER]_NEW: '/[feature-name]/new',
} as const;
```

### 7. Add Route to App

Update `src/App.tsx`:
```typescript
import { [FeatureName] } from './features/[feature-name]/[FeatureName]';

// In Routes:
<Route
  path={ROUTES.[FEATURE_NAME_UPPER]}
  element={
    <ProtectedRoute>
      <[FeatureName] />
    </ProtectedRoute>
  }
/>
```

### 8. Add Navigation Item

Update `src/components/layout/Sidebar.tsx`:
- Add icon import from `lucide-react`
- Add navigation item in the appropriate section
- Use i18n key: `{t('navigation.[feature-name]')}`

### 9. Create i18n Translation Files

Create both:
- `public/locales/tr/[feature-name].json`
- `public/locales/en/[feature-name].json`

Include standard keys:
```json
{
  "title": "Feature Title",
  "add": "Add New",
  "edit": "Edit",
  "delete": "Delete",
  "confirmDelete": "Are you sure?",
  "success": "Success",
  "error": "Error",
  "fields": {
    "name": "Name",
    // ... field names
  }
}
```

Also update `public/locales/tr/navigation.json` and `public/locales/en/navigation.json` with navigation item.

### 10. Create Main Page Component

Create the main page following this pattern:
- Import necessary dependencies
- Use `MainLayout` wrapper
- Use `PageContainer` for consistent styling
- Implement responsive design (cards on mobile, table on desktop)
- Use `EmptyState` when no data
- Use design system colors from `src/config/colors.ts`
- Add loading states
- Add error handling with toast notifications
- Use i18n with `useTranslation('[feature-name]')`

### 11. Apply Design System

Follow the design system from `src/config/colors.ts`:
- Use `COLORS.primary.bgGradient` for primary buttons
- Use `COLORS.success.bgGradient` for success actions
- Use `getStatusBadgeClasses()` for status badges
- Use `getCardClasses()` for cards
- Ensure mobile-first responsive design (min 44px touch targets)

## Example Implementation

Would you like me to generate all these files for your new feature? Please provide:
1. Feature name (singular, lowercase)
2. Feature display name (for UI)
3. Turkish translation
4. Brief description of what this feature manages
