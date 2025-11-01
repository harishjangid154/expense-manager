import { Currency, UserSettings } from '../types';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

// Fallback exchange rates (base: INR)
export const FALLBACK_RATES: Record<string, number> = {
  'INR': 1,
  'USD': 0.012,
  'EUR': 0.011,
  'GBP': 0.0095,
  'JPY': 1.84,
  'CNY': 0.087,
  'AUD': 0.019,
  'CAD': 0.017,
  'CHF': 0.011,
  'AED': 0.044,
};

export async function fetchExchangeRates(baseCurrency: string = 'INR'): Promise<Record<string, number>> {
  try {
    // Try to fetch live rates from ExchangeRate-API's free endpoint
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch rates');
    }
    
    const data = await response.json();
    if (data.result === 'success') {
      return data.rates;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.warn('Failed to fetch live exchange rates, using fallback rates');
    
    // Convert fallback rates to the requested base currency
    if (baseCurrency === 'INR') {
      return FALLBACK_RATES;
    }
    
    // Convert from INR-based rates to the requested base
    const baseRate = FALLBACK_RATES[baseCurrency];
    if (!baseRate) {
      return FALLBACK_RATES;
    }
    
    const convertedRates: Record<string, number> = {};
    Object.entries(FALLBACK_RATES).forEach(([currency, rate]) => {
      convertedRates[currency] = rate / baseRate;
    });
    
    return convertedRates;
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  settings?: UserSettings
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // If no settings provided, use fallback rates
  const rates = settings?.exchangeRates || FALLBACK_RATES;
  const defaultCurrency = settings?.defaultCurrency || 'INR';
  
  // If converting to default currency, use the rate directly
  if (toCurrency === defaultCurrency) {
    const rate = rates[fromCurrency];
    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency}, using fallback rate`);
      return amount * (FALLBACK_RATES[fromCurrency] || 1);
    }
    return amount / rate;
  }
  
  // If converting from default currency, use the rate directly
  if (fromCurrency === defaultCurrency) {
    const rate = rates[toCurrency];
    if (!rate) {
      console.warn(`No exchange rate found for ${toCurrency}, using fallback rate`);
      return amount * (FALLBACK_RATES[toCurrency] || 1);
    }
    return amount * rate;
  }
  
  // Convert through default currency
  const amountInDefault = convertCurrency(amount, fromCurrency, defaultCurrency, settings);
  return convertCurrency(amountInDefault, defaultCurrency, toCurrency, settings);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  const value = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${symbol}${Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}` : `${symbol}${value}`;
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}
