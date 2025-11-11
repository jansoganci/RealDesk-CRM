import { supabase } from '../config/supabase';

/**
 * Gets authenticated user ID with fallback to session.
 *
 * This dual-source approach prevents "not authenticated" errors during:
 * - Page reloads (auth state not yet rehydrated)
 * - Token refresh (brief window where getUser() returns null)
 * - Network delays (auth request pending)
 *
 * Priority:
 * 1. supabase.auth.getUser() - Validates JWT via network call (most reliable)
 * 2. supabase.auth.getSession() - Reads from local storage (faster fallback)
 *
 * @returns User ID string
 * @throws Error if neither source available (user truly not authenticated)
 *
 * @example
 * ```typescript
 * // In service layer
 * const userId = await getAuthenticatedUserId();
 * await insertRow('properties', {
 *   ...propertyData,
 *   user_id: userId,
 * });
 * ```
 */
export async function getAuthenticatedUserId(): Promise<string> {
  // Primary: Try getUser() - validates JWT via network call
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (user?.id) {
    return user.id;
  }

  // Fallback: Try getSession() - reads from local storage
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (session?.user?.id) {
    console.warn('[Auth] Using session fallback for user ID');
    return session.user.id;
  }

  // Both failed - user is not authenticated
  console.error('[Auth] Authentication failed', { userError, sessionError });
  throw new Error('User not authenticated. Please log in again.');
}