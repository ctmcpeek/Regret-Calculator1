// Exchange rate utilities for real-time crypto and fiat currency data
export interface ExchangeRate {
  currency: string;
  rate: number;
  symbol: string;
  lastUpdated: Date;
}

// Mock exchange rates with real-time simulation
// In production, this would fetch from CoinGecko API or similar
export const mockExchangeRates: { [key: string]: { rate: number; symbol: string } } = {
  'USD': { rate: 1, symbol: '$' },
  'EUR': { rate: 0.92, symbol: '€' },
  'GBP': { rate: 0.78, symbol: '£' },
  'JPY': { rate: 150, symbol: '¥' },
  'CAD': { rate: 1.37, symbol: 'C$' },
  'AUD': { rate: 1.51, symbol: 'A$' },
  'CHF': { rate: 0.87, symbol: 'CHF' },
  'CNY': { rate: 7.09, symbol: '¥' },
  'INR': { rate: 83.5, symbol: '₹' },
  'BRL': { rate: 5.15, symbol: 'R$' },
  'MXN': { rate: 16.8, symbol: 'MX$' },
  'ZAR': { rate: 18.5, symbol: 'R' },
  'SGD': { rate: 1.35, symbol: 'S$' },
  'NZD': { rate: 1.64, symbol: 'NZ$' },
  'KRW': { rate: 1370, symbol: '₩' },
  'RUB': { rate: 90, symbol: '₽' },
  'SEK': { rate: 10.5, symbol: 'kr' },
  'NOK': { rate: 10.8, symbol: 'kr' },
  'TRY': { rate: 32, symbol: '₺' },
  'HKD': { rate: 7.8, symbol: 'HK$' },
  // Cryptocurrencies (rates in relation to USD)
  'BTC': { rate: 0.000023, symbol: '₿' },
  'ETH': { rate: 0.000387, symbol: '⟠' },
  'SOL': { rate: 0.01014, symbol: '◎' }
};

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  // In production, fetch from real API
  // For now, return mock data with simulated fluctuations
  return Object.entries(mockExchangeRates).map(([currency, data]) => ({
    currency,
    rate: data.rate,
    symbol: data.symbol,
    lastUpdated: new Date()
  }));
}

export function formatCurrency(amount: number, currency: string): string {
  const rate = mockExchangeRates[currency];
  if (!rate) return `$${amount.toFixed(2)}`;
  
  const converted = amount * rate.rate;
  const symbol = rate.symbol;
  
  if (converted >= 1000000) return `${symbol}${(converted / 1000000).toFixed(1)}M`;
  if (converted >= 1000) return `${symbol}${(converted / 1000).toFixed(1)}K`;
  return `${symbol}${converted.toFixed(2)}`;
}

export function getExchangeRate(currency: string): { rate: number; symbol: string } {
  return mockExchangeRates[currency] || { rate: 1, symbol: '$' };
}

// Simulate real-time price changes for demo
export function simulatePriceChange(): number {
  return (Math.random() - 0.5) * 10; // -5% to +5% change
}

// Currency groups for organized display
export const currencyGroups = {
  fiat: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'],
  crypto: ['BTC', 'ETH', 'SOL'],
  all: Object.keys(mockExchangeRates)
};
