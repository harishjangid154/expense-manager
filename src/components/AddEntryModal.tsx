import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { SUPPORTED_CURRENCIES, convertCurrency } from '../utils/currency';
import { BankAccount, UserSettings } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Heart, 
  Briefcase,
  Coffee,
  Film,
  DollarSign,
  PiggyBank,
  Building2,
  Wallet as WalletIcon,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';

interface AddEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: ExpenseEntry) => void;
  accounts: BankAccount[];
  settings: UserSettings;
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
  assetName?: string;
}

const expenseCategories = [
  { value: 'rent', label: 'Rent', icon: Home, isInvestment: false },
  { value: 'food', label: 'Food & Dining', icon: Utensils, isInvestment: false },
  { value: 'transport', label: 'Transport', icon: Car, isInvestment: false },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, isInvestment: false },
  { value: 'entertainment', label: 'Entertainment', icon: Film, isInvestment: false },
  { value: 'health', label: 'Health', icon: Heart, isInvestment: false },
  { value: 'sip', label: 'SIP', icon: PiggyBank, isInvestment: true },
  { value: 'stocks', label: 'Stocks', icon: TrendingUp, isInvestment: true },
  { value: 'crypto', label: 'Crypto', icon: DollarSign, isInvestment: true },
  { value: 'gold', label: 'Gold', icon: PiggyBank, isInvestment: true },
  { value: 'other', label: 'Other', icon: Coffee, isInvestment: false },
];

const earningCategories = [
  { value: 'salary', label: 'Salary', icon: Briefcase },
  { value: 'freelance', label: 'Freelance', icon: DollarSign },
  { value: 'investment', label: 'Investment Returns', icon: TrendingUp },
  { value: 'other', label: 'Other Income', icon: DollarSign },
];

export function AddEntryModal({ open, onOpenChange, onSubmit, accounts, settings }: AddEntryModalProps) {
  const [type, setType] = useState<'expense' | 'earning'>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(settings?.defaultCurrency || 'INR');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [accountId, setAccountId] = useState('');
  const [assetName, setAssetName] = useState('');

  const categories = type === 'expense' ? expenseCategories : earningCategories;
  const selectedCategory = expenseCategories.find(cat => cat.value === category);
  const isInvestmentCategory = selectedCategory?.isInvestment || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !accountId) return;

    const originalAmount = parseFloat(amount);
    const convertedAmount = currency !== settings.defaultCurrency 
      ? convertCurrency(originalAmount, currency, settings.defaultCurrency, settings)
      : originalAmount;

    onSubmit({
      type,
      amount: convertedAmount,
      currency: settings.defaultCurrency,
      originalAmount,
      originalCurrency: currency,
      category,
      comment,
      accountId,
      isInvestment: isInvestmentCategory,
      assetName: isInvestmentCategory ? assetName || category : undefined,
    });

    // Reset form
    setAmount('');
    setCategory('');
    setComment('');
    setAccountId('');
    setAssetName('');
    onOpenChange(false);
  };

  const getAccountIcon = (account: BankAccount) => {
    switch (account.type) {
      case 'investment':
        return TrendingUpIcon;
      case 'wallet':
        return WalletIcon;
      default:
        return Building2;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-3xl max-w-md backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Add New Entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Type Toggle */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  type === 'expense'
                    ? 'glass-strong neon-border-purple neon-glow-purple'
                    : 'glass hover:glass-strong'
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('earning')}
                className={`p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  type === 'earning'
                    ? 'glass-strong neon-border-blue neon-glow-blue'
                    : 'glass hover:glass-strong'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Earning
              </button>
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue focus:neon-glow-blue rounded-xl h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger
                  id="currency"
                  className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue rounded-xl h-12"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{curr.symbol}</span>
                        <span>{curr.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue rounded-xl h-12">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value} className="hover:glass-strong">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Bank Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">{type === 'earning' ? 'Credit To' : 'Debit From'}</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue rounded-xl h-12">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
                {accounts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No accounts available. Please add an account first.
                  </div>
                ) : (
                  accounts.map((account) => {
                    const Icon = getAccountIcon(account);
                    return (
                      <SelectItem key={account.id} value={account.id} className="hover:glass-strong">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: account.color }} />
                          <span>{account.name}</span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            ₹{account.balance.toLocaleString()}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Investment Asset Name (only for investment categories) */}
          {type === 'expense' && isInvestmentCategory && (
            <div className="space-y-2 glass rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-4 h-4 text-[#6BCB77]" />
                <span className="text-sm text-foreground">This will be tracked as an asset</span>
              </div>
              <Label htmlFor="asset-name">Asset Name (Optional)</Label>
              <Input
                id="asset-name"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder={`e.g., ${category === 'sip' ? 'Axis Bluechip Fund' : category === 'stocks' ? 'AAPL' : 'Asset name'}`}
                className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue rounded-xl h-11"
              />
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note..."
              className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue rounded-xl min-h-20 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] neon-glow-blue rounded-xl h-11"
            >
              Add Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
