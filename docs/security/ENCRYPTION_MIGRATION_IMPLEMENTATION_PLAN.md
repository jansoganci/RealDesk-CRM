# 🔒 Encryption Migration - Detailed Implementation Plan

**Date:** February 9, 2026  
**Status:** 📋 Plan Ready for Review  
**Priority:** CRITICAL SECURITY ISSUE

---

## Table of Contents

1. [Edge Functions Design](#1-edge-functions-design)
2. [Frontend Changes Plan](#2-frontend-changes-plan)
3. [Migration Script Details](#3-migration-script-details)
4. [Testing Strategy](#4-testing-strategy)
5. [Deployment Plan](#5-deployment-plan)
6. [Risk Mitigation](#6-risk-mitigation)
7. [Timeline Estimate](#7-timeline-estimate)

---

## 1. Edge Functions Design

### 1.1 Function: `encrypt-sensitive-data`

#### Purpose
Encrypt TC numbers and IBANs server-side using a secure key stored in Supabase secrets.

#### Function Signature

**Endpoint:** `POST /functions/v1/encrypt-sensitive-data`

**Request Type:**
```typescript
interface EncryptRequest {
  data: string;           // Plain text TC or IBAN
  type: 'tc' | 'iban';   // Field type for validation
}
```

**Response Type:**
```typescript
interface EncryptResponse {
  encrypted: string;      // Encrypted data in format "iv:ciphertext" (hex-encoded)
  hash?: string;         // SHA-256 hash (only for type='tc')
  success: boolean;
}
```

**Error Response Type:**
```typescript
interface EncryptErrorResponse {
  error: string;
  code: 'INVALID_INPUT' | 'VALIDATION_ERROR' | 'ENCRYPTION_FAILED' | 'UNAUTHORIZED';
  details?: string;
}
```

#### Authentication & Authorization

**Authentication:**
- Extract JWT token from `Authorization` header
- Use `getUserFromRequest()` helper from `_shared/supabase-admin.ts`
- Verify token is valid and not expired
- **Error if unauthorized:** Return `401 Unauthorized`

**Authorization:**
- Any authenticated user can encrypt data (they own the data they're encrypting)
- No additional ownership checks needed for encryption
- **Rationale:** User is encrypting their own data before storing it

#### Input Validation

**TC Validation:**
- Must be exactly 11 digits: `/^\d{11}$/`
- **Error code:** `VALIDATION_ERROR`
- **Error message:** `"TC Kimlik No must be exactly 11 digits"`

**IBAN Validation:**
- Must match format: `/^TR\d{24}$/`
- **Error code:** `VALIDATION_ERROR`
- **Error message:** `"IBAN must be TR followed by 24 digits"`

**Empty/Null Check:**
- Data cannot be empty or null
- **Error code:** `INVALID_INPUT`
- **Error message:** `"Data is required"`

#### Encryption Logic

**Algorithm:** AES-256-GCM (same as current implementation)

**Key Management:**
- Read key from Supabase secrets: `Deno.env.get('ENCRYPTION_KEY')`
- Key format: 64-character hex string (32 bytes)
- **Error if missing:** Return `500 Internal Server Error` with generic message (don't expose key absence)

**Encryption Steps:**
1. Validate input format (TC or IBAN)
2. Get encryption key from environment
3. Generate random IV (12 bytes / 96 bits)
4. Convert plaintext to Uint8Array
5. Import key using Web Crypto API
6. Encrypt using `crypto.subtle.encrypt()` with AES-GCM
7. Convert IV and ciphertext to hex strings
8. Return format: `"${ivHex}:${ciphertextHex}"`

**Hash Generation (for TC only):**
- If `type === 'tc'`, also generate SHA-256 hash
- Use `crypto.subtle.digest('SHA-256', ...)`
- Return hash in response

#### Error Handling

**Error Scenarios:**

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Missing Authorization header | 401 | UNAUTHORIZED | "Missing Authorization header" |
| Invalid/expired token | 401 | UNAUTHORIZED | "Invalid or expired token" |
| Missing data field | 400 | INVALID_INPUT | "Missing required field: data" |
| Missing type field | 400 | INVALID_INPUT | "Missing required field: type" |
| Invalid TC format | 400 | VALIDATION_ERROR | "TC Kimlik No must be exactly 11 digits" |
| Invalid IBAN format | 400 | VALIDATION_ERROR | "IBAN must be TR followed by 24 digits" |
| Encryption key missing | 500 | ENCRYPTION_FAILED | "Encryption service unavailable" |
| Encryption operation fails | 500 | ENCRYPTION_FAILED | "Failed to encrypt data" |

**Error Response Format:**
```typescript
{
  error: string;
  code: string;
  details?: string;
}
```

#### Rate Limiting Considerations

**Current Approach:** No explicit rate limiting in Edge Function
- Supabase Edge Functions have built-in rate limiting
- Default: ~100 requests/second per function
- **Recommendation:** Monitor usage, add explicit rate limiting if needed later

**Future Enhancement:**
- Add rate limiting using Supabase Edge Function middleware
- Limit: 50 encrypt requests per user per minute
- Return `429 Too Many Requests` if exceeded

#### RLS Policy Integration

**Not Required:**
- Encryption function doesn't access database
- No RLS checks needed
- User authentication is sufficient

#### Implementation Structure

```typescript
// File: supabase/functions/encrypt-sensitive-data/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getUserFromRequest, jsonResponse, errorResponse, corsHeaders } from '../_shared/supabase-admin.ts';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authentication
    const user = await getUserFromRequest(req);
    
    // 2. Parse request
    const body = await req.json();
    const { data, type } = body;
    
    // 3. Validate input
    // ... validation logic ...
    
    // 4. Get encryption key
    const keyHex = Deno.env.get('ENCRYPTION_KEY');
    if (!keyHex) {
      return errorResponse('Encryption service unavailable', 500);
    }
    
    // 5. Encrypt data
    // ... encryption logic ...
    
    // 6. Generate hash (if TC)
    let hash: string | undefined;
    if (type === 'tc') {
      // ... hash generation ...
    }
    
    // 7. Return response
    return jsonResponse({
      success: true,
      encrypted: `${ivHex}:${ciphertextHex}`,
      ...(hash && { hash }),
    });
    
  } catch (error) {
    // Error handling
    return errorResponse(error.message, 500);
  }
});
```

---

### 1.2 Function: `decrypt-sensitive-data`

#### Purpose
Decrypt TC numbers and IBANs server-side, with strict authorization checks to ensure users can only decrypt their own data.

#### Function Signature

**Endpoint:** `POST /functions/v1/decrypt-sensitive-data`

**Request Type:**
```typescript
interface DecryptRequest {
  encrypted: string;              // Encrypted data from database (format: "iv:ciphertext")
  entity_type: 'owner' | 'tenant'; // Type of entity (owner or tenant)
  entity_id: string;              // UUID of owner or tenant record
}
```

**Response Type:**
```typescript
interface DecryptResponse {
  decrypted: string;    // Plain text TC or IBAN
  success: boolean;
  key_used?: 'new' | 'old'; // Which key was used (for migration tracking)
}
```

**Error Response Type:**
```typescript
interface DecryptErrorResponse {
  error: string;
  code: 'INVALID_INPUT' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'DECRYPTION_FAILED' | 'ACCESS_DENIED';
  details?: string;
}
```

#### Authentication & Authorization

**Authentication:**
- Extract JWT token from `Authorization` header
- Use `getUserFromRequest()` helper
- Verify token is valid
- **Error if unauthorized:** Return `401 Unauthorized`

**Authorization (CRITICAL):**
- User must own the entity they're trying to decrypt
- **For owners:** Query `property_owners` table
  ```sql
  SELECT user_id FROM property_owners WHERE id = $1 AND user_id = auth.uid()
  ```
- **For tenants:** Query `tenants` table
  ```sql
  SELECT user_id FROM tenants WHERE id = $1 AND user_id = auth.uid()
  ```
- Use Supabase client with user context (respects RLS)
- **Error if access denied:** Return `403 Forbidden` with message "You don't have access to this data"

#### Input Validation

**Encrypted Data Format:**
- Must match format: `"iv:ciphertext"` (colon-separated hex strings)
- Both parts must be valid hex strings
- **Error code:** `INVALID_INPUT`
- **Error message:** `"Invalid encrypted data format"`

**Entity Type:**
- Must be either `'owner'` or `'tenant'`
- **Error code:** `INVALID_INPUT`
- **Error message:** `"entity_type must be 'owner' or 'tenant'"`

**Entity ID:**
- Must be valid UUID format
- **Error code:** `INVALID_INPUT`
- **Error message:** `"entity_id must be a valid UUID"`

#### Decryption Logic

**Dual-Key Support (Migration Period):**

1. **Try New Key First:**
   - Read `ENCRYPTION_KEY` from Supabase secrets
   - Attempt decryption with new key
   - If successful, return decrypted data with `key_used: 'new'`

2. **Fallback to Old Key:**
   - If new key fails, read `ENCRYPTION_KEY_OLD` from Supabase secrets
   - Attempt decryption with old key
   - If successful, return decrypted data with `key_used: 'old'`
   - **Log:** Record which key was used (for migration tracking)

3. **Both Keys Fail:**
   - Return `DECRYPTION_FAILED` error
   - **Error message:** `"Failed to decrypt data. Data may be corrupted."`

**Decryption Steps:**
1. Verify user owns the entity (authorization check)
2. Parse encrypted string: split by `:` to get IV and ciphertext
3. Convert hex strings to Uint8Array
4. Import encryption key
5. Decrypt using `crypto.subtle.decrypt()` with AES-GCM
6. Convert decrypted bytes to string
7. Return plain text

#### Error Handling

**Error Scenarios:**

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Missing Authorization header | 401 | UNAUTHORIZED | "Missing Authorization header" |
| Invalid/expired token | 401 | UNAUTHORIZED | "Invalid or expired token" |
| Missing encrypted field | 400 | INVALID_INPUT | "Missing required field: encrypted" |
| Missing entity_type | 400 | INVALID_INPUT | "Missing required field: entity_type" |
| Missing entity_id | 400 | INVALID_INPUT | "Missing required field: entity_id" |
| Invalid encrypted format | 400 | INVALID_INPUT | "Invalid encrypted data format" |
| Invalid entity_type | 400 | INVALID_INPUT | "entity_type must be 'owner' or 'tenant'" |
| Invalid entity_id format | 400 | INVALID_INPUT | "entity_id must be a valid UUID" |
| Entity not found | 404 | NOT_FOUND | "Owner/Tenant not found" |
| User doesn't own entity | 403 | ACCESS_DENIED | "You don't have access to this data" |
| Decryption fails (both keys) | 500 | DECRYPTION_FAILED | "Failed to decrypt data" |

#### Rate Limiting Considerations

**Current Approach:** No explicit rate limiting
- Supabase built-in rate limiting applies
- **Recommendation:** Monitor usage

**Future Enhancement:**
- Limit: 100 decrypt requests per user per minute
- Return `429 Too Many Requests` if exceeded

#### RLS Policy Integration

**CRITICAL:** Must use RLS-respecting Supabase client

**Implementation:**
```typescript
// Create user-context client (respects RLS)
const supabase = createUserClient(req.headers.get('Authorization')!.replace('Bearer ', ''));

// Query with RLS enforcement
const { data: entity, error } = await supabase
  .from(entity_type === 'owner' ? 'property_owners' : 'tenants')
  .select('user_id, tc_encrypted, iban_encrypted')
  .eq('id', entity_id)
  .single();

// RLS automatically filters to user's own records
if (error || !entity) {
  return errorResponse('Entity not found or access denied', 403);
}
```

**Why This Works:**
- RLS policies on `property_owners` and `tenants` tables enforce `user_id = auth.uid()`
- If user doesn't own the record, query returns empty (even if record exists)
- This provides defense-in-depth security

#### Implementation Structure

```typescript
// File: supabase/functions/decrypt-sensitive-data/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getUserFromRequest, createUserClient, jsonResponse, errorResponse, corsHeaders } from '../_shared/supabase-admin.ts';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authentication
    const user = await getUserFromRequest(req);
    
    // 2. Parse request
    const body = await req.json();
    const { encrypted, entity_type, entity_id } = body;
    
    // 3. Validate input
    // ... validation logic ...
    
    // 4. Create user-context Supabase client (respects RLS)
    const supabase = createUserClient(req.headers.get('Authorization')!.replace('Bearer ', ''));
    
    // 5. Fetch entity and verify ownership
    const tableName = entity_type === 'owner' ? 'property_owners' : 'tenants';
    const { data: entity, error: fetchError } = await supabase
      .from(tableName)
      .select('user_id, tc_encrypted, iban_encrypted')
      .eq('id', entity_id)
      .single();
    
    if (fetchError || !entity) {
      return errorResponse('Entity not found or access denied', 403);
    }
    
    // 6. Determine which field to decrypt
    const fieldToDecrypt = entity_type === 'owner' 
      ? (encrypted === entity.tc_encrypted ? 'tc' : 'iban')
      : 'tc';
    
    // 7. Decrypt with dual-key support
    let decrypted: string;
    let keyUsed: 'new' | 'old';
    
    try {
      // Try new key first
      decrypted = await decryptWithKey(encrypted, Deno.env.get('ENCRYPTION_KEY')!);
      keyUsed = 'new';
    } catch {
      // Fallback to old key
      const oldKey = Deno.env.get('ENCRYPTION_KEY_OLD');
      if (!oldKey) {
        throw new Error('Decryption failed: no valid key available');
      }
      decrypted = await decryptWithKey(encrypted, oldKey);
      keyUsed = 'old';
    }
    
    // 8. Return response
    return jsonResponse({
      success: true,
      decrypted,
      key_used: keyUsed,
    });
    
  } catch (error) {
    // Error handling
    return errorResponse(error.message, 500);
  }
});
```

---

### 1.3 Function: `migrate-encrypted-data` (One-Time Migration Script)

#### Purpose
Re-encrypt all existing encrypted data from old frontend key to new server-side key.

#### Function Signature

**Endpoint:** `POST /functions/v1/migrate-encrypted-data`

**Request Type:**
```typescript
interface MigrateRequest {
  batch_size?: number;    // Number of records to process per batch (default: 100)
  dry_run?: boolean;      // If true, only report what would be migrated (default: false)
  entity_type?: 'owner' | 'tenant' | 'all'; // Which entities to migrate (default: 'all')
}
```

**Response Type:**
```typescript
interface MigrateResponse {
  success: boolean;
  total_records: number;
  migrated_count: number;
  failed_count: number;
  skipped_count: number;
  batches_processed: number;
  dry_run: boolean;
  errors?: Array<{
    entity_id: string;
    entity_type: 'owner' | 'tenant';
    error: string;
  }>;
}
```

#### Authentication & Authorization

**Authentication:**
- Requires SERVICE ROLE key (admin access)
- **NOT** user authentication
- Use `supabaseAdmin` client from `_shared/supabase-admin.ts`
- **Security:** This function should be called manually by admin, not exposed to frontend

**Authorization:**
- Only service role can access
- Verify request includes service role key
- **Error if unauthorized:** Return `401 Unauthorized`

#### Migration Logic

**Step-by-Step Process:**

1. **Initialize:**
   - Read `ENCRYPTION_KEY` (new key) and `ENCRYPTION_KEY_OLD` (old key)
   - Set batch size (default: 100)
   - Initialize counters

2. **Fetch Records (Batch Processing):**
   - **For owners:** Query `property_owners` table
     ```sql
     SELECT id, user_id, tc_encrypted, iban_encrypted 
     FROM property_owners 
     WHERE tc_encrypted IS NOT NULL OR iban_encrypted IS NOT NULL
     ORDER BY created_at
     LIMIT $batch_size OFFSET $offset
     ```
   - **For tenants:** Query `tenants` table
     ```sql
     SELECT id, user_id, tc_encrypted 
     FROM tenants 
     WHERE tc_encrypted IS NOT NULL
     ORDER BY created_at
     LIMIT $batch_size OFFSET $offset
     ```

3. **Process Each Record:**
   - **For each encrypted field:**
     - Try decrypting with old key
     - If successful, encrypt with new key
     - Update database with new encrypted value
     - Increment `migrated_count`
   - **If decryption fails:**
     - Check if already encrypted with new key (try decrypting with new key)
     - If new key works, skip (already migrated)
     - If both keys fail, log error and increment `failed_count`

4. **Transaction Safety:**
   - Process one record at a time (not batch transaction)
   - If one record fails, continue with next
   - Log all errors for manual review

5. **Repeat:**
   - Process next batch
   - Continue until no more records

#### Error Handling

**Error Scenarios:**

| Scenario | Action |
|----------|--------|
| Missing old key | Return error, cannot migrate without old key |
| Missing new key | Return error, cannot encrypt without new key |
| Decryption fails (old key) | Log error, skip record, continue |
| Encryption fails (new key) | Log error, skip record, continue |
| Database update fails | Log error, skip record, continue |

**Error Logging:**
- Store errors in response `errors` array
- Include entity ID, type, and error message
- Don't fail entire migration for individual record failures

#### Rollback Strategy

**If Migration Fails:**
- Old encrypted data remains in database (not overwritten)
- New encrypted data stored alongside old (if update succeeded)
- **Problem:** Records may have both old and new encrypted values

**Solution:**
- Before migration, add temporary column: `tc_encrypted_backup`
- Store old encrypted value in backup column
- If migration fails, restore from backup
- After successful migration, drop backup column

**Better Approach:**
- Use database transaction per record
- If new encryption succeeds, update; if fails, rollback
- Old data always preserved until new data verified

#### Implementation Structure

```typescript
// File: supabase/functions/migrate-encrypted-data/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabaseAdmin, jsonResponse, errorResponse, corsHeaders } from '../_shared/supabase-admin.ts';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify service role (admin only)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return errorResponse('Service role key required', 401);
    }
    
    // 2. Parse request
    const body = await req.json();
    const { batch_size = 100, dry_run = false, entity_type = 'all' } = body;
    
    // 3. Get encryption keys
    const newKey = Deno.env.get('ENCRYPTION_KEY');
    const oldKey = Deno.env.get('ENCRYPTION_KEY_OLD');
    
    if (!newKey || !oldKey) {
      return errorResponse('Encryption keys not configured', 500);
    }
    
    // 4. Initialize counters
    let totalRecords = 0;
    let migratedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ entity_id: string; entity_type: string; error: string }> = [];
    
    // 5. Process batches
    // ... migration logic ...
    
    // 6. Return results
    return jsonResponse({
      success: true,
      total_records: totalRecords,
      migrated_count: migratedCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      batches_processed: Math.ceil(totalRecords / batch_size),
      dry_run,
      ...(errors.length > 0 && { errors }),
    });
    
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
```

---

## 2. Frontend Changes Plan

### 2.1 New Service: `encryptionEdgeFunction.service.ts`

#### Purpose
Centralized service for calling encryption/decryption Edge Functions.

#### File Location
`src/services/encryptionEdgeFunction.service.ts`

#### Functions to Create

**Function 1: `encryptSensitiveData()`**
```typescript
/**
 * Encrypt sensitive data (TC or IBAN) via Edge Function
 * 
 * @param data - Plain text TC or IBAN
 * @param type - Field type ('tc' or 'iban')
 * @returns Promise with encrypted data and optional hash
 * @throws Error if encryption fails
 */
export async function encryptSensitiveData(
  data: string,
  type: 'tc' | 'iban'
): Promise<{ encrypted: string; hash?: string }> {
  // Implementation details below
}
```

**Function 2: `decryptSensitiveData()`**
```typescript
/**
 * Decrypt sensitive data (TC or IBAN) via Edge Function
 * 
 * @param encrypted - Encrypted data from database
 * @param entityType - Type of entity ('owner' or 'tenant')
 * @param entityId - UUID of owner or tenant record
 * @returns Promise with decrypted plain text
 * @throws Error if decryption fails or access denied
 */
export async function decryptSensitiveData(
  encrypted: string,
  entityType: 'owner' | 'tenant',
  entityId: string
): Promise<string> {
  // Implementation details below
}
```

#### Implementation Pattern

**Based on existing Edge Function calls (`exchangeRates.service.ts`, `stripeCheckout.service.ts`):**

```typescript
import { supabase } from '@/config/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL is not set');
}

export async function encryptSensitiveData(
  data: string,
  type: 'tc' | 'iban'
): Promise<{ encrypted: string; hash?: string }> {
  try {
    // 1. Get user session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Please log in to continue');
    }
    
    // 2. Construct Edge Function URL
    const functionUrl = `${SUPABASE_URL}/functions/v1/encrypt-sensitive-data`;
    
    // 3. Call Edge Function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ data, type }),
    });
    
    // 4. Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Encryption failed');
    }
    
    return {
      encrypted: result.encrypted,
      hash: result.hash,
    };
    
  } catch (error) {
    console.error('[EncryptionEdgeFunction] Encryption error:', error);
    throw error instanceof Error ? error : new Error('Failed to encrypt data');
  }
}

export async function decryptSensitiveData(
  encrypted: string,
  entityType: 'owner' | 'tenant',
  entityId: string
): Promise<string> {
  try {
    // 1. Get user session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Please log in to continue');
    }
    
    // 2. Construct Edge Function URL
    const functionUrl = `${SUPABASE_URL}/functions/v1/decrypt-sensitive-data`;
    
    // 3. Call Edge Function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        encrypted,
        entity_type: entityType,
        entity_id: entityId,
      }),
    });
    
    // 4. Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // Handle specific error codes
      if (response.status === 403) {
        throw new Error('You don\'t have access to this data');
      }
      if (response.status === 404) {
        throw new Error('Data not found');
      }
      
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    
    return result.decrypted;
    
  } catch (error) {
    console.error('[EncryptionEdgeFunction] Decryption error:', error);
    throw error instanceof Error ? error : new Error('Failed to decrypt data');
  }
}
```

#### Error Handling

**Error Types:**
- `NetworkError` - Edge Function unreachable
- `AuthError` - User not authenticated
- `ValidationError` - Invalid input format
- `AccessDeniedError` - User doesn't own the data
- `DecryptionError` - Decryption failed

**Error Handling Strategy:**
- Catch all errors and wrap in user-friendly messages
- Log detailed errors to console for debugging
- Re-throw errors so calling code can handle them
- Provide fallback behavior (show error message to user)

---

### 2.2 Modify: `contractCreation.service.ts`

#### Current Implementation
- Line 8: `import { encrypt, hashTC } from './encryption.service';`
- Line 43: `tc_encrypted: await encrypt(formData.owner_tc)`
- Line 45: `iban_encrypted: await encrypt(formData.owner_iban)`
- Line 55: `tc_encrypted: await encrypt(formData.tenant_tc)`

#### Changes Required

**Step 1: Update Imports**
```typescript
// Remove:
import { encrypt, hashTC } from './encryption.service';

// Add:
import { encryptSensitiveData } from './encryptionEdgeFunction.service';
import { hashTC } from './encryption.service'; // Keep hashTC (safe, client-side)
```

**Step 2: Update Owner Data Preparation**
```typescript
// OLD:
const ownerData = {
  name: formData.owner_name,
  tc_encrypted: await encrypt(formData.owner_tc),
  tc_hash: await hashTC(formData.owner_tc),
  iban_encrypted: await encrypt(formData.owner_iban),
  phone: normalizePhone(formData.owner_phone),
  email: formData.owner_email || null
};

// NEW:
// Encrypt TC and IBAN via Edge Function
const ownerTCResult = await encryptSensitiveData(formData.owner_tc, 'tc');
const ownerIBANResult = await encryptSensitiveData(formData.owner_iban, 'iban');

const ownerData = {
  name: formData.owner_name,
  tc_encrypted: ownerTCResult.encrypted,
  tc_hash: await hashTC(formData.owner_tc), // Keep client-side (safe)
  iban_encrypted: ownerIBANResult.encrypted,
  phone: normalizePhone(formData.owner_phone),
  email: formData.owner_email || null
};
```

**Step 3: Update Tenant Data Preparation**
```typescript
// OLD:
const tenantData = {
  name: formData.tenant_name,
  tc_encrypted: await encrypt(formData.tenant_tc),
  tc_hash: await hashTC(formData.tenant_tc),
  phone: normalizePhone(formData.tenant_phone),
  email: formData.tenant_email || null,
  address: formData.tenant_address
};

// NEW:
// Encrypt TC via Edge Function
const tenantTCResult = await encryptSensitiveData(formData.tenant_tc, 'tc');

const tenantData = {
  name: formData.tenant_name,
  tc_encrypted: tenantTCResult.encrypted,
  tc_hash: await hashTC(formData.tenant_tc), // Keep client-side (safe)
  phone: normalizePhone(formData.tenant_phone),
  email: formData.tenant_email || null,
  address: formData.tenant_address
};
```

**Step 4: Add Error Handling**
```typescript
try {
  // ... existing code ...
  
  // Encrypt owner TC
  const ownerTCResult = await encryptSensitiveData(formData.owner_tc, 'tc');
  
  // ... rest of code ...
  
} catch (error) {
  logger.error('Contract creation error:', error);
  
  // Provide user-friendly error message
  if (error instanceof Error && error.message.includes('encrypt')) {
    throw new Error('Failed to encrypt sensitive data. Please try again.');
  }
  
  throw error;
}
```

#### Impact Assessment

**Performance:**
- **Before:** 2-3 async operations (encrypt calls)
- **After:** 2-3 network requests to Edge Functions
- **Latency:** ~100-200ms per Edge Function call (vs ~10ms local encryption)
- **Total Impact:** ~200-400ms additional latency per contract creation

**User Experience:**
- Show loading state during encryption
- Handle network errors gracefully
- Retry on transient failures

---

### 2.3 Modify: `contractUpdate.service.ts`

#### Current Implementation
- Line 7: `import { encrypt, hashTC } from './encryption.service';`
- Line 56: `tc_encrypted: await encrypt(formData.owner_tc)`
- Line 58: `iban_encrypted: await encrypt(formData.owner_iban)`
- Line 81: `tc_encrypted: await encrypt(formData.tenant_tc)`

#### Changes Required

**Same pattern as `contractCreation.service.ts`:**

1. Update imports
2. Replace `encrypt()` calls with `encryptSensitiveData()` Edge Function calls
3. Keep `hashTC()` (client-side, safe)
4. Add error handling

**Specific Changes:**

```typescript
// OLD:
const ownerData = {
  name: formData.owner_name,
  tc_encrypted: await encrypt(formData.owner_tc),
  tc_hash: await hashTC(formData.owner_tc),
  iban_encrypted: await encrypt(formData.owner_iban),
  // ...
};

// NEW:
const ownerTCResult = await encryptSensitiveData(formData.owner_tc, 'tc');
const ownerIBANResult = await encryptSensitiveData(formData.owner_iban, 'iban');

const ownerData = {
  name: formData.owner_name,
  tc_encrypted: ownerTCResult.encrypted,
  tc_hash: await hashTC(formData.owner_tc),
  iban_encrypted: ownerIBANResult.encrypted,
  // ...
};
```

---

### 2.4 Modify: `useContractEditData.ts`

#### Current Implementation
- Line 9: `import { decrypt } from '@/services/encryption.service';`
- Line 161: `ownerTC = await decrypt(owner.tc_encrypted)`
- Line 164: `ownerIBAN = await decrypt(owner.iban_encrypted)`
- Line 167: `tenantTC = await decrypt(contract.tenant.tc_encrypted)`

#### Changes Required

**Step 1: Update Imports**
```typescript
// Remove:
import { decrypt } from '@/services/encryption.service';

// Add:
import { decryptSensitiveData } from '@/services/encryptionEdgeFunction.service';
```

**Step 2: Update Decryption Logic**
```typescript
// OLD:
try {
  if (owner.tc_encrypted) {
    ownerTC = await decrypt(owner.tc_encrypted);
  }
  if (owner.iban_encrypted) {
    ownerIBAN = await decrypt(owner.iban_encrypted);
  }
  if (contract.tenant.tc_encrypted) {
    tenantTC = await decrypt(contract.tenant.tc_encrypted);
  }
} catch (decryptError) {
  console.error('Decryption error:', decryptError);
  throw new Error('Failed to decrypt sensitive data');
}

// NEW:
try {
  // Decrypt owner TC
  if (owner.tc_encrypted && owner.id) {
    ownerTC = await decryptSensitiveData(owner.tc_encrypted, 'owner', owner.id);
  }
  
  // Decrypt owner IBAN
  if (owner.iban_encrypted && owner.id) {
    ownerIBAN = await decryptSensitiveData(owner.iban_encrypted, 'owner', owner.id);
  }
  
  // Decrypt tenant TC
  if (contract.tenant.tc_encrypted && contract.tenant.id) {
    tenantTC = await decryptSensitiveData(contract.tenant.tc_encrypted, 'tenant', contract.tenant.id);
  }
} catch (decryptError) {
  console.error('Decryption error:', decryptError);
  
  // Provide user-friendly error message
  if (decryptError instanceof Error && decryptError.message.includes('access')) {
    throw new Error('You don\'t have permission to view this data');
  }
  
  throw new Error('Failed to decrypt sensitive data. Please refresh the page.');
}
```

**Step 3: Add Loading States**

The hook already has `loading` state, but we may want to add granular loading states for decryption:

```typescript
const [decrypting, setDecrypting] = useState(false);

// In loadContractData:
setDecrypting(true);
try {
  // ... decryption logic ...
} finally {
  setDecrypting(false);
}

// Return:
return {
  data,
  loading: loading || decrypting, // Combine loading states
  error,
  reload: loadContractData,
};
```

#### Impact Assessment

**Performance:**
- **Before:** 3 async decrypt operations (~30ms total)
- **After:** 3 network requests to Edge Functions (~300-600ms total)
- **Latency:** ~10x slower, but acceptable for edit page load

**User Experience:**
- Show loading spinner during decryption
- Handle access denied errors gracefully
- Provide retry mechanism

---

### 2.5 Update: `encryption.service.ts`

#### Changes Required

**Remove Functions:**
- `encrypt()` - Remove entirely
- `decrypt()` - Remove entirely
- `getEncryptionKey()` - Remove entirely (private function)

**Keep Functions (Safe, Client-Side):**
- `hashTC()` - Keep (SHA-256, one-way)
- `isValidTC()` - Keep (validation only)
- `isValidIBAN()` - Keep (validation only)
- `generateEncryptionKey()` - Keep (utility, but document it's for server-side use only)

**Updated File Structure:**
```typescript
/**
 * Encryption Service - Client-Side Utilities
 * 
 * NOTE: encrypt() and decrypt() have been moved to Edge Functions for security.
 * Only validation and hashing functions remain client-side.
 */

// Keep hashTC, isValidTC, isValidIBAN, generateEncryptionKey
// Remove encrypt, decrypt, getEncryptionKey
```

---

### 2.6 Update: `serviceProxy.ts`

#### Changes Required

**Update Exports:**
```typescript
// OLD:
export { encrypt, decrypt, hashTC, isValidTC, isValidIBAN, generateEncryptionKey } from '../services/encryption.service';

// NEW:
// Remove encrypt/decrypt exports
export { hashTC, isValidTC, isValidIBAN, generateEncryptionKey } from '../services/encryption.service';

// Add new Edge Function service exports
export { encryptSensitiveData, decryptSensitiveData } from '../services/encryptionEdgeFunction.service';
```

---

### 2.7 Loading States & Error Handling

#### Loading States

**Where to Add Loading States:**

1. **Contract Creation Form:**
   - Show loading spinner on submit button
   - Disable form during encryption
   - Show progress: "Encrypting sensitive data..."

2. **Contract Update Form:**
   - Same as creation form

3. **Contract Edit Page:**
   - Show loading skeleton while decrypting
   - Show "Decrypting sensitive data..." message

**Implementation Pattern:**
```typescript
const [isEncrypting, setIsEncrypting] = useState(false);

const handleSubmit = async (formData: ContractFormData) => {
  setIsEncrypting(true);
  try {
    // Encrypt data
    const encrypted = await encryptSensitiveData(formData.tc, 'tc');
    // ... rest of logic ...
  } finally {
    setIsEncrypting(false);
  }
};
```

#### Error Handling

**Error Scenarios:**

1. **Network Error:**
   - Edge Function unreachable
   - **Action:** Show error message, allow retry
   - **Message:** "Network error. Please check your connection and try again."

2. **Authentication Error:**
   - User session expired
   - **Action:** Redirect to login
   - **Message:** "Your session expired. Please log in again."

3. **Validation Error:**
   - Invalid TC/IBAN format
   - **Action:** Show validation error on form field
   - **Message:** "Invalid TC Kimlik No format" (or IBAN)

4. **Access Denied:**
   - User doesn't own the data
   - **Action:** Show error, don't allow access
   - **Message:** "You don't have permission to view this data."

5. **Decryption Error:**
   - Data corrupted or key mismatch
   - **Action:** Log error, show generic message
   - **Message:** "Failed to load data. Please contact support if this persists."

**Error Handling Pattern:**
```typescript
try {
  const decrypted = await decryptSensitiveData(encrypted, 'owner', ownerId);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('access')) {
      toast.error('You don\'t have permission to view this data');
    } else if (error.message.includes('network')) {
      toast.error('Network error. Please try again.');
    } else {
      toast.error('Failed to load data. Please refresh the page.');
    }
  }
  throw error; // Re-throw for calling code to handle
}
```

---

## 3. Migration Script Details

### 3.1 Migration Process Overview

**Goal:** Re-encrypt all existing encrypted data from old frontend key to new server-side key.

**Strategy:** Batch processing with transaction safety per record.

---

### 3.2 Step-by-Step Migration Process

#### Phase 1: Pre-Migration Setup

**Step 1.1: Backup Database**
```bash
# Create full database backup
supabase db dump -f backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

**Step 1.2: Set Encryption Keys in Supabase Secrets**
```bash
# Set new encryption key (server-side)
supabase secrets set ENCRYPTION_KEY="<64-char-hex-string>"

# Set old encryption key (temporary, for migration)
supabase secrets set ENCRYPTION_KEY_OLD="<current-VITE_ENCRYPTION_KEY-value>"
```

**Step 1.3: Verify Keys**
- Test encryption with new key
- Test decryption with old key
- Verify both keys work correctly

**Step 1.4: Deploy Migration Edge Function**
```bash
supabase functions deploy migrate-encrypted-data
```

---

#### Phase 2: Dry Run (Testing)

**Step 2.1: Run Dry Run**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/migrate-encrypted-data" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": true,
    "batch_size": 10,
    "entity_type": "all"
  }'
```

**Step 2.2: Review Dry Run Results**
- Check `total_records` count
- Verify no unexpected errors
- Estimate migration time

**Step 2.3: Test on Small Batch**
```bash
# Migrate only 10 records as test
curl -X POST \
  "${SUPABASE_URL}/functions/v1/migrate-encrypted-data" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": false,
    "batch_size": 10,
    "entity_type": "all"
  }'
```

**Step 2.4: Verify Test Migration**
- Check database: verify records have new encrypted values
- Test decryption: verify new encrypted values decrypt correctly
- Test frontend: verify contract edit page loads correctly

---

#### Phase 3: Full Migration

**Step 3.1: Run Full Migration**
```bash
# Migrate all records
curl -X POST \
  "${SUPABASE_URL}/functions/v1/migrate-encrypted-data" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": false,
    "batch_size": 100,
    "entity_type": "all"
  }'
```

**Step 3.2: Monitor Migration Progress**
- Check response for `migrated_count`, `failed_count`
- Monitor Edge Function logs
- Watch for errors

**Step 3.3: Handle Failures**
- Review `errors` array in response
- Manually fix failed records if needed
- Re-run migration for failed records

**Step 3.4: Verify Migration Complete**
- Query database: count records with old vs new encryption
- Test decryption: verify all records decrypt with new key
- Test frontend: verify all contracts load correctly

---

### 3.3 Handling Failures During Migration

#### Failure Scenarios

**Scenario 1: Network Failure**
- **Symptom:** Edge Function call fails mid-migration
- **Action:** Re-run migration (idempotent - skips already migrated records)
- **Safety:** Already migrated records are skipped (try new key first)

**Scenario 2: Decryption Failure (Old Key)**
- **Symptom:** Cannot decrypt with old key
- **Possible Causes:**
  - Data corrupted
  - Wrong old key
  - Already encrypted with new key
- **Action:** 
  - Check if decrypts with new key (already migrated)
  - If not, log error and skip record
  - Manual investigation required

**Scenario 3: Encryption Failure (New Key)**
- **Symptom:** Cannot encrypt with new key
- **Possible Causes:**
  - New key invalid
  - Edge Function error
- **Action:**
  - Verify new key is correct
  - Check Edge Function logs
  - Fix and retry

**Scenario 4: Database Update Failure**
- **Symptom:** Cannot update database record
- **Possible Causes:**
  - RLS policy blocking
  - Database constraint violation
  - Connection timeout
- **Action:**
  - Check database logs
  - Verify RLS policies
  - Retry failed records

#### Rollback Strategy

**If Migration Fails Completely:**

1. **Stop Migration:**
   - Don't continue if too many failures
   - Set threshold: if >5% failures, stop

2. **Restore Backup:**
   ```bash
   # Restore database from backup
   supabase db reset
   psql < backup_before_migration_*.sql
   ```

3. **Investigate Issues:**
   - Review error logs
   - Fix root cause
   - Re-attempt migration

**If Partial Migration (Some Records Migrated):**

1. **Identify Migrated Records:**
   - Query database for records encrypted with new key
   - Compare with total record count

2. **Option A: Continue Migration:**
   - Re-run migration (skips already migrated)
   - Fix failed records manually

3. **Option B: Rollback Migrated Records:**
   - Decrypt with new key
   - Re-encrypt with old key
   - Restore old encrypted values

**Recommendation:** Option A (continue migration) is safer. Only rollback if >50% records failed.

---

### 3.4 Estimated Migration Time

**Assumptions:**
- Average Edge Function call: ~200ms per record
- Batch size: 100 records per batch
- Network overhead: ~50ms per batch
- Total per batch: ~20 seconds

**Calculation:**
- **Small database (1,000 records):**
  - Batches: 10
  - Time: ~3-5 minutes

- **Medium database (10,000 records):**
  - Batches: 100
  - Time: ~30-40 minutes

- **Large database (100,000 records):**
  - Batches: 1,000
  - Time: ~5-6 hours

**Recommendation:**
- Run migration during low-traffic period
- Monitor progress and pause if needed
- Use smaller batch size (50) if database is slow

---

### 3.5 Testing Approach Before Production Migration

#### Test Environment Setup

**Step 1: Create Test Database**
```bash
# Create test database with production data copy
supabase db dump -f test_migration_data.sql
# Restore to test environment
```

**Step 2: Set Test Keys**
```bash
# Set test encryption keys
supabase secrets set ENCRYPTION_KEY="<test-new-key>"
supabase secrets set ENCRYPTION_KEY_OLD="<test-old-key>"
```

**Step 3: Run Test Migration**
- Run dry run
- Run small batch test
- Run full test migration

#### Validation Tests

**Test 1: Data Integrity**
- Verify all records migrated successfully
- Verify no data loss
- Verify encrypted values changed (new key)

**Test 2: Decryption**
- Test decrypting all migrated records
- Verify decrypted values match original
- Test with both old and new keys (old should fail)

**Test 3: Frontend Integration**
- Test contract creation (new encryption)
- Test contract update (new encryption)
- Test contract edit (new decryption)
- Verify all forms work correctly

**Test 4: Edge Cases**
- Test with null/empty encrypted fields
- Test with corrupted encrypted data
- Test with missing entity records
- Test with invalid entity IDs

**Test 5: Performance**
- Measure migration time
- Measure Edge Function latency
- Measure frontend load times

---

## 4. Testing Strategy

### 4.1 Testing Edge Functions Locally

#### Setup Local Development

**Step 1: Install Supabase CLI**
```bash
# Verify Supabase CLI is installed
supabase --version

# Start local Supabase
supabase start
```

**Step 2: Set Local Secrets**
```bash
# Set encryption keys for local development
supabase secrets set ENCRYPTION_KEY="<test-key>"
supabase secrets set ENCRYPTION_KEY_OLD="<test-old-key>"
```

**Step 3: Deploy Functions Locally**
```bash
# Deploy functions to local instance
supabase functions serve encrypt-sensitive-data
supabase functions serve decrypt-sensitive-data
```

#### Testing encrypt-sensitive-data

**Test Case 1: Valid TC Encryption**
```bash
curl -X POST \
  "http://localhost:54321/functions/v1/encrypt-sensitive-data" \
  -H "Authorization: Bearer ${LOCAL_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "12345678901",
    "type": "tc"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "encrypted": "a1b2c3...:1a2b3c...",
  "hash": "sha256-hash-here"
}
```

**Test Case 2: Valid IBAN Encryption**
```bash
curl -X POST \
  "http://localhost:54321/functions/v1/encrypt-sensitive-data" \
  -H "Authorization: Bearer ${LOCAL_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "TR123456789012345678901234",
    "type": "iban"
  }'
```

**Test Case 3: Invalid TC Format**
```bash
curl -X POST \
  "http://localhost:54321/functions/v1/encrypt-sensitive-data" \
  -H "Authorization: Bearer ${LOCAL_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "12345",
    "type": "tc"
  }'
```

**Expected Result:**
```json
{
  "error": "TC Kimlik No must be exactly 11 digits",
  "code": "VALIDATION_ERROR"
}
```

**Test Case 4: Unauthorized Request**
```bash
curl -X POST \
  "http://localhost:54321/functions/v1/encrypt-sensitive-data" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "12345678901",
    "type": "tc"
  }'
```

**Expected Result:** `401 Unauthorized`

#### Testing decrypt-sensitive-data

**Test Case 1: Valid Decryption (Owner)**
```bash
curl -X POST \
  "http://localhost:54321/functions/v1/decrypt-sensitive-data" \
  -H "Authorization: Bearer ${LOCAL_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "encrypted": "<encrypted-value-from-db>",
    "entity_type": "owner",
    "entity_id": "<owner-uuid>"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "decrypted": "12345678901",
  "key_used": "new"
}
```

**Test Case 2: Access Denied (Wrong User)**
- Create owner record with user A
- Try to decrypt with user B's token
- **Expected:** `403 Forbidden`

**Test Case 3: Entity Not Found**
```bash
curl -X POST \
  "http://localhost:54321/functions/v1/decrypt-sensitive-data" \
  -H "Authorization: Bearer ${LOCAL_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "encrypted": "<encrypted-value>",
    "entity_type": "owner",
    "entity_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Expected Result:** `404 Not Found`

---

### 4.2 Testing with Real Encrypted Data Safely

#### Safe Testing Approach

**Step 1: Create Test Data**
- Create test owner/tenant records with known TC/IBAN values
- Encrypt with old key (frontend encryption)
- Store in test database

**Step 2: Test Decryption**
- Call decrypt Edge Function with test data
- Verify decrypted value matches original
- Test with both old and new keys

**Step 3: Test Re-Encryption**
- Decrypt test data with old key
- Encrypt with new key
- Verify new encrypted value is different
- Verify new encrypted value decrypts correctly

**Step 4: Clean Up**
- Delete test records after testing
- Don't leave test data in production database

#### Test Data Examples

**Test Owner:**
```typescript
const testOwner = {
  name: "Test Owner",
  tc: "12345678901",
  iban: "TR123456789012345678901234",
  phone: "5551234567",
  email: "test@example.com"
};
```

**Test Tenant:**
```typescript
const testTenant = {
  name: "Test Tenant",
  tc: "98765432109",
  phone: "5559876543",
  email: "tenant@example.com"
};
```

---

### 4.3 Parallel Testing Approach

#### Old vs New Encryption Comparison

**Test Strategy:**
1. Create duplicate test records
2. Encrypt one with old method (frontend)
3. Encrypt one with new method (Edge Function)
4. Compare encrypted values (should be different)
5. Verify both decrypt correctly
6. Verify decrypted values match original

**Test Code:**
```typescript
// Test parallel encryption
const testTC = "12345678901";

// Old method (frontend)
const oldEncrypted = await encrypt(testTC); // Using old encryption.service.ts

// New method (Edge Function)
const newEncryptedResult = await encryptSensitiveData(testTC, 'tc');

// Verify both decrypt correctly
const oldDecrypted = await decrypt(oldEncrypted); // Old method
const newDecrypted = await decryptSensitiveData(newEncryptedResult.encrypted, 'owner', ownerId); // New method

// Verify results match
console.assert(oldDecrypted === testTC, "Old decryption failed");
console.assert(newDecrypted === testTC, "New decryption failed");
console.assert(oldEncrypted !== newEncryptedResult.encrypted, "Encrypted values should differ");
```

---

### 4.4 Validation That Decryption Works Correctly

#### Validation Tests

**Test 1: Round-Trip Encryption**
```typescript
const original = "12345678901";
const encrypted = await encryptSensitiveData(original, 'tc');
const decrypted = await decryptSensitiveData(encrypted.encrypted, 'owner', ownerId);
console.assert(original === decrypted, "Round-trip failed");
```

**Test 2: Multiple Encryptions (Different IVs)**
```typescript
const original = "12345678901";
const encrypted1 = await encryptSensitiveData(original, 'tc');
const encrypted2 = await encryptSensitiveData(original, 'tc');

// Encrypted values should differ (different IVs)
console.assert(encrypted1.encrypted !== encrypted2.encrypted, "IVs should differ");

// But both should decrypt to same value
const decrypted1 = await decryptSensitiveData(encrypted1.encrypted, 'owner', ownerId);
const decrypted2 = await decryptSensitiveData(encrypted2.encrypted, 'owner', ownerId);
console.assert(decrypted1 === original && decrypted2 === original, "Decryption failed");
```

**Test 3: Edge Cases**
- Empty string (should fail validation)
- Null value (should fail validation)
- Very long string (should handle gracefully)
- Special characters (should handle correctly)

**Test 4: Performance**
- Measure encryption latency
- Measure decryption latency
- Verify acceptable performance (<500ms per operation)

---

## 5. Deployment Plan

### 5.1 Deployment Order

#### Phase 1: Edge Functions Deployment (No Breaking Changes)

**Step 1.1: Deploy encrypt-sensitive-data**
```bash
supabase functions deploy encrypt-sensitive-data
```

**Step 1.2: Deploy decrypt-sensitive-data**
```bash
supabase functions deploy decrypt-sensitive-data
```

**Step 1.3: Set Encryption Keys**
```bash
# Set new key
supabase secrets set ENCRYPTION_KEY="<new-64-char-hex-key>"

# Set old key (for backward compatibility)
supabase secrets set ENCRYPTION_KEY_OLD="<current-VITE_ENCRYPTION_KEY>"
```

**Step 1.4: Test Edge Functions**
- Test encryption with sample data
- Test decryption with sample data
- Verify authentication works
- Verify authorization works

**Step 1.5: Monitor**
- Check Edge Function logs
- Monitor error rates
- Verify no production impact

**Result:** Edge Functions deployed, but frontend still uses old encryption. No breaking changes.

---

#### Phase 2: Frontend Deployment (Breaking Changes)

**Step 2.1: Deploy Frontend Changes**
- Deploy updated `contractCreation.service.ts`
- Deploy updated `contractUpdate.service.ts`
- Deploy updated `useContractEditData.ts`
- Deploy new `encryptionEdgeFunction.service.ts`
- Deploy updated `encryption.service.ts` (removed encrypt/decrypt)

**Step 2.2: Verify Deployment**
- Test contract creation (new encryption)
- Test contract update (new encryption)
- Test contract edit (new decryption)
- Verify error handling works

**Step 2.3: Monitor**
- Monitor error rates
- Check Edge Function usage
- Verify no decryption failures

**Result:** Frontend now uses Edge Functions. New data encrypted with new key. Old data still decrypts with old key (dual-key support).

---

#### Phase 3: Migration (One-Time)

**Step 3.1: Run Migration**
- Execute migration Edge Function
- Monitor progress
- Handle failures

**Step 3.2: Verify Migration**
- Check all records migrated
- Test decryption with new key
- Verify frontend works correctly

**Step 3.3: Cleanup**
- Remove `ENCRYPTION_KEY_OLD` from secrets
- Remove migration Edge Function (optional)
- Update documentation

**Result:** All data encrypted with new key. Old key removed.

---

### 5.2 Zero Downtime Deployment

#### Is Zero Downtime Possible?

**Yes, with careful planning:**

1. **Edge Functions:** Deploy independently, no downtime
2. **Frontend:** Deploy with dual-key support, no downtime
3. **Migration:** Run during low-traffic period, minimal impact

**Strategy:**
- Deploy Edge Functions first (backward compatible)
- Deploy frontend with feature flag (can toggle old/new encryption)
- Gradually migrate users
- Complete migration during maintenance window (if needed)

#### Feature Flag Approach

**Option: Use Feature Flag for Gradual Rollout**

```typescript
// Feature flag
const USE_EDGE_FUNCTION_ENCRYPTION = import.meta.env.VITE_USE_EDGE_ENCRYPTION === 'true';

// In contractCreation.service.ts
if (USE_EDGE_FUNCTION_ENCRYPTION) {
  // Use Edge Function encryption
  const encrypted = await encryptSensitiveData(data, 'tc');
} else {
  // Use old frontend encryption (fallback)
  const encrypted = await encrypt(data);
}
```

**Benefits:**
- Can toggle without redeployment
- Gradual rollout (10% → 50% → 100%)
- Easy rollback if issues

**Recommendation:** Use feature flag for first deployment, remove after verification.

---

### 5.3 Rollback Plan at Each Step

#### Rollback Plan: Edge Functions Deployment

**If Edge Functions Fail:**
- **Symptom:** High error rate, functions unreachable
- **Action:** 
  1. Keep old frontend encryption working
  2. Fix Edge Functions
  3. Redeploy Edge Functions
- **Impact:** None (frontend still uses old encryption)

#### Rollback Plan: Frontend Deployment

**If Frontend Changes Break:**

**Option A: Feature Flag Rollback**
```bash
# Disable Edge Function encryption
# Set environment variable
VITE_USE_EDGE_ENCRYPTION=false
# Redeploy frontend
```

**Option B: Code Rollback**
- Revert frontend changes
- Redeploy previous version
- **Impact:** Temporary, but safe

**Option C: Keep Both Methods**
- Frontend tries Edge Function first
- Falls back to old encryption if Edge Function fails
- **Impact:** Minimal, but requires keeping old code temporarily

**Recommendation:** Option A (feature flag) is safest.

#### Rollback Plan: Migration

**If Migration Fails:**
- **Symptom:** High failure rate, data corruption
- **Action:**
  1. Stop migration immediately
  2. Restore database from backup
  3. Investigate root cause
  4. Fix issues
  5. Re-attempt migration
- **Impact:** Data restored to pre-migration state

---

### 5.4 Monitoring and Logging Strategy

#### Monitoring Metrics

**Edge Function Metrics:**
- Request count (encrypt/decrypt)
- Success rate
- Error rate by type
- Latency (p50, p95, p99)
- Key usage (new vs old)

**Frontend Metrics:**
- Encryption/decryption call count
- Error rate
- User-facing error messages
- Loading times

**Database Metrics:**
- Encrypted record count
- Migration progress
- Failed record count

#### Logging Strategy

**Edge Function Logs:**
```typescript
// Log all encryption/decryption operations
console.log('[Encrypt]', {
  type: 'tc' | 'iban',
  userId: user.id,
  timestamp: new Date().toISOString(),
});

// Log errors with context
console.error('[Decrypt] Error:', {
  error: error.message,
  entityType: 'owner' | 'tenant',
  entityId: entityId,
  userId: user.id,
});
```

**Frontend Logs:**
```typescript
// Log Edge Function calls
logger.debug('[EncryptionEdgeFunction] Encrypting:', { type: 'tc' });

// Log errors
logger.error('[EncryptionEdgeFunction] Error:', error);
```

**Migration Logs:**
```typescript
// Log migration progress
console.log('[Migration]', {
  batch: batchNumber,
  processed: processedCount,
  migrated: migratedCount,
  failed: failedCount,
});
```

#### Alerting

**Set Up Alerts For:**
- Edge Function error rate >5%
- Decryption failure rate >1%
- Migration failure rate >5%
- Edge Function latency >1s (p95)

**Tools:**
- Supabase Dashboard (built-in monitoring)
- Sentry (error tracking)
- Custom monitoring dashboard

---

## 6. Risk Mitigation

### 6.1 What Could Go Wrong?

#### Risk 1: Edge Function Unavailability

**Scenario:** Edge Functions are down or unreachable.

**Impact:**
- Contract creation fails
- Contract update fails
- Contract edit page cannot load

**Mitigation:**
- **Prevention:** Deploy to multiple regions (if available)
- **Detection:** Monitor Edge Function health
- **Response:** 
  - Fallback to old encryption temporarily (if feature flag enabled)
  - Show user-friendly error message
  - Retry automatically

**Probability:** Low  
**Severity:** High  
**Risk Level:** Medium

---

#### Risk 2: Key Mismatch During Migration

**Scenario:** Old key doesn't match actual encryption key used in production.

**Impact:**
- Cannot decrypt existing data
- Migration fails
- Users cannot view old contracts

**Mitigation:**
- **Prevention:** 
  - Verify old key before migration (test decryption)
  - Document key source clearly
- **Detection:** Test migration on small batch first
- **Response:**
  - Stop migration immediately
  - Investigate key source
  - Fix key and retry

**Probability:** Low  
**Severity:** Critical  
**Risk Level:** High

---

#### Risk 3: Data Loss During Migration

**Scenario:** Migration corrupts or deletes encrypted data.

**Impact:**
- Encrypted data lost
- Cannot recover original TC/IBAN values
- Legal/compliance issues

**Mitigation:**
- **Prevention:**
  - Full database backup before migration
  - Transaction-based updates (one record at a time)
  - Verify decryption before updating
- **Detection:** Compare record counts before/after
- **Response:**
  - Restore from backup
  - Investigate root cause
  - Fix and retry

**Probability:** Very Low  
**Severity:** Critical  
**Risk Level:** Medium

---

#### Risk 4: Performance Degradation

**Scenario:** Edge Function calls add significant latency.

**Impact:**
- Slow contract creation (200-400ms slower)
- Slow contract edit page load (300-600ms slower)
- Poor user experience

**Mitigation:**
- **Prevention:**
  - Optimize Edge Function code
  - Use connection pooling
  - Cache encryption keys (if safe)
- **Detection:** Monitor latency metrics
- **Response:**
  - Optimize Edge Functions
  - Add loading states (already planned)
  - Consider caching strategies

**Probability:** Medium  
**Severity:** Low  
**Risk Level:** Low

---

#### Risk 5: Authorization Bypass

**Scenario:** User can decrypt data they don't own.

**Impact:**
- Data breach
- Privacy violation
- Legal/compliance issues

**Mitigation:**
- **Prevention:**
  - Strict RLS checks in Edge Function
  - Verify user owns entity before decryption
  - Use user-context Supabase client
- **Detection:** Audit logs, monitor access patterns
- **Response:**
  - Revoke access immediately
  - Investigate breach
  - Notify affected users

**Probability:** Very Low  
**Severity:** Critical  
**Risk Level:** High

---

#### Risk 6: Migration Takes Too Long

**Scenario:** Migration runs for hours, blocking other operations.

**Impact:**
- Database locked
- Other operations slow
- User complaints

**Mitigation:**
- **Prevention:**
  - Use batch processing (not locking entire table)
  - Run during low-traffic period
  - Process in smaller batches
- **Detection:** Monitor migration progress
- **Response:**
  - Pause migration if needed
  - Resume later
  - Optimize batch size

**Probability:** Low  
**Severity:** Medium  
**Risk Level:** Low

---

### 6.2 How to Prevent Data Loss

#### Prevention Strategies

**1. Full Database Backup**
```bash
# Before migration
supabase db dump -f backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

**2. Transaction Safety**
- Update one record at a time
- Verify decryption before updating
- Rollback on error

**3. Verification Steps**
- Count records before migration
- Count records after migration
- Verify all records migrated
- Test decryption on sample records

**4. Dual-Key Support**
- Keep old key during migration
- Can decrypt with either key
- No data loss if migration fails

**5. Dry Run First**
- Test migration on copy of production data
- Verify no data loss
- Estimate migration time

---

### 6.3 How to Ensure All Data is Migrated

#### Verification Steps

**Step 1: Count Records**
```sql
-- Count owners with encrypted TC
SELECT COUNT(*) FROM property_owners WHERE tc_encrypted IS NOT NULL;

-- Count owners with encrypted IBAN
SELECT COUNT(*) FROM property_owners WHERE iban_encrypted IS NOT NULL;

-- Count tenants with encrypted TC
SELECT COUNT(*) FROM tenants WHERE tc_encrypted IS NOT NULL;
```

**Step 2: Test Decryption**
```sql
-- Sample records to test
SELECT id, tc_encrypted FROM property_owners WHERE tc_encrypted IS NOT NULL LIMIT 10;
```

**Step 3: Verify Migration Status**
- Check migration response: `migrated_count` vs `total_records`
- Verify `failed_count` is 0 (or acceptable)
- Review error logs

**Step 4: Spot Check**
- Randomly select 10-20 records
- Verify they decrypt with new key
- Verify old key no longer works (expected)

**Step 5: Frontend Testing**
- Test contract edit page
- Verify all contracts load correctly
- Verify no decryption errors

---

### 6.4 Backup Strategy Before Migration

#### Backup Plan

**1. Full Database Backup**
```bash
# Create full backup
supabase db dump -f backup_full_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file exists and is not empty
ls -lh backup_full_*.sql
```

**2. Selective Backup (Encrypted Tables Only)**
```sql
-- Backup property_owners table
COPY property_owners TO '/tmp/property_owners_backup.csv' CSV HEADER;

-- Backup tenants table
COPY tenants TO '/tmp/tenants_backup.csv' CSV HEADER;
```

**3. Backup Encryption Keys**
```bash
# Document old key (securely)
# Store in password manager or secure vault
# DO NOT commit to git
```

**4. Backup Verification**
- Test restore on test database
- Verify backup is complete
- Verify backup is recent (<24 hours old)

**5. Backup Storage**
- Store backup in secure location
- Keep for 30 days after migration
- Encrypt backup if sensitive

---

## 7. Timeline Estimate

### 7.1 Phase Breakdown

#### Phase 1: Edge Functions Development

**Tasks:**
1. Create `encrypt-sensitive-data` Edge Function (4 hours)
2. Create `decrypt-sensitive-data` Edge Function (6 hours)
3. Add authentication/authorization (2 hours)
4. Add error handling (2 hours)
5. Write unit tests (4 hours)
6. Local testing (4 hours)
7. Code review (2 hours)

**Total:** ~24 hours (3 days)

---

#### Phase 2: Frontend Service Development

**Tasks:**
1. Create `encryptionEdgeFunction.service.ts` (2 hours)
2. Update `contractCreation.service.ts` (2 hours)
3. Update `contractUpdate.service.ts` (2 hours)
4. Update `useContractEditData.ts` (3 hours)
5. Update `encryption.service.ts` (1 hour)
6. Update `serviceProxy.ts` (30 minutes)
7. Add loading states (2 hours)
8. Add error handling (2 hours)
9. Frontend testing (4 hours)
10. Code review (2 hours)

**Total:** ~20.5 hours (2.5 days)

---

#### Phase 3: Migration Script Development

**Tasks:**
1. Create `migrate-encrypted-data` Edge Function (6 hours)
2. Add batch processing logic (2 hours)
3. Add error handling (2 hours)
4. Add rollback logic (2 hours)
5. Write tests (4 hours)
6. Test on sample data (4 hours)
7. Code review (2 hours)

**Total:** ~22 hours (3 days)

---

#### Phase 4: Testing & QA

**Tasks:**
1. Test Edge Functions locally (4 hours)
2. Test with real encrypted data (4 hours)
3. Parallel testing (old vs new) (4 hours)
4. Integration testing (4 hours)
5. Performance testing (2 hours)
6. Security testing (4 hours)
7. Bug fixes (8 hours)

**Total:** ~30 hours (4 days)

---

#### Phase 5: Deployment

**Tasks:**
1. Deploy Edge Functions to staging (1 hour)
2. Test on staging (2 hours)
3. Deploy Edge Functions to production (1 hour)
4. Deploy frontend to staging (1 hour)
5. Test on staging (2 hours)
6. Deploy frontend to production (1 hour)
7. Monitor production (4 hours)
8. Run migration (varies by data volume)
9. Verify migration (2 hours)
10. Cleanup (1 hour)

**Total:** ~15 hours (2 days) + migration time

---

#### Phase 6: Migration Execution

**Tasks:**
1. Pre-migration setup (2 hours)
2. Dry run (1 hour)
3. Test migration (small batch) (1 hour)
4. Full migration execution (varies: 30 min - 6 hours)
5. Verification (2 hours)
6. Cleanup (1 hour)

**Total:** ~7 hours + migration execution time

---

### 7.2 Total Implementation Time Estimate

**Development & Testing:**
- Edge Functions: 3 days
- Frontend: 2.5 days
- Migration Script: 3 days
- Testing & QA: 4 days
- **Subtotal:** ~12.5 days

**Deployment:**
- Deployment: 2 days
- Migration: 1 day (assuming medium database)
- **Subtotal:** ~3 days

**Buffer for Issues:**
- Bug fixes: 2 days
- Unexpected issues: 2 days
- **Subtotal:** ~4 days

**Total Estimate:** ~19.5 days (~4 weeks)

**Conservative Estimate:** 5-6 weeks (including buffer and review time)

---

### 7.3 Critical Path

**Must Complete Before Next Phase:**

1. **Edge Functions** → Must complete before frontend changes
2. **Frontend Service** → Must complete before frontend integration
3. **Testing** → Must complete before production deployment
4. **Migration Script** → Must complete before migration execution

**Parallel Work:**
- Edge Functions development can happen in parallel with frontend service development
- Testing can happen in parallel with bug fixes

---

## Summary

This implementation plan provides:

✅ **Detailed Edge Function specifications** (encrypt, decrypt, migrate)  
✅ **Complete frontend change plan** (exact file modifications)  
✅ **Step-by-step migration process** (with rollback strategy)  
✅ **Comprehensive testing strategy** (local, integration, production)  
✅ **Deployment plan** (zero-downtime approach)  
✅ **Risk mitigation** (what could go wrong and how to prevent it)  
✅ **Timeline estimate** (~4-6 weeks total)

**Next Steps:**
1. Review this plan
2. Approve or request changes
3. Begin implementation when approved

---

**Document Status:** ✅ Plan Complete - Ready for Review
