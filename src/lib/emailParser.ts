/**
 * Email parsing utilities for auto-importing transactions from email notifications
 */

export interface ParsedTransaction {
  clientId?: string;
  amountMinor: number;
  currency: string;
  type: 'debit' | 'credit';
  merchant?: string;
  note?: string;
  occurredAt?: string;
  raw?: string;
}

export interface CreditCardPayment {
  cardLast4?: string;
  amountMinor?: number;
  currency?: string;
}

export interface LoanNotice {
  lender?: string;
  hint?: string;
}

// Currency symbols and codes mapping
const CURRENCY_MAP: Record<string, string> = {
  '₹': 'INR',
  'Rs': 'INR',
  'Rs.': 'INR',
  'INR': 'INR',
  '$': 'USD',
  'USD': 'USD',
  '€': 'EUR',
  'EUR': 'EUR',
  '£': 'GBP',
  'GBP': 'GBP',
  '¥': 'JPY',
  'JPY': 'JPY',
};

// Debit keywords (case-insensitive)
const DEBIT_KEYWORDS = [
  'debited',
  'debit',
  'spent',
  'paid',
  'payment',
  'purchase',
  'withdrawn',
  'withdrawal',
  'charged',
  'transaction',
];

// Credit keywords (case-insensitive)
const CREDIT_KEYWORDS = [
  'credited',
  'credit',
  'received',
  'deposited',
  'deposit',
  'refund',
  'cashback',
];

/**
 * Extract amount and currency from text
 * Handles formats like: ₹1,234.56, Rs. 1234.56, $100.00, USD 50
 */
function extractAmountAndCurrency(text: string): { amountMinor: number; currency: string } | null {
  // Pattern: currency symbol/code followed by amount with optional commas and decimals
  const patterns = [
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)/,
    /USD\s*([\d,]+(?:\.\d{2})?)/i,
    /€\s*([\d,]+(?:\.\d{2})?)/,
    /EUR\s*([\d,]+(?:\.\d{2})?)/i,
    /£\s*([\d,]+(?:\.\d{2})?)/,
    /GBP\s*([\d,]+(?:\.\d{2})?)/i,
    /([\d,]+(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR)/i,
    /([\d,]+(?:\.\d{2})?)\s*USD/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount)) continue;

      // Determine currency from the match
      const matchedText = match[0];
      let currency = 'USD'; // default
      
      for (const [symbol, code] of Object.entries(CURRENCY_MAP)) {
        if (matchedText.includes(symbol)) {
          currency = code;
          break;
        }
      }

      // Convert to minor units (cents)
      const amountMinor = Math.round(amount * 100);
      
      return { amountMinor, currency };
    }
  }

  return null;
}

/**
 * Determine transaction type (debit or credit) from text
 */
function detectTransactionType(text: string): 'debit' | 'credit' | null {
  const lowerText = text.toLowerCase();

  // Check for debit keywords
  for (const keyword of DEBIT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'debit';
    }
  }

  // Check for credit keywords
  for (const keyword of CREDIT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'credit';
    }
  }

  return null;
}

/**
 * Extract merchant name from text
 * Looks for patterns like "at MERCHANT", "to MERCHANT", "via MERCHANT"
 */
function extractMerchant(text: string): string | undefined {
  const patterns = [
    /(?:at|to|via|from)\s+([A-Z][A-Za-z0-9\s&'-]+?)(?:\s+on|\s+for|\.|$)/,
    /(?:merchant|store|shop):\s*([A-Za-z0-9\s&'-]+?)(?:\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extract date from text
 * Looks for common date formats
 */
function extractDate(text: string): string | undefined {
  const patterns = [
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        // Invalid date, continue
      }
    }
  }

  return undefined;
}

/**
 * Parse email content to extract transaction information
 * Returns null if no valid transaction can be parsed
 */
export function parseEmailToTransaction(
  subject: string,
  body: string
): ParsedTransaction | null {
  const combinedText = `${subject} ${body}`;

  // Extract amount and currency
  const amountData = extractAmountAndCurrency(combinedText);
  if (!amountData) {
    return null; // No amount found, cannot create transaction
  }

  // Detect transaction type
  const type = detectTransactionType(combinedText);
  if (!type) {
    return null; // Cannot determine if debit or credit
  }

  // Extract optional fields
  const merchant = extractMerchant(combinedText);
  const occurredAt = extractDate(combinedText);

  // Generate client ID
  const clientId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    clientId,
    amountMinor: amountData.amountMinor,
    currency: amountData.currency,
    type,
    merchant,
    note: subject.substring(0, 200), // Use subject as note, truncated
    occurredAt,
    raw: combinedText.substring(0, 500), // Store raw text for reference
  };
}

/**
 * Detect credit card payment alerts
 * Looks for patterns indicating a credit card payment was made
 */
export function detectCreditCardPayment(
  subject: string,
  body: string
): CreditCardPayment | null {
  const combinedText = `${subject} ${body}`.toLowerCase();

  // Keywords indicating credit card payment
  const ccPaymentKeywords = [
    'credit card',
    'card payment',
    'card ending',
    'card charged',
    'payment processed',
  ];

  const hasPaymentKeyword = ccPaymentKeywords.some((keyword) =>
    combinedText.includes(keyword)
  );

  if (!hasPaymentKeyword) {
    return null;
  }

  // Extract card last 4 digits
  const cardMatch = combinedText.match(/(?:ending|last\s*4|xxxx)\s*(\d{4})/i);
  const cardLast4 = cardMatch ? cardMatch[1] : undefined;

  // Extract amount
  const amountData = extractAmountAndCurrency(subject + ' ' + body);

  return {
    cardLast4,
    amountMinor: amountData?.amountMinor,
    currency: amountData?.currency,
  };
}

/**
 * Detect loan/EMI payment notices
 * Looks for patterns indicating a loan or EMI notice
 */
export function detectLoanNotice(subject: string, body: string): LoanNotice | null {
  const combinedText = `${subject} ${body}`.toLowerCase();

  // Keywords indicating loan/EMI
  const loanKeywords = [
    'emi',
    'loan',
    'installment',
    'instalment',
    'repayment',
    'due date',
    'payment due',
    'monthly payment',
  ];

  const hasLoanKeyword = loanKeywords.some((keyword) => combinedText.includes(keyword));

  if (!hasLoanKeyword) {
    return null;
  }

  // Try to extract lender name
  const lenderPatterns = [
    /(?:from|by)\s+([A-Z][A-Za-z\s]+(?:Bank|Finance|Loan))/i,
    /([A-Z][A-Za-z\s]+(?:Bank|Finance|Loan))/i,
  ];

  let lender: string | undefined;
  for (const pattern of lenderPatterns) {
    const match = (subject + ' ' + body).match(pattern);
    if (match && match[1]) {
      lender = match[1].trim();
      break;
    }
  }

  return {
    lender,
    hint: 'Loan/EMI payment notice detected. Consider setting up recurring payment.',
  };
}
