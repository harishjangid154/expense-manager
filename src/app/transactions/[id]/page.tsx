import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TransactionForm } from '@/components/TransactionForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

async function getTransaction(id: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      account: true,
    },
  });

  if (!transaction) {
    notFound();
  }

  return transaction;
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const transaction = await getTransaction(params.id);

  async function handleSave(data: any) {
    'use server';
    await prisma.transaction.update({
      where: { id: params.id },
      data,
    });
    redirect('/transactions');
  }

  async function handleDelete() {
    'use server';
    await prisma.transaction.update({
      where: { id: params.id },
      data: { isDeleted: true },
    });
    redirect('/transactions');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/transactions"
          className="p-2 rounded-lg glass border border-[rgba(255,255,255,0.15)] hover:border-[#00FFFF]/50 transition-colors"
          aria-label="Back to transactions"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Edit Transaction</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update transaction details
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="glass-strong rounded-2xl p-6">
        <TransactionForm
          transaction={transaction}
          onSave={handleSave}
          onCancel={() => redirect('/transactions')}
        />
      </div>

      {/* Delete button */}
      <form action={handleDelete}>
        <Button
          type="submit"
          variant="outline"
          className="w-full glass border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Transaction
        </Button>
      </form>
    </div>
  );
}
