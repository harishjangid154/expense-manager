'use client';

import Link from 'next/link';
import { formatCurrency } from '@/utils/currency';
import { Edit, Tag } from 'lucide-react';

interface Transaction {
  id: string;
  amountMinor: number;
  currency: string;
  category: string;
  merchant?: string | null;
  note?: string | null;
  createdAt: Date | string;
}

interface TransactionRowProps {
  transaction: Transaction;
  settings?: { defaultCurrency: string };
}

export function TransactionRow({ transaction, settings }: TransactionRowProps) {
  const amount = transaction.amountMinor / 100;
  const isExpense = transaction.amountMinor < 0;
  const date = new Date(transaction.createdAt);

  return (
    <>
      {/* Desktop: Table row */}
      <tr className="hidden md:table-row glass hover:bg-white/5 transition-colors border-b border-[rgba(255,255,255,0.05)]">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isExpense ? 'bg-[#FF6B9D]' : 'bg-[#00FFFF]'
              }`}
            />
            <span className="text-sm text-foreground">
              {date.toLocaleDateString()}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {transaction.merchant || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">{transaction.category}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {transaction.note || '-'}
        </td>
        <td className="px-4 py-3">
          <span
            className={`text-sm font-semibold ${
              isExpense ? 'text-[#FF6B9D]' : 'text-[#00FFFF]'
            }`}
          >
            {isExpense ? '-' : '+'}
            {formatCurrency(Math.abs(amount), transaction.currency)}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/transactions/${transaction.id}`}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Edit transaction"
            >
              <Edit className="w-4 h-4 text-muted-foreground" />
            </Link>
            <button
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Categorize transaction"
            >
              <Tag className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </td>
      </tr>

      {/* Mobile: Card */}
      <div className="md:hidden glass-strong rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">
              {transaction.merchant || 'Unknown'}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{date.toLocaleDateString()}</span>
              <span>•</span>
              <span>{transaction.category}</span>
            </div>
          </div>
          <span
            className={`text-lg font-semibold ${
              isExpense ? 'text-[#FF6B9D]' : 'text-[#00FFFF]'
            }`}
          >
            {isExpense ? '-' : '+'}
            {formatCurrency(Math.abs(amount), transaction.currency)}
          </span>
        </div>

        {transaction.note && (
          <p className="text-xs text-muted-foreground mb-3">{transaction.note}</p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <Link
            href={`/transactions/${transaction.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg glass border border-[rgba(255,255,255,0.15)] hover:border-[#00FFFF]/50 transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Link>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg glass border border-[rgba(255,255,255,0.15)] hover:border-[#00FFFF]/50 transition-colors text-sm"
            aria-label="Categorize"
          >
            <Tag className="w-4 h-4" />
            <span>Tag</span>
          </button>
        </div>
      </div>
    </>
  );
}
