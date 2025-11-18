// Exchange rates (base currency: USD)
// Rates are fetched from free API and cached for 24 hours
// These are only used as LAST RESORT fallback if all APIs fail
let exchangeRates: Record<string, number> = {
  USD: 1,
  TRY: 42.30, // Emergency fallback only
  EUR: 49.09, // Emergency fallback only
};

// Cache key for localStorage
const EXCHANGE_RATES_CACHE_KEY = 'emlak_crm_exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface ExchangeRatesCache {
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * Fetch exchange rates from free API
 * Uses most reliable free APIs with proper fallback chain
 * Falls back to emergency rates only if all APIs fail
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Try API 1: Frankfurter.dev (PRIMARY - No limits, no API key, ECB source)
  try {
    const response = await fetch('https://api.frankfurter.dev/latest?base=USD&symbols=TRY,EUR', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates && data.rates.TRY && data.rates.EUR) {
        // Calculate EUR in TRY: If 1 USD = X TRY and 1 USD = Y EUR, then 1 EUR = X/Y TRY
        const eurInTry = data.rates.TRY / data.rates.EUR;
        return {
          USD: 1,
          TRY: data.rates.TRY,
          EUR: eurInTry, // 1 EUR = X TRY
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ API 1 (frankfurter.dev) failed, trying backup...', error);
  }

  // Try API 2: ExchangeRate-API.com (BACKUP - 1,500 req/month, proven reliable)
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates && typeof data.rates.TRY === 'number' && typeof data.rates.EUR === 'number') {
        // Calculate EUR in TRY: If 1 USD = X TRY and 1 USD = Y EUR, then 1 EUR = X/Y TRY
        const eurInTry = data.rates.TRY / data.rates.EUR;
        return {
          USD: 1,
          TRY: data.rates.TRY,
          EUR: eurInTry, // 1 EUR = X TRY
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ API 2 (exchangerate-api.com) failed, trying last backup...', error);
  }

  // Try API 3: exchangerate.host (LAST RESORT - less reliable)
  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=TRY,EUR', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.rates && data.rates.TRY && data.rates.EUR) {
        // Calculate EUR in TRY: If 1 USD = X TRY and 1 USD = Y EUR, then 1 EUR = X/Y TRY
        const eurInTry = data.rates.TRY / data.rates.EUR;
        return {
          USD: 1,
          TRY: data.rates.TRY,
          EUR: eurInTry, // 1 EUR = X TRY
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ API 3 (exchangerate.host) failed', error);
  }

  // All APIs failed - use emergency fallback
  console.error('❌ All exchange rate APIs failed, using emergency fallback rates');
  return {
    USD: 1,
    TRY: 42.30,
    EUR: 49.09,
  };
}

/**
 * Initialize exchange rates on module load
 * ALWAYS tries to fetch from API first (unless valid cache exists)
 * Never uses fallback rates unless API truly fails
 */
let ratesInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function initializeExchangeRates(): Promise<void> {
  // If already initialized, return immediately
  if (ratesInitialized) return;
  
  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      // Check cache first - if valid, use it
      const cached = localStorage.getItem(EXCHANGE_RATES_CACHE_KEY);
      if (cached) {
        try {
          const cacheData: ExchangeRatesCache = JSON.parse(cached);
          const now = Date.now();
          
          // If cache is fresh (less than 24 hours), use it
          if (now - cacheData.timestamp < CACHE_DURATION) {
            exchangeRates = cacheData.rates;
            ratesInitialized = true;
            return;
          }
        } catch (error) {
          console.warn('Invalid cache, fetching fresh rates...', error);
        }
      }

      // No valid cache - fetch from API immediately
      exchangeRates = await fetchExchangeRates();
      
      // Save to cache
      try {
        const cacheData: ExchangeRatesCache = {
          rates: exchangeRates,
          timestamp: Date.now(),
        };
        localStorage.setItem(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Failed to save exchange rates cache:', error);
      }
      
      ratesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize exchange rates:', error);
      ratesInitialized = true; // Mark as initialized even if failed to prevent infinite loops
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * Manually refresh exchange rates (bypasses cache)
 */
export async function refreshExchangeRates(): Promise<void> {
  // Clear cache
  try {
    localStorage.removeItem(EXCHANGE_RATES_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear exchange rates cache:', error);
  }
  
  // Fetch new rates
  exchangeRates = await fetchExchangeRates();
  
  // Save to cache
  try {
    const cacheData: ExchangeRatesCache = {
      rates: exchangeRates,
      timestamp: Date.now(),
    };
    localStorage.setItem(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to save exchange rates cache:', error);
  }
}

/**
 * Get current exchange rate for a currency
 */
export async function getExchangeRate(currency: string): Promise<number> {
  await initializeExchangeRates();
  return exchangeRates[currency.toUpperCase()] || 1;
}

/**
 * Get current exchange rates object
 */
export function getCurrentExchangeRates(): Record<string, number> {
  return { ...exchangeRates };
}

/**
 * Get exchange rates cache timestamp
 */
export function getExchangeRatesTimestamp(): number | null {
  try {
    const cached = localStorage.getItem(EXCHANGE_RATES_CACHE_KEY);
    if (cached) {
      const cacheData: ExchangeRatesCache = JSON.parse(cached);
      return cacheData.timestamp;
    }
  } catch (error) {
    console.warn('Failed to read exchange rates timestamp:', error);
  }
  return null;
}

export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Convert currency from one to another (SYNC version for render functions)
 * If currencies are the same, returns the amount as-is (no conversion)
 * Rates are automatically fetched and cached for 24 hours
 * First call will trigger async fetch, subsequent calls use cached rates
 * @param amount - The amount to convert
 * @param from - Source currency code (e.g., 'USD', 'TRY')
 * @param to - Target currency code (e.g., 'USD', 'TRY')
 * @returns Converted amount
 */
export const convertCurrency = (amount: number, from: string, to: string): number => {
  // If same currency, no conversion needed
  if (from === to) {
    return amount;
  }

  // Initialize rates asynchronously (non-blocking)
  // First time this is called, it will fetch in background
  if (!ratesInitialized) {
    initializeExchangeRates().catch(err => {
      console.warn('Failed to initialize exchange rates:', err);
    });
  }

  // Normalize currency codes (case-insensitive)
  const fromUpper = (from || 'USD').toUpperCase();
  const toUpper = (to || 'USD').toUpperCase();

  const fromRate = exchangeRates[fromUpper] || 1;
  const toRate = exchangeRates[toUpper] || 1;

  // Convert: amount (in 'from' currency) -> USD -> target currency
  // Formula: (amount / fromRate) * toRate
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
};
