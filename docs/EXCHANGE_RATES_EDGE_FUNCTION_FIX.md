# Exchange Rates Edge Function Fix

## Problem Summary

The `exchange_rates` table was staying empty even though `fetchAndStoreDailyRates()` was being called from the frontend.

### Root Cause

1. **RLS Policy Blocking Inserts**: The `exchange_rates` table has Row Level Security (RLS) enabled, but there's **NO INSERT policy** for authenticated users.

2. **Frontend Context Limitation**: The frontend uses the Supabase **anon key** (not service role), which means:
   - All database operations are subject to RLS policies
   - Since no INSERT policy exists, inserts fail silently
   - Errors are caught and logged, but data never gets stored

3. **Security Risk**: Even if we added an INSERT policy, we **cannot** use the service role key in frontend code (it would expose admin credentials to all users).

## Why Edge Function is Required

### ✅ Security
- Service role key must NEVER be exposed in frontend code
- Edge Functions run server-side and can safely use service role
- User tokens are validated but service role bypasses RLS when needed

### ✅ Reliability
- Server-side execution avoids browser/CORS issues
- More stable than client-side API calls
- Better error handling and logging

### ✅ Scalability
- Can be scheduled with cron for automatic daily fetching
- Can handle multiple concurrent requests
- No dependency on user's browser being open

### ✅ Architecture
- Follows Supabase best practices
- Consistent with other Edge Functions (stripe-webhook, extract-text, etc.)
- Clean separation: frontend calls → Edge Function → database

## Solution Implemented

### 1. Created Edge Function
**File**: `supabase/functions/fetch-exchange-rates/index.ts`

- Uses `supabaseAdmin` (service role) to bypass RLS
- Fetches rates from Frankfurter.dev API
- Stores rates in `exchange_rates` table
- Handles errors gracefully
- Returns JSON response with success/error status

### 2. Updated Frontend Service
**File**: `src/services/finance/exchangeRates.service.ts`

- `fetchAndStoreDailyRates()` now calls Edge Function instead of direct DB insert
- Uses authenticated request (includes user's JWT token)
- Maintains same API signature (no breaking changes)
- Error handling improved with clear error messages

### 3. How It Works

```
Frontend (useFinanceData hook)
    ↓
fetchAndStoreDailyRates(date)
    ↓
POST /functions/v1/fetch-exchange-rates
    ↓
Edge Function (server-side)
    ↓
supabaseAdmin (service role - bypasses RLS)
    ↓
INSERT into exchange_rates ✅
```

## Testing

### Manual Test
1. Open Finance Dashboard
2. Check browser console for rate fetch logs
3. Verify `exchange_rates` table has data:
   ```sql
   SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 10;
   ```

### Edge Function Test
```bash
# Deploy function first
supabase functions deploy fetch-exchange-rates

# Test locally (if using Supabase CLI)
curl -X POST http://localhost:54321/functions/v1/fetch-exchange-rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"date": "2024-01-15"}'
```

## Next Steps (Optional)

### 1. Schedule Daily Cron Job
Add to Supabase Dashboard → Edge Functions → Cron:
```
0 9 * * * fetch-exchange-rates
```
Runs daily at 9 AM UTC to fetch today's rates.

### 2. Add Monitoring
- Log successful/failed rate fetches
- Alert if rates are missing for > 1 day
- Track API response times

### 3. Add Rate Limiting
- Prevent abuse (max 10 requests per user per hour)
- Use Supabase Edge Function rate limiting

## Files Changed

1. ✅ `supabase/functions/fetch-exchange-rates/index.ts` (NEW)
2. ✅ `src/services/finance/exchangeRates.service.ts` (UPDATED)

## Migration Notes

- **No breaking changes**: Frontend code continues to work as before
- **Backward compatible**: Same function signature
- **Zero downtime**: Edge Function can be deployed independently

## Security Notes

- ✅ Service role key stored as Supabase secret (never in code)
- ✅ Edge Function validates user authentication
- ✅ RLS still protects table (only service role can write)
- ✅ Frontend cannot directly insert (must go through Edge Function)

