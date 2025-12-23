# 🚀 Global Performance Master Plan

This plan outlines the systematic optimization of all remaining main list pages to achieve <1s load times and 0.0 CLS.

## 📋 Global Optimization Standards

Every page in this plan will follow these three "Gold Standards":
1. **Payload Reduction:** No more `select('*')`. We only fetch columns needed for the list view.
2. **Reference Stability:** All event handlers, render-props, and schema objects must be wrapped in `useCallback` or `useMemo`.
3. **Template Memoization:** (Already Completed) `ListPageTemplate` is memoized to prevent re-renders unless props change.

---

## 🏗️ Phase-by-Phase Roadmap

### 🏠 Phase 1: Properties (Gayrimenkuller)
**Target:** 22.2MB → <500KB
- **Service:** Update `properties.service.ts`. Limit `select` to `id, title, address, city, district, status, property_type, rent_amount, sale_price`. Limit nested `owner` and `photos` count.
- **Component:** Wrap `handleEdit`, `handleDelete`, and `renderTableRow` in `useCallback` within `Properties.tsx`.

### 👥 Phase 2: Tenants (Kiracılar)
**Target:** Elimination of "Render Storm"
- **Service:** Update `tenants.service.ts`. Explicitly select `id, name, email, phone`.
- **Component:** Stabilize `Tenants.tsx` handlers. Memoize `tenantSchema`.

### 📄 Phase 3: Contracts (Sözleşmeler)
**Target:** Heavy Relationship Optimization
- **Service:** Update `contracts.service.ts`. Optimize the complex join between contracts, tenants, and properties.
- **Component:** Stabilize `Contracts.tsx`. Use `useMemo` for table configurations.

### 🔍 Phase 4: Inquiries & Reminders (Talepler & Hatırlatıcılar)
**Target:** Quick Wins
- **Service:** Explicit column selection in `inquiries.service.ts` and `reminders.service.ts`.
- **Component:** Standard memoization patterns in `Inquiries.tsx` and `Reminders.tsx`.

### 📅 Phase 5: Calendar (Takvim)
**Target:** Event Payload Optimization
- **Action:** Calendar pages usually fetch many events. We will implement date-range limiting and memoize the event rendering to prevent the calendar from "flickering" on every state change.

---

## 📊 Performance Matrix (Estimated)

| Page | Current Requests | Target Requests | Current Payload | Target Payload |
| :--- | :--- | :--- | :--- | :--- |
| Properties | ~2000 | < 40 | 22.2 MB | < 400 KB |
| Tenants | ~2000 | < 40 | 22.2 MB | < 200 KB |
| Contracts | ~2000 | < 50 | 22.2 MB | < 500 KB |
| Others | ~1900 | < 30 | 22.2 MB | < 150 KB |

---

## 🛠️ Execution Order
We will proceed one page at a time, completing all layers (Service + Component) before moving to the next.

1. **Properties** (High Impact)
2. **Tenants**
3. **Contracts**
4. **Calendar**
5. **Inquiries/Reminders**

