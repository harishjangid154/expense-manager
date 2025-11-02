'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { RecurringExpense, BankAccount, UserSettings } from '@/types';
import { Plus, Trash2, Calendar, DollarSign, Repeat, AlertCircle, TrendingDown, Edit2, X } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

interface RecurringExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringExpenses: RecurringExpense[];
  accounts: BankAccount[];
  settings: UserSettings;
  onAddRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  onUpdateRecurringExpense: (expense: RecurringExpense) => void;
  onDeleteRecurringExpense: (id: string) => void;
}

const EXPENSE_CATEGORIES = [
  'Rent',
  'Utility Bill',
  'Credit Card Bill',
  'Loan EMI',
  'Insurance',
  'Subscription',
  'Internet',
  'Phone Bill',
  'Other',
];

export function RecurringExpensesModal({
  open,
  onOpenChange,
  recurringExpenses,
  accounts,
  settings,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
}: RecurringExpensesModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Rent',
    accountId: accounts[0]?.id || '',
    dayOfMonth: '1',
    isActive: true,
    comment: '',
    isLoan: false,
    principalRemaining: '',
    interestRate: '',
    emiAmount: '',
    tenure: '',
    tenureRemaining: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'Rent',
      accountId: accounts[0]?.id || '',
      dayOfMonth: '1',
      isActive: true,
      comment: '',
      isLoan: false,
      principalRemaining: '',
      interestRate: '',
      emiAmount: '',
      tenure: '',
      tenureRemaining: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      accountId: expense.accountId,
      dayOfMonth: expense.dayOfMonth.toString(),
      isActive: expense.isActive,
      comment: expense.comment || '',
      isLoan: expense.isLoan || false,
      principalRemaining: expense.loanDetails?.principalRemaining.toString() || '',
      interestRate: expense.loanDetails?.interestRate.toString() || '',
      emiAmount: expense.loanDetails?.emiAmount.toString() || '',
      tenure: expense.loanDetails?.tenure.toString() || '',
      tenureRemaining: expense.loanDetails?.tenureRemaining.toString() || '',
    });
    setEditingId(expense.id);
    setIsAdding(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.amount || !formData.accountId) {
      toast.error('Please fill all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const dayOfMonth = parseInt(formData.dayOfMonth);
    if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      toast.error('Please enter a valid day (1-31)');
      return;
    }

    const expenseData: Omit<RecurringExpense, 'id' | 'createdAt'> = {
      name: formData.name,
      amount,
      currency: settings.defaultCurrency,
      category: formData.category,
      accountId: formData.accountId,
      dayOfMonth,
      isActive: formData.isActive,
      startDate: new Date(),
      comment: formData.comment,
      isLoan: formData.isLoan,
    };

    if (formData.isLoan) {
      const principalRemaining = parseFloat(formData.principalRemaining);
      const interestRate = parseFloat(formData.interestRate);
      const emiAmount = parseFloat(formData.emiAmount);
      const tenure = parseInt(formData.tenure);
      const tenureRemaining = parseInt(formData.tenureRemaining);

      if (isNaN(principalRemaining) || isNaN(interestRate) || isNaN(emiAmount) || isNaN(tenure) || isNaN(tenureRemaining)) {
        toast.error('Please fill all loan details correctly');
        return;
      }

      expenseData.loanDetails = {
        principalRemaining,
        interestRate,
        emiAmount,
        tenure,
        tenureRemaining,
      };
    }

    if (editingId) {
      const existingExpense = recurringExpenses.find(e => e.id === editingId);
      if (existingExpense) {
        onUpdateRecurringExpense({
          ...existingExpense,
          ...expenseData,
        });
        toast.success('Recurring expense updated!');
      }
    } else {
      onAddRecurringExpense(expenseData);
      toast.success('Recurring expense added!');
    }

    resetForm();
  };

  const handleToggleActive = (expense: RecurringExpense) => {
    onUpdateRecurringExpense({
      ...expense,
      isActive: !expense.isActive,
    });
    toast.success(expense.isActive ? 'Expense paused' : 'Expense resumed');
  };

  const totalMonthlyExpenses = recurringExpenses
    .filter(e => e.isActive)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-[rgba(255,255,255,0.2)] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#A259FF] flex items-center justify-center">
              <Repeat className="w-6 h-6 text-white" />
            </div>
            Recurring Expenses
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your monthly fixed expenses like rent, bills, and EMIs
          </p>
        </DialogHeader>

        {/* Summary Card */}
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Monthly Expenses</p>
            <p className="text-2xl text-[#FF6B9D] font-semibold mt-1">
              {formatCurrency(totalMonthlyExpenses, settings.defaultCurrency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Active Expenses</p>
            <p className="text-2xl text-foreground font-semibold mt-1">
              {recurringExpenses.filter(e => e.isActive).length}
            </p>
          </div>
        </div>

        {/* Add/Edit Form */}
        {isAdding ? (
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-foreground font-semibold">
                {editingId ? 'Edit Expense' : 'Add New Recurring Expense'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Expense Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., House Rent"
                  className="glass border-[rgba(255,255,255,0.15)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="glass border-[rgba(255,255,255,0.15)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)]">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({settings.defaultCurrency}) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="glass border-[rgba(255,255,255,0.15)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Account *</Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                  <SelectTrigger className="glass border-[rgba(255,255,255,0.15)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)]">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month *</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  className="glass border-[rgba(255,255,255,0.15)]"
                />
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Input
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Add any notes..."
                className="glass border-[rgba(255,255,255,0.15)]"
              />
            </div>

            {/* Loan Details Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isLoan"
                  checked={formData.isLoan}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLoan: checked })}
                />
                <Label htmlFor="isLoan" className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  This is a loan EMI
                </Label>
              </div>

              {formData.isLoan && (
                <div className="glass-strong rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Loan Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="principalRemaining">Principal Remaining *</Label>
                      <Input
                        id="principalRemaining"
                        type="number"
                        value={formData.principalRemaining}
                        onChange={(e) => setFormData({ ...formData, principalRemaining: e.target.value })}
                        placeholder="0.00"
                        className="glass border-[rgba(255,255,255,0.15)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Interest Rate (% per annum) *</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        value={formData.interestRate}
                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                        placeholder="0.00"
                        className="glass border-[rgba(255,255,255,0.15)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emiAmount">EMI Amount *</Label>
                      <Input
                        id="emiAmount"
                        type="number"
                        value={formData.emiAmount}
                        onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                        placeholder="0.00"
                        className="glass border-[rgba(255,255,255,0.15)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenure">Total Tenure (months) *</Label>
                      <Input
                        id="tenure"
                        type="number"
                        value={formData.tenure}
                        onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                        placeholder="0"
                        className="glass border-[rgba(255,255,255,0.15)]"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="tenureRemaining">Tenure Remaining (months) *</Label>
                      <Input
                        id="tenureRemaining"
                        type="number"
                        value={formData.tenureRemaining}
                        onChange={(e) => setFormData({ ...formData, tenureRemaining: e.target.value })}
                        placeholder="0"
                        className="glass border-[rgba(255,255,255,0.15)]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
              >
                {editingId ? 'Update Expense' : 'Add Expense'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="glass border-[rgba(255,255,255,0.2)]"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full glass border-[rgba(255,255,255,0.2)] hover:glass-strong"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring Expense
          </Button>
        )}

        {/* Expenses List */}
        <div className="space-y-3">
          {recurringExpenses.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No recurring expenses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your monthly fixed expenses to track them automatically
              </p>
            </div>
          ) : (
            recurringExpenses.map((expense) => {
              const account = accounts.find(a => a.id === expense.accountId);
              return (
                <div
                  key={expense.id}
                  className={`glass-strong rounded-xl p-4 transition-all ${
                    expense.isActive ? 'border-l-4 border-[#00FFFF]' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-foreground font-semibold">{expense.name}</h4>
                        <span className="text-xs px-2 py-1 rounded-full glass">
                          {expense.category}
                        </span>
                        {expense.isLoan && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#FF6B9D]/20 text-[#FF6B9D]">
                            Loan EMI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Day {expense.dayOfMonth} of month
                        </span>
                        <span>{account?.name || 'Unknown Account'}</span>
                      </div>
                      {expense.comment && (
                        <p className="text-xs text-muted-foreground mt-2">{expense.comment}</p>
                      )}
                      {expense.isLoan && expense.loanDetails && (
                        <div className="mt-3 glass rounded-lg p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Principal Remaining:</span>
                            <span className="text-foreground font-semibold">
                              {formatCurrency(expense.loanDetails.principalRemaining, expense.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Interest Rate:</span>
                            <span className="text-foreground">{expense.loanDetails.interestRate}% p.a.</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tenure:</span>
                            <span className="text-foreground">
                              {expense.loanDetails.tenureRemaining} / {expense.loanDetails.tenure} months
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(expense)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(expense)}
                        className={expense.isActive ? 'text-[#00FFFF]' : 'text-muted-foreground'}
                      >
                        <Repeat className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this recurring expense?')) {
                            onDeleteRecurringExpense(expense.id);
                            toast.success('Recurring expense deleted');
                          }
                        }}
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
