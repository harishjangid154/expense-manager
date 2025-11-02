import { prisma } from '@/lib/prisma';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

export default async function AnalyticsPage() {
  // TODO: Add authentication and get current user
  const user = await prisma.user.findFirst();

  if (!user) {
    return (
      <div className="glass-strong rounded-2xl p-12 text-center">
        <p className="text-muted-foreground">No user found</p>
      </div>
    );
  }

  // Fetch analytics data
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const totalExpense = transactions
    .filter((t) => t.amountMinor < 0)
    .reduce((sum, t) => sum + Math.abs(t.amountMinor), 0);

  const totalIncome = transactions
    .filter((t) => t.amountMinor > 0)
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const netBalance = totalIncome - totalExpense;

  // Category breakdown
  const categoryMap = new Map<string, number>();
  transactions.forEach((t) => {
    const current = categoryMap.get(t.category) || 0;
    categoryMap.set(t.category, current + Math.abs(t.amountMinor));
  });

  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Insights and trends from your transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <TrendingUp className="w-5 h-5 text-[#00FFFF]" />
          </div>
          <p className="text-3xl font-bold text-[#00FFFF]">
            ${(totalIncome / 100).toFixed(2)}
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <TrendingDown className="w-5 h-5 text-[#FF6B9D]" />
          </div>
          <p className="text-3xl font-bold text-[#FF6B9D]">
            ${(totalExpense / 100).toFixed(2)}
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Net Balance</p>
            <DollarSign className="w-5 h-5 text-[#6BCB77]" />
          </div>
          <p
            className={`text-3xl font-bold ${
              netBalance >= 0 ? 'text-[#6BCB77]' : 'text-[#FF6B9D]'
            }`}
          >
            ${(netBalance / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Top Categories */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#00FFFF]" />
          Top Categories
        </h2>
        <div className="space-y-4">
          {topCategories.map(([category, amount]) => {
            const percentage = (amount / (totalExpense + totalIncome)) * 100;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {category}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ${(amount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 glass rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00FFFF] to-[#A259FF]"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {transactions.slice(0, 10).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 glass rounded-xl"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {tx.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  tx.amountMinor < 0 ? 'text-[#FF6B9D]' : 'text-[#00FFFF]'
                }`}
              >
                {tx.amountMinor < 0 ? '-' : '+'}$
                {Math.abs(tx.amountMinor / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
