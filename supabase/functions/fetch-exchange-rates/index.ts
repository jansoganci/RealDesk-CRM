/**
 * Fetch Exchange Rates Edge Function
 * 
 * Fetches daily exchange rates from external API and stores them in exchange_rates table.
 * Uses service role to bypass RLS policies.
 * 
 * Can be called:
 * - From frontend (on-demand)
 * - Via cron schedule (automatic daily)
 * 
 * Usage:
 *   POST /fetch-exchange-rates
 *   Body: { "date": "2024-01-15" } (optional, defaults to today)
 */

import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/supabase-admin.ts';

interface RequestBody {
  date?: string; // ISO date string (YYYY-MM-DD), defaults to today
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Test supabaseAdmin initialization before use
  try {
    const testResult = await supabaseAdmin.from('exchange_rates').select('id').limit(0);
    if (testResult.error) {
      console.error('[Edge Function] CRITICAL: supabaseAdmin query failed:', {
        message: testResult.error.message,
        code: testResult.error.code,
      });
      return errorResponse(
        'Service role configuration error',
        500,
        corsHeaders,
        { error: testResult.error.message, code: testResult.error.code }
      );
    }
  } catch (initError) {
    console.error('[Edge Function] CRITICAL: supabaseAdmin initialization exception:', {
      message: initError instanceof Error ? initError.message : String(initError),
      stack: initError instanceof Error ? initError.stack : undefined,
    });
    return errorResponse(
      'Service role initialization failed',
      500,
      corsHeaders,
      { error: initError instanceof Error ? initError.message : String(initError) }
    );
  }

  try {
    // Parse request body
    let body: RequestBody = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (parseError) {
        // No body or invalid JSON - use defaults
      }
    }

    // Determine target date
    let targetDate: Date;
    let dateStr: string;
    try {
      targetDate = body.date ? new Date(body.date) : new Date();
      if (isNaN(targetDate.getTime())) {
        throw new Error(`Invalid date: ${body.date}`);
      }
      dateStr = targetDate.toISOString().split('T')[0];
    } catch (dateError) {
      console.error('[Edge Function] Date parsing failed:', {
        message: dateError instanceof Error ? dateError.message : String(dateError),
        input: body.date,
      });
      return errorResponse(
        'Invalid date format',
        400,
        corsHeaders,
        { error: dateError instanceof Error ? dateError.message : String(dateError) }
      );
    }

    // Check if rates already exist for this date
    let existing;
    try {
      const queryResult = await supabaseAdmin
        .from('exchange_rates')
        .select('rate_date')
        .eq('rate_date', dateStr)
        .limit(1);
      
      if (queryResult.error) {
        console.error('[Edge Function] Database query error:', {
          message: queryResult.error.message,
          code: queryResult.error.code,
        });
        return errorResponse(
          'Database query failed',
          500,
          corsHeaders,
          { error: queryResult.error.message, code: queryResult.error.code }
        );
      }
      
      existing = queryResult.data;
    } catch (queryException) {
      console.error('[Edge Function] Database query exception:', {
        message: queryException instanceof Error ? queryException.message : String(queryException),
      });
      return errorResponse(
        'Database query exception',
        500,
        corsHeaders,
        { error: queryException instanceof Error ? queryException.message : String(queryException) }
      );
    }

    if (existing && existing.length > 0) {
      return jsonResponse({
        success: true,
        message: `Rates for ${dateStr} already exist`,
        date: dateStr,
        skipped: true,
      });
    }

    // Fetch rates from API
    let rates: Record<string, number> = {};

    try {
      // Try API 1: Frankfurter.app (supports historical dates)
      // Note: we use base=EUR as it's the most stable base for Frankfurter/ECB data
      const apiUrl = `https://api.frankfurter.app/${dateStr}?base=EUR&symbols=TRY,USD`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rates && data.rates.TRY && data.rates.USD) {
          // Standardize to TRY base: "Units per 1 TRY"
          // Formula: 1 TRY = (1 / EUR_in_TRY) EUR
          // Formula: 1 TRY = (USD_in_EUR / TRY_in_EUR) USD
          rates = {
            TRY: 1,
            EUR: 1 / data.rates.TRY,
            USD: data.rates.USD / data.rates.TRY,
          };
        } else {
          throw new Error('Missing required rates in API response');
        }
      } else {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Fallback: Try multiple APIs
      // Fallback 1: Frankfurter latest
      try {
        const fallbackUrl1 = 'https://api.frankfurter.app/latest?base=EUR&symbols=TRY,USD';
        const response1 = await fetch(fallbackUrl1);
        
        if (response1.ok) {
          const data1 = await response1.json();
          if (data1.rates && data1.rates.TRY && data1.rates.USD) {
            rates = {
              TRY: 1,
              EUR: 1 / data1.rates.TRY,
              USD: data1.rates.USD / data1.rates.TRY,
            };
          } else {
            throw new Error('Fallback 1 missing rates');
          }
        } else {
          throw new Error(`Fallback 1 returned ${response1.status}`);
        }
      } catch (fallback1Error) {
        // Fallback 2: ExchangeRate-API (USD base)
        try {
          const fallbackUrl2 = 'https://api.exchangerate-api.com/v4/latest/USD';
          const response2 = await fetch(fallbackUrl2);
          
          if (response2.ok) {
            const data2 = await response2.json();
            if (data2.rates && data2.rates.TRY && data2.rates.EUR) {
              // Convert USD-base to TRY-base: "Units per 1 TRY"
              rates = {
                TRY: 1,
                USD: 1 / data2.rates.TRY,
                EUR: data2.rates.EUR / data2.rates.TRY,
              };
            } else {
              throw new Error('Fallback 2 missing rates');
            }
          } else {
            throw new Error(`Fallback 2 returned ${response2.status}`);
          }
        } catch (fallback2Error) {
          console.error('[Edge Function] All APIs failed:', {
            primary: error instanceof Error ? error.message : String(error),
            fallback1: fallback1Error instanceof Error ? fallback1Error.message : String(fallback1Error),
            fallback2: fallback2Error instanceof Error ? fallback2Error.message : String(fallback2Error),
          });
          return errorResponse(
            'Unable to fetch exchange rates from any API',
            500,
            corsHeaders,
            { 
              error: 'All exchange rate APIs failed',
              fallback1: fallback1Error instanceof Error ? fallback1Error.message : String(fallback1Error),
              fallback2: fallback2Error instanceof Error ? fallback2Error.message : String(fallback2Error),
            }
          );
        }
      }
    }

    // Validate rates
    if (!rates.USD || !rates.TRY || !rates.EUR) {
      console.error('[Edge Function] Invalid rates object:', rates);
      return errorResponse(
        'Failed to fetch valid exchange rates',
        500,
        corsHeaders,
        { rates }
      );
    }

    /**
     * POST-MORTEM NOTE:
     * Frankfurter returns "1 base = X symbol". 
     * To ensure our table follows "1 TRY = X target", we must triangulate.
     * Bug was likely caused by inconsistent base assumptions or broken .dev endpoint redirects.
     */
    const pairs = [
      { from: 'TRY', to: 'USD', rate: rates.USD },
      { from: 'TRY', to: 'EUR', rate: rates.EUR },
    ];
    
    // SAFEGUARD: Prevent clearly inverted rates from entering the system
    // 1 TRY is currently ~0.02 EUR. If it's > 0.2, it's almost certainly inverted (e.g. 1.17 USD/EUR).
    const clearlyWrong = pairs.filter(p => p.from === 'TRY' && p.to === 'EUR' && p.rate > 0.2);
    if (clearlyWrong.length > 0) {
      console.error('[Edge Function] CRITICAL: Clearly wrong rate detected, skipping save:', clearlyWrong);
      return errorResponse(
        'Inverted rate detected',
        500,
        corsHeaders,
        { detected: clearlyWrong }
      );
    }
    
    const invalidPairs = pairs.filter(p => !isFinite(p.rate));
    if (invalidPairs.length > 0) {
      console.error('[Edge Function] Invalid rate calculations:', invalidPairs);
      return errorResponse(
        'Invalid rate calculations (Infinity or NaN)',
        500,
        corsHeaders,
        { invalidPairs }
      );
    }

    const rateRecords = pairs.map(pair => ({
      rate_date: dateStr,
      from_currency: pair.from,
      to_currency: pair.to,
      rate: pair.rate,
      source: 'frankfurter.dev',
    }));

    const insertResult = await supabaseAdmin
      .from('exchange_rates')
      .upsert(rateRecords, {
        onConflict: 'rate_date,from_currency,to_currency',
      });
    
    if (insertResult.error) {
      console.error('[Edge Function] Database insert error:', {
        message: insertResult.error.message,
        code: insertResult.error.code,
      });
      return errorResponse(
        'Failed to store exchange rates in database',
        500,
        corsHeaders,
        { 
          error: insertResult.error.message,
          code: insertResult.error.code,
        }
      );
    }
    return jsonResponse(
      {
        success: true,
        message: `Exchange rates fetched and stored for ${dateStr}`,
        date: dateStr,
        rates: {
          'USD->TRY': rates.TRY,
          'USD->EUR': rates.EUR,
        },
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('[Edge Function] Unexpected error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      'Internal server error',
      500,
      corsHeaders,
      { 
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
});

