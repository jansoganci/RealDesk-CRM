/**
 * Consent Logger
 * 
 * Handles database logging of cookie consent decisions for GDPR/KVKK compliance.
 * Provides functions to log consent records to Supabase.
 */

import { supabase } from '@/config/supabase';
import type { ConsentRecordInsert } from '@/types/cookieConsent';
import type { Json } from '@/types/database';

/**
 * Result type for consent logging operations
 */
export interface ConsentLogResult {
  success: boolean;
  error?: string;
  errorType?: 'network' | 'auth' | 'rls' | 'unknown';
}

/**
 * Error type detection
 */
type ErrorType = 'network' | 'auth' | 'rls' | 'unknown';

/**
 * Track consecutive failures for rate limiting
 */
let consecutiveFailures = 0;
let lastErrorLogTime = 0;
const ERROR_LOG_RATE_LIMIT = 30000; // 30 seconds between error logs

/**
 * Detect error type from error message/code
 */
function detectErrorType(error: unknown): ErrorType {
  if (!error) return 'unknown';

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as { code?: string })?.code;

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorCode === 'PGRST116' // PostgREST network error
  ) {
    return 'network';
  }

  // Authentication errors
  if (
    errorMessage.includes('JWT') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorCode === 'PGRST301'
  ) {
    return 'auth';
  }

  // RLS (Row Level Security) errors
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('policy') ||
    errorMessage.includes('RLS') ||
    errorCode === '42501' ||
    errorCode === 'PGRST301'
  ) {
    return 'rls';
  }

  return 'unknown';
}

/**
 * Rate-limited error logging
 */
function logError(message: string, error: unknown, context?: Record<string, unknown>): void {
  const now = Date.now();
  const timeSinceLastLog = now - lastErrorLogTime;

  // Rate limit: only log if enough time has passed
  if (timeSinceLastLog < ERROR_LOG_RATE_LIMIT && consecutiveFailures > 3) {
    return; // Skip logging to prevent spam
  }

  lastErrorLogTime = now;
  consecutiveFailures++;

  const errorType = detectErrorType(error);
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`[ConsentLogger] ${message}`, {
    error: errorMessage,
    errorType,
    consecutiveFailures,
    ...context,
  });
}

/**
 * Get authenticated user ID
 * 
 * Attempts to get the current authenticated user ID.
 * Returns null for anonymous users or if authentication fails.
 * 
 * @returns User ID string or null if not authenticated
 */
async function getUserId(): Promise<string | null> {
  try {
    // Try getUser() first - validates JWT via network call
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }

    // Fallback: Try getSession() - reads from local storage
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user?.id) {
      return session.user.id;
    }

    // Both failed - user is anonymous or not authenticated
    // This is expected for anonymous users, so we don't log an error
    return null;
  } catch (error) {
    // Authentication check failed - treat as anonymous user
    console.debug('[ConsentLogger] Failed to get user ID:', error);
    return null;
  }
}

/**
 * Retry helper with exponential backoff and error-aware retry strategy
 * 
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 * @returns Result of the function call
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  let lastErrorType: ErrorType = 'unknown';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      // Reset consecutive failures on success
      consecutiveFailures = 0;
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      lastErrorType = detectErrorType(error);
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Don't retry auth errors (user not authenticated)
      if (lastErrorType === 'auth') {
        throw lastError;
      }

      // Don't retry RLS errors (policy issue, not transient)
      if (lastErrorType === 'rls') {
        throw lastError;
      }

      // Only retry network errors and unknown errors
      // Exponential backoff: delay = initialDelay * 2^attempt
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Log consent decision to database
 * 
 * Inserts a consent record into the consent_logs table.
 * Handles errors gracefully and includes retry logic for transient failures.
 * 
 * @param consent Consent record to log
 * @returns ConsentLogResult - Success status and optional error message
 */
export async function logConsentToDatabase(
  consent: ConsentRecordInsert
): Promise<ConsentLogResult> {
  try {
    // Validate required fields before database insert
    if (!consent.sessionId || !consent.categories || !consent.timestamp || !consent.version || !consent.language) {
      console.warn('[ConsentLogger] Invalid consent record: missing required fields', {
        hasSessionId: !!consent.sessionId,
        hasCategories: !!consent.categories,
        hasTimestamp: !!consent.timestamp,
        hasVersion: !!consent.version,
        hasLanguage: !!consent.language,
      });
      return {
        success: false,
        error: 'Invalid consent record: missing required fields',
        errorType: 'unknown',
      };
    }

    // Get user ID if authenticated (null for anonymous users)
    const userId = await getUserId();

    // Map TypeScript types to database schema
    const { error } = await retryWithBackoff(async () => {
      const { error: insertError } = await supabase
        .from('consent_logs')
        .insert({
          timestamp: consent.timestamp.toISOString(),
          version: consent.version,
          categories: consent.categories as unknown as Json,
          session_id: consent.sessionId,
          user_agent: consent.userAgent || null,
          language: consent.language,
          user_id: userId || null,
        });

      if (insertError) {
        throw insertError;
      }

      return { error: null };
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    // Log error but don't throw - consent logging should not block UI
    const errorType = detectErrorType(error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Rate-limited error logging with context
    logError('Failed to log consent to database', error, {
      timestamp: consent.timestamp.toISOString(),
      version: consent.version,
      language: consent.language,
      hasUserId: !!consent.userAgent,
    });

    return {
      success: false,
      error: errorMessage,
      errorType,
    };
  }
}

