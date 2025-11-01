import { BankAccount, Asset, Transaction, UserSettings } from '@/types';

export interface StorageData {
  accounts: BankAccount[];
  assets: Asset[];
  transactions: Transaction[];
  settings: UserSettings;
  version: number;
}

const STORAGE_VERSION = 1;
const STORAGE_KEY = 'expenseManager';

export function saveToStorage(data: Partial<StorageData>) {
  try {
    // Get existing data
    const existingData = loadFromStorage();

    // Merge new data with existing data
    const newData: StorageData = {
      ...existingData,
      ...data,
      version: STORAGE_VERSION
    };

    // Serialize dates properly
    const serializedData = serializeData(newData);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedData));
    return true;
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    return false;
  }
}

export function loadFromStorage(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return getDefaultData();
    }

    const parsedData = JSON.parse(data) as any;

    // Handle version migrations here if needed
    if (parsedData.version !== STORAGE_VERSION) {
      // Implement migration logic when needed
      console.log('Data version mismatch, using default data');
      return getDefaultData();
    }

    // Deserialize dates
    return deserializeData(parsedData);
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return getDefaultData();
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
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
    },
    version: STORAGE_VERSION
  };
}

// Helper functions for date serialization/deserialization
function serializeData(data: StorageData): any {
  const serialized = { ...data };

  // Serialize transaction dates
  serialized.transactions = data.transactions.map(tx => ({
    ...tx,
    date: tx.date instanceof Date ? tx.date.toISOString() : tx.date
  }));

  // Serialize asset purchase dates
  serialized.assets = data.assets.map(asset => ({
    ...asset,
    purchaseDate: asset.purchaseDate instanceof Date ? asset.purchaseDate.toISOString() : asset.purchaseDate
  }));

  // Serialize settings last rate update
  if (data.settings.lastRateUpdate instanceof Date) {
    serialized.settings = {
      ...data.settings,
      lastRateUpdate: data.settings.lastRateUpdate.toISOString()
    };
  }

  return serialized;
}

function deserializeData(data: any): StorageData {
  // Deserialize transaction dates
  const transactions = data.transactions.map((tx: any) => ({
    ...tx,
    date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date
  }));

  // Deserialize asset purchase dates
  const assets = data.assets.map((asset: any) => ({
    ...asset,
    purchaseDate: typeof asset.purchaseDate === 'string' ? new Date(asset.purchaseDate) : asset.purchaseDate
  }));

  // Deserialize settings last rate update
  const settings = data.settings?.lastRateUpdate && typeof data.settings.lastRateUpdate === 'string'
    ? {
        ...data.settings,
        lastRateUpdate: new Date(data.settings.lastRateUpdate)
      }
    : data.settings;

  return {
    ...data,
    transactions,
    assets,
    settings
  } as StorageData;
}