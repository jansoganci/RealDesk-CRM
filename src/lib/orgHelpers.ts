import { supabase } from '../config/supabase';
import { getAuthenticatedUserId } from './auth';

/**
 * Gets the current user's active organization ID.
 *
 * This function is used in service layer to get org_id for queries.
 * It follows the same pattern as getAuthenticatedUserId().
 *
 * @returns org_id string
 * @throws Error if user has no active org membership
 *
 * @example
 * ```typescript
 * // In service layer
 * const orgId = await getActiveOrgId();
 * const { data } = await supabase
 *   .from('properties')
 *   .select('*')
 *   .eq('org_id', orgId)
 *   .is('deleted_at', null);
 * ```
 */
// Promise caching for deduping parallel org checks
let activeOrgPromise: Promise<string> | null = null;

export async function getActiveOrgId(): Promise<string> {
  // If a request is already in flight, return that promise
  if (activeOrgPromise) {
    return activeOrgPromise;
  }

  activeOrgPromise = (async () => {
    try {
      const userId = await getAuthenticatedUserId();

      // Use limit(1) to handle users with multiple orgs (V1: pick first one)
      const { data, error } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !data?.org_id) {
        throw new Error('No active organization found. Please contact support.');
      }

      return data.org_id;
    } finally {
      // Clear the promise so next request can start fresh
      activeOrgPromise = null;
    }
  })();

  return activeOrgPromise;
}

/**
 * Soft delete helper - updates deleted_at timestamp instead of hard delete.
 *
 * All business tables use soft delete for data recovery and audit trails.
 * RLS policies block actual DELETE operations.
 *
 * @param table - Table name to soft delete from
 * @param id - Record ID to soft delete
 * @throws Error if update fails
 *
 * @example
 * ```typescript
 * // In service layer
 * async delete(id: string): Promise<void> {
 *   await softDelete('properties', id);
 * }
 * ```
 */
export async function softDelete(table: string, id: string): Promise<void> {
  // Table name is dynamic, so we use type assertion for the generic supabase call
  const { error } = await supabase
    .from(table as 'properties')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error(`[softDelete] Failed to soft delete from ${table}:`, error);
    throw error;
  }
}
