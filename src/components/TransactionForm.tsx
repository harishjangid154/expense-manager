'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2 } from 'lucide-react';

interface TransactionFormProps {
  transaction?: {
    id: string;
    amountMinor: number;
    currency: string;
    category: string;
    merchant?: string | null;
    note?: string | null;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY'];
const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Education',
  'Salary',
  'Investment',
  'Other',
];

export function TransactionForm({ transaction, onSave, onCancel }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: transaction ? Math.abs(transaction.amountMinor / 100).toString() : '',
    currency: transaction?.currency || 'USD',
    category: transaction?.category || 'Other',
    merchant: transaction?.merchant || '',
    note: transaction?.note || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        amountMinor: Math.round(parseFloat(formData.amount) * 100),
        currency: formData.currency,
        category: formData.category,
        merchant: formData.merchant || null,
        note: formData.note || null,
      });
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Amount
        </label>
        <Input
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
          className="glass border-[rgba(255,255,255,0.15)]"
        />
      </div>

      {/* Currency */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Currency
        </label>
        <Select
          value={formData.currency}
          onValueChange={(value) => setFormData({ ...formData, currency: value })}
        >
          <SelectTrigger className="glass border-[rgba(255,255,255,0.15)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)]">
            {CURRENCIES.map((curr) => (
              <SelectItem key={curr} value={curr}>
                {curr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Category
        </label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="glass border-[rgba(255,255,255,0.15)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)]">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Merchant */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Merchant
        </label>
        <Input
          type="text"
          value={formData.merchant}
          onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
          placeholder="Store or service name"
          className="glass border-[rgba(255,255,255,0.15)]"
        />
      </div>

      {/* Note */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Note
        </label>
        <Textarea
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="Additional details..."
          rows={3}
          className="glass border-[rgba(255,255,255,0.15)]"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 glass border-[rgba(255,255,255,0.2)]"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
