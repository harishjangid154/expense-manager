import { SummaryCard } from './SummaryCard';
import { WealthSection } from './WealthSection';
import { TransactionHistory } from './TransactionHistory';
import { TrendingUp, TrendingDown, Wallet, Calendar, Plus, Sparkles, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { BankAccount, Asset, UserSettings, Transaction } from '@/types';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

interface DashboardProps {
  onAddEntry: () => void;
  onManageAccounts: () => void;
  onOpenAutoImport: () => void;
  onOpenSettings: () => void;
  onAccountClick?: (account: BankAccount) => void;
  onAssetClick?: (asset: Asset) => void;
  accounts: BankAccount[];
  assets: Asset[];
  settings: UserSettings;
  transactions: Transaction[];
}

// Generate color palette for expense categories
const categoryColors = {
  Rent: '#A259FF',
  Food: '#00FFFF',
  SIP: '#FF6B9D',
  Transport: '#FFD93D',
  Entertainment: '#6BCB77',
};

// Process transactions to get expense data
const calculateExpenseData = (transactions: Transaction[] | null | undefined = []) => {
  // Ensure we have a valid array to work with
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  
  if (validTransactions.length === 0) {
    return [];
  }

  const expensesByCategory = validTransactions
    .filter(t => t?.type === 'expense')
    .reduce((acc, t) => {
      if (t?.category && t?.amount) {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name as keyof typeof categoryColors] || '#A259FF'
  }));
};

// Process transactions to get monthly trends
const calculateMonthlyTrend = (transactions: Transaction[] | null | undefined = []) => {
  // Ensure we have a valid array to work with
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  
  if (validTransactions.length === 0) {
    return [];
  }

  const months: Record<string, { earnings: number; expenses: number }> = {};
  
  validTransactions.forEach(t => {
    try {
      if (!t?.date || !t?.type || !t?.amount) {
        return; // Skip invalid transactions
      }

      let date: Date;
      try {
        date = new Date(t.date);
        if (isNaN(date.getTime())) {
          return; // Skip invalid dates
        }
      } catch {
        return; // Skip if date creation fails
      }

      const monthKey = date.toLocaleString('default', { month: 'short' });
      
      if (!months[monthKey]) {
        months[monthKey] = { earnings: 0, expenses: 0 };
      }
      
      if (t.type === 'earning') {
        months[monthKey].earnings += t.amount;
      } else if (t.type === 'expense') {
        months[monthKey].expenses += t.amount;
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  });

  return Object.entries(months).map(([month, data]) => ({
    month,
    ...data
  }));
};

type TransactionType = 'Expense' | 'Earning';

// Process transactions to get top categories
const calculateTopCategories = (transactions: Transaction[] | null | undefined = []) => {
  // Ensure we have a valid array to work with
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  
  if (validTransactions.length === 0) {
    return [];
  }

  const categoryMap: Record<string, { amount: number; type: TransactionType; icon: string }> = {};
  
  validTransactions.forEach(t => {
    if (!t?.category || !t?.type || !t?.amount) {
      return; // Skip invalid transactions
    }

    if (!categoryMap[t.category]) {
      categoryMap[t.category] = {
        amount: 0,
        type: t.type === 'expense' ? 'Expense' : 'Earning',
        icon: getCategoryIcon(t.category)
      };
    }
    categoryMap[t.category].amount += t.amount;
  });

  const totalByType: Record<TransactionType, number> = {
    Expense: Object.values(categoryMap)
      .filter(c => c.type === 'Expense')
      .reduce((sum, c) => sum + c.amount, 0),
    Earning: Object.values(categoryMap)
      .filter(c => c.type === 'Earning')
      .reduce((sum, c) => sum + c.amount, 0)
  };

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      type: data.type,
      amount: data.amount,
      percentage: `${Math.round((data.amount / (totalByType[data.type] || 1)) * 100)}%`,
      icon: data.icon
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
};

// Helper function to get category icons
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    Rent: '🏠',
    SIP: '�',
    Food: '🍽️',
    Salary: '💼',
    Freelance: '💻',
    Transport: '🚗',
    Entertainment: '🎭',
    Shopping: '🛍️',
    Health: '⚕️',
    Education: '�'
  };
  return icons[category] || '📋';
};

const CustomTooltip = ({ active, payload, settings }: { active?: boolean; payload?: any[]; settings: UserSettings }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl p-3 border border-[rgba(255,255,255,0.2)]">
        <p className="text-sm text-foreground">{payload[0].name}</p>
        <p className="text-sm text-[#00FFFF]">{formatCurrency(payload[0].value, settings?.defaultCurrency || 'INR')}</p>
      </div>
    );
  }
  return null;
};const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function Dashboard({ 
  onAddEntry, 
  onManageAccounts, 
  onOpenAutoImport, 
  onOpenSettings,
  onAccountClick,
  onAssetClick,
  accounts = [], 
  assets = [], 
  settings = { defaultCurrency: 'INR', exchangeRates: {} }, 
  transactions = [] 
}: DashboardProps) {
  // Ensure we have valid arrays and objects
  const validAccounts = Array.isArray(accounts) ? accounts : [];
  const validAssets = Array.isArray(assets) ? assets : [];
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  const validSettings = settings || { defaultCurrency: 'INR', exchangeRates: {} };
  
  const currencySymbol = getCurrencySymbol(validSettings.defaultCurrency || 'INR');
  
  // Calculate data from actual transactions
  const expenseData = calculateExpenseData(validTransactions);
  const monthlyTrend = calculateMonthlyTrend(validTransactions);
  const topCategories = calculateTopCategories(validTransactions);
  
  // Calculate totals with array validation
  const totalEarnings = validTransactions
    .filter(t => t?.type === 'earning' && typeof t?.amount === 'number')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = validTransactions
    .filter(t => t?.type === 'expense' && typeof t?.amount === 'number')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netBalance = totalEarnings - totalExpenses;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-[hsl(222,47%,11%)] to-[hsl(224,71%,4%)]">
      {/* Header */}
      <header className="glass section-bg-1 rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFFF] to-[#A259FF] flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl text-foreground">Expense Manager</h1>
              <p className="text-sm text-muted-foreground">
                Track your financial journey • {settings.defaultCurrency}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Select defaultValue="this-month">
              <SelectTrigger className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>

              <Button 
              onClick={onOpenSettings}
              variant="outline"
              className="glass border-[rgba(255,255,255,0.2)] hover:border-primary hover:text-primary hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(0,255,255,0.2)] rounded-xl h-11 px-4"
            >
              <Settings className="w-4 h-4" />
            </Button>

              <Button 
              onClick={onOpenAutoImport}
              variant="outline"
              className="glass border-[rgba(255,255,255,0.2)] hover:border-primary hover:text-primary hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(0,255,255,0.2)] rounded-xl h-11 px-4"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Import
            </Button>

              <Button 
              onClick={onAddEntry}
              className="bg-[#00FFFF] text-[#0B0C10] hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] rounded-xl h-11 px-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>
      </header>

      {/* Wealth Section */}
      <div className="section-bg-2 p-6 rounded-2xl">
        <WealthSection 
          accounts={accounts} 
          assets={assets}
          onManageAccounts={onManageAccounts}
          onAccountClick={onAccountClick}
          onAssetClick={onAssetClick}
          settings={settings}
        />
      </div>

      {/* Summary Cards */}
      <div className="section-bg-3 p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Total Earnings"
            amount={formatCurrency(totalEarnings, settings.defaultCurrency)}
            icon={TrendingUp}
            trend="+12% from last month"
            accentColor="blue"
          />
          <SummaryCard
            title="Total Expenses"
            amount={formatCurrency(totalExpenses, settings.defaultCurrency)}
            icon={TrendingDown}
            trend="+8% from last month"
            accentColor="purple"
          />
          <SummaryCard
            title="Net Balance"
            amount={formatCurrency(netBalance, settings.defaultCurrency)}
            icon={Wallet}
            trend={netBalance > 0 ? 'Positive flow' : 'Negative flow'}
            accentColor="green"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="section-bg-4 p-6 rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Distribution Pie Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl text-foreground mb-6">Expense Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip settings={settings} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {expenseData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl text-foreground mb-6">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A259FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A259FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(234,234,234,0.6)"
                  tick={{ fill: 'rgba(234,234,234,0.6)' }}
                />
                <YAxis 
                  stroke="rgba(234,234,234,0.6)"
                  tick={{ fill: 'rgba(234,234,234,0.6)' }}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} settings={settings} />} />
                <Legend content={<CustomLegend />} />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#00FFFF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEarnings)" 
                  name="Earnings"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#A259FF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl text-foreground mb-6">Top Categories</h3>
        <div className="space-y-3">
          {topCategories.map((item, index) => (
            <div 
              key={index}
              className="glass-strong rounded-xl p-4 flex items-center justify-between hover:neon-glow-blue transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-foreground">{item.category}</p>
                  <p className="text-sm text-muted-foreground">{item.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-foreground">{formatCurrency(item.amount, settings.defaultCurrency)}</p>
                <p className="text-sm text-muted-foreground">{item.percentage} of total</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="section-bg-5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl text-foreground font-semibold">Transaction History</h3>
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
              <span>Earnings</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-2 h-2 rounded-full bg-[#FF6B9D] shadow-[0_0_10px_rgba(255,107,157,0.5)]"></div>
              <span>Expenses</span>
            </div>
          </div>
        </div>
        <TransactionHistory 
          transactions={validTransactions}
          settings={validSettings}
        />
      </div>
    </div>
  );
}
