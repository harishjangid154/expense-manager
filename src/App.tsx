import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { AddEntryModal, ExpenseEntry } from './components/AddEntryModal';
import { AccountsModal } from './components/AccountsModal';
import { AutoImportSettings } from './components/AutoImportSettings';
import { SettingsModal } from './components/SettingsModal';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { BankAccount, Asset, Transaction, UserSettings } from './types';
import { convertCurrency, fetchExchangeRates, formatCurrency, FALLBACK_RATES } from './utils/currency';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    defaultCurrency: 'INR',
    exchangeRates: FALLBACK_RATES
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAccounts = localStorage.getItem('accounts');
    const savedAssets = localStorage.getItem('assets');
    const savedTransactions = localStorage.getItem('transactions');
    const savedSettings = localStorage.getItem('settings');

    if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const handleAddAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: generateId(),
    };
    setAccounts([...accounts, newAccount]);
    toast.success('Account added successfully!', {
      description: `${account.name} - ₹${account.balance.toLocaleString()}`,
    });
  };

  const handleDeleteAccount = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    if (account && account.balance > 0) {
      toast.error('Cannot delete account', {
        description: 'Please transfer or withdraw the balance first',
      });
      return;
    }
    setAccounts(accounts.filter(acc => acc.id !== id));
    toast.success('Account deleted successfully');
  };

  const handleAddEntry = (entry: ExpenseEntry) => {
    const transaction: Transaction = {
      id: generateId(),
      ...entry,
      originalAmount: entry.originalAmount,
      originalCurrency: entry.originalCurrency,
      date: new Date(),
    };

    // Update account balance using the converted amount
    const updatedAccounts = accounts.map(account => {
      if (account.id === entry.accountId) {
        return {
          ...account,
          balance: entry.type === 'earning' 
            ? account.balance + entry.amount 
            : account.balance - entry.amount,
        };
      }
      return account;
    });

    setAccounts(updatedAccounts);
    setTransactions([...transactions, transaction]);

    // If it's an investment, create an asset
    if (entry.isInvestment && entry.type === 'expense') {
      const newAsset: Asset = {
        id: generateId(),
        name: entry.assetName || entry.category,
        type: entry.category as Asset['type'],
        value: entry.amount,
        purchaseDate: new Date(),
        category: entry.category,
      };
      setAssets([...assets, newAsset]);
      
      toast.success('Investment added!', {
        description: entry.originalCurrency !== entry.currency
          ? `${formatCurrency(entry.originalAmount!, entry.originalCurrency!)} (${formatCurrency(entry.amount, entry.currency)}) invested in ${newAsset.name}`
          : `${formatCurrency(entry.amount, entry.currency)} invested in ${newAsset.name}`,
      });
    } else {
      const description = entry.originalCurrency !== entry.currency
        ? `${formatCurrency(entry.originalAmount!, entry.originalCurrency!)} (${formatCurrency(entry.amount, entry.currency)}) - ${entry.category}`
        : `${formatCurrency(entry.amount, entry.currency)} - ${entry.category}`;
        
      toast.success(
        `${entry.type === 'expense' ? 'Expense' : 'Earning'} added successfully!`,
        { description }
      );
    }
  };

  return (
    <div className="min-h-screen">
      <Dashboard 
        onAddEntry={() => setIsEntryModalOpen(true)}
        onManageAccounts={() => setIsAccountsModalOpen(true)}
        onOpenAutoImport={() => setIsAutoImportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        accounts={accounts}
        assets={assets}
        transactions={transactions}
        settings={settings}
      />
      <AddEntryModal 
        open={isEntryModalOpen} 
        onOpenChange={setIsEntryModalOpen}
        onSubmit={handleAddEntry}
        accounts={accounts}
        settings={settings}
      />
      <AccountsModal
        open={isAccountsModalOpen}
        onOpenChange={setIsAccountsModalOpen}
        accounts={accounts}
        settings={settings}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
      />
      <AutoImportSettings
        open={isAutoImportOpen}
        onOpenChange={setIsAutoImportOpen}
      />
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onUpdateSettings={setSettings}
      />
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass-strong border-[rgba(255,255,255,0.2)]',
        }}
      />
    </div>
  );
}
