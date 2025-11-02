const exchangeRates = {
  USD: 1,
  TRY: 32.8, // Example exchange rate
};

export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const convertCurrency = (amount: number, from: string, to: string) => {
  const fromRate = exchangeRates[from as keyof typeof exchangeRates] || 1;
  const toRate = exchangeRates[to as keyof typeof exchangeRates] || 1;
  return (amount / fromRate) * toRate;
};
