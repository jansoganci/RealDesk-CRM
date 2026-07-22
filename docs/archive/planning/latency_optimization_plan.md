# ⚡ Latency Optimization Plan: Speeding up Profile Page Load

## Overview
While the number of network requests has been reduced (loop fix), the **Total Loading Time** is still high due to sequential request execution (Waterfall) and redundant fetches. This plan aims to bring the page load time under 1 second by parallelizing operations and utilizing existing state.

---

## 📅 Phase 1: Parallelize Backend Requests (Highest Impact)
**Goal:** Reduce `getBillingStatus` execution time by ~60%.

- **File:** `src/services/billingService.ts`
- **Current Issue:** 
    ```typescript
    const { data: hasAccess } = await supabase.rpc('has_active_subscription', ...); // Wait 1s
    const { data: subscription } = await supabase.from('subscriptions')...;      // Wait 1s
    const { data: billingRecord } = await supabase.from('user_billing')...;      // Wait 1s
    // Total wait: 3s
    ```
- **Technical Action:** 
    - Use `Promise.all` to trigger all three requests concurrently.
    - Implement a unified error handling block for the parallel requests.
- **Estimated Gain:** -1.5s to -2.0s reduction in waterfall. Total time will be the duration of the single slowest request (~1s).

---

## 📅 Phase 2: Eliminate Redundant Preferences Fetching
**Goal:** Use data already present in `AuthContext` to prevent secondary round-trips.

- **File:** `src/features/profile/Profile.tsx`
- **Current Issue:** The Profile page defines a local `loadPreferences` function that re-queries the database for preferences already held by the `AuthContext` provider.
- **Technical Action:** 
    - Remove `loadPreferences` and the `userPreferencesService.getPreferences()` call.
    - Extract `language`, `currency`, `meetingReminderMinutes`, and `commissionRate` from `useAuth()`.
    - Use `useEffect` to sync the local `profileData` state from `useAuth` values only when they change.
- **Estimated Gain:** -1.0s to -1.5s (eliminates the 2nd preference network call entirely).

---

## 📅 Phase 3: Unified Auth & Preference Query
**Goal:** Reduce initialization round-trips during app boot.

- **File:** `src/contexts/AuthContext.tsx`
- **Current Issue:** In `fetchSessionAndPreferences`, the code waits for `supabase.auth.getUser()` before starting the preference fetch.
- **Technical Action:** 
    - Parallelize the `getUser()` validation and the `user_preferences` table query.
    - While `getUser()` verifies the session JWT via network, the database can simultaneously fetch preferences for the session's user ID.
- **Estimated Gain:** -0.5s to -1.0s during app initialization.

---

## 📅 Phase 4: Non-blocking UI Hydration ( TTFB / TTI )
**Goal:** Show the UI immediately while validation happens in the background.

- **File:** `src/contexts/AuthContext.tsx`
- **Current Issue:** `loading` state is `true` until `getUser()` (slow network call) finishes, causing a visible "loading" delay.
- **Technical Action:** 
    - Utilize `supabase.auth.getSession()` (synchronous access to LocalStorage) to instantly hydrate `user` and `session` state on mount.
    - Set `loading: false` immediately if a local session is found.
    - Allow `getUser()` to run as a "silent validator" in the background. If the verification fails, trigger `signOut()`.
- **Estimated Gain:** **Near-instant UI rendering** on page reloads/navigation.

---

## 📈 Success Metrics
- **Initial Request Waterfall:** No more than 2 levels deep.
- **Profile Data Ready:** < 1.0s total from refresh.
- **TTI (Time to Interactive):** Immediate (via Session Cache).
