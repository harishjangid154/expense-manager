import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@expensemanager.com' },
    update: {},
    create: {
      email: 'demo@expensemanager.com',
      name: 'Demo User',
      passwordHash: '$2a$10$dummyHashForDemo',
    },
  });

  console.log('✅ Created user:', user.email);

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Main Checking',
      type: 'bank',
      balance: 500000,
      currency: 'USD',
      color: '#00FFFF',
    },
  });

  console.log('✅ Created account:', account.name);

  const now = new Date();
  const transactions = await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: account.id,
        clientId: 'client-tx-001',
        amountMinor: -5000,
        currency: 'USD',
        category: 'Food',
        merchant: 'Grocery Store',
        note: 'Weekly groceries',
        metadata: '{"tags":["groceries","weekly"]}',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        accountId: account.id,
        clientId: 'client-tx-002',
        amountMinor: -3500,
        currency: 'USD',
        category: 'Transport',
        merchant: 'Gas Station',
        note: 'Fuel',
        metadata: '{"tags":["fuel"]}',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        accountId: account.id,
        clientId: 'client-tx-003',
        amountMinor: 200000,
        currency: 'USD',
        category: 'Salary',
        merchant: null,
        note: 'Monthly salary',
        metadata: '{"type":"income"}',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        accountId: account.id,
        clientId: 'client-tx-004',
        amountMinor: -12000,
        currency: 'USD',
        category: 'Shopping',
        merchant: 'Electronics Store',
        note: 'New headphones',
        metadata: '{"tags":["electronics"]}',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        accountId: account.id,
        clientId: 'client-tx-005',
        amountMinor: -8500,
        currency: 'USD',
        category: 'Entertainment',
        merchant: 'Cinema',
        note: 'Movie tickets',
        metadata: '{"tags":["movies","weekend"]}',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Created transactions:', transactions.count);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
