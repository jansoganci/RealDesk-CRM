# 🚀 Resend Email Integration - Deployment Guide

**Date:** 2026-01-12  
**Status:** ✅ Ready for Deployment

---

## 📋 Prerequisites

- ✅ Resend account created
- ✅ `RESEND_API_KEY` added to Supabase Secrets
- ✅ Code files created (see implementation)

---

## 🔧 Deployment Steps

### Step 1: Set Frontend URL (Optional but Recommended)

If your frontend is hosted on a custom domain, set the `FRONTEND_URL` secret:

```bash
supabase secrets set FRONTEND_URL="https://emlakcrm.app"
```

**Note:** If not set, the Edge Function will default to:
- `http://localhost:5173` for local development
- `https://emlakcrm.app` for production

### Step 2: Deploy Edge Function

Deploy the `send-invitation-email` Edge Function:

```bash
# From project root
supabase functions deploy send-invitation-email
```

**Expected Output:**
```
Deploying function send-invitation-email...
Function deployed successfully!
```

### Step 3: Verify Deployment

Check that the function is deployed:

```bash
supabase functions list
```

You should see `send-invitation-email` in the list.

### Step 4: Test the Integration

#### Option A: Test via UI
1. Go to `/team` page
2. Click "Add Member"
3. Enter an email address
4. Submit the form
5. Check your email inbox for the invitation

#### Option B: Test via API (for debugging)

```bash
# Get your Supabase project URL
SUPABASE_URL="https://your-project.supabase.co"

# Get your access token (from browser console: supabase.auth.getSession())
ACCESS_TOKEN="your-jwt-token"

# Create an invitation first (via UI or API)
INVITATION_ID="invitation-uuid-here"

# Call the Edge Function
curl -X POST \
  "${SUPABASE_URL}/functions/v1/send-invitation-email" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"invitationId\": \"${INVITATION_ID}\"}"
```

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Invite new member → Email received
- [ ] Resend invitation → Email received
- [ ] Email contains correct organization name
- [ ] Email contains correct inviter name
- [ ] Email contains correct role (owner/member)
- [ ] Invitation link works correctly
- [ ] Link redirects to `/accept-invite?token=xxx`

### Error Handling
- [ ] Invalid invitation ID → Error handled gracefully
- [ ] Expired invitation → Error handled gracefully
- [ ] Already accepted invitation → Error handled gracefully
- [ ] Email sending failure → Invitation still created in DB
- [ ] Frontend shows success even if email fails

### Email Content
- [ ] Bilingual content (TR/EN) displays correctly
- [ ] Organization logo displays (if set)
- [ ] Expiration date formatted correctly
- [ ] Mobile email client rendering looks good
- [ ] Email not in spam folder

---

## 🔍 Troubleshooting

### Issue: "RESEND_API_KEY not set"

**Solution:**
```bash
supabase secrets set RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

### Issue: "Function not found" or 404 error

**Solution:**
1. Verify function is deployed: `supabase functions list`
2. Check function name matches exactly: `send-invitation-email`
3. Redeploy: `supabase functions deploy send-invitation-email`

### Issue: "Unauthorized" error

**Solution:**
- Verify user is authenticated (has valid JWT token)
- Check that Authorization header is included in request
- Verify token hasn't expired

### Issue: Email not received

**Check:**
1. **Resend Dashboard:** Check if email was sent
   - Go to Resend dashboard → Emails
   - Look for your email in the list
   - Check delivery status

2. **Spam Folder:** Check spam/junk folder

3. **Email Address:** Verify email address is correct

4. **Edge Function Logs:**
   ```bash
   supabase functions logs send-invitation-email
   ```

5. **Resend API Status:** Check Resend status page

### Issue: Invitation link doesn't work

**Check:**
1. **Frontend URL:** Verify `FRONTEND_URL` is set correctly
   ```bash
   supabase secrets list
   ```

2. **Link Format:** Should be `https://yourdomain.com/accept-invite?token=xxx`

3. **Token:** Verify token is valid and not expired

### Issue: Email template looks broken

**Check:**
1. HTML is valid
2. CSS is inline (required for email clients)
3. Images are absolute URLs (if using organization logo)

---

## 📊 Monitoring

### Check Edge Function Logs

```bash
supabase functions logs send-invitation-email --follow
```

### Check Resend Dashboard

1. Go to https://resend.com/emails
2. View email delivery stats
3. Check bounce/spam rates
4. Monitor delivery success rate

### Monitor in Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Select `send-invitation-email`
3. View execution logs
4. Check error rates

---

## 🔄 Updating the Function

If you need to update the Edge Function:

```bash
# Make your changes to the code
# Then redeploy:
supabase functions deploy send-invitation-email
```

**Note:** No downtime - new deployments replace the old function immediately.

---

## 🎯 Production Checklist

Before going to production:

- [ ] `RESEND_API_KEY` set in production Supabase project
- [ ] `FRONTEND_URL` set to production domain
- [ ] Edge Function deployed to production
- [ ] Test invitation flow end-to-end
- [ ] Verify email delivery in production
- [ ] Check email not going to spam
- [ ] Monitor logs for errors
- [ ] Set up alerts for email failures (optional)

---

## 📝 Environment Variables Summary

| Variable | Location | Required | Default |
|----------|----------|----------|---------|
| `RESEND_API_KEY` | Supabase Secrets | ✅ Yes | - |
| `FRONTEND_URL` | Supabase Secrets | ⚠️ Optional | `https://emlakcrm.app` |
| `SUPABASE_URL` | Auto (Edge Functions) | ✅ Yes | - |
| `SUPABASE_ANON_KEY` | Auto (Edge Functions) | ✅ Yes | - |

---

## 🆘 Support

If you encounter issues:

1. **Check Logs:**
   ```bash
   supabase functions logs send-invitation-email
   ```

2. **Check Resend Dashboard:**
   - Email delivery status
   - API usage/quota
   - Error messages

3. **Verify Secrets:**
   ```bash
   supabase secrets list
   ```

4. **Test Locally (if possible):**
   ```bash
   supabase functions serve send-invitation-email
   ```

---

**Last Updated:** 2026-01-12  
**Status:** Ready for Production
