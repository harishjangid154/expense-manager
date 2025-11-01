'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BankAccount, Transaction, UserSettings } from '@/types';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { Building2, Wallet, TrendingUp, CreditCard, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';

interface AccountDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccount | null;
  transactions: Transaction[];
  settings: UserSettings;
}

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'investment':
      return TrendingUp;
    case 'wallet':
      return Wallet;
    case 'current':
      return CreditCard;
    default:
      return Building2;
  }
};

export function AccountDetailModal({ 
  open, 
  onOpenChange, 
  account, 
  transactions, 
  settings 
}: AccountDetailModalProps) {
  const accountTransactions = useMemo(() => {
    if (!account) return [];
    return transactions
      .filter(t => t.accountId === account.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [account, transactions]);

  const metrics = useMemo(() => {
    if (!account) return null;

    const earnings = accountTransactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = earnings - expenses;
    const transactionCount = accountTransactions.length;

    return {
      earnings,
      expenses,
      netFlow,
      transactionCount,
      currentBalance: account.balance
    };
  }, [account, accountTransactions]);

  const monthlyCashFlow = useMemo(() => {
    if (!account) return [];
    
    const flowMap: Record<string, { earnings: number; expenses: number; balance: number }> = {};
    
    // Group transactions by month
    accountTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!flowMap[monthKey]) {
        flowMap[monthKey] = { earnings: 0, expenses: 0, balance: 0 };
      }
      
      if (tx.type === 'earning') {
        flowMap[monthKey].earnings += tx.amount;
      } else {
        flowMap[monthKey].expenses += tx.amount;
      }
    });

    // Calculate ending balance for each month (working backwards from current balance)
    let currentBalance = account.balance;
    const months = Object.entries(flowMap)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB.getTime() - dateA.getTime();
      });

    // Calculate balance at end of each month
    months.forEach(([month, data]) => {
      // Current balance is after this month's transactions
      // So balance at end of month = currentBalance
      data.balance = currentBalance;
      // Work backwards: balance at start of month = balance at end - (earnings - expenses)
      currentBalance = currentBalance - (data.earnings - data.expenses);
    });

    return months
      .reverse()
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month,
        earnings: data.earnings,
        expenses: data.expenses,
        balance: data.balance
      }));
  }, [account, accountTransactions]);

  const recentTransactions = useMemo(() => {
    return accountTransactions.slice(0, 10);
  }, [accountTransactions]);

  if (!account) return null;

  const Icon = getAccountIcon(account.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-strong border-[rgba(255,255,255,0.2)]">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div 
              className="p-3 rounded-xl glass"
              style={{ 
                color: account.color,
                borderLeft: `3px solid ${account.color}`
              }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl text-foreground">{account.name}</DialogTitle>
              <p className="text-sm text-muted-foreground capitalize mt-1">{account.type} Account</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold" style={{ color: account.color }}>
                {formatCurrency(account.balance, settings.defaultCurrency)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-green-400" />
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(metrics.earnings, settings.defaultCurrency)}
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-red-400" />
                <p className="text-xs text-muted-foreground">Total Expenses</p>
              </div>
              <p className="text-lg font-bold text-red-400">
                {formatCurrency(metrics.expenses, settings.defaultCurrency)}
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                {metrics.netFlow >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                )}
                <p className="text-xs text-muted-foreground">Net Flow</p>
              </div>
              <p 
                className={`text-lg font-bold ${metrics.netFlow >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}
              >
                {formatCurrency(metrics.netFlow, settings.defaultCurrency)}
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
              <p className="text-lg font-bold text-purple-400">
                {metrics.transactionCount}
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="glass border-[rgba(255,255,255,0.15)] rounded-xl mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="cashflow" className="rounded-lg">Cash Flow</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Cash Flow Chart */}
            {monthlyCashFlow.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Monthly Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyCashFlow}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#10b981" 
                      fillOpacity={1}
                      fill="url(#colorEarnings)"
                      name="Earnings"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Balance Trend */}
            {monthlyCashFlow.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Balance Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyCashFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      formatter={(value) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke={account.color}
                      strokeWidth={3}
                      dot={{ fill: account.color, r: 4 }}
                      name="Balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-6">
            {monthlyCashFlow.length > 0 ? (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Monthly Cash Flow</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyCashFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      formatter={(value) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Legend />
                    <Bar dataKey="earnings" fill="#10b981" name="Earnings" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No transaction history yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((tx) => {
                  const date = new Date(tx.date);
                  return (
                    <div
                      key={tx.id}
                      className="glass rounded-xl p-4 flex items-center justify-between hover:glass-strong transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            tx.type === 'earning' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {tx.type === 'earning' ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.comment}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground capitalize">{tx.category}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p 
                        className={`text-sm font-bold ${
                          tx.type === 'earning' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {tx.type === 'earning' ? '+' : '-'}
                        {formatCurrency(tx.amount, settings.defaultCurrency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

