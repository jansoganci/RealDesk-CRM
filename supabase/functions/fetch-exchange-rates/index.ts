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
  console.log('[Edge Function] ===== ENTRY =====');
  console.log('[Edge Function] fetch-exchange-rates called', {
    method: req.method,
    hasAuth: !!req.headers.get('Authorization'),
    hasApikey: !!req.headers.get('apikey'),
    url: req.url,
  });
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[Edge Function] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Test supabaseAdmin initialization before use
  console.log('[Edge Function] STEP 1: Testing supabaseAdmin initialization...');
  try {
    // Attempt a minimal query to verify service role is configured
    const testResult = await supabaseAdmin.from('exchange_rates').select('id').limit(0);
    if (testResult.error) {
      console.error('[Edge Function] CRITICAL: supabaseAdmin query failed:', {
        message: testResult.error.message,
        code: testResult.error.code,
        details: testResult.error.details,
        hint: testResult.error.hint,
      });
      return errorResponse(
        'Service role configuration error',
        500,
        corsHeaders,
        { error: testResult.error.message, code: testResult.error.code }
      );
    }
    console.log('[Edge Function] STEP 1: ✓ supabaseAdmin initialized successfully');
  } catch (initError) {
    console.error('[Edge Function] CRITICAL: supabaseAdmin initialization exception:', {
      message: initError instanceof Error ? initError.message : String(initError),
      stack: initError instanceof Error ? initError.stack : undefined,
      name: initError instanceof Error ? initError.name : typeof initError,
      error: initError,
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
    console.log('[Edge Function] STEP 2: Parsing request body...');
    let body: RequestBody = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
        console.log('[Edge Function] STEP 2: ✓ Body parsed:', { hasDate: !!body.date, date: body.date });
      } catch (parseError) {
        console.warn('[Edge Function] STEP 2: Body parse failed (using defaults):', {
          message: parseError instanceof Error ? parseError.message : String(parseError),
          error: parseError,
        });
        // No body or invalid JSON - use defaults
      }
    } else {
      console.log('[Edge Function] STEP 2: Not a POST request, using defaults');
    }

    // Determine target date
    console.log('[Edge Function] STEP 3: Parsing target date...');
    let targetDate: Date;
    let dateStr: string;
    try {
      targetDate = body.date ? new Date(body.date) : new Date();
      console.log('[Edge Function] STEP 3: Date object created:', {
        input: body.date,
        isValid: !isNaN(targetDate.getTime()),
        timestamp: targetDate.getTime(),
      });
      
      if (isNaN(targetDate.getTime())) {
        throw new Error(`Invalid date: ${body.date}`);
      }
      
      dateStr = targetDate.toISOString().split('T')[0];
      console.log('[Edge Function] STEP 3: ✓ Date parsed successfully:', dateStr);
    } catch (dateError) {
      console.error('[Edge Function] STEP 3: ✗ Date parsing failed:', {
        message: dateError instanceof Error ? dateError.message : String(dateError),
        stack: dateError instanceof Error ? dateError.stack : undefined,
        input: body.date,
        error: dateError,
      });
      return errorResponse(
        'Invalid date format',
        400,
        corsHeaders,
        { error: dateError instanceof Error ? dateError.message : String(dateError) }
      );
    }

    // Check if rates already exist for this date
    console.log('[Edge Function] STEP 4: Querying existing rates for date:', dateStr);
    let existing;
    try {
      const queryResult = await supabaseAdmin
        .from('exchange_rates')
        .select('rate_date')
        .eq('rate_date', dateStr)
        .limit(1);
      
      if (queryResult.error) {
        console.error('[Edge Function] STEP 4: ✗ Database query error:', {
          message: queryResult.error.message,
          code: queryResult.error.code,
          details: queryResult.error.details,
          hint: queryResult.error.hint,
          error: queryResult.error,
        });
        return errorResponse(
          'Database query failed',
          500,
          corsHeaders,
          { error: queryResult.error.message, code: queryResult.error.code }
        );
      }
      
      existing = queryResult.data;
      console.log('[Edge Function] STEP 4: ✓ Query successful:', { 
        exists: !!existing?.length,
        count: existing?.length || 0 
      });
    } catch (queryException) {
      console.error('[Edge Function] STEP 4: ✗ Database query exception:', {
        message: queryException instanceof Error ? queryException.message : String(queryException),
        stack: queryException instanceof Error ? queryException.stack : undefined,
        error: queryException,
      });
      return errorResponse(
        'Database query exception',
        500,
        corsHeaders,
        { error: queryException instanceof Error ? queryException.message : String(queryException) }
      );
    }

    if (existing && existing.length > 0) {
      console.log('[Edge Function] Rates already exist, returning early');
      return jsonResponse({
        success: true,
        message: `Rates for ${dateStr} already exist`,
        date: dateStr,
        skipped: true,
      });
    }

    // Fetch rates from API
    console.log('[Edge Function] STEP 5: Fetching rates from external API...');
    let rates: Record<string, number> = {};

    try {
      // Try API 1: Frankfurter.dev (supports historical dates)
      const apiUrl = `https://api.frankfurter.dev/${dateStr}?base=USD&symbols=TRY,EUR`;
      console.log('[Edge Function] STEP 5: Calling Frankfurter API:', apiUrl);
      
      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        console.log('[Edge Function] STEP 5: API response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });
      } catch (fetchError) {
        console.error('[Edge Function] STEP 5: ✗ Fetch request failed:', {
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined,
          error: fetchError,
        });
        throw fetchError;
      }

      if (response.ok) {
        let data;
        try {
          data = await response.json();
          console.log('[Edge Function] STEP 5: ✓ JSON parsed:', {
            hasRates: !!data.rates,
            hasTRY: !!data.rates?.TRY,
            hasEUR: !!data.rates?.EUR,
            tryValue: data.rates?.TRY,
            eurValue: data.rates?.EUR,
          });
        } catch (jsonError) {
          console.error('[Edge Function] STEP 5: ✗ JSON parse failed:', {
            message: jsonError instanceof Error ? jsonError.message : String(jsonError),
            stack: jsonError instanceof Error ? jsonError.stack : undefined,
            status: response.status,
            error: jsonError,
          });
          throw new Error(`Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
        
        if (data.rates && data.rates.TRY && data.rates.EUR) {
          // Validate rates are not zero before division
          if (data.rates.TRY === 0 || data.rates.EUR === 0) {
            throw new Error(`Invalid exchange rate: TRY=${data.rates.TRY}, EUR=${data.rates.EUR}`);
          }
          
          // Calculate EUR in TRY: If 1 USD = X TRY and 1 USD = Y EUR, then 1 EUR = X/Y TRY
          const eurInTry = data.rates.TRY / data.rates.EUR;
          rates = {
            USD: 1,
            TRY: data.rates.TRY,
            EUR: eurInTry,
          };
          console.log('[Edge Function] STEP 5: ✓ Rates calculated:', rates);
        } else {
          console.warn('[Edge Function] STEP 5: Missing required rates in response:', data);
        }
      } else {
        console.warn('[Edge Function] STEP 5: API returned non-OK status:', response.status);
      }
    } catch (error) {
      console.error('[Edge Function] STEP 5: ✗ Primary API failed:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });
      console.log('[Edge Function] STEP 5: Attempting fallback API...');

      // Fallback: Use current rates API (for MVP)
      try {
        const fallbackUrl = 'https://api.frankfurter.dev/latest?base=USD&symbols=TRY,EUR';
        console.log('[Edge Function] STEP 5: Calling fallback API:', fallbackUrl);
        
        const currentResponse = await fetch(fallbackUrl);
        console.log('[Edge Function] STEP 5: Fallback response:', {
          status: currentResponse.status,
          ok: currentResponse.ok,
        });
        
        if (currentResponse.ok) {
          let currentData;
          try {
            currentData = await currentResponse.json();
            console.log('[Edge Function] STEP 5: Fallback JSON parsed:', {
              hasRates: !!currentData.rates,
              hasTRY: !!currentData.rates?.TRY,
              hasEUR: !!currentData.rates?.EUR,
            });
          } catch (fallbackJsonError) {
            console.error('[Edge Function] STEP 5: ✗ Fallback JSON parse failed:', {
              message: fallbackJsonError instanceof Error ? fallbackJsonError.message : String(fallbackJsonError),
              error: fallbackJsonError,
            });
            throw fallbackJsonError;
          }
          
          if (currentData.rates && currentData.rates.TRY && currentData.rates.EUR) {
            if (currentData.rates.TRY === 0 || currentData.rates.EUR === 0) {
              throw new Error(`Invalid fallback exchange rate: TRY=${currentData.rates.TRY}, EUR=${currentData.rates.EUR}`);
            }
            
            const eurInTry = currentData.rates.TRY / currentData.rates.EUR;
            rates = {
              USD: 1,
              TRY: currentData.rates.TRY,
              EUR: eurInTry,
            };
            console.log('[Edge Function] STEP 5: ✓ Fallback rates calculated:', rates);
          } else {
            console.warn('[Edge Function] STEP 5: Fallback response missing required rates');
          }
        }
      } catch (fallbackError) {
        console.error('[Edge Function] STEP 5: ✗ Fallback API failed:', {
          message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
          error: fallbackError,
        });
        return errorResponse(
          'Unable to fetch exchange rates from API',
          500,
          corsHeaders,
          { 
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
            stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
          }
        );
      }
    }

    console.log('[Edge Function] STEP 6: Validating rates...');
    if (!rates.USD || !rates.TRY || !rates.EUR) {
      console.error('[Edge Function] STEP 6: ✗ Invalid rates object:', rates);
      return errorResponse(
        'Failed to fetch valid exchange rates',
        500,
        corsHeaders,
        { rates }
      );
    }
    console.log('[Edge Function] STEP 6: ✓ Rates validated:', rates);

    // Store rates in database (all pairs: USD->TRY, USD->EUR, TRY->USD, EUR->USD, EUR->TRY, TRY->EUR)
    console.log('[Edge Function] STEP 7: Preparing rate pairs...');
    const pairs = [
      { from: 'USD', to: 'TRY', rate: rates.TRY },
      { from: 'USD', to: 'EUR', rate: rates.EUR },
      { from: 'TRY', to: 'USD', rate: 1 / rates.TRY },
      { from: 'EUR', to: 'USD', rate: 1 / rates.EUR },
      { from: 'EUR', to: 'TRY', rate: rates.TRY / rates.EUR },
      { from: 'TRY', to: 'EUR', rate: rates.EUR / rates.TRY },
    ];
    
    // Validate no Infinity or NaN
    const invalidPairs = pairs.filter(p => !isFinite(p.rate));
    if (invalidPairs.length > 0) {
      console.error('[Edge Function] STEP 7: ✗ Invalid rate calculations:', invalidPairs);
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
    
    console.log('[Edge Function] STEP 7: ✓ Rate records prepared:', {
      count: rateRecords.length,
      sample: rateRecords[0],
    });

    console.log('[Edge Function] STEP 8: Inserting rates into database...');
    let insertResult;
    try {
      insertResult = await supabaseAdmin
        .from('exchange_rates')
        .upsert(rateRecords, {
          onConflict: 'rate_date,from_currency,to_currency',
        });
      
      if (insertResult.error) {
        console.error('[Edge Function] STEP 8: ✗ Database insert error:', {
          message: insertResult.error.message,
          code: insertResult.error.code,
          details: insertResult.error.details,
          hint: insertResult.error.hint,
          error: insertResult.error,
        });
        return errorResponse(
          'Failed to store exchange rates in database',
          500,
          corsHeaders,
          { 
            error: insertResult.error.message,
            code: insertResult.error.code,
            details: insertResult.error.details,
          }
        );
      }
      
      console.log('[Edge Function] STEP 8: ✓ Rates inserted successfully');
    } catch (insertException) {
      console.error('[Edge Function] STEP 8: ✗ Database insert exception:', {
        message: insertException instanceof Error ? insertException.message : String(insertException),
        stack: insertException instanceof Error ? insertException.stack : undefined,
        error: insertException,
      });
      return errorResponse(
        'Database insert exception',
        500,
        corsHeaders,
        { error: insertException instanceof Error ? insertException.message : String(insertException) }
      );
    }

    console.log('[Edge Function] ===== SUCCESS =====');
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
    console.error('[Edge Function] ===== UNHANDLED EXCEPTION =====');
    console.error('[Edge Function] Unexpected error in fetch-exchange-rates:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      error: error,
    });
    return errorResponse(
      'Internal server error',
      500,
      corsHeaders,
      { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
  }
});

