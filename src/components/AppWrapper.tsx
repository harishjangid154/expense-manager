'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { AddEntryModal } from '@/components/AddEntryModal';
import { ExpenseEntry } from '@/types';
import { AccountsModal } from '@/components/AccountsModal';
import { AutoImportSettings } from '@/components/AutoImportSettings';
import { SettingsModal } from '@/components/SettingsModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AccountDetailModal } from '@/components/AccountDetailModal';
import { AssetDetailModal } from '@/components/AssetDetailModal';
import { RecurringExpensesModal } from '@/components/RecurringExpensesModal';
import { BrokerModal } from '@/components/BrokerModal';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { BankAccount, Asset, Transaction, UserSettings, RecurringExpense, BrokerAccount } from '@/types';
import { FALLBACK_RATES, formatCurrency, fetchExchangeRates } from '@/utils/currency';
import { loadFromStorage, saveToStorage } from '@/utils/storage';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function AppWrapper() {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAccountDetailOpen, setIsAccountDetailOpen] = useState(false);
  const [isAssetDetailOpen, setIsAssetDetailOpen] = useState(false);
  const [isRecurringExpensesOpen, setIsRecurringExpensesOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    defaultCurrency: 'INR',
    exchangeRates: FALLBACK_RATES,
    lastRateUpdate: new Date()
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing system...');

  // Initialize app with loading screen
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Loading user data
        setLoadingProgress(20);
        setLoadingStatus('Loading your data...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const data = await loadFromStorage();
        setAccounts(data.accounts);
        setAssets(data.assets);
        setTransactions(data.transactions);
        setRecurringExpenses(data.recurringExpenses);
        setBrokerAccounts(data.brokerAccounts);
        
        // Step 2: Processing transactions
        setLoadingProgress(40);
        setLoadingStatus('Processing transactions...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 3: Loading settings
        setLoadingProgress(60);
        setLoadingStatus('Configuring settings...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const currentSettings = data.settings || {
          defaultCurrency: 'INR',
          exchangeRates: FALLBACK_RATES,
          lastRateUpdate: new Date()
        };
        
        // Step 4: Checking exchange rates
        setLoadingProgress(75);
        setLoadingStatus('Checking exchange rates...');
        
        // Check if rates are stale (older than 24 hours) or don't exist
        const shouldFetchRates = !currentSettings.lastRateUpdate || 
          (Date.now() - new Date(currentSettings.lastRateUpdate).getTime()) > 24 * 60 * 60 * 1000;
        
        let finalSettings = currentSettings;
        
        if (shouldFetchRates) {
          try {
            setLoadingStatus('Fetching live exchange rates...');
            const rates = await fetchExchangeRates(currentSettings.defaultCurrency || 'INR');
            finalSettings = {
              ...currentSettings,
              exchangeRates: rates,
              lastRateUpdate: new Date()
            };
            setLoadingProgress(90);
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.warn('Failed to fetch exchange rates, using cached/fallback rates');
          }
        }
        
        setSettings(finalSettings);
        
        // Step 5: Finalizing
        setLoadingProgress(95);
        setLoadingStatus('Almost there...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setLoadingProgress(100);
        setLoadingStatus('Ready!');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setIsInitialized(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoadingStatus('Error loading app...');
        // Still show the app even if there's an error
        setTimeout(() => {
          setIsInitialized(true);
          setIsLoading(false);
        }, 1000);
      }
    };

    initializeApp();
  }, []);

  // Save data to storage whenever it changes (but only after initial load)
  useEffect(() => {
    if (isInitialized) {
      saveToStorage({ accounts, assets, transactions, recurringExpenses, brokerAccounts, settings }).catch(error => {
        console.error('Failed to save to storage:', error);
      });
    }
  }, [accounts, assets, transactions, recurringExpenses, brokerAccounts, settings, isInitialized]);

  const handleAddAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: generateId(),
    };
    setAccounts([...accounts, newAccount]);
    
    // Create an initial transaction if account has a balance > 0
    if (account.balance > 0) {
      const initialTransaction: Transaction = {
        id: generateId(),
        type: 'earning',
        amount: account.balance,
        currency: settings.defaultCurrency,
        category: 'Initial Balance',
        comment: `Initial balance for ${account.name}`,
        accountId: newAccount.id,
        date: new Date(),
      };
      setTransactions([...transactions, initialTransaction]);
    }
    
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
    // Validate account balance for expenses
    if (entry.type === 'expense') {
      const account = accounts.find(acc => acc.id === entry.accountId);
      if (!account) {
        toast.error('Account not found');
        return;
      }
      if (account.balance < entry.amount) {
        toast.error('Insufficient balance', {
          description: `Available: ${formatCurrency(account.balance, settings.defaultCurrency)}, Required: ${formatCurrency(entry.amount, settings.defaultCurrency)}`,
        });
        return;
      }
    }

    const transaction: Transaction = {
      id: generateId(),
      ...entry,
      date: new Date(),
    };

    // Create asset if this is an investment expense
    let newAsset: Asset | null = null;
    if (entry.type === 'expense' && entry.isInvestment) {
      // Map category to asset type
      const categoryToAssetType: Record<string, Asset['type']> = {
        'sip': 'sip',
        'stocks': 'stocks',
        'crypto': 'crypto',
        'gold': 'gold',
        'rent': 'property',
        'other': 'other',
      };

      const assetType = categoryToAssetType[entry.category.toLowerCase()] || 'other';
      const assetName = entry.assetName || entry.category || 'Investment';
      
      newAsset = {
        id: generateId(),
        name: assetName,
        type: assetType,
        value: entry.amount, // Initial value is the purchase amount
        purchaseDate: new Date(),
        category: entry.category,
      };
      
      // Link the transaction to the asset
      transaction.assetId = newAsset.id;
      
      // Add asset to assets array
      setAssets([...assets, newAsset]);
    }

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

    if (entry.isInvestment && newAsset) {
      toast.success('Investment added successfully!', {
        description: `${entry.assetName} - ${formatCurrency(entry.amount, settings.defaultCurrency)}`,
      });
    } else {
      toast.success(
        entry.type === 'earning' ? 'Earning added successfully!' : 'Expense added successfully!',
        {
          description: `${entry.comment} - ${formatCurrency(entry.amount, settings.defaultCurrency)}`,
        }
      );
    }
  };

  // Recurring Expenses Handlers
  const handleAddRecurringExpense = (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: generateId(),
      createdAt: new Date(),
    };
    setRecurringExpenses([...recurringExpenses, newExpense]);
  };

  const handleUpdateRecurringExpense = (expense: RecurringExpense) => {
    setRecurringExpenses(recurringExpenses.map(e => e.id === expense.id ? expense : e));
  };

  const handleDeleteRecurringExpense = (id: string) => {
    setRecurringExpenses(recurringExpenses.filter(e => e.id !== id));
  };

  // Broker Account Handlers
  const handleAddBroker = (broker: Omit<BrokerAccount, 'id' | 'createdAt'>) => {
    const newBroker: BrokerAccount = {
      ...broker,
      id: generateId(),
      createdAt: new Date(),
    };
    setBrokerAccounts([...brokerAccounts, newBroker]);
  };

  const handleTransferToBroker = (brokerId: string, amount: number, fromAccountId: string) => {
    // Deduct from bank account
    const updatedAccounts = accounts.map(account => {
      if (account.id === fromAccountId) {
        return { ...account, balance: account.balance - amount };
      }
      return account;
    });
    setAccounts(updatedAccounts);

    // Add to broker account
    const updatedBrokers = brokerAccounts.map(broker => {
      if (broker.id === brokerId) {
        return { ...broker, balance: broker.balance + amount };
      }
      return broker;
    });
    setBrokerAccounts(updatedBrokers);

    // Create transaction record
    const transaction: Transaction = {
      id: generateId(),
      type: 'expense',
      amount,
      currency: settings.defaultCurrency,
      category: 'Broker Transfer',
      comment: `Transfer to ${brokerAccounts.find(b => b.id === brokerId)?.name}`,
      accountId: fromAccountId,
      date: new Date(),
      brokerId,
    };
    setTransactions([...transactions, transaction]);
  };

  const handleBuyStock = (data: {
    brokerId: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
  }) => {
    // Deduct from broker account
    const updatedBrokers = brokerAccounts.map(broker => {
      if (broker.id === data.brokerId) {
        return { ...broker, balance: broker.balance - data.totalAmount };
      }
      return broker;
    });
    setBrokerAccounts(updatedBrokers);

    // Create stock asset
    const newAsset: Asset = {
      id: generateId(),
      name: data.name,
      type: 'stocks',
      value: data.totalAmount,
      purchaseDate: new Date(),
      category: 'Stocks',
      brokerId: data.brokerId,
      quantity: data.quantity,
      purchasePrice: data.pricePerUnit,
    };
    setAssets([...assets, newAsset]);

    // Create transaction record
    const transaction: Transaction = {
      id: generateId(),
      type: 'expense',
      amount: data.totalAmount,
      currency: settings.defaultCurrency,
      category: 'Stock Purchase',
      comment: `Bought ${data.quantity} units of ${data.name} @ ${formatCurrency(data.pricePerUnit, settings.defaultCurrency)}`,
      accountId: data.brokerId, // Using broker as account for tracking
      date: new Date(),
      isInvestment: true,
      assetId: newAsset.id,
      brokerId: data.brokerId,
    };
    setTransactions([...transactions, transaction]);
  };

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} status={loadingStatus} />;
  }

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
        onOpenRecurringExpenses={() => setIsRecurringExpensesOpen(true)}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        onAccountClick={(account) => {
          setSelectedAccount(account);
          setIsAccountDetailOpen(true);
        }}
        onAssetClick={(asset) => {
          setSelectedAsset(asset);
          setIsAssetDetailOpen(true);
        }}
      />
      
      <AddEntryModal
        open={isEntryModalOpen}
        onOpenChange={(open) => setIsEntryModalOpen(open)}
        onSubmit={handleAddEntry}
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

      <AccountDetailModal
        open={isAccountDetailOpen}
        onOpenChange={(open) => {
          setIsAccountDetailOpen(open);
          if (!open) setSelectedAccount(null);
        }}
        account={selectedAccount}
        transactions={transactions}
        settings={settings}
      />

      <AssetDetailModal
        open={isAssetDetailOpen}
        onOpenChange={(open) => {
          setIsAssetDetailOpen(open);
          if (!open) setSelectedAsset(null);
        }}
        asset={selectedAsset}
        transactions={transactions}
        settings={settings}
      />

      <RecurringExpensesModal
        open={isRecurringExpensesOpen}
        onOpenChange={(open) => setIsRecurringExpensesOpen(open)}
        recurringExpenses={recurringExpenses}
        accounts={accounts}
        settings={settings}
        onAddRecurringExpense={handleAddRecurringExpense}
        onUpdateRecurringExpense={handleUpdateRecurringExpense}
        onDeleteRecurringExpense={handleDeleteRecurringExpense}
      />

      <BrokerModal
        open={isBrokerModalOpen}
        onOpenChange={(open) => setIsBrokerModalOpen(open)}
        brokerAccounts={brokerAccounts}
        bankAccounts={accounts}
        assets={assets}
        settings={settings}
        onAddBroker={handleAddBroker}
        onTransferToBroker={handleTransferToBroker}
        onBuyStock={handleBuyStock}
      />

      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass-strong border-[rgba(255,255,255,0.2)]',
        }}
      />
    </>
  );
}