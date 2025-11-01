export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  type: 'savings' | 'current' | 'investment' | 'wallet';
  color: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'sip' | 'stocks' | 'crypto' | 'gold' | 'property' | 'other';
  value: number;
  purchaseDate: Date;
  category: string;
}

export interface Transaction {
  id: string;
  type: 'expense' | 'earning';
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  category: string;
  comment: string;
  accountId: string;
  date: Date;
  isInvestment?: boolean;
  assetId?: string;
}

export interface UserSettings {
  defaultCurrency: string;
  exchangeRates: Record<string, number>;
  lastRateUpdate?: Date;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface ExpenseEntry {
  type: 'expense' | 'earning';
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  category: string;
  comment: string;
  accountId: string;
  isInvestment?: boolean;
  assetId?: string;
  assetName?: string;
}
