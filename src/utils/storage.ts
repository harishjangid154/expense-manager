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

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
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

    const parsedData = JSON.parse(data) as StorageData;

    // Handle version migrations here if needed
    if (parsedData.version !== STORAGE_VERSION) {
      // Implement migration logic when needed
      console.log('Data version mismatch, using default data');
      return getDefaultData();
    }

    return parsedData;
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