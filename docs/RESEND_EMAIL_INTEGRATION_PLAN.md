# 📧 Resend Email Integration - Implementation Plan

**Date:** 2026-01-12  
**Status:** 📋 Planning  
**Feature:** Email Sending for Organization Invitations

---

## 🎯 Executive Summary

This document outlines the step-by-step implementation plan for integrating **Resend** email service to send organization invitation emails. The system will use **Supabase Edge Functions** for secure, server-side email delivery.

---

## 📊 Current System Analysis

### ✅ What's Already Implemented

1. **Database Layer** ✅
   - `org_invitations` table with all required fields
   - Auto-accept trigger on user signup
   - RPC functions for invitation management
   - RLS policies for security

2. **Service Layer** ✅
   - `organizationService.inviteMember()` - Creates invitation
   - `organizationService.resendInvitation()` - Resends invitation
   - `organizationService.getInvitations()` - Lists invitations
   - `organizationService.revokeInvitation()` - Deletes invitation

3. **UI Components** ✅
   - `AddMemberDialog` - Form to invite members
   - `TeamMembersList` - Shows members and pending invitations
   - `AcceptInvite` - Page to accept invitations
   - Resend/Revoke actions in UI

4. **Edge Functions Infrastructure** ✅
   - Existing Edge Functions pattern (Stripe, text extraction, exchange rates)
   - Shared utilities (`supabase-admin.ts`)
   - Secrets management via Supabase Vault

### ❌ What's Missing

1. **Email Sending** ❌
   - No email service integration
   - Invitations are created but emails are not sent
   - Users must manually copy invitation links

2. **Email Templates** ❌
   - No HTML email templates
   - No bilingual support (TR/EN)

---

## 🔍 Other Email Needs in the App

After analyzing the codebase, here are **all places** where emails might be needed:

### ✅ Already Handled by Supabase
1. **Email Confirmation** - Supabase handles this automatically
2. **Password Reset** - Supabase handles this automatically
3. **Magic Link Login** - Supabase handles this automatically

### 🆕 Needs Resend Integration
1. **Organization Invitations** ⭐ **PRIMARY NEED**
   - When owner invites a new member
   - When resending an invitation
   - **Frequency:** High (core feature)

### 🔮 Future Considerations (Not Needed Now)
1. **Contract Notifications** - Could email owners/tenants when contracts are created
2. **Reminder Notifications** - Could email reminders for upcoming tasks
3. **Inquiry Match Notifications** - Could email when property matches inquiry

**Recommendation:** Start with **Organization Invitations only**. Add other email types later if needed.

---

## 🏗️ Architecture Decision

### ✅ Use Supabase Edge Function (Recommended)

**Why Edge Function over Frontend/Backend Service?**

#### Security ✅
- **API Key Protection:** Resend API key stored in Supabase Vault (not exposed to frontend)
- **No Client Exposure:** Frontend never sees sensitive credentials
- **Consistent Pattern:** Matches existing Edge Functions (Stripe, text extraction)

#### Scalability ✅
- **Server-Side Execution:** Runs on Supabase infrastructure
- **No Browser Limitations:** Not affected by user's network/browser
- **Reliable Delivery:** Better success rate than client-side

#### Maintainability ✅
- **Centralized Logic:** All email logic in one place
- **Easy Updates:** Update templates without frontend deployment
- **Consistent Architecture:** Follows existing patterns

#### Transaction Safety ✅
- **Database-First:** Invitation created in DB first
- **Email After Success:** Only send email if DB operation succeeds
- **Error Handling:** Can retry failed emails without affecting DB

### ❌ Why NOT Frontend/Backend Service?

- **Security Risk:** API key would be exposed in frontend code
- **Reliability:** Client-side email sending is unreliable
- **Inconsistent:** Doesn't match existing Edge Function pattern

---

## 🔐 Secrets Storage: Supabase Vault vs .env

### ✅ Use Supabase Vault (Recommended)

**Why Supabase Vault?**

1. **Consistent with Existing Pattern**
   - `STRIPE_SECRET_KEY` → Supabase Vault ✅
   - `FLAVIUS_FIREBASE_ID_TOKEN` → Supabase Vault ✅
   - `SUPABASE_SERVICE_ROLE_KEY` → Supabase Vault ✅

2. **Edge Function Access**
   - Edge Functions automatically have access to Supabase Vault secrets
   - No need to configure environment variables manually
   - Works in both local development and production

3. **Security**
   - Secrets are encrypted at rest
   - Only accessible from Edge Functions (not frontend)
   - Can be rotated without code changes

4. **Management**
   - Set via CLI: `supabase secrets set RESEND_API_KEY="re_xxx"`
   - View in Supabase Dashboard
   - Easy to update without redeployment

### ❌ Why NOT .env?

- **Frontend Exposure Risk:** `.env` files can be accidentally committed
- **Deployment Complexity:** Need to configure in multiple environments
- **Inconsistent:** Doesn't match existing secret management

**Decision:** Store `RESEND_API_KEY` in **Supabase Vault**.

---

## 🔄 Complete Flow: From Click to Email

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Owner clicks "Invite Member" on /team page      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: AddMemberDialog calls organizationService          │
│    - organizationService.inviteMember(orgId, email, role)       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER: organization.service.ts                       │
│    - Validates email format                                     │
│    - Checks if user exists in auth.users                        │
│    - If user exists → Creates org_members directly              │
│    - If user doesn't exist → Creates org_invitations record     │
│    - Returns { type: 'invitation', data: {...} }               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVICE LAYER: After successful DB insert                   │
│    - If type === 'invitation':                                  │
│      → Calls Edge Function: send-invitation-email              │
│    - If type === 'member':                                      │
│      → No email needed (user already registered)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. EDGE FUNCTION: send-invitation-email                         │
│    - Validates user authentication (JWT token)                   │
│    - Fetches invitation details from database                    │
│    - Fetches organization details                                │
│    - Fetches inviter details                                    │
│    - Generates invitation link                                  │
│    - Calls Resend API to send email                             │
│    - Returns success/error response                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RESEND API: Sends email to invited user                      │
│    - From: noreply@yourdomain.com (or configured sender)        │
│    - To: invitation.email                                       │
│    - Subject: "You're invited to join {org_name}"               │
│    - Body: HTML template with invitation link                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. USER RECEIVES EMAIL                                          │
│    - Clicks invitation link                                     │
│    - Redirected to /accept-invite?token=xxx                      │
│    - AcceptInvite component handles acceptance                  │
└─────────────────────────────────────────────────────────────────┘
```

### Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ IF DB INSERT FAILS:                                             │
│   → Throw error immediately                                     │
│   → No email sent                                               │
│   → User sees error message                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ IF EMAIL SEND FAILS:                                            │
│   → Log error in Edge Function                                  │
│   → Return error to frontend                                    │
│   → Frontend shows warning (but invitation still exists)        │
│   → User can manually copy invitation link                      │
│   → Owner can resend invitation later                           │
└─────────────────────────────────────────────────────────────────┘
```

### Resend Invitation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Owner clicks "Resend" on pending invitation                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. organizationService.resendInvitation(invitationId)           │
│    - Generates new token                                        │
│    - Updates expires_at (extends by 7 days)                     │
│    - Updates invited_at (current timestamp)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Calls Edge Function: send-invitation-email                   │
│    - Same flow as new invitation                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

### 🆕 New Files to Create

1. **Edge Function: Send Invitation Email**
   ```
   supabase/functions/send-invitation-email/
   └── index.ts
   ```
   - Handles email sending via Resend API
   - Validates user authentication
   - Fetches invitation and org details
   - Generates invitation link
   - Sends email with HTML template

2. **Email Template (Shared)**
   ```
   supabase/functions/_shared/
   └── email-templates.ts
   ```
   - HTML email templates
   - Bilingual support (TR/EN)
   - Invitation email template

3. **Resend Client (Shared)**
   ```
   supabase/functions/_shared/
   └── resend-client.ts
   ```
   - Resend API client initialization
   - Helper functions for sending emails
   - Error handling

4. **Documentation**
   ```
   docs/
   └── RESEND_EMAIL_INTEGRATION_PLAN.md (this file)
   ```

### ✏️ Files to Modify

1. **Service Layer**
   ```
   src/services/organization.service.ts
   ```
   - Modify `inviteMember()` to call Edge Function after DB insert
   - Modify `resendInvitation()` to call Edge Function after DB update
   - Add `sendInvitationEmail()` helper method

2. **Type Definitions** (if needed)
   ```
   src/types/org.ts
   ```
   - Add email sending response types (if needed)

---

## 🔧 Implementation Steps

### Phase 1: Setup Resend Account & API Key

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up for account
   - Verify email address

2. **Create API Key**
   - Go to API Keys section
   - Create new API key
   - Copy key: `re_xxxxxxxxxxxxx`
   - **Save securely** (you'll need it)

3. **Verify Domain** (Optional but Recommended)
   - Add your domain (e.g., `emlakcrm.app`)
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification
   - **Note:** Can use Resend's default domain for testing

4. **Set Secret in Supabase**
   ```bash
   supabase secrets set RESEND_API_KEY="re_xxxxxxxxxxxxx"
   ```

### Phase 2: Create Edge Function

1. **Create Function Directory**
   ```bash
   mkdir -p supabase/functions/send-invitation-email
   ```

2. **Create Resend Client Helper**
   - File: `supabase/functions/_shared/resend-client.ts`
   - Initialize Resend client with API key from secrets
   - Export helper functions

3. **Create Email Templates**
   - File: `supabase/functions/_shared/email-templates.ts`
   - HTML template for invitation email
   - Bilingual support (TR/EN)
   - Dynamic variables: org_name, inviter_name, role, link, expires_at

4. **Create Edge Function**
   - File: `supabase/functions/send-invitation-email/index.ts`
   - Validate authentication
   - Fetch invitation details
   - Generate invitation link
   - Call Resend API
   - Return success/error

5. **Deploy Function**
   ```bash
   supabase functions deploy send-invitation-email
   ```

### Phase 3: Integrate with Service Layer

1. **Update organization.service.ts**
   - Add `sendInvitationEmail()` method
   - Call Edge Function after successful DB insert
   - Handle errors gracefully

2. **Update inviteMember()**
   - After creating invitation, call `sendInvitationEmail()`
   - If email fails, log but don't fail the whole operation

3. **Update resendInvitation()**
   - After updating invitation, call `sendInvitationEmail()`
   - Use same email sending logic

### Phase 4: Testing

1. **Local Testing**
   ```bash
   supabase functions serve send-invitation-email
   ```
   - Test with curl/Postman
   - Verify email delivery

2. **Integration Testing**
   - Invite new member via UI
   - Verify email received
   - Click link and verify acceptance flow

3. **Error Testing**
   - Test with invalid invitation ID
   - Test with expired token
   - Test with invalid API key

### Phase 5: Production Deployment

1. **Deploy Edge Function**
   ```bash
   supabase functions deploy send-invitation-email --project-ref your-project-ref
   ```

2. **Verify Secrets**
   - Confirm `RESEND_API_KEY` is set in production
   - Test email sending in production

3. **Monitor**
   - Check Resend dashboard for delivery stats
   - Monitor Edge Function logs
   - Set up alerts for failures

---

## 🔒 Security Considerations

### ✅ Security Measures

1. **API Key Protection**
   - Stored in Supabase Vault (encrypted)
   - Never exposed to frontend
   - Only accessible from Edge Functions

2. **Authentication**
   - Edge Function validates JWT token
   - Only authenticated users can trigger emails
   - RLS policies prevent unauthorized access

3. **Input Validation**
   - Email format validation
   - Invitation ID validation
   - Token validation

4. **Rate Limiting**
   - Resend has built-in rate limits
   - Consider adding additional rate limiting in Edge Function

5. **Error Handling**
   - Don't expose API keys in error messages
   - Log errors securely
   - Don't leak sensitive information

---

## 📧 Email Template Design

### Invitation Email Template

**Subject (TR):** `{org_name} organizasyonuna davet edildiniz`  
**Subject (EN):** `You're invited to join {org_name}`

**Content:**
- Organization logo (if available)
- Inviter name
- Organization name
- Role (owner/member)
- Invitation link (prominent CTA button)
- Expiration date
- Support contact
- Bilingual (TR/EN) based on user preference or default

**Design:**
- Modern, clean HTML
- Responsive (mobile-friendly)
- Brand colors matching app
- Clear call-to-action button

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Resend client initialization
- [ ] Email template generation
- [ ] Invitation link generation
- [ ] Error handling

### Integration Tests
- [ ] Invite new member → Email sent
- [ ] Resend invitation → Email sent
- [ ] Invalid invitation ID → Error handled
- [ ] Invalid API key → Error handled
- [ ] Network failure → Error handled

### Manual Tests
- [ ] Email received in inbox
- [ ] Email not in spam
- [ ] Link works correctly
- [ ] Link expires after 7 days
- [ ] Bilingual content displays correctly
- [ ] Mobile email client rendering

---

## 📊 Monitoring & Analytics

### Metrics to Track

1. **Email Delivery**
   - Sent count
   - Delivered count
   - Bounced count
   - Opened count (if tracking enabled)
   - Clicked count (if tracking enabled)

2. **Edge Function Performance**
   - Execution time
   - Error rate
   - Success rate

3. **User Behavior**
   - Invitation acceptance rate
   - Time to acceptance
   - Resend frequency

### Tools

- **Resend Dashboard:** Email delivery stats
- **Supabase Logs:** Edge Function execution logs
- **Custom Analytics:** Track in database

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Resend account created
- [ ] API key generated
- [ ] Domain verified (optional)
- [ ] Secret set in Supabase Vault
- [ ] Edge Function tested locally
- [ ] Email template tested
- [ ] Error handling tested

### Deployment
- [ ] Edge Function deployed
- [ ] Secrets verified in production
- [ ] Test email sent successfully
- [ ] Integration tested end-to-end

### Post-Deployment
- [ ] Monitor email delivery
- [ ] Check Edge Function logs
- [ ] Verify user feedback
- [ ] Set up alerts for failures

---

## 🔮 Future Enhancements

### Phase 2 Features (Not in Initial Implementation)

1. **Email Tracking**
   - Track opens and clicks
   - Analytics dashboard

2. **Custom Email Templates**
   - Allow orgs to customize templates
   - Brand colors/logos

3. **Email Preferences**
   - User email preferences
   - Unsubscribe options

4. **Additional Email Types**
   - Contract notifications
   - Reminder emails
   - Inquiry match notifications

5. **Email Queue System**
   - Retry failed emails
   - Batch processing
   - Priority queue

---

## 📝 Summary

### Key Decisions

1. **Architecture:** Supabase Edge Function ✅
2. **Secrets Storage:** Supabase Vault ✅
3. **Email Service:** Resend ✅
4. **Scope:** Organization invitations only (for now) ✅

### Implementation Order

1. Setup Resend account & API key
2. Create Edge Function
3. Create email templates
4. Integrate with service layer
5. Test thoroughly
6. Deploy to production

### Files Summary

**New Files:**
- `supabase/functions/send-invitation-email/index.ts`
- `supabase/functions/_shared/resend-client.ts`
- `supabase/functions/_shared/email-templates.ts`

**Modified Files:**
- `src/services/organization.service.ts`

---

**Last Updated:** 2026-01-12  
**Status:** Ready for Implementation  
**Next Step:** Create Resend account and set up API key
