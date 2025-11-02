# i18n & Multi-Currency Audit Report

This report analyzes the Fortunia web app to assess its readiness for internationalization (i18n) and multi-currency support.

## 1. Presence of Localization System

- **Finding:** The codebase currently lacks any formal i18n or localization system. There are no libraries like `react-i18next` or `i18next` integrated into the application.
- **Impact:** All user-facing strings are hardcoded in English, making it impossible to switch languages without significant code changes.

## 2. Hardcoded English Strings in UI Components

- **Finding:** A thorough review of the UI components in `src/features` and `src/components` reveals that all text is hardcoded in English. This includes labels, buttons, titles, error messages, and placeholders.
- **Impact:** Every string in the UI will need to be extracted and replaced with a key that can be translated.

## 3. Language Field Handling

- **Finding:** There is no concept of a language field in the data models for users, tenants, or any other entity. The backend and frontend do not exchange any information about the user's preferred language.
- **Impact:** The application has no way of knowing which language to display to the user.

## 4. Pricing/Currency Handling Logic

- **Finding:** The `contracts` table in the database contains `rent_amount` and `expected_new_rent` fields of type `number`. There is no corresponding currency field, indicating that the application assumes a single, unspecified currency (likely USD or a local currency). The frontend and backend services treat these values as simple numbers without any currency context.
- **Impact:** The application cannot handle multiple currencies, and there is a risk of misinterpreting monetary values if the user assumes a different currency.

## 5. Exchange Rate API or Currency Selector

- **Finding:** There is no integration with any exchange rate API, nor is there a UI component for users to select their preferred currency.
- **Impact:** The application cannot convert between currencies, and the user has no control over how monetary values are displayed.

## 6. Storage of User Preferences

- **Finding:** The `AuthContext` and user-related data models do not include any fields for storing the user's preferred language or currency.
- **Impact:** The application cannot remember a user's preferences across sessions.

## 7. List of Affected Modules/Files for Implementation

The following is a non-exhaustive list of files and directories that will require significant modification:

- **`src/features/**/*.tsx`:** All files in this directory will need to have their hardcoded strings extracted.
- **`src/components/**/*.tsx`:** All common and UI components will need to be updated to use the i18n system.
- **`src/types/database.ts`:** The database schema will need to be updated to include currency fields for contracts and user preference fields.
- **`src/services/**/*.ts`:** Backend services will need to be updated to handle currency information.
- **`src/contexts/AuthContext.tsx`:** The `AuthContext` will need to be extended to manage user language and currency preferences.
- **`package.json`:** New i18n libraries will need to be added.
- **`supabase/migrations/*`:** New migrations will be needed to update the database schema.

## 8. Hardcoded String Inventory

## 8. Hardcoded String Inventory

This section details the extent of hardcoded English strings found across the application's user-facing components. This inventory is a starting point and may not be exhaustive.

### `src/components/properties/PhotoManagement.tsx`
- `gallery` (value for TabsTrigger)
- `upload` (value for TabsTrigger)

### `src/components/properties/PhotoGallery.tsx`
- `No photos yet`
- `Upload photos to showcase this property`
- `Drag to reorder` (aria-label)
- `Move up` (aria-label)
- `Move down` (aria-label)
- `Delete photo` (aria-label)
- `Primary` (Badge content)

### `src/components/ui/carousel.tsx`
- `Previous slide` (sr-only)
- `Next slide` (sr-only)

### `src/components/ui/dialog.tsx`
- `Close` (sr-only)

### `src/components/ui/breadcrumb.tsx`
- `More` (sr-only)

### `src/components/layout/MainLayout.tsx`
- `Exit Demo` (sr-only)

### `src/features/properties/Properties.tsx`
- `Properties` (title)
- `Search properties...` (searchPlaceholder)
- `Filter by status` (filterPlaceholder)
- `Add Property` (addButtonLabel)
- `Actions` (TableHead)
- `Add Tenant` (Button)

### `src/features/dashboard/Dashboard.tsx`
- `Dashboard` (title)
- `Total Properties` (title)
- `Occupied` (title)
- `Currently rented` (description)
- `Total Tenants` (title)
- `Total tenants` (description)
- `Active Contracts` (title)
- `Current leases` (description)
- `View All` (button text)

### `src/features/reminders/Reminders.tsx`
- `Contract Ended` (Badge)
- `Property Owner Contact:` (text)
- `Error Loading Reminders` (h3)
- `Reload` (button text)
- `No Active Reminders` (title)
- `Enable rent increase reminders when creating or editing contracts to track when to contact property owners about rent increases.` (description)
- `overdue` (value for TabsTrigger)
- `upcoming` (value for TabsTrigger)
- `scheduled` (value for TabsTrigger)
- `expired` (value for TabsTrigger)
- `All Clear!` (title)
- `No overdue reminders` (description)
- `Nothing Coming Up` (title)
- `No upcoming reminders` (description)
- `No Scheduled Reminders` (title)
- `No reminders are scheduled for the future` (description)
- `No Expired Contracts` (title)
- `No expired contracts with pending reminders` (description)

### `src/features/properties/PropertyDialog.tsx`
- `Select an owner` (placeholder)
- `Address *` (Label)
- `123 Main St, Apt 4B` (placeholder)
- `City` (Label)
- `City name` (placeholder)
- `District` (Label)
- `Status *` (Label)
- `Select status` (placeholder)
- `Empty` (SelectItem)
- `Occupied` (SelectItem)
- `Inactive` (SelectItem)
- `Notes` (Label)
- `Additional information about the property...` (placeholder)

### `src/features/owners/OwnerDialog.tsx`
- `John Doe` (placeholder)
- `john@example.com` (placeholder)
- `123 Main St, City, State` (placeholder)
- `Additional notes about this owner...` (placeholder)

### `src/features/contracts/ContractDialog.tsx`
- `Select a tenant` (placeholder)
- `Select a property` (placeholder)
- `Start Date *` (Label)
- `End Date *` (Label)
- `Monthly Rent Amount` (Label)
- `1000.00` (placeholder)
- `Currency` (Label)
- `Select currency` (placeholder)
- `USD` (SelectItem)
- `TRY` (SelectItem)
- `Status *` (Label)
- `Select status` (placeholder)
- `Active` (SelectItem)
- `Archived` (SelectItem)
- `Inactive` (SelectItem)
- `Contract PDF (Optional)` (Label)
- `Upload a PDF copy of the signed contract` (p)
- `Notes` (Label)
- `Additional contract information...` (placeholder)
- `Rent Increase Reminder` (Label)
- `Get reminded to contact owner about rent increase` (p)
- `Remind me (days before end)` (Label)
- `Select days` (placeholder)
- `30 days (1 month)` (SelectItem)
- `60 days (2 months)` (SelectItem)
- `90 days (3 months)` (SelectItem)
- `120 days (4 months)` (SelectItem)
- `180 days (6 months)` (SelectItem)
- `Expected New Rent (Optional)` (Label)
- `1200.00` (placeholder)
- `Reminder Notes (Optional)` (Label)
- `e.g., Owner wants 10% increase, market rate is $1200...` (placeholder)

### `src/features/owners/Owners.tsx`
- `Property Owners` (title)
- `Search owners...` (searchPlaceholder)
- `Add Owner` (addButtonLabel)
- `Properties` (TableHead)
- `Actions` (TableHead)

### `src/features/tenants/EnhancedTenantEditDialog.tsx`
- `Step` (span)
- `of` (span)
- `% Complete` (span)

### `src/features/tenants/steps/TenantInfoStep.tsx`
- `Tenant Information` (h3)
- `Full Name *` (Label)
- `John Doe` (placeholder)
- `Phone Number` (Label)
- `Email Address` (Label)
- `Additional Notes` (Label)
- `Any additional information about the tenant...` (placeholder)

### `src/features/tenants/steps/ContractDetailsStep.tsx`
- `Contract Details` (h3)
- `Select a property` (placeholder)
- `Contract Status` (Label)
- `Active` (SelectItem)
- `Inactive` (SelectItem)
- `Archived` (SelectItem)

### `src/features/tenants/steps/ContractSettingsStep.tsx`
- `Contract Settings & Upload` (h3)
- `Additional notes for rent increase reminders...` (placeholder)

### `src/features/auth/Login.tsx`
- `Email` (Label)
- `Password` (Label)
- `Already have an account?` (text)
- `Don't have an account?` (text)
# Implementation Roadmap

Here is a 5-step roadmap for adding bilingual (EN/TR) and multi-currency (USD/TRY) support:

## Step 1: Integrate an i18n Framework

1.  **Choose and install an i18n library:** `react-i18next` with `i18next` is a popular and robust choice.
2.  **Configure the i18n instance:** Set up the supported languages (EN, TR), default language, and the location of translation files.
3.  **Create translation files:** Create JSON files for English and Turkish translations, initially with a few sample strings.
4.  **Wrap the application:** Wrap the root component in an `I18nextProvider` to make the translation functions available throughout the component tree.

## Step 2: Externalize Strings

1.  **Go through each UI component:** Systematically replace all hardcoded English strings with the `t()` function from `react-i18next`.
2.  **Populate translation files:** As you extract strings, add them to the English and Turkish translation files.
3.  **Handle pluralization and formatting:** Use the features of the i18n library to handle pluralization and date/number formatting.

## Step 3: Implement Language Switching

1.  **Create a language selector:** Add a language switcher component to the UI (e.g., in the navbar).
2.  **Store user's language preference:**
    *   Add a `language` field to the user's profile or a new `user_preferences` table in the database.
    *   Update the `AuthContext` to load and store the user's language preference.
    *   On language change, update the user's preference in the database and in the `AuthContext`.
3.  **Load the correct language:** When the application loads, use the user's preferred language from the `AuthContext` to initialize the i18n library.

## Step 4: Add Multi-Currency Support to the Backend

1.  **Update the database schema:**
    *   Add a `currency` column (e.g., of type `text`) to the `contracts` table to store the currency for each rent amount (e.g., 'USD', 'TRY').
    *   Add a `currency` field to the user's profile or `user_preferences` table.
2.  **Update backend services:** Modify the `contracts.service.ts` and any related services to read and write the `currency` field along with the `rent_amount`.
3.  **Create database migrations:** Write and apply the necessary Supabase migrations to alter the tables.

## Step 5: Implement Currency Switching and Formatting in the Frontend

1.  **Create a currency selector:** Add a UI component for the user to select their preferred currency (e.g., in the user settings).
2.  **Store user's currency preference:**
    *   Update the `AuthContext` to load and store the user's currency preference.
    *   On currency change, update the user's preference in the database and in the `AuthContext`.
3.  **Implement a currency conversion mechanism:**
    *   Integrate with a reliable exchange rate API to fetch the latest USD/TRY exchange rates.
    *   Create a utility function to format monetary values according to the user's selected currency and locale.
4.  **Update UI components:**
    *   In all components that display monetary values, use the currency formatting function to display the correct currency symbol and format.
    *   When displaying amounts that are not in the user's preferred currency, either show the original amount with its currency or convert it to the user's preferred currency and display both.
