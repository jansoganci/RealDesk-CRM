# Data Fetching & Caching Strategy Analysis

## Executive Summary

This document analyzes the current data fetching patterns for `/rest/v1/contracts` and `/rest/v1/org_members` endpoints, identifies opportunities for caching with Cloudflare Workers using `stale-while-revalidate` headers, and investigates the `/storage/v1/object/contract-pdfs` POST 500 error.

---

## 1. Current Data Fetching Analysis

### 1.1 Contracts Endpoint (`/rest/v1/contracts`)

#### Fetch Locations:
1. **`src/services/contracts.service.ts`** - Primary service layer
   - `getAll()` - Fetches all contracts for active org (Line 18-43)
   - `getById()` - Single contract fetch (Line 45-71)
   - `getByTenantId()` - Contracts for specific tenant (Line 73-86)
   - `getByPropertyId()` - Contracts for specific property (Line 88-101)
   - `getActiveContracts()` - Active contracts only (Line 103-128)
   - `getExpiringContracts()` - Expiring within N days (Line 130-159)
   - `getStats()` - Contract statistics (Line 283-310)

2. **`src/features/contracts/hooks/useContractsData.ts`** - React hook
   - Fetches on mount via `useEffect` (Line 45-47)
   - No caching, refetches every time component mounts
   - Used in `Contracts.tsx` component

3. **`src/features/dashboard/hooks/useDashboardData.ts`** - Dashboard stats
   - Calls `contractsService.getStats()` in parallel with other services (Line 142)
   - Fetches on mount and when `refreshData()` is called

#### Query Pattern:
```typescript
// Typical query structure
const { data, error } = await supabase
  .from('contracts')
  .select(`
    id, status, start_date, end_date, rent_amount, currency,
    tenant:tenants(id, name, email, phone),
    property:properties(id, address, city, district, il, ilce)
  `)
  .eq('org_id', orgId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false });
```

#### Issues Identified:
- **No caching**: Every component mount triggers a fresh database query
- **Multiple redundant calls**: Dashboard, Contracts list, and individual contract views all fetch independently
- **No request deduplication**: Multiple components mounting simultaneously cause duplicate requests
- **Heavy joins**: Each query includes tenant and property joins, increasing payload size

### 1.2 Org Members Endpoint (`/rest/v1/org_members`)

#### Fetch Locations:
1. **`src/services/organization.service.ts`** - Service layer
   - `getMembers(orgId)` - All members with user details (Line 68-96)
   - `getMemberCount(orgId)` - Count query (Line 101-114)
   - `getOwnerCount(orgId)` - Owner count (Line 120-134)
   - `getMemberById(memberId)` - Single member (Line 139-155)

2. **`src/contexts/OrgContext.tsx`** - Context provider
   - Fetches org membership on auth state change (Line 40-74)
   - Includes organization join query
   - Runs on every `user.id` change

3. **`src/features/organization/TeamMembersList.tsx`** - Team members page
   - Fetches members on mount (Line 58-75)
   - Refetches after add/remove/role change operations

4. **`src/features/profile/components/TeamMembersCard.tsx`** - Profile card
   - Fetches members independently (Line 28-45)
   - No coordination with TeamMembersList

#### Query Pattern:
```typescript
// OrgContext query (most common)
const { data, error } = await supabase
  .from('org_members')
  .select(`
    id, org_id, user_id, role, status,
    organization:organizations(id, name, slug, logo_url, ...)
  `)
  .eq('user_id', user.id)
  .eq('status', 'active')
  .order('joined_at', { ascending: true })
  .limit(1)
  .maybeSingle();

// Team members query
const { data, error } = await supabase
  .from('org_members')
  .select(`
    id, org_id, user_id, role, status,
    user:user_id (email, raw_user_meta_data)
  `)
  .eq('org_id', orgId)
  .order('joined_at', { ascending: true });
```

#### Issues Identified:
- **Context refetch on every auth change**: OrgContext refetches org membership whenever `user.id` changes
- **Duplicate fetches**: TeamMembersList and TeamMembersCard fetch independently
- **No cache invalidation strategy**: Changes to members require manual refresh
- **Heavy user metadata joins**: Includes `raw_user_meta_data` which can be large

### 1.3 Request Volume Analysis

Based on code analysis, typical request patterns:

**Contracts:**
- Dashboard load: 1 request (`getStats()`)
- Contracts list page: 1 request (`getAll()`)
- Contract detail page: 1 request (`getById()`)
- **Total per user session**: ~3-5 requests minimum

**Org Members:**
- App initialization: 1 request (OrgContext)
- Team members page: 1 request (`getMembers()`)
- Profile page: 1 request (TeamMembersCard)
- **Total per user session**: ~3 requests minimum

**With 6.8k+ database requests**, this suggests:
- High user activity
- Multiple component remounts
- No request deduplication
- Potential polling/refresh loops

---

## 2. Cloudflare Workers Caching Strategy

### 2.1 Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Cloudflare Workers (Edge Cache)   │
│  ┌───────────────────────────────┐ │
│  │  Cache Layer (KV Store)       │ │
│  │  - Stale-while-revalidate     │ │
│  │  - Cache-Control headers      │ │
│  └───────────────────────────────┘ │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      Supabase REST API              │
│  /rest/v1/contracts                 │
│  /rest/v1/org_members               │
└─────────────────────────────────────┘
```

### 2.2 Implementation Strategy

#### Worker Structure:
```typescript
// worker.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Route to appropriate handler
    if (url.pathname.startsWith('/rest/v1/contracts')) {
      return handleContractsRequest(request, env);
    }
    if (url.pathname.startsWith('/rest/v1/org_members')) {
      return handleOrgMembersRequest(request, env);
    }
    
    // Proxy other requests directly
    return fetch(request);
  }
};
```

#### Stale-While-Revalidate Pattern:

```typescript
async function handleContractsRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const cacheKey = generateCacheKey(request);
  
  // Try to get from cache
  const cached = await env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    // Serve stale data immediately
    const response = new Response(JSON.stringify(cached.data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'HIT',
        'X-Cache-Age': String(cached.age),
      },
    });
    
    // Revalidate in background (don't await)
    revalidateInBackground(request, env, cacheKey);
    
    return response;
  }
  
  // Cache miss - fetch from Supabase
  return fetchFromSupabase(request, env, cacheKey);
}

async function revalidateInBackground(
  request: Request,
  env: Env,
  cacheKey: string
): Promise<void> {
  try {
    const response = await fetchFromSupabase(request, env, cacheKey);
    const data = await response.json();
    
    // Update cache
    await env.CACHE.put(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }), {
      expirationTtl: 300, // 5 minutes
    });
  } catch (error) {
    console.error('Background revalidation failed:', error);
  }
}

async function fetchFromSupabase(
  request: Request,
  env: Env,
  cacheKey: string
): Promise<Response> {
  // Forward request to Supabase with auth headers
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseRequest = new Request(
    `${supabaseUrl}${new URL(request.url).pathname}${new URL(request.url).search}`,
    {
      method: request.method,
      headers: request.headers,
      body: request.body,
    }
  );
  
  const response = await fetch(supabaseRequest);
  const data = await response.json();
  
  // Cache the response
  await env.CACHE.put(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now(),
  }), {
    expirationTtl: 300,
  });
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Cache': 'MISS',
    },
  });
}

function generateCacheKey(request: Request): string {
  const url = new URL(request.url);
  const orgId = extractOrgId(request); // From auth token or query param
  const path = url.pathname;
  const query = url.search;
  
  return `cache:${orgId}:${path}:${query}`;
}
```

### 2.3 Cache Key Strategy

**Contracts:**
- Base key: `cache:{orgId}:/rest/v1/contracts`
- With filters: `cache:{orgId}:/rest/v1/contracts?org_id=eq.{orgId}&status=eq.Active`
- Per contract: `cache:{orgId}:/rest/v1/contracts?id=eq.{contractId}`

**Org Members:**
- Base key: `cache:{orgId}:/rest/v1/org_members`
- With filters: `cache:{orgId}:/rest/v1/org_members?org_id=eq.{orgId}&status=eq.active`

### 2.4 Cache Invalidation

```typescript
// Invalidate cache on mutations
async function invalidateCache(env: Env, orgId: string, resource: string) {
  const pattern = `cache:${orgId}:/rest/v1/${resource}*`;
  
  // List all keys matching pattern
  const keys = await env.CACHE.list({ prefix: pattern });
  
  // Delete all matching keys
  await Promise.all(keys.keys.map(key => env.CACHE.delete(key.name)));
}

// Call after mutations:
// - Contract create/update/delete
// - Org member add/remove/role change
```

### 2.5 Recommended Cache TTLs

| Endpoint | s-maxage | stale-while-revalidate | Rationale |
|----------|----------|------------------------|------------|
| `/rest/v1/contracts` (list) | 60s | 300s | Contracts change infrequently |
| `/rest/v1/contracts` (single) | 120s | 600s | Individual contracts rarely change |
| `/rest/v1/org_members` (list) | 120s | 600s | Team changes are infrequent |
| `/rest/v1/org_members` (single) | 300s | 1800s | Member details change rarely |

### 2.6 Expected Performance Improvements

**Before:**
- Every request hits Supabase database
- Average response time: 200-500ms
- 6.8k+ requests = high database load

**After:**
- ~80% cache hit rate (estimated)
- Cache hit response time: 10-50ms (from edge)
- Cache miss: 200-500ms (first request)
- Background revalidation: No user wait time
- **Expected reduction: 5.4k+ requests (80% reduction)**

---

## 3. Storage POST 500 Error Analysis

### 3.1 Current Implementation

**Location:** `src/services/contracts.service.ts` (Line 231-246)

```typescript
async uploadContractPdf(file: File, contractId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${contractId}-${Date.now()}.${fileExt}`;
  const filePath = `contracts/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('contract-pdfs')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  return filePath;
}
```

### 3.2 Storage Policy Analysis

**Location:** `supabase/migrations/20260109000001_fix_storage_policies_org_id.sql`

The INSERT policy (`org_insert_contract_pdfs`, Line 141-162) validates:
1. Bucket is `contract-pdfs`
2. Contract ID in path belongs to user's org
3. Contract is not deleted

**Policy Logic:**
```sql
CREATE POLICY "org_insert_contract_pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-pdfs'
  AND (
    -- Extract contract_id from path
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    -- Handle format: contracts/{contract_id}-{timestamp}.pdf
    (string_to_array(name, '/'))[2]::text LIKE '%' || (
      SELECT id::text FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
      LIMIT 1
    ) || '%'
  )
);
```

### 3.3 Potential Causes of 500 Error

#### Issue #1: Path Format Mismatch
**Problem:** The policy expects contract ID in specific path positions, but the code generates:
```
contracts/{contractId}-{timestamp}.pdf
```

The policy checks:
- `(string_to_array(name, '/'))[1]` = `contracts` (not a UUID)
- `(string_to_array(name, '/'))[2]` = `{contractId}-{timestamp}.pdf` (UUID extraction may fail)

**Solution:** The LIKE pattern should work, but UUID extraction from filename might fail if the contract ID isn't at the start of the filename segment.

#### Issue #2: Contract Not Yet Created
**Problem:** If `uploadContractPdf()` is called before the contract is committed to the database, the policy check will fail because the contract doesn't exist yet.

**Evidence:** In `uploadContractPdfAndPersist()` (Line 248-261), the upload happens first, then the database update. If the contract was just created, there might be a race condition.

#### Issue #3: Org ID Mismatch
**Problem:** The contract might exist but belong to a different org than the user's active org, or `get_user_org_ids()` might return empty if the user's membership isn't active.

#### Issue #4: Policy Function Error
**Problem:** The `get_user_org_ids()` function (Line 31-42) might throw an error if:
- User session is invalid
- `auth.uid()` returns null
- `org_members` table query fails

### 3.4 Recommended Fixes

#### Fix #1: Improve Path Extraction
```typescript
// In contracts.service.ts
async uploadContractPdf(file: File, contractId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  // Ensure contract ID is first in filename for policy matching
  const fileName = `${contractId}-${Date.now()}.${fileExt}`;
  // Use format: {contractId}/filename.pdf for easier policy matching
  const filePath = `${contractId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('contract-pdfs')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    // Enhanced error logging
    console.error('Upload error details:', {
      error: uploadError,
      filePath,
      contractId,
      bucket: 'contract-pdfs',
    });
    throw uploadError;
  }

  return filePath;
}
```

#### Fix #2: Verify Contract Before Upload
```typescript
async uploadContractPdf(file: File, contractId: string): Promise<string> {
  // Verify contract exists and belongs to user's org
  const orgId = await getActiveOrgId();
  const contract = await this.getById(contractId);
  
  if (!contract) {
    throw new Error(`Contract ${contractId} not found`);
  }
  
  if (contract.org_id !== orgId) {
    throw new Error(`Contract ${contractId} does not belong to your organization`);
  }

  // Proceed with upload...
}
```

#### Fix #3: Update Storage Policy for Better Path Matching
```sql
-- More robust path extraction
CREATE POLICY "org_insert_contract_pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-pdfs'
  AND (
    -- Format: {contractId}/filename.pdf
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
    OR
    -- Format: contracts/{contractId}-{timestamp}.pdf
    substring(
      (string_to_array(name, '/'))[2],
      1,
      36
    )::uuid IN (
      SELECT id FROM contracts
      WHERE org_id IN (SELECT get_user_org_ids())
        AND deleted_at IS NULL
    )
  )
);
```

#### Fix #4: Add Error Handling and Retry Logic
```typescript
async uploadContractPdf(
  file: File,
  contractId: string,
  retries = 3
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${contractId}-${Date.now()}.${fileExt}`;
  const filePath = `contracts/${fileName}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('contract-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // Check if it's a policy error
        if (uploadError.message?.includes('policy') || uploadError.statusCode === 403) {
          // Wait a bit for contract to be committed (if race condition)
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
        throw uploadError;
      }

      return filePath;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Upload failed after retries');
}
```

### 3.5 Debugging Steps

1. **Check Supabase Logs:**
   - Look for policy evaluation errors
   - Check if `get_user_org_ids()` is returning expected values
   - Verify contract exists at upload time

2. **Add Request Logging:**
   ```typescript
   // Before upload
   const { data: { user } } = await supabase.auth.getUser();
   const orgIds = await supabase.rpc('get_user_org_ids');
   const contract = await this.getById(contractId);
   
   console.log('Upload context:', {
     userId: user?.id,
     orgIds: orgIds.data,
     contractId,
     contractOrgId: contract?.org_id,
     filePath,
   });
   ```

3. **Test Policy Directly:**
   ```sql
   -- Test if policy would allow upload
   SELECT 
     (string_to_array('contracts/123e4567-e89b-12d3-a456-426614174000-1234567890.pdf', '/'))[2] as filename_part,
     substring((string_to_array('contracts/123e4567-e89b-12d3-a456-426614174000-1234567890.pdf', '/'))[2], 1, 36) as extracted_uuid;
   ```

---

## 4. Implementation Recommendations

### 4.1 Priority Order

1. **High Priority:**
   - Fix storage POST 500 error (user-blocking)
   - Implement Cloudflare Workers caching for contracts endpoint
   - Add request deduplication in React hooks

2. **Medium Priority:**
   - Implement caching for org_members endpoint
   - Add cache invalidation on mutations
   - Implement request batching

3. **Low Priority:**
   - Add cache warming strategies
   - Implement cache analytics
   - Add cache hit/miss metrics

### 4.2 Cloudflare Workers Setup

1. **Create Worker:**
   ```bash
   npx wrangler init supabase-cache-worker
   ```

2. **Configure wrangler.toml:**
   ```toml
   name = "supabase-cache-worker"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"

   [vars]
   SUPABASE_URL = "your-supabase-url"

   [[kv_namespaces]]
   binding = "CACHE"
   id = "your-kv-namespace-id"
   ```

3. **Deploy:**
   ```bash
   npx wrangler deploy
   ```

4. **Update Supabase Client:**
   ```typescript
   // Point to Cloudflare Worker instead of direct Supabase
   const SUPABASE_URL = 'https://your-worker.workers.dev';
   ```

### 4.3 React Hook Improvements

```typescript
// Add request deduplication
const requestCache = new Map<string, Promise<any>>();

export function useContractsData(): UseContractsDataReturn {
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContracts = useCallback(async () => {
    const cacheKey = `contracts:${orgId}`;
    
    // Deduplicate concurrent requests
    if (requestCache.has(cacheKey)) {
      const cached = await requestCache.get(cacheKey);
      setContracts(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const promise = contractsService.getAll();
      requestCache.set(cacheKey, promise);
      
      const data = await promise;
      setContracts(data);
      requestCache.delete(cacheKey);
    } catch (error) {
      requestCache.delete(cacheKey);
      // ... error handling
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // ... rest of hook
}
```

---

## 5. Expected Outcomes

### Performance Improvements:
- **80% reduction** in database requests (from 6.8k to ~1.4k)
- **10-50ms response time** for cached requests (vs 200-500ms)
- **Reduced Supabase costs** (fewer API calls)
- **Better user experience** (faster page loads)

### Storage Upload Fix:
- **Eliminate 500 errors** through better path handling
- **Improved error messages** for debugging
- **Retry logic** for transient failures
- **Race condition handling** for new contracts

---

## 6. Next Steps

1. **Immediate:**
   - Fix storage upload path format
   - Add error logging to identify root cause
   - Test policy evaluation with actual paths

2. **Short-term (1-2 weeks):**
   - Implement Cloudflare Workers caching
   - Add request deduplication in React hooks
   - Deploy and monitor cache hit rates

3. **Long-term (1 month):**
   - Implement cache invalidation strategy
   - Add cache analytics and monitoring
   - Optimize cache TTLs based on usage patterns

---

## Appendix: Code References

### Contracts Service:
- `src/services/contracts.service.ts` - Lines 18-310
- `src/features/contracts/hooks/useContractsData.ts` - Lines 25-54

### Org Members Service:
- `src/services/organization.service.ts` - Lines 68-96
- `src/contexts/OrgContext.tsx` - Lines 18-123
- `src/features/organization/TeamMembersList.tsx` - Lines 58-75

### Storage Upload:
- `src/services/contracts.service.ts` - Lines 231-246
- `supabase/migrations/20260109000001_fix_storage_policies_org_id.sql` - Lines 141-162
