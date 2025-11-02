import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Transaction {
  id: string;
  clientId: string;
  accountId: string;
  amountMinor: number;
  currency: string;
  category: string;
  merchant?: string;
  note?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  synced: boolean;
}

interface ExpenseManagerDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-synced': boolean; 'by-clientId': string };
  };
}

let dbPromise: Promise<IDBPDatabase<ExpenseManagerDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ExpenseManagerDB>('ExpenseManagerDB', 2, {
      upgrade(db, oldVersion) {
        // Create transactions store if it doesn't exist
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('by-synced', 'synced');
          store.createIndex('by-clientId', 'clientId', { unique: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function getPendingTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  const index = db.transaction('transactions').store.index('by-synced');
  return index.getAll(false);
}

export async function markSynced(clientId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  const index = tx.store.index('by-clientId');
  const transaction = await index.get(clientId);
  
  if (transaction) {
    transaction.synced = true;
    await tx.store.put(transaction);
  }
  
  await tx.done;
}

export async function deleteClientTransaction(clientId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  const index = tx.store.index('by-clientId');
  const transaction = await index.get(clientId);
  
  if (transaction) {
    await tx.store.delete(transaction.id);
  }
  
  await tx.done;
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'synced'>): Promise<void> {
  const db = await getDB();
  const newTransaction: Transaction = {
    ...transaction,
    id: crypto.randomUUID(),
    synced: false,
  };
  await db.add('transactions', newTransaction);
}

export async function clearSyncedTransactions(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  const allTransactions = await tx.store.getAll();
  
  for (const transaction of allTransactions) {
    if (transaction.synced) {
      await tx.store.delete(transaction.id);
    }
  }
  
  await tx.done;
}
