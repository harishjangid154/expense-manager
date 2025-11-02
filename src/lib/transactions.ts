import { prisma } from './prisma';
import type { Transaction, Prisma } from '@prisma/client';
import type { TransactionInput, TransactionUpdateInput } from './schemas/transaction';

export async function listTransactions(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    accountId?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    includeDeleted?: boolean;
  } = {}
) {
  const {
    page = 1,
    limit = 50,
    accountId,
    category,
    startDate,
    endDate,
    includeDeleted = false,
  } = options;

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(accountId && { accountId }),
    ...(category && { category }),
    ...(startDate && { createdAt: { gte: startDate } }),
    ...(endDate && { createdAt: { lte: endDate } }),
    ...(!includeDeleted && { isDeleted: false }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTransactionById(id: string, userId: string) {
  return await prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      account: true,
    },
  });
}

export async function createTransaction(userId: string, data: TransactionInput) {
  const createdAt = typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt;

  return await prisma.transaction.create({
    data: {
      userId,
      accountId: data.accountId,
      clientId: data.clientId,
      amountMinor: data.amountMinor,
      currency: data.currency,
      category: data.category,
      merchant: data.merchant,
      note: data.note,
      metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
      createdAt,
    },
  });
}

export async function updateTransaction(
  id: string,
  userId: string,
  data: TransactionUpdateInput
) {
  return await prisma.transaction.updateMany({
    where: { id, userId },
    data: {
      ...(data.accountId && { accountId: data.accountId }),
      ...(data.amountMinor !== undefined && { amountMinor: data.amountMinor }),
      ...(data.currency && { currency: data.currency }),
      ...(data.category && { category: data.category }),
      ...(data.merchant !== undefined && { merchant: data.merchant }),
      ...(data.note !== undefined && { note: data.note }),
      ...(data.metadata && { metadata: JSON.stringify(data.metadata) }),
      ...(data.isDeleted !== undefined && { isDeleted: data.isDeleted }),
    },
  });
}

export async function softDeleteTransaction(id: string, userId: string) {
  return await prisma.transaction.updateMany({
    where: { id, userId },
    data: { isDeleted: true },
  });
}

export async function upsertBatch(userId: string, transactions: TransactionInput[]) {
  const BATCH_SIZE = 200;
  const results = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ clientId?: string; error: string }>,
  };

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    for (const txData of batch) {
      try {
        const createdAt = typeof txData.createdAt === 'string' 
          ? new Date(txData.createdAt) 
          : txData.createdAt;

        if (txData.clientId) {
          // Check if transaction exists
          const existing = await prisma.transaction.findUnique({
            where: {
              userId_clientId: {
                userId,
                clientId: txData.clientId,
              },
            },
          });

          if (existing) {
            // Update existing
            await prisma.transaction.update({
              where: { id: existing.id },
              data: {
                accountId: txData.accountId,
                amountMinor: txData.amountMinor,
                currency: txData.currency,
                category: txData.category,
                merchant: txData.merchant,
                note: txData.note,
                metadata: txData.metadata ? JSON.stringify(txData.metadata) : '{}',
                createdAt,
              },
            });
            results.updated++;
          } else {
            // Insert new
            await prisma.transaction.create({
              data: {
                userId,
                clientId: txData.clientId,
                accountId: txData.accountId,
                amountMinor: txData.amountMinor,
                currency: txData.currency,
                category: txData.category,
                merchant: txData.merchant,
                note: txData.note,
                metadata: txData.metadata ? JSON.stringify(txData.metadata) : '{}',
                createdAt,
              },
            });
            results.inserted++;
          }
        } else {
          // No clientId, just insert
          await prisma.transaction.create({
            data: {
              userId,
              accountId: txData.accountId,
              amountMinor: txData.amountMinor,
              currency: txData.currency,
              category: txData.category,
              merchant: txData.merchant,
              note: txData.note,
              metadata: txData.metadata ? JSON.stringify(txData.metadata) : '{}',
              createdAt,
            },
          });
          results.inserted++;
        }
      } catch (error) {
        results.errors.push({
          clientId: txData.clientId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.skipped++;
      }
    }
  }

  return results;
}
