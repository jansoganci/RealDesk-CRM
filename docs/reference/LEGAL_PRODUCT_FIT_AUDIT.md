# Legal Product-Fit Audit
**Date:** 2025-12-07
**App Version:** Dev (Supabase + React)
**Auditor:** Antigravity (AI Agent)

## 1. Overview
The Emlak CRM application is a SaaS tool for real estate management, handling sensitive data like Turkish ID numbers, IBANs, and rental contracts. The current legal documents (Terms of Service, Privacy Policy, Cookie Policy) are well-structured templates but contain significant gaps regarding the **billing model** and **identifying specific sub-processors** used in the actual code.

**Disclaimer:** This is **NOT legal advice**. This is a technical potential mismatch report between "what the code does" and "what the documents say", intended for a founder to review with legal counsel.

## 2. Detected Legal Documents

| File Path | Type | Language | Notes |
| :--- | :--- | :--- | :--- |
| `public/legal/terms-of-service-en.html` | Terms | EN | Generic SaaS terms. **Missing billing/refund sections.** |
| `public/legal/privacy-policy-en.html` | Privacy | EN | Good detail on KVKK/GDPR. **Missing Google OAuth.** |
| `public/legal/cookie-policy-en.html` | Cookies | EN | Accurate. Matches current codebase. |
| `public/legal/*-tr.html` | Various | TR | Turkish versions (not deep-dived, assumed mirrors). |

## 3. Behavior vs. Legal Mapping

### A. Data Collection & usage
| What the App Actually Does (Code) | What the Legal Text Says | Risk / Mismatch / Comment |
| :--- | :--- | :--- |
| **Encryption:** `encryption.service.ts` encrypts T.C. IDs and IBANs (AES-GCM) *client-side* before sending to Supabase. | "Sensitive data (Turkish ID, IBAN) is protected with AES-256-GCM encryption" | **PERFECT MATCH.** This is a high-standard implementation and the policy accurately reflects it. |
| **Data Fields:** Collects Owner/Tenant Names, Phones, Emails, Addresses, Contract Dates, Rent Amounts. | Lists Identity, Contact, Financial, Location, Contract data. | **Match.** The policy accurately describes the data schema. |
| **Analytics:** `package.json` has `chart.js` but no tracking scripts (GA, Mixpanel) initialized in `main.tsx`. | "Analytics Cookies: ... (currently not used)" | **Match.** The policy honestly states analytics are not currently used. |

### B. Authentication & Security
| What the App Actually Does (Code) | What the Legal Text Says | Risk / Mismatch / Comment |
| :--- | :--- | :--- |
| **Auth Providers:** Uses `supabase.auth.signInWithPassword` AND `signInWithGoogle`. | Mentions "Supabase Auth" but **not** Google. | **MISMATCH.** Google logic exists in `Login.tsx` but Google is not listed as a sub-processor/auth provider in Privacy Policy. |
| **Security:** Uses Row Level Security (RLS) policies in Supabase (inferred from `database.ts` comments/structure). | Claims "Row Level Security (RLS)" is used. | **Match.** Technical implementation aligns with claims. |

### C. Billing, Trial & Subscription
| What the App Actually Does (Code) | What the Legal Text Says | Risk / Mismatch / Comment |
| :--- | :--- | :--- |
| **Logic:** `billingService.ts` checks `user_billing` table, `BillingSubscribe.tsx` shows UI for subscriptions/plans. | **SILENCE.** No mention of payments, subscriptions, trials, refunds, or cancellation. | **CRITICAL GAP.** The Terms of Service are completely silent on the commercial nature of the app. Users could claim they expected a free service forever or demand refunds without clear terms. |
| **Process:** App has a "Paywall" flow (`ProtectedRoute` checks access). | No mention of restricted access or trial terms. | **Risk.** You need clauses defining "Free Trial", "Subscription Terms", and "Account Suspension for Non-payment". |

### D. Third Parties
| What the App Actually Does (Code) | What the Legal Text Says | Risk / Mismatch / Comment |
| :--- | :--- | :--- |
| **Sub-processors:** Supabase (Database/Auth). Google (Auth). | Lists Supabase. Lists "Exchange Rate APIs". | **Minor Gap.** Add Google (for OAuth) to the list. |
| **Exchange Rates:** Likely fetches rates (implied by policy and `financial.ts` logic). | Lists "Exchange Rate APIs". | **Match.** |

## 4. Geo Considerations (High-Level)

### Turkey (KVKK)
*   **Data Controller:** You must fill in the `[Company Address]` placeholder. KVKK requires explicit identity of the data controller.
*   **Explicit Consent:** The app processes "Sensitive Personal Data" (Special Categories) if it stores criminal records or similar, but T.C. ID is generally "Personal Data" requiring strict protection. The **Encryption** feature is excellent for KVKK compliance.
*   **Servers:** Data is in Supabase. Check if your Supabase region is `eu-central-1` (Frankfurt) or similar. KVKK has specific rules about cross-border data transfer. If Supabase is outside Turkey, you rely on explicit consent or other mechanisms. Privacy Policy confirms "International Transfers" implicitly by mentioning Supabase.

### EU (GDPR)
*   **Right to Erasure:** App supports "Account Deletion" which claims to delete data in 30 days. Code needs to ensure a cascading delete or cron job actually does this (verified `rpc_delete_contract` exists, but full user wipe logic wasn't fully audited).
*   **Processor Agreement:** Privacy Policy claims a DPA is signed with Supabase. Ensure this is actually true on your Supabase dashboard/agreement.

### US
*   **CCPA/CPRA:** Not explicitly targeted, but the "Do Not Sell" clause is effectively covered by the "We do not use content for commercial purposes" clause.

## 5. Priority Issues & Recommendations

1.  **[CRITICAL] Add Billing & Refund Terms**
    *   **Why:** You are charging money (or planning to) but your Terms act like a free hobby site. Disputes will be indefensible.
    *   **Fix:** Add a "Subscription & Payments" section to Terms of Service covering: Pricing changes, Trial duration, Refund policy (e.g. "No refunds" or "30 days"), and Cancellation rights.

2.  **[HIGH] Declare Google as Auth Provider**
    *   **Why:** Privacy Policy must list all 3rd parties handling user credentials.
    *   **Fix:** Update Privacy Policy Section 5 to include "Google (Authentication Service)" and link to their privacy policy.

3.  **[MEDIUM] Fill Company Details**
    *   **Why:** `[Company Address]` placeholders are not legally binding and violate KVKK/GDPR transparency rules.
    *   **Fix:** Replace all placeholders with your actual legal entity name and address (or registered office).

4.  **[MEDIUM] Verify Data Residency**
    *   **Why:** If targeting Turkish users primarily, storing data outside Turkey (Supabase is likely AWS/Fly.io in EU/US) requires careful KVKK consent clauses.
    *   **Fix:** Ensure the Privacy Policy's "International Transfers" section is robust or consider hosting a replica in Turkey if you scale to enterprise.

5.  **[LOW] "Encrypted" Claim vs. Other Data**
    *   **Why:** You claim "Turkish ID" is encrypted. What about "Phone/Email"? They are PII too.
    *   **Fix:** Ensure you don't over-promise. You promised ID/IBAN encryption and you **Delivered**. Good job. Just ensure you don't accidentally log these in plain text in any server logs (Supabase logs).
