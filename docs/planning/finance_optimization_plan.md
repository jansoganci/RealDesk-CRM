# 📉 Finance Page Optimization Plan: Eliminating the "Network Storm"

## Overview
The Finance page currently triggers **~2020 network requests** and transfers **22.3MB of data**, leading to a 9+ second load time (LCP) and severe layout shifting (CLS). This is caused by redundant database queries for exchange rates and oversized data payloads.

---

## 📅 Phase 1: Global In-Memory Caching (Highest Impact)
**Goal:** Reduce exchange rate requests by ~80% immediately.

- **File:** `src/services/finance/exchangeRates.service.ts`
- **Current Issue:** Functions like `getRateFromTry` query the database every single time they are called, even if the same date/currency was just fetched by another component.
- **Technical Action:** 
    - Implement a module-level `RateCache` (Map) to store `RateInfo` objects.
    - Modify `getRateFromTry` and `getRatesForBatchFromTry` to check the cache before hitting Supabase.
- **Estimated Gain:** Reduces requests from thousands to dozens.

---

## 📅 Phase 2: Global Date Pre-flight & Pre-fetching
**Goal:** Prevent "Sequential Waterfall" within calculations.

- **File:** `src/services/finance/analytics.service.ts`
- **Current Issue:** `getFinancialDashboardNormalized` triggers multiple sub-functions (YTD, Prev Month, Categories) that each start their own exchange rate lookups.
- **Technical Action:** 
    - Refactor `getFinancialDashboardNormalized` to extract all unique transaction dates from the raw data first.
    - Trigger a single `getRatesForBatchFromTry` for all required dates/currencies before starting any normalization.
- **Estimated Gain:** Consolidates hundreds of parallel DB checks into 1-2 batch queries.

---

## 📅 Phase 3: Payload Optimization (The 22MB fix)
**Goal:** Reduce data transfer from 22MB to < 500KB.

- **Files:** `src/services/finance/analytics.service.ts`, `src/services/finance/transactions.service.ts`
- **Current Issue:** Many queries use `.select('*')`, fetching heavy text fields (notes, metadata) that are not used in summary calculations.
- **Technical Action:** 
    - Replace `*` with explicit columns: `.select('id, amount, currency, transaction_date, category, type, payment_status')`.
- **Estimated Gain:** ~95% reduction in network payload size.

---

## 📅 Phase 4: Proactive Rate Hydration
**Goal:** Prevent on-demand Edge Function triggers during UI render.

- **File:** `src/features/finance/hooks/useFinanceData.ts`
- **Current Issue:** If a rate is missing, the Edge Function is triggered during the calculation, adding 1.5s latency per missing date.
- **Technical Action:** 
    - Improve the initialization logic to identify gaps in exchange rates for the current fiscal year and trigger a single "backfill" if necessary.
- **Estimated Gain:** Consistent sub-second calculation times.

---

## 📅 Phase 5: Layout Stability & CLS Fix
**Goal:** Fix the 0.81 CLS score and improve UX.

- **Files:** `src/features/finance/components/` (SummaryCards, Charts, Transactions)
- **Current Issue:** Containers have no defined height while loading, causing elements to "jump" as data arrives.
- **Technical Action:** 
    - Implement `Skeleton` loaders for every financial card and chart.
    - Set minimum heights for the dashboard grid sections.
- **Estimated Gain:** CLS reduced from 0.81 to < 0.1.

---

## 📈 Success Metrics
- **Total Requests:** < 30 (down from 2020).
- **Total Payload:** < 1MB (down from 22.3MB).
- **LCP (Page Ready):** < 1.5s.
- **CLS:** < 0.1.

