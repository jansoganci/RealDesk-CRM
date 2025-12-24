# Owners Page Optimization Plan

## 📊 Phase 1: Service Payload Optimization
**Goal:** Reduce data transfer by fetching only required columns.

- **File:** `src/services/owners.service.ts`
- **Current Issue:** Uses `select('*')` which includes sensitive and heavy encrypted fields (TC ID, IBAN).
- **Technical Action:** Update `getOwnersWithPropertyCount` to explicitly select: `id, name, email, phone, address`.
- **Estimated Gain:** 40-60% reduction in row size.

## ⚡ Phase 2: React Component Stabilization
**Goal:** Kill the re-render loop by stabilizing function references.

- **File:** `src/features/owners/Owners.tsx`
- **Current Issue:** Inline functions passed as props to `ListPageTemplate` trigger re-renders on every cycle.
- **Technical Action:** 
    - Wrap all event handlers (`handleAddOwner`, `handleEditOwner`, etc.) in `useCallback`.
    - Wrap render-prop functions (`renderTableHeaders`, `renderTableRow`, `renderCardContent`) in `useCallback`.
    - Memoize `ownerSchema` using `useMemo`.
- **Estimated Gain:** Reduced CPU usage and elimination of "Render Storm".

## 🏗️ Phase 3: Template Memoization
**Goal:** Prevent unnecessary template re-renders.

- **File:** `src/components/templates/ListPageTemplate.tsx`
- **Technical Action:** Wrap the entire template component in `React.memo`. Since this template is used across 6+ pages, this will improve performance globally.

## 📅 Phase 4: Layout Stability & CLS Fix
**Goal:** Fix layout shifts during loading.

- **File:** `src/components/templates/ListPageTemplate.tsx`
- **Technical Action:** Ensure `TableSkeleton` has a fixed height or consistent structure to prevent "jumping" when data arrives.

