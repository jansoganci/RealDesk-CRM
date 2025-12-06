import { supabase } from '../config/supabase';

/**
 * Gets billing status for the current authenticated user.
 * 
 * Checks if user has active access (trial or subscription) and returns
 * billing information including status and trial end date.
 * 
 * @returns Object with hasActiveAccess (boolean), billingStatus (string | null), and trialEnd (string | null)
 * 
 * @example
 * ```typescript
 * const { hasActiveAccess, billingStatus, trialEnd } = await getBillingStatus();
 * if (!hasActiveAccess) {
 *   // Redirect to paywall
 * }
 * ```
 */
export async function getBillingStatus(): Promise<{
  hasActiveAccess: boolean;
  billingStatus: string | null;
  trialEnd: string | null;
}> {
  try {
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // No user logged in - return safe fallback
      return {
        hasActiveAccess: false,
        billingStatus: null,
        trialEnd: null,
      };
    }

    // Call RPC function to check if user has active access
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'user_has_active_access',
      { user_uuid: user.id }
    );

    if (rpcError) {
      console.error('[Billing] RPC error', rpcError);
      // Treat RPC error as no access, but continue to fetch billing row for status
    }

    // Normalize RPC response (handle both boolean and array responses)
    let normalizedRpcValue: boolean = false;
    if (rpcData !== null && rpcData !== undefined) {
      if (Array.isArray(rpcData)) {
        // If array, check first element or look for user_has_active_access property
        const firstElement = rpcData[0];
        if (typeof firstElement === 'boolean') {
          normalizedRpcValue = firstElement;
        } else if (firstElement && typeof firstElement === 'object' && 'user_has_active_access' in firstElement) {
          normalizedRpcValue = Boolean(firstElement.user_has_active_access);
        } else {
          // Fallback: use first element as boolean if truthy
          normalizedRpcValue = Boolean(firstElement);
        }
      } else if (typeof rpcData === 'boolean') {
        normalizedRpcValue = rpcData;
      } else {
        // Handle other types (object with property, etc.)
        normalizedRpcValue = Boolean(rpcData);
      }
    }

    // Fetch billing row to get status and trial end date
    const { data: billingRow, error: billingError } = await supabase
      .from('user_billing')
      .select('billing_status, trial_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (billingError) {
      console.error('[Billing] fetch error', billingError);
      // Return RPC result even if billing row fetch failed
      return {
        hasActiveAccess: Boolean(normalizedRpcValue),
        billingStatus: null,
        trialEnd: null,
      };
    }

    // Return combined result
    return {
      hasActiveAccess: Boolean(normalizedRpcValue),
      billingStatus: billingRow?.billing_status ?? null,
      trialEnd: billingRow?.trial_end ?? null,
    };
  } catch (error) {
    // Catch any unexpected errors and return safe fallback
    console.error('[Billing] Unexpected error', error);
    return {
      hasActiveAccess: false,
      billingStatus: null,
      trialEnd: null,
    };
  }
}

