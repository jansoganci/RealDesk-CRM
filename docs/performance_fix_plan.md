# 🚀 Performance Fix Plan: Network Request Loop Resolution

## Overview
This plan addresses the issue of ~2000 network requests triggered on the Profile page load. The root cause is a "Dependency Loop" combined with "Unstable Context Providers" that cause recursive re-renders and interval re-creations.

---

## 📅 Phase 1: Auth & Core Provider Stabilization
**Goal:** Stop the "Re-render Storm" at the root of the application.

- [ ] **Memoize AuthContext Value:** Wrap the `AuthContext.Provider` value in `useMemo` to prevent every child component from re-rendering on every Auth state change.
- [ ] **Batch Preference State:** Combine individual states (`language`, `currency`, `meetingReminderMinutes`, `commissionRate`) into a single `preferences` object to reduce the number of state updates (and subsequent renders) during initialization.
- [ ] **Stabilize User Dependency:** Change `useEffect` dependencies from `user` (object) to `user?.id` (string) to prevent effects from re-running when the object reference changes but the user remains the same.

---

## 📅 Phase 2: Global Service Optimization (Deduping)
**Goal:** Prevent redundant network calls for the same data.

- [ ] **Deduplicate `getAuthenticatedUserId`:** Implement a promise-caching mechanism in `src/lib/auth.ts`. If 10 components call this simultaneously, only 1 network request should be sent to Supabase.
- [ ] **Auth State Change Guard:** Add a check in `onAuthStateChange` to only update state if the session actually changed, preventing redundant state updates from Supabase events.

---

## 📅 Phase 3: Notification & Meeting Loop Fixes
**Goal:** Fix the "Interval Explosion" that causes the request flood.

- [ ] **NotificationContext Memoization:** Memoize the context value and `refreshCounts` callback.
- [ ] **Interval Cleanup & Refs:** 
    - Use `useRef` for the interval ID to ensure clean disposal.
    - Add an `isFetching` ref to `refreshCounts` to prevent multiple overlapping fetches.
    - Stabilize the `useEffect` that sets up the interval to only run when `user?.id` changes.
- [ ] **useMeetingNotifications Hook:** Apply similar logic to the meeting check loop (stabilize dependencies and add fetching guards).

---

## 📅 Phase 4: Verification & Final Polish
**Goal:** Ensure the fix works and doesn't break features.

- [ ] **Profile Page Audit:** Verify that `loadPreferences` in `Profile.tsx` runs only once on mount.
- [ ] **Network Tab Verification:** Ensure total requests stay < 50 for the initial load instead of ~2000.
- [ ] **Feature Check:** Verify that notifications, billing status, and profile updates still work correctly.

---

## 📈 Success Metrics
- **Initial Load Requests:** < 50
- **Idle Request Rate:** 2 requests per minute (Background syncs)
- **Time to Interactive:** < 2 seconds on Profile page

