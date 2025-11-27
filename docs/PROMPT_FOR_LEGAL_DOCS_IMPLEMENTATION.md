# Prompt for Legal Documents Implementation

Copy and paste this prompt to Claude Code or another AI assistant:

---

## Context

I have a Real Estate CRM SaaS application built with React, TypeScript, and Tailwind CSS. I've created 6 legal document HTML files:

**Files Created:**
- `docs/privacy-policy-tr.html` (Turkish)
- `docs/privacy-policy-en.html` (English)
- `docs/terms-of-service-tr.html` (Turkish)
- `docs/terms-of-service-en.html` (English)
- `docs/cookie-policy-tr.html` (Turkish)
- `docs/cookie-policy-en.html` (English)

All files are standalone HTML with Tailwind CSS, matching my app's design language (blue #2563EB primary color, Inter font).

**Current State:**
- My landing page footer already has placeholder links for "Privacy" and "Terms" (currently pointing to `#`)
- The app supports Turkish and English via i18next
- Users can switch languages in the app
- The app uses React Router for navigation
- Files are currently in the `docs/` folder

## Questions I Need Help With:

### 1. File Location & Serving
- Should I keep the HTML files in `docs/` folder, or move them to `public/` folder?
- How should these files be served? As static HTML files or should I create React components that render them?
- What's the best approach for a Vite + React app?

### 2. Footer Implementation
- My footer already has placeholder links. Should I:
  - Link directly to the HTML files (e.g., `/docs/privacy-policy-tr.html`)?
  - Create React routes that serve these pages?
  - Use iframes to embed them?
- Should I add a Cookie Policy link to the footer as well? (Currently only Privacy and Terms are there)

### 3. Language Handling
- How should I handle language differences? Options:
  - Detect user's current language and link to the correct version automatically?
  - Show both language options in the footer?
  - Use React Router to handle language in URL (e.g., `/privacy?lang=tr`)?
- The HTML files already have language switchers in their headers - should I rely on those or handle it in the app?

### 4. Registration/Login Flow
- Should I add mandatory checkboxes in the registration form?
- How should I link to the documents from the registration form?
- Should the links open in a new tab or same tab?

### 5. Settings/Profile Page
- Should I add a "Legal Documents" section in the Profile page?
- If yes, how should it be structured?

### 6. Best Practices
- What are the industry best practices for displaying legal documents in a SaaS app?
- Should these pages be accessible without authentication?
- Any SEO considerations?

## Technical Details

**Tech Stack:**
- React 18.3
- TypeScript 5.5
- Vite 5.4
- React Router 7.9
- i18next for translations
- Tailwind CSS 3.4
- Supabase for backend

**Current Footer Code Location:**
- `src/features/landing/LandingPage.tsx` (lines ~470-494)
- Footer has translation keys: `footer.privacy` and `footer.terms`

**Current Routes:**
- Defined in `src/config/constants.ts`
- App routes in `src/App.tsx`

**Language Detection:**
- User language stored in AuthContext
- Can access via `useAuth()` hook
- Language can be 'tr' or 'en'

## What I Want:

1. **Specific code recommendations** - Show me exactly where and how to implement
2. **File structure recommendations** - Where should files live?
3. **Language handling strategy** - Best approach for my use case
4. **Complete implementation** - If possible, provide the actual code changes needed

Please analyze my codebase and provide a comprehensive implementation plan with code examples.

---





