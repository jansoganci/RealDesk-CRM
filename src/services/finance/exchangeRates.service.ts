// =====================================================
// Exchange Rates Service
// Historical exchange rate management for multi-currency finance
// =====================================================

import { supabase } from '../../config/supabase';

export interface RateInfo {
  rate: number;
  rate_date_used: string; // ISO date string
  source?: string;
}

/**
 * Check if rates exist for a specific date (without fetching)
 * @param date - Date to check
 * @returns Promise<boolean> - True if rates exist for this date
 */
export async function hasRatesForDate(date: Date): Promise<boolean> {
  const dateStr = date.toISOString().split('T')[0];
  console.log('[hasRatesForDate] Checking for date:', dateStr);
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate_date')
    .eq('rate_date', dateStr)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.warn('[hasRatesForDate] Error checking rates for date:', error);
    return false;
  }
  
  const exists = !!data;
  console.log('[hasRatesForDate] Result:', exists ? 'EXISTS' : 'NOT FOUND');
  return exists;
}

/**
 * Fetch exchange rates for a specific date from API and store in database
 * Calls Edge Function which uses service role to bypass RLS
 * @param date - Date to fetch rates for (defaults to today)
 * @returns Promise<void>
 */
export async function fetchAndStoreDailyRates(date: Date = new Date()): Promise<void> {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  console.log('[fetchAndStoreDailyRates] Called for date:', dateStr);
  
  // Get Supabase URL and anon key from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set');
  }

  // Call Edge Function (runs server-side with service role)
  const functionUrl = `${supabaseUrl}/functions/v1/fetch-exchange-rates`;
  console.log('[fetchAndStoreDailyRates] Calling Edge Function:', functionUrl);
  
  // Get user's auth token for authenticated request
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey, // Required: Supabase infrastructure authentication
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  console.log('[fetchAndStoreDailyRates] Headers:', {
    hasApikey: !!supabaseAnonKey,
    hasAuth: !!authToken,
  });

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ date: dateStr }),
  });

  console.log('[fetchAndStoreDailyRates] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('[fetchAndStoreDailyRates] Edge Function error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`Failed to fetch exchange rates: ${errorData.error || response.statusText}`);
  }

  const result = await response.json();
  console.log('[fetchAndStoreDailyRates] Success:', result);
  
  // Log if skipped (already exists)
  if (result.skipped) {
    console.log(`[fetchAndStoreDailyRates] Rates for ${dateStr} already exist, skipped`);
  }
}

/**
 * Get exchange rate for a specific date with fallback to previous available rate
 * @param fromCurrency - Source currency code (ISO 4217)
 * @param toCurrency - Target currency code (ISO 4217)
 * @param date - Transaction date (ISO date string or Date object)
 * @returns Promise<RateInfo> - Rate and the date that was actually used
 */
export async function getRateForDate(
  fromCurrency: string,
  toCurrency: string,
  date: string | Date
): Promise<RateInfo> {
  // Normalize currencies
  const from = fromCurrency.toUpperCase().trim();
  const to = toCurrency.toUpperCase().trim();
  
  // If same currency, return 1.0
  if (from === to) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return {
      rate: 1.0,
      rate_date_used: dateStr,
    };
  }

  // Normalize date
  const dateStr = typeof date === 'string' 
    ? date.split('T')[0] // Extract YYYY-MM-DD from ISO string
    : date.toISOString().split('T')[0];

  // Try exact date match first
  let { data, error } = await supabase
    .from('exchange_rates')
    .select('rate, rate_date, source')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .eq('rate_date', dateStr)
    .maybeSingle();

  // If exact match found, return it
  if (data && !error) {
    return {
      rate: Number(data.rate),
      rate_date_used: data.rate_date,
      source: data.source || undefined,
    };
  }

  // Fallback: Get previous available rate (ORDER BY rate_date DESC LIMIT 1)
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('exchange_rates')
    .select('rate, rate_date, source')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .lte('rate_date', dateStr)
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackData && !fallbackError) {
    return {
      rate: Number(fallbackData.rate),
      rate_date_used: fallbackData.rate_date,
      source: fallbackData.source || undefined,
    };
  }

  // Last resort: Try to fetch and store rates for the requested date
  // This handles the case where no rates exist yet
  try {
    const requestedDate = new Date(dateStr);
    await fetchAndStoreDailyRates(requestedDate);
    
    // Retry lookup after fetching
    const { data: retryData } = await supabase
      .from('exchange_rates')
      .select('rate, rate_date, source')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .eq('rate_date', dateStr)
      .maybeSingle();

    if (retryData) {
      return {
        rate: Number(retryData.rate),
        rate_date_used: retryData.rate_date,
        source: retryData.source || undefined,
      };
    }
  } catch (fetchError) {
    console.warn('Failed to fetch rates on-demand:', fetchError);
  }

  // Ultimate fallback: return 1.0 if no rate found (shouldn't happen in production)
  console.warn(`No exchange rate found for ${from}->${to} on ${dateStr}, using 1.0`);
  return {
    rate: 1.0,
    rate_date_used: dateStr,
  };
}

/**
 * Backfill exchange rates for a date range
 * Useful for filling gaps after API outages or missed days
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Promise<{fetched: number, skipped: number}> - Count of fetched vs skipped dates
 */
export async function backfillRatesForDateRange(
  startDate: Date,
  endDate: Date
): Promise<{ fetched: number; skipped: number }> {
  let fetched = 0;
  let skipped = 0;
  const current = new Date(startDate);
  
  // Normalize dates to start of day
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    
    try {
      const hasRates = await hasRatesForDate(current);
      
      if (!hasRates) {
        try {
          await fetchAndStoreDailyRates(new Date(current));
          fetched++;
        } catch (error) {
          console.warn(`Failed to fetch rates for ${dateStr}:`, error);
        }
      } else {
        skipped++;
      }
    } catch (error) {
      console.warn(`Error checking rates for ${dateStr}:`, error);
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return { fetched, skipped };
}

