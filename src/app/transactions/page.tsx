import { prisma } from '@/lib/prisma';
import { TransactionRow } from '@/components/TransactionRow';

export default async function TransactionsPage() {
  // TODO: Add authentication and get current user
  // For now, fetch first user's transactions as demo
  const user = await prisma.user.findFirst();
  
  const transactions = user
    ? await prisma.transaction.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          account: {
            select: {
              name: true,
              currency: true,
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your transaction history
          </p>
        </div>
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block glass-strong rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.1)]">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Merchant
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Note
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                settings={{ defaultCurrency: tx.account.currency }}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            settings={{ defaultCurrency: tx.account.currency }}
          />
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No transactions found</p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Import transactions or add them manually
          </p>
        </div>
      )}
    </div>
  );
}
