'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { AddEntryModal, ExpenseEntry } from '@/components/AddEntryModal';
import { AccountsModal } from '@/components/AccountsModal';
import { AutoImportSettings } from '@/components/AutoImportSettings';
import { SettingsModal } from '@/components/SettingsModal';
import { toast } from 'sonner';
import { BankAccount, Asset, Transaction, UserSettings } from '@/types';
import { FALLBACK_RATES, formatCurrency } from '@/utils/currency';
import { loadFromStorage, saveToStorage } from '@/utils/storage';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function AppWrapper() {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    defaultCurrency: 'INR',
    exchangeRates: FALLBACK_RATES,
    lastRateUpdate: new Date()
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    setAccounts(savedData.accounts);
    setAssets(savedData.assets);
    setTransactions(savedData.transactions);
    setSettings(savedData.settings);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    saveToStorage({ accounts });
  }, [accounts]);

  useEffect(() => {
    saveToStorage({ assets });
  }, [assets]);

  useEffect(() => {
    saveToStorage({ transactions });
  }, [transactions]);

  useEffect(() => {
    saveToStorage({ settings });
  }, [settings]);

  const handleAddAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: generateId(),
    };
    setAccounts([...accounts, newAccount]);
    toast.success('Account added successfully!', {
      description: `${account.name} - ${formatCurrency(account.balance, settings.defaultCurrency)}`,
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
      date: new Date(),
    };

    // Update account balance
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
    setIsEntryModalOpen(false);

    toast.success(
      entry.type === 'earning' ? 'Earning added successfully!' : 'Expense added successfully!',
      {
        description: `${entry.description} - ${formatCurrency(entry.amount, settings.defaultCurrency)}`,
      }
    );
  };

  return (
    <>
      <Dashboard
        accounts={accounts}
        assets={assets}
        transactions={transactions}
        settings={settings}
        onAddEntry={() => setIsEntryModalOpen(true)}
        onManageAccounts={() => setIsAccountsModalOpen(true)}
        onOpenAutoImport={() => setIsAutoImportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <AddEntryModal
        open={isEntryModalOpen}
        onOpenChange={(open) => setIsEntryModalOpen(open)}
        onAddEntry={handleAddEntry}
        accounts={accounts}
        settings={settings}
      />

      <AccountsModal
        open={isAccountsModalOpen}
        onOpenChange={(open) => setIsAccountsModalOpen(open)}
        accounts={accounts}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
        settings={settings}
      />

      <AutoImportSettings
        open={isAutoImportOpen}
        onOpenChange={(open) => setIsAutoImportOpen(open)}
      />

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={(open) => setIsSettingsOpen(open)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </>
  );
}