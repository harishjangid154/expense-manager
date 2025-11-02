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
  // Broker-specific fields
  brokerId?: string; // Link to broker account if this is a stock
  quantity?: number; // For stocks/crypto - number of units
  purchasePrice?: number; // Price per unit at purchase
}

export interface BrokerAccount {
  id: string;
  name: string;
  balance: number; // Available cash in broker account
  type: 'broker';
  color: string;
  createdAt: Date;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  accountId: string; // Which account to deduct from
  dayOfMonth: number; // 1-31, day of month when expense occurs
  isActive: boolean; // Can pause/resume recurring expenses
  startDate: Date; // When this recurring expense starts
  endDate?: Date; // Optional end date (for loans that will be paid off)
  comment?: string;
  // Loan-specific fields
  isLoan?: boolean;
  loanDetails?: {
    principalRemaining: number;
    interestRate: number; // Annual interest rate percentage
    emiAmount: number;
    tenure: number; // Total months
    tenureRemaining: number; // Months remaining
  };
  createdAt: Date;
  lastProcessedDate?: Date; // Track when last transaction was created
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
  recurringExpenseId?: string; // Link to recurring expense if auto-generated
  brokerId?: string; // Link to broker account for broker transactions
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
