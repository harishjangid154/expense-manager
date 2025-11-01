import { BankAccount, Asset, Transaction, UserSettings } from '@/types';

const DB_NAME = 'ExpenseManagerDB';
const DB_VERSION = 1;

// Object store names (matching potential backend table names)
export const STORES = {
  ACCOUNTS: 'accounts',
  ASSETS: 'assets',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
} as const;

// IndexedDB interface
interface IDBPDatabase {
  objectStoreNames: DOMStringList;
  transaction: (storeNames: string[], mode?: IDBTransactionMode) => IDBTransaction;
  close: () => void;
}

// Get IndexedDB instance
async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores with indexes (matching backend schema design)
      
      // Accounts Store
      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        const accountsStore = db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
        accountsStore.createIndex('type', 'type', { unique: false });
        accountsStore.createIndex('name', 'name', { unique: false });
      }

      // Assets Store
      if (!db.objectStoreNames.contains(STORES.ASSETS)) {
        const assetsStore = db.createObjectStore(STORES.ASSETS, { keyPath: 'id' });
        assetsStore.createIndex('type', 'type', { unique: false });
        assetsStore.createIndex('category', 'category', { unique: false });
        assetsStore.createIndex('purchaseDate', 'purchaseDate', { unique: false });
      }

      // Transactions Store (can grow very large - most important to index)
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionsStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        transactionsStore.createIndex('accountId', 'accountId', { unique: false });
        transactionsStore.createIndex('assetId', 'assetId', { unique: false });
        transactionsStore.createIndex('date', 'date', { unique: false });
        transactionsStore.createIndex('type', 'type', { unique: false });
        transactionsStore.createIndex('category', 'category', { unique: false });
        transactionsStore.createIndex('date_accountId', ['date', 'accountId'], { unique: false });
        transactionsStore.createIndex('date_type', ['date', 'type'], { unique: false });
      }

      // Settings Store (small, but keeping in IndexedDB for consistency)
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

// Helper to convert dates to ISO strings for storage
function serializeDates<T extends { [key: string]: any }>(obj: T): any {
  const serialized = { ...obj };
  Object.keys(serialized).forEach(key => {
    if (serialized[key] instanceof Date) {
      serialized[key] = serialized[key].toISOString();
    } else if (typeof serialized[key] === 'object' && serialized[key] !== null) {
      serialized[key] = serializeDates(serialized[key]);
    }
  });
  return serialized;
}

// Helper to convert ISO strings back to dates
function deserializeDates<T>(obj: T, dateFields: string[]): T {
  const deserialized = { ...obj } as any;
  dateFields.forEach(field => {
    if (deserialized[field] && typeof deserialized[field] === 'string') {
      deserialized[field] = new Date(deserialized[field]);
    }
  });
  return deserialized;
}

// Generic CRUD operations

export async function addItem<T>(storeName: string, item: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(serializeDates(item));
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateItem<T>(storeName: string, item: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(serializeDates(item));
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteItem(storeName: string, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getItem<T>(storeName: string, id: string, dateFields: string[] = []): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => {
      const result = request.result;
      if (!result) {
        resolve(null);
        return;
      }
      resolve(deserializeDates(result, dateFields));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllItems<T>(storeName: string, dateFields: string[] = []): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map(item => deserializeDates(item, dateFields)));
    };
    request.onerror = () => reject(request.error);
  });
}

// Query helpers (using indexes for performance)

export async function getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
    const store = transaction.objectStore(STORES.TRANSACTIONS);
    const index = store.index('accountId');
    const request = index.getAll(accountId);
    
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map(item => deserializeDates(item, ['date'])));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getTransactionsByAsset(assetId: string): Promise<Transaction[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
    const store = transaction.objectStore(STORES.TRANSACTIONS);
    const index = store.index('assetId');
    const request = index.getAll(assetId);
    
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map(item => deserializeDates(item, ['date'])));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
    const store = transaction.objectStore(STORES.TRANSACTIONS);
    const index = store.index('date');
    const range = IDBKeyRange.bound(
      startDate.toISOString(),
      endDate.toISOString(),
      false,
      false
    );
    const request = index.getAll(range);
    
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map(item => deserializeDates(item, ['date'])));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getTransactionsByType(type: 'expense' | 'earning'): Promise<Transaction[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
    const store = transaction.objectStore(STORES.TRANSACTIONS);
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map(item => deserializeDates(item, ['date'])));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAssetsByType(type: Asset['type']): Promise<Asset[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ASSETS], 'readonly');
    const store = transaction.objectStore(STORES.ASSETS);
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map(item => deserializeDates(item, ['purchaseDate'])));
    };
    request.onerror = () => reject(request.error);
  });
}

// Settings helpers (stored as key-value pairs)
export async function getSetting<T>(key: string): Promise<T | null> {
  const result = await getItem<{ key: string; value: T }>(STORES.SETTINGS, key);
  return result?.value || null;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await updateItem(STORES.SETTINGS, { key, value });
}

// Clear all data
export async function clearAll(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ACCOUNTS, STORES.ASSETS, STORES.TRANSACTIONS, STORES.SETTINGS], 'readwrite');
    
    const accountsReq = transaction.objectStore(STORES.ACCOUNTS).clear();
    const assetsReq = transaction.objectStore(STORES.ASSETS).clear();
    const transactionsReq = transaction.objectStore(STORES.TRANSACTIONS).clear();
    const settingsReq = transaction.objectStore(STORES.SETTINGS).clear();
    
    let completed = 0;
    const onComplete = () => {
      completed++;
      if (completed === 4) resolve();
    };
    
    accountsReq.onsuccess = onComplete;
    assetsReq.onsuccess = onComplete;
    transactionsReq.onsuccess = onComplete;
    settingsReq.onsuccess = onComplete;
    
    accountsReq.onerror = () => reject(accountsReq.error);
    assetsReq.onerror = () => reject(assetsReq.error);
    transactionsReq.onerror = () => reject(transactionsReq.error);
    settingsReq.onerror = () => reject(settingsReq.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Bulk operations for better performance
export async function addBulkItems<T>(storeName: string, items: T[]): Promise<void> {
  if (items.length === 0) return;
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    let completed = 0;
    let hasError = false;
    
    items.forEach(item => {
      const request = store.add(serializeDates(item));
      request.onsuccess = () => {
        completed++;
        if (completed === items.length && !hasError) {
          resolve();
        }
      };
      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(request.error);
        }
      };
    });
    
    transaction.onerror = () => {
      if (!hasError) {
        hasError = true;
        reject(transaction.error);
      }
    };
  });
}

export async function updateBulkItems<T>(storeName: string, items: T[]): Promise<void> {
  if (items.length === 0) return;
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    let completed = 0;
    let hasError = false;
    
    items.forEach(item => {
      const request = store.put(serializeDates(item));
      request.onsuccess = () => {
        completed++;
        if (completed === items.length && !hasError) {
          resolve();
        }
      };
      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(request.error);
        }
      };
    });
    
    transaction.onerror = () => {
      if (!hasError) {
        hasError = true;
        reject(transaction.error);
      }
    };
  });
}

