

**SPRINT 1: FOUNDATION**

RealDesk CRM — US Market Adaptation

*Cursor AI Development Guide — Task-by-Task Breakdown*

| Sprint | 1 of 8 — Foundation Infrastructure |
| :---- | :---- |

| Duration | Weeks 1–2 (10 working days) |
| :---- | :---- |

| Goal | Replace all Turkish infrastructure with US equivalents. Every downstream feature depends on this sprint. |
| :---- | :---- |

| Dev Method | Cursor Agent (Composer / Auto mode) — each task is a standalone prompt |
| :---- | :---- |

| Branch | feature/sprint-1-us-foundation |
| :---- | :---- |

| SPRINT 1 OVERVIEW |
| :---- |

## **What This Sprint Delivers**

Sprint 1 transforms the Turkish CRM foundation into a US-ready platform. After this sprint, every form, every service, every database query speaks US English with US data formats. No visible feature changes to the user — but without this, nothing else works.

| Task | What Changes | Files Touched | Est. Hours |
| :---- | :---- | :---- | :---- |
| T1: Database Migration | Add US address columns, drop TR fields, add bank fields | 1 migration file | 2h |
| T2: US Address Service | Replace TR address logic with street/city/state/zip | address.service.ts \+ types | 3h |
| T3: US Phone Service | Replace TR phone with NANP (xxx) xxx-xxxx | phone.service.ts | 2h |
| T4: US Encryption/Validation | Replace TC/IBAN with Tax ID \+ routing/account | encryption.service.ts | 3h |
| T5: Contract Form Schema | Replace TR validators with US fields in Zod schema | contractForm.schema.ts | 3h |
| T6: Currency to USD-Only | Remove FX infrastructure, default everything to USD | currency.ts \+ 5 files | 3h |
| T7: Locale & i18n | English-only default, remove TR locale detection | localeDetection.ts \+ i18n config | 2h |
| T8: Service Proxy Update | Update barrel exports for renamed/new functions | serviceProxy.ts | 1h |
| T9: Constants & Config | Update app constants, default values, route prep | constants.ts \+ AuthContext | 2h |
| T10: TypeScript Cleanup | Fix all type errors from schema changes, run build | types/index.ts \+ affected files | 3h |

| TOTAL: \~24 hours of focused dev work \= 3–4 days with Cursor Agent |
| :---- |

| HOW TO USE THIS DOCUMENT WITH CURSOR |
| :---- |

## **Cursor Workflow**

Each task below is designed as a single Cursor Composer/Agent prompt. Copy the prompt, paste it into Cursor, and let it execute. Tasks are ordered by dependency — do them in sequence.

### **Prompt Structure per Task**

1. **Context:** Which files to @-reference in Cursor (always include CLAUDE.md)

2. **Exact Prompt:** Copy-paste ready prompt for Cursor Agent

3. **Expected Output:** What files Cursor should create/modify

4. **Verification:** How to test the change worked

5. **Depends On:** Which prior tasks must be complete first

### **Before You Start**

* Create branch: git checkout \-b feature/sprint-1-us-foundation

* Open CLAUDE.md in Cursor so it’s always in context

* Open US\_ADAPTATION\_PLAN.md for reference

* Run npm run dev to verify current build is clean

* Run npm run typecheck to verify zero TS errors before starting

| TASK 1: DATABASE MIGRATION — US Address & Bank Fields |
| :---- |

| Depends On | Nothing — this goes first |
| :---- | :---- |

| Files | supabase/migrations/\[timestamp\]\_us\_address\_and\_bank\_fields.sql |
| :---- | :---- |

| Estimated | 2 hours |
| :---- | :---- |

### **What This Does**

Adds US address columns (street\_address, unit, city, state, zip\_code) to properties, tenants, and property\_owners. Adds US bank fields (routing\_number\_encrypted, account\_number\_encrypted, tax\_id). Drops Turkish-specific columns (mahalle, cadde\_sokak, bina\_no, daire\_no, tc\_encrypted, iban\_encrypted, tc\_hash). Adds contract deposit fields.

### **Cursor Context (@-references)**

* @CLAUDE.md (architecture rules for migrations)

* @supabase/migrations/ (see existing migration patterns)

* @US\_ADAPTATION\_PLAN.md Section 2.4 (Address Model)

### **Cursor Prompt**

| Create a new Supabase migration file: supabase/migrations/\[timestamp\]\_us\_address\_and\_bank\_fields.sql This migration adapts the Turkish CRM database for the US market. \#\# PROPERTIES TABLE changes: 1\. ADD street\_address TEXT 2\. ADD unit TEXT (apartment/suite number, nullable) 3\. ADD zip\_code TEXT 4\. ADD mls\_id TEXT (nullable, for MLS listing number) 5\. ADD year\_built INTEGER (nullable, for lead paint disclosure) 6\. RENAME column "il" TO "state" (if exists, otherwise ADD state TEXT) 7\. RENAME column "ilce" TO "city" (if city doesnt exist already) 8\. DROP columns if they exist: mahalle, cadde\_sokak, bina\_no, daire\_no \#\# PROPERTY\_OWNERS TABLE changes: 1\. ADD routing\_number\_encrypted TEXT (nullable) 2\. ADD account\_number\_encrypted TEXT (nullable) 3\. ADD tax\_id TEXT (nullable, optional Tax ID/EIN) 4\. DROP columns if they exist: tc\_encrypted, iban\_encrypted \#\# TENANTS TABLE changes: 1\. ADD street\_address TEXT (nullable) 2\. ADD unit TEXT (nullable) 3\. ADD city TEXT (if not exists) 4\. ADD state TEXT (nullable) 5\. ADD zip\_code TEXT (nullable) 6\. DROP columns if they exist: tc\_encrypted, tc\_hash \#\# CONTRACTS TABLE changes: 1\. ADD deposit\_amount NUMERIC(10,2) (nullable) 2\. ADD deposit\_return\_deadline DATE (nullable) 3\. ADD deal\_id UUID REFERENCES deals(id) (nullable, FK added later) Rules: \- Use IF EXISTS / IF NOT EXISTS guards for idempotency \- DO NOT modify existing RLS policies \- Add comments explaining each section \- Follow existing migration patterns from the codebase \- Use ALTER TABLE ... DROP COLUMN IF EXISTS for safety \- Use ALTER TABLE ... ADD COLUMN IF NOT EXISTS for safety \- State should be TEXT (2-letter US state code like CA, TX, NY) \- zip\_code should be TEXT (supports 5 and 9 digit formats) |
| :---- |

### **Verification**

* Run: supabase db push

* Run: npm run gen:types (regenerate database.ts)

* Verify new columns appear in database.types.ts

* Verify dropped columns are gone from database.types.ts

| COMMIT: git commit \-m "feat(db): add US address, bank, and deposit fields to schema" |
| :---- |

| TASK 2: US ADDRESS SERVICE |
| :---- |

| Depends On | T1 (database migration) |
| :---- | :---- |

| Files | src/services/address.service.ts |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **What This Does**

Rewrites the address service from Turkish (mahalle/ilce/il) to US format (street/city/state/zip). Includes US state list, zip code validation, address formatting, and a Google Places autocomplete-ready interface.

### **Cursor Prompt**

| Rewrite src/services/address.service.ts for the US market. Current file uses Turkish address model (mahalle, cadde\_sokak, bina\_no, daire\_no, ilce, il). Replace with US address model. The new AddressComponents interface:   street\_address: string   // "123 Main St"   unit?: string            // "Apt 4B" (optional)   city: string             // "Austin"   state: string            // "TX" (2-letter code)   zip\_code: string         // "78701" or "78701-1234" Export these functions (keep same export pattern): 1\. normalizeAddress(input: string): string    \- Trim whitespace, normalize caps for display 2\. generateFullAddress(components: AddressComponents): string    \- Format: "123 Main St, Apt 4B, Austin, TX 78701"    \- Omit unit if empty 3\. parseAddress(fullAddress: string): Partial\<AddressComponents\>    \- Best-effort parse of a single-line address string    \- Try to extract state (2-letter) and zip (5 or 9 digit) 4\. isValidAddress(components: AddressComponents): boolean    \- street\_address required (min 3 chars)    \- city required    \- state must be valid 2-letter US state code    \- zip\_code must match /^\\d{5}(-\\d{4})?$/ 5\. addressesMatch(a: AddressComponents, b: AddressComponents): boolean    \- Case-insensitive comparison of all fields 6\. getShortAddress(components: AddressComponents): string    \- "123 Main St, Austin TX" (no zip, no unit) 7\. US\_STATES: Array\<{code: string, name: string}\>    \- All 50 states \+ DC, sorted alphabetically    \- Export as named constant for dropdowns 8\. isValidZipCode(zip: string): boolean    \- 5 digits or 5+4 format 9\. isValidState(state: string): boolean    \- Must be in US\_STATES list Keep the same export style as the existing file. Add JSDoc comments to every function. Make it work with the existing serviceProxy.ts pattern. |
| :---- |

### **Verification**

* Import in a test: generateFullAddress({ street\_address: '123 Main St', city: 'Austin', state: 'TX', zip\_code: '78701' }) should return '123 Main St, Austin, TX 78701'

* isValidAddress with missing state should return false

* US\_STATES should have 51 entries (50 states \+ DC)

* npm run typecheck passes

| COMMIT: git commit \-m "feat(address): replace Turkish address service with US format" |
| :---- |

| TASK 3: US PHONE SERVICE |
| :---- |

| Depends On | None (can run parallel with T2) |
| :---- | :---- |

| Files | src/services/phone.service.ts |
| :---- | :---- |

| Estimated | 2 hours |
| :---- | :---- |

### **Current File (to replace)**

The current phone.service.ts normalizes Turkish mobile numbers: removes \+90, validates starts-with-5, formats as 0539 217 47 82\.

### **Cursor Prompt**

| Rewrite src/services/phone.service.ts for US phone numbers. Current: Turkish mobile (10-digit starting with 5, \+90 prefix). New: US NANP format (10-digit, \+1 prefix). Keep EXACT same function names and exports (used in serviceProxy.ts): 1\. normalizePhone(phone: string): string    \- Strip all non-digits    \- Remove leading "1" if 11 digits (country code)    \- Return 10-digit string: "5125551234" 2\. formatPhoneForDisplay(phone: string): string    \- Input: "5125551234"    \- Output: "(512) 555-1234" 3\. isValidPhone(phone: string): boolean    \- Must be exactly 10 digits after normalization    \- Area code (first 3 digits) cannot start with 0 or 1    \- Exchange code (digits 4-6) cannot start with 0 or 1 4\. detectPhoneFormat(phone: string): "international" | "national" | "local" | "unknown"    \- "+1..." or "1..." (11 digits) \= international    \- "(xxx) xxx-xxxx" \= national    \- "xxxxxxxxxx" (10 digits) \= local    \- else \= unknown 5\. formatPhoneForStorage(phone: string): string    \- Returns "+1XXXXXXXXXX" for database storage Add JSDoc with examples like the current file. Keep the same export style (named exports, no class). |
| :---- |

### **Verification**

* normalizePhone('+1 (512) 555-1234') \=== '5125551234'

* formatPhoneForDisplay('5125551234') \=== '(512) 555-1234'

* isValidPhone('0125551234') \=== false (area code starts with 0\)

* isValidPhone('5125551234') \=== true

* npm run typecheck passes

| COMMIT: git commit \-m "feat(phone): replace Turkish phone service with US NANP format" |
| :---- |

| TASK 4: US ENCRYPTION & VALIDATION SERVICE |
| :---- |

| Depends On | T1 (database has new columns) |
| :---- | :---- |

| Files | src/services/encryption.service.ts |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **What Changes**

The encrypt() and decrypt() functions stay identical — AES-256-GCM works for any data. What changes: remove TC/IBAN validators, add US bank validators, rename hash function.

### **Cursor Prompt**

| Revise src/services/encryption.service.ts for the US market. KEEP UNCHANGED: \- encrypt() function (AES-256-GCM encryption) \- decrypt() function \- getEncryptionKey() function \- generateEncryptionKey() function REMOVE: \- isValidTC() — Turkish ID validation (11-digit TC Kimlik) \- isValidIBAN() — Turkish IBAN validation (TR \+ 24 digits) \- hashTC() — SHA-256 hash for TC Kimlik ADD: 1\. isValidRoutingNumber(routing: string): boolean    \- Must be exactly 9 digits    \- ABA checksum validation: d1\*3 \+ d2\*7 \+ d3\*1 \+ d4\*3 \+ d5\*7 \+ d6\*1 \+ d7\*3 \+ d8\*7 \+ d9\*1      must be divisible by 10    \- Add JSDoc with example 2\. isValidAccountNumber(account: string): boolean    \- Must be 4–17 digits    \- Strip dashes and spaces before validation 3\. isValidTaxId(taxId: string): boolean    \- Optional field — if empty string, return true    \- If provided: EIN format XX-XXXXXXX (2 digits, dash, 7 digits)    \- OR plain digits (9 digits total)    \- No SSN validation (V1 does not collect SSN) 4\. hashTaxId(taxId: string): Promise\<string\>    \- Same SHA-256 logic as old hashTC()    \- For duplicate detection on Tax ID IMPORTANT: Update JSDoc header comment to say "Encryption Service for US bank accounts and Tax IDs" instead of "TC Kimlik No and IBAN" |
| :---- |

### **Verification**

* isValidRoutingNumber('021000021') \=== true (Chase)

* isValidRoutingNumber('123456789') \=== false (bad checksum)

* isValidAccountNumber('1234567890') \=== true

* isValidTaxId('') \=== true (optional)

* isValidTaxId('12-3456789') \=== true (EIN format)

* encrypt() and decrypt() still work for any string

* npm run typecheck passes (no references to removed functions)

| COMMIT: git commit \-m "feat(encryption): replace TR identity validators with US bank/tax validation" |
| :---- |

| TASK 5: CONTRACT FORM SCHEMA — US Fields |
| :---- |

| Depends On | T2, T3, T4 (address, phone, encryption services) |
| :---- | :---- |

| Files | src/features/contracts/schemas/contractForm.schema.ts |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **What Changes**

This is the main contract creation form’s Zod validation schema. Currently requires Turkish TC Kimlik (11 digits), IBAN (TR+24), Turkish phone, and Turkish address fields (mahalle, ilce, il with Istanbul default). All must become US equivalents.

### **Current Fields to Replace**

| Current Field | Current Validation | New Field | New Validation |
| :---- | :---- | :---- | :---- |
| owner\_tc | 11 digits, isValidTC() | owner\_tax\_id | Optional, isValidTaxId() |
| owner\_iban | TR \+ 24 digits, isValidIBAN() | owner\_routing\_number | 9 digits, isValidRoutingNumber() |
| — | — | owner\_account\_number | 4-17 digits, isValidAccountNumber() |
| owner\_phone | 10 digits starting with 5 | owner\_phone | 10-digit NANP, isValidPhone() |
| tenant\_tc | 11 digits, isValidTC() | tenant\_tax\_id | Optional, isValidTaxId() |
| tenant\_phone | 10 digits starting with 5 | tenant\_phone | 10-digit NANP, isValidPhone() |
| mahalle | required string | — | REMOVED |
| cadde\_sokak | required string | street\_address | Required, min 3 chars |
| bina\_no | required string | unit | Optional |
| daire\_no | required string | — | REMOVED |
| ilce | required string | city | Required |
| il | default 'İstanbul' | state | Required, isValidState() |
| — | — | zip\_code | Required, isValidZipCode() |
| currency | default 'TRY' | currency | default 'USD' (hardcoded V1) |

### **Cursor Prompt**

| Rewrite src/features/contracts/schemas/contractForm.schema.ts to replace all Turkish fields with US equivalents. Reference the updated services: \- Import { isValidPhone } from "@/lib/serviceProxy" \- Import { isValidRoutingNumber, isValidAccountNumber, isValidTaxId } from "@/lib/serviceProxy" \- Import { isValidState, isValidZipCode } from "@/lib/serviceProxy" Owner section changes: \- owner\_tc (remove) → owner\_tax\_id (optional string, validate with isValidTaxId if provided) \- owner\_iban (remove) → owner\_routing\_number (required, 9 digits, isValidRoutingNumber)                       \+ owner\_account\_number (required, 4-17 digits, isValidAccountNumber) \- owner\_phone: keep field name, change validation to US isValidPhone() Tenant section changes: \- tenant\_tc (remove) → tenant\_tax\_id (optional string, validate with isValidTaxId if provided) \- tenant\_phone: keep field name, change validation to US isValidPhone() Address section changes: \- Remove: mahalle, cadde\_sokak, bina\_no, daire\_no \- Add: street\_address (required, min 3 chars) \- Add: unit (optional string) \- Keep/Add: city (required, was ilce) \- Add: state (required, must pass isValidState()) \- Add: zip\_code (required, must pass isValidZipCode()) Financial defaults: \- currency default: "USD" (was "TRY") Update contractFormDefaultValues: \- Remove: mahalle, cadde\_sokak, bina\_no, daire\_no, il, ilce \- Remove: owner\_tc, owner\_iban, tenant\_tc \- Add: street\_address: "", unit: "", state: "", zip\_code: "" \- Add: owner\_tax\_id: "", owner\_routing\_number: "", owner\_account\_number: "" \- Add: tenant\_tax\_id: "" \- Change: currency: "USD" Keep the same Zod pattern and i18n translation keys. Update ContractFormData type export. |
| :---- |

### **Verification**

* No reference to isValidTC, isValidIBAN, mahalle, il, cadde\_sokak anywhere

* Default currency is 'USD'

* State validation requires 2-letter US state code

* npm run typecheck passes

* Every component importing contractFormSchema still compiles

| COMMIT: git commit \-m "feat(schema): replace TR contract form schema with US fields" |
| :---- |

| TASK 6: CURRENCY — USD-Only Simplification |
| :---- |

| Depends On | None (can run parallel) |
| :---- | :---- |

| Files Affected | 6 files (see list below) |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **Strategy**

V1 is USD-only. We don’t delete the multi-currency infrastructure entirely — we simplify it. The formatCurrency() function stays (it uses Intl.NumberFormat which already handles USD). We remove the FX fetch, the exchange rate card, and default everything to USD.

### **Cursor Prompt**

| Simplify the app to USD-only for V1. Make these changes: 1\. src/lib/currency.ts:    \- Keep formatCurrency() as-is (it already works with USD)    \- Remove or comment out: fetchExchangeRates(), getExchangeRate(),      getCurrentExchangeRates(), getExchangeRatesTimestamp()    \- Remove: convertWithHistoricalRate(), getRateForDate() imports    \- Remove: EXCHANGE\_RATES\_CACHE\_KEY, ExchangeRatesCache type    \- Remove: initializeExchangeRates(), FALLBACK\_RATES    \- Add: export const DEFAULT\_CURRENCY \= "USD"    \- Keep the file — formatCurrency is used everywhere 2\. src/features/dashboard/components/ExchangeRatesCard.tsx:    \- Delete this file entirely (shows TRY exchange rates)    \- Remove its import/usage from the dashboard page 3\. src/services/finance/exchangeRates.service.ts:    \- Delete this file entirely    \- Remove its export from finance/index.ts if present 4\. src/contexts/AuthContext.tsx:    \- Find defaultCommissionRate or similar defaults    \- Change any "TRY" default to "USD"    \- Change commissionRate default from 4.0 to 3.0 (US average) 5\. All files with hardcoded "TRY":    \- Search entire src/ for string "TRY" (case-sensitive)    \- Replace with "USD" where it is a currency default    \- Do NOT change translation keys or variable names containing "try" 6\. src/features/finance/components/\* (any currency selector):    \- If there is a currency dropdown, default to "USD"    \- Keep the dropdown functional (for future multi-currency)    \- Just change the default selection Do NOT delete supabase/functions/fetch-exchange-rates yet — we will handle edge functions in a separate cleanup task. |
| :---- |

### **Verification**

* grep \-r '"TRY"' src/ should return zero results (except translation files)

* Dashboard loads without ExchangeRatesCard

* Finance forms default to USD

* formatCurrency(1234.50, 'USD') returns '$1,234.50'

* npm run typecheck passes

* npm run build succeeds

| COMMIT: git commit \-m "feat(currency): simplify to USD-only, remove FX infrastructure" |
| :---- |

| TASK 7: LOCALE & i18n — English-Only Default |
| :---- |

| Depends On | None (can run parallel) |
| :---- | :---- |

| Files | src/lib/localeDetection.ts, src/i18n.ts (or i18n config), date-fns imports |
| :---- | :---- |

| Estimated | 2 hours |
| :---- | :---- |

### **Cursor Prompt**

| Make the app English-only for V1 US launch: 1\. src/lib/localeDetection.ts (or wherever locale detection lives):    \- Remove Turkey geolocation detection    \- Default locale: "en"    \- Default currency: "USD"    \- Remove any navigator.language \=== "tr" logic    \- Simplify to always return { locale: "en", currency: "USD" } 2\. i18n configuration (src/i18n.ts or similar):    \- Change defaultNS or lng from "tr" to "en"    \- Change fallbackLng from "tr" to "en"    \- Keep Turkish locale files in public/locales/tr/ (dont delete)    \- But make "en" the primary and only active locale 3\. All date-fns locale imports:    \- Search for: import { tr } from "date-fns/locale"    \- Replace with: import { enUS } from "date-fns/locale"    \- Update all format() calls using locale: tr to locale: enUS    \- Check: useContractPdfHandler.ts, any date formatting utils 4\. MONTH\_NAMES\_TR in src/services/commissions.service.ts:    \- Replace Turkish month array with English:      \["January","February",...,"December"\]    \- Or better: use Intl.DateTimeFormat("en-US", { month: "long" })    \- Rename constant to MONTH\_NAMES 5\. Any hardcoded Turkish strings outside i18n:    \- Search for Turkish characters: İ, ı, Ş, ş, Ğ, ğ, Ö, ö, Ü, ü, Ç, ç    \- If in component code (not locale files), replace with English Do NOT delete public/locales/tr/ directory. Do NOT remove i18next or useTranslation hooks. |
| :---- |

### **Verification**

* App loads in English by default (no flash of Turkish)

* All date formats show English months (April, not Nisan)

* Commission service uses English month names

* npm run build succeeds

| COMMIT: git commit \-m "feat(i18n): set English as default locale, replace TR date formats" |
| :---- |

| TASK 8: SERVICE PROXY UPDATE |
| :---- |

| Depends On | T2, T3, T4 (all services rewritten) |
| :---- | :---- |

| Files | src/lib/serviceProxy.ts |
| :---- | :---- |

| Estimated | 1 hour |
| :---- | :---- |

### **What Changes**

serviceProxy.ts is the barrel export file for all services. It currently exports hashTC, isValidTC, isValidIBAN from encryption. These no longer exist. Update to export the new US functions.

### **Cursor Prompt**

| Update src/lib/serviceProxy.ts to reflect the US service changes. Current encryption exports:   export { encrypt, decrypt, hashTC, isValidTC, isValidIBAN, generateEncryptionKey }     from "../services/encryption.service"; Replace with:   export { encrypt, decrypt, hashTaxId, isValidRoutingNumber,     isValidAccountNumber, isValidTaxId, generateEncryptionKey }     from "../services/encryption.service"; Current phone exports (keep same names):   export { normalizePhone, formatPhoneForDisplay, isValidPhone,     detectPhoneFormat } from "../services/phone.service"; Add new phone export:   Also export formatPhoneForStorage from phone.service Current address exports (keep structure, types may change):   export { normalizeAddress, generateFullAddress, parseAddress,     isValidAddress, addressesMatch, getShortAddress }     from "../services/address.service";   export type { AddressComponents } from "../services/address.service"; Add new address exports:   Also export US\_STATES, isValidZipCode, isValidState   from address.service Remove any exchange rate related exports if present. |
| :---- |

### **Verification**

* No import errors from serviceProxy anywhere in the app

* Search for 'hashTC' in entire codebase — should only appear in serviceProxy and encryption.service

* Search for 'isValidTC' — should be zero results outside the removed code

* npm run typecheck passes

| COMMIT: git commit \-m "feat(proxy): update service proxy exports for US services" |
| :---- |

| TASK 9: CONSTANTS & CONFIG UPDATES |
| :---- |

| Depends On | T6 (currency defaults) |
| :---- | :---- |

| Files | src/config/constants.ts, src/contexts/AuthContext.tsx |
| :---- | :---- |

| Estimated | 2 hours |
| :---- | :---- |

### **Cursor Prompt**

| Update config files for US market: 1\. src/config/constants.ts:    \- Change APP\_NAME from "emlakcrm" to "realdesk"    \- Add new constant: DEFAULT\_CURRENCY \= "USD"    \- Add new constant: DEFAULT\_COMMISSION\_RATE \= 3.0    \- Add new constant: DEFAULT\_LOCALE \= "en"    \- Keep all existing ROUTES (no new routes in Sprint 1\)    \- Keep all existing status constants 2\. src/contexts/AuthContext.tsx:    \- Find any default preferences object that sets currency    \- Change currency default from "TRY" to "USD"    \- Find commissionRate default, change from 4.0 to 3.0    \- Find any locale default, change from "tr" to "en" 3\. src/features/quick-add/\* (quick entity creation):    \- Find currency default in any quick-add form    \- Change from "TRY" to "USD" 4\. Landing page demo data (if exists in Sprint 1 scope):    \- src/features/landing/components/Hero.tsx    \- Replace Istanbul/Kadikoy/Besiktas references with:      "Austin, TX · For Rent", "Miami, FL · For Sale"    \- This is a quick-win that signals the US pivot immediately |
| :---- |

| COMMIT: git commit \-m "feat(config): update constants and defaults for US market" |
| :---- |

| TASK 10: TYPESCRIPT CLEANUP & BUILD VERIFICATION |
| :---- |

| Depends On | ALL previous tasks (T1–T9) |
| :---- | :---- |

| Files | Multiple — every file with type errors |
| :---- | :---- |

| Estimated | 3 hours |
| :---- | :---- |

### **What This Does**

After all the service and schema changes, there will be TypeScript errors throughout the codebase. Components that reference owner\_tc, owner\_iban, mahalle, ilce, il, TRY defaults, etc. will all break. This task fixes every single one.

### **Cursor Prompt**

| Fix all TypeScript errors caused by the US market migration. Run npm run typecheck and fix every error. Common patterns: 1\. Components referencing removed fields:    \- owner\_tc, owner\_iban → owner\_tax\_id, owner\_routing\_number, owner\_account\_number    \- tenant\_tc → tenant\_tax\_id    \- mahalle, cadde\_sokak, bina\_no, daire\_no → street\_address, unit    \- il (default Istanbul) → state    \- ilce → city 2\. Service calls referencing removed functions:    \- isValidTC() → isValidTaxId()    \- isValidIBAN() → isValidRoutingNumber() \+ isValidAccountNumber()    \- hashTC() → hashTaxId() 3\. Contract service queries referencing old columns:    \- contracts.service.ts: check select() queries for il, ilce    \- Replace with state, city in join queries    \- Check: property:properties(id, address, city, district, il, ilce)    \- Change to: property:properties(id, street\_address, city, state, zip\_code) 4\. Type definitions:    \- src/types/index.ts — any interfaces referencing old fields    \- Update ContractWithDetails if it references TR fields 5\. Form components (in src/features/contracts/components/):    \- Any form rendering owner\_tc, owner\_iban inputs    \- Replace with owner\_tax\_id, owner\_routing\_number, owner\_account\_number inputs    \- Update labels from Turkish to English 6\. PDF generation (src/services/contractPdf\*.ts):    \- References to owner\_tc, tenant\_tc in PDF fields    \- Replace with tax\_id fields    \- Note: Full PDF rewrite is Sprint 6, just fix type errors now 7\. Duplicate check service (duplicateCheck.service.ts):    \- Any Turkish labels (Telefon:, etc.) → English (Phone:, etc.) After fixing all errors: \- npm run typecheck should show 0 errors \- npm run build should succeed \- npm run lint should pass (fix any lint issues) |
| :---- |

### **Final Verification Checklist**

| Check | Command | Expected Result |
| :---- | :---- | :---- |
| TypeScript | npm run typecheck | 0 errors |
| Build | npm run build | Success, dist/ generated |
| Lint | npm run lint | 0 errors (warnings OK) |
| No TR remnants | grep \-r 'isValidTC\\|isValidIBAN\\|hashTC' src/ | 0 results |
| No TR defaults | grep \-r '"TRY"' src/ \--include='\*.ts' \--include='\*.tsx' | 0 results (except locale JSONs) |
| No TR address | grep \-r 'mahalle\\|cadde\_sokak\\|bina\_no\\|daire\_no' src/ | 0 results |
| USD default | grep \-r 'DEFAULT\_CURRENCY' src/config/ | "USD" |
| EN default | grep \-r 'defaultNS\\|fallbackLng\\|lng' src/ | "en" (not "tr") |

| COMMIT: git commit \-m "fix(types): resolve all TypeScript errors from US migration" |
| :---- |

| FINAL: git push origin feature/sprint-1-us-foundation → Create PR for review |
| :---- |

| SPRINT 1 COMPLETION CHECKLIST |
| :---- |

## **Definition of Done**

| ✓ | Criteria | How to Verify |
| :---- | :---- | :---- |
| □ | Database has US address columns on properties, tenants, owners | Check database.types.ts after gen:types |
| □ | Database has routing\_number\_encrypted \+ account\_number\_encrypted | Check database.types.ts |
| □ | No TC Kimlik or IBAN references in application code | grep \-r returns 0 |
| □ | Phone validation uses US NANP format | (512) 555-1234 format works |
| □ | Address service exports US\_STATES with 51 entries | Import and check .length |
| □ | Contract form schema uses US fields | Open contract creation form |
| □ | All currency defaults are USD | grep \-r '"TRY"' returns 0 in src/ |
| □ | App loads in English by default | Open app, verify language |
| □ | Date formats use English months | Check any date display |
| □ | Dashboard loads without exchange rate card | Open dashboard |
| □ | npm run typecheck: 0 errors | Run command |
| □ | npm run build: success | Run command |
| □ | App launches and all pages load | Manual smoke test |
| □ | All 10 commits made on feature branch | git log |

## **What Sprint 2 Needs From This**

Sprint 2 (Lead Pipeline \+ Buyer-Agent Agreement) will:

* Use the new US\_STATES dropdown in lead and agreement forms

* Use the new US phone validation for lead phone numbers

* Use USD as default currency for commission estimates on agreements

* Build on the contracts.deal\_id FK for linking deals to contracts

* Reference the address service for property-lead matching by state/city/zip

*END OF SPRINT 1 DOCUMENT*