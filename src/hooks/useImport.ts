'use client';

import { useState, useCallback } from 'react';
import { getPendingTransactions, markSynced } from '@/lib/idb';

interface ImportProgress {
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ clientId?: string; error: string }>;
}

interface UseImportReturn {
  importing: boolean;
  progress: ImportProgress | null;
  error: string | null;
  startImport: () => Promise<void>;
  reset: () => void;
}

export function useImport(): UseImportReturn {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startImport = useCallback(async () => {
    setImporting(true);
    setError(null);
    setProgress(null);

    try {
      // Get pending transactions from IndexedDB
      const pendingTransactions = await getPendingTransactions();

      if (pendingTransactions.length === 0) {
        setError('No pending transactions to import');
        setImporting(false);
        return;
      }

      setProgress({
        total: pendingTransactions.length,
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      });

      // Convert to API format
      const transactionsToImport = pendingTransactions.map((tx) => ({
        clientId: tx.clientId,
        accountId: tx.accountId,
        amountMinor: tx.amountMinor,
        currency: tx.currency,
        category: tx.category,
        merchant: tx.merchant,
        note: tx.note,
        metadata: tx.metadata,
        createdAt: tx.createdAt.toISOString(),
      }));

      // Send to API with retry logic
      let retries = 3;
      let lastError: Error | null = null;

      while (retries > 0) {
        try {
          const response = await fetch('/api/transactions/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionsToImport),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Import failed');
          }

          const result = await response.json();

          // Update progress
          setProgress({
            total: pendingTransactions.length,
            processed: pendingTransactions.length,
            inserted: result.inserted,
            updated: result.updated,
            skipped: result.skipped,
            errors: result.errors,
          });

          // Mark transactions as synced
          for (const tx of pendingTransactions) {
            if (tx.clientId) {
              await markSynced(tx.clientId);
            }
          }

          setImporting(false);
          return;
        } catch (err) {
          lastError = err as Error;
          retries--;

          if (retries > 0) {
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, (4 - retries) * 1000)
            );
          }
        }
      }

      throw lastError || new Error('Import failed after retries');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setImporting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setImporting(false);
    setProgress(null);
    setError(null);
  }, []);

  return {
    importing,
    progress,
    error,
    startImport,
    reset,
  };
}
