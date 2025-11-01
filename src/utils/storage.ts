import { BankAccount, Asset, Transaction, UserSettings } from '@/types';
import * as IDB from './indexedDB';

export interface StorageData {
  accounts: BankAccount[];
  assets: Asset[];
  transactions: Transaction[];
  settings: UserSettings;
  version: number;
}

const STORAGE_VERSION = 2; // Bumped for IndexedDB migration

// Check if we need to migrate from localStorage
async function checkAndMigrateFromLocalStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const oldData = localStorage.getItem('expenseManager');
    if (!oldData) return false;

    const parsedData = JSON.parse(oldData) as any;
    
    // Only migrate if version is old (pre-IndexedDB)
    if (parsedData.version && parsedData.version < STORAGE_VERSION) {
      console.log('Migrating data from localStorage to IndexedDB...');
      
      // Clear existing IndexedDB data
      await IDB.clearAll();
      
      // Migrate accounts
      if (parsedData.accounts && Array.isArray(parsedData.accounts)) {
        await IDB.addBulkItems(IDB.STORES.ACCOUNTS, parsedData.accounts);
      }
      
      // Migrate assets
      if (parsedData.assets && Array.isArray(parsedData.assets)) {
        const assets = parsedData.assets.map((asset: any) => ({
          ...asset,
          purchaseDate: typeof asset.purchaseDate === 'string' 
            ? new Date(asset.purchaseDate) 
            : asset.purchaseDate || new Date()
        }));
        await IDB.addBulkItems(IDB.STORES.ASSETS, assets);
      }
      
      // Migrate transactions
      if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
        const transactions = parsedData.transactions.map((tx: any) => ({
          ...tx,
          date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date || new Date()
        }));
        await IDB.addBulkItems(IDB.STORES.TRANSACTIONS, transactions);
      }
      
      // Migrate settings
      if (parsedData.settings) {
        await IDB.setSetting('userSettings', parsedData.settings);
      }
      
      // Remove old localStorage data
      localStorage.removeItem('expenseManager');
      
      console.log('Migration completed successfully!');
      return true;
    }
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
  
  return false;
}

export async function saveToStorage(data: Partial<StorageData>): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    
    // Ensure migration is done
    await checkAndMigrateFromLocalStorage();
    
    // Save accounts
    if (data.accounts !== undefined) {
      if (data.accounts.length === 0) {
        // Clear all if empty array
        const existing = await IDB.getAllItems<BankAccount>(IDB.STORES.ACCOUNTS);
        for (const account of existing) {
          await IDB.deleteItem(IDB.STORES.ACCOUNTS, account.id);
        }
      } else {
        // Update all accounts
        await IDB.updateBulkItems(IDB.STORES.ACCOUNTS, data.accounts);
      }
    }
    
    // Save assets
    if (data.assets !== undefined) {
      if (data.assets.length === 0) {
        // Clear all if empty array
        const existing = await IDB.getAllItems<Asset>(IDB.STORES.ASSETS);
        for (const asset of existing) {
          await IDB.deleteItem(IDB.STORES.ASSETS, asset.id);
        }
      } else {
        // Update all assets
        await IDB.updateBulkItems(IDB.STORES.ASSETS, data.assets);
      }
    }
    
    // Save transactions
    if (data.transactions !== undefined) {
      if (data.transactions.length === 0) {
        // Clear all if empty array
        const existing = await IDB.getAllItems<Transaction>(IDB.STORES.TRANSACTIONS);
        for (const tx of existing) {
          await IDB.deleteItem(IDB.STORES.TRANSACTIONS, tx.id);
        }
      } else {
        // Update all transactions
        await IDB.updateBulkItems(IDB.STORES.TRANSACTIONS, data.transactions);
      }
    }
    
    // Save settings
    if (data.settings !== undefined) {
      await IDB.setSetting('userSettings', data.settings);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save data to IndexedDB:', error);
    return false;
  }
}

export async function loadFromStorage(): Promise<StorageData> {
  try {
    if (typeof window === 'undefined') return getDefaultData();
    
    // Check and migrate from localStorage if needed
    await checkAndMigrateFromLocalStorage();
    
    // Load from IndexedDB
    const accounts = await IDB.getAllItems<BankAccount>(IDB.STORES.ACCOUNTS);
    const assets = await IDB.getAllItems<Asset>(IDB.STORES.ASSETS, ['purchaseDate']);
    const transactions = await IDB.getAllItems<Transaction>(IDB.STORES.TRANSACTIONS, ['date']);
    const settings = await IDB.getSetting<UserSettings>('userSettings') || getDefaultData().settings;
    
    return {
      accounts,
      assets,
      transactions,
      settings,
      version: STORAGE_VERSION
    };
  } catch (error) {
    console.error('Failed to load data from IndexedDB:', error);
    // Fallback to localStorage if IndexedDB fails
    return loadFromLocalStorageFallback();
  }
}

// Fallback to localStorage (for compatibility)
function loadFromLocalStorageFallback(): StorageData {
  try {
    const data = localStorage.getItem('expenseManager');
    if (!data) {
      return getDefaultData();
    }

    const parsedData = JSON.parse(data) as any;
    return deserializeData(parsedData);
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return getDefaultData();
  }
}

export async function clearStorage(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    await IDB.clearAll();
    localStorage.removeItem('expenseManager'); // Also clear old localStorage
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
}

function getDefaultData(): StorageData {
  return {
    accounts: [],
    assets: [],
    transactions: [],
    settings: {
      defaultCurrency: 'INR',
      exchangeRates: {},
      lastRateUpdate: new Date(),
    },
    version: STORAGE_VERSION
  };
}

function deserializeData(data: any): StorageData {
  const defaultData = getDefaultData();
  
  const transactions = Array.isArray(data.transactions)
    ? data.transactions.map((tx: any) => ({
        ...tx,
        date: typeof tx.date === 'string' ? new Date(tx.date) : (tx.date || new Date())
      }))
    : defaultData.transactions;

  const assets = Array.isArray(data.assets)
    ? data.assets.map((asset: any) => ({
        ...asset,
        purchaseDate: typeof asset.purchaseDate === 'string' ? new Date(asset.purchaseDate) : (asset.purchaseDate || new Date())
      }))
    : defaultData.assets;

  const accounts = Array.isArray(data.accounts) ? data.accounts : defaultData.accounts;

  const settings: UserSettings = {
    ...defaultData.settings,
    ...(data.settings || {}),
    lastRateUpdate: data.settings?.lastRateUpdate && typeof data.settings.lastRateUpdate === 'string'
      ? new Date(data.settings.lastRateUpdate)
      : (data.settings?.lastRateUpdate || defaultData.settings.lastRateUpdate)
  };

  return {
    accounts,
    transactions,
    assets,
    settings,
    version: data.version || STORAGE_VERSION
  } as StorageData;
}

// Individual item operations (for future use with backend sync)

export async function addAccount(account: BankAccount): Promise<void> {
  await IDB.addItem(IDB.STORES.ACCOUNTS, account);
}

export async function updateAccount(account: BankAccount): Promise<void> {
  await IDB.updateItem(IDB.STORES.ACCOUNTS, account);
}

export async function deleteAccount(accountId: string): Promise<void> {
  await IDB.deleteItem(IDB.STORES.ACCOUNTS, accountId);
}

export async function addAsset(asset: Asset): Promise<void> {
  await IDB.addItem(IDB.STORES.ASSETS, asset);
}

export async function updateAsset(asset: Asset): Promise<void> {
  await IDB.updateItem(IDB.STORES.ASSETS, asset);
}

export async function deleteAsset(assetId: string): Promise<void> {
  await IDB.deleteItem(IDB.STORES.ASSETS, assetId);
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  await IDB.addItem(IDB.STORES.TRANSACTIONS, transaction);
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  await IDB.updateItem(IDB.STORES.TRANSACTIONS, transaction);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await IDB.deleteItem(IDB.STORES.TRANSACTIONS, transactionId);
}

// Query helpers (using IndexedDB indexes for performance)

export async function getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  return IDB.getTransactionsByAccount(accountId);
}

export async function getTransactionsByAsset(assetId: string): Promise<Transaction[]> {
  return IDB.getTransactionsByAsset(assetId);
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  return IDB.getTransactionsByDateRange(startDate, endDate);
}

export async function getAssetsByType(type: Asset['type']): Promise<Asset[]> {
  return IDB.getAssetsByType(type);
}
