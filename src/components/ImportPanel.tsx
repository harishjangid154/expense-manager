'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useImport } from '@/hooks/useImport';
import { getPendingTransactions, clearSyncedTransactions } from '@/lib/idb';
import { Upload, CheckCircle, XCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

export function ImportPanel() {
  const { importing, progress, error, startImport, reset } = useImport();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPendingTransactions = async () => {
    setLoading(true);
    try {
      const pending = await getPendingTransactions();
      setPendingTransactions(pending);
      setPendingCount(pending.length);
    } catch (err) {
      console.error('Failed to load pending transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTransactions();
  }, []);

  const handleClearSynced = async () => {
    if (confirm('Clear all synced transactions from local storage?')) {
      await clearSyncedTransactions();
      await loadPendingTransactions();
    }
  };

  if (loading) {
    return (
      <div className="glass-strong p-8 rounded-2xl text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00FFFF]" />
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Import Transactions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sync your local transactions to the database
            </p>
          </div>
          <Button
            onClick={loadPendingTransactions}
            variant="outline"
            size="sm"
            className="glass border-[rgba(255,255,255,0.2)]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-[#00FFFF] mt-1">{pendingCount}</p>
          </div>
          {progress && (
            <>
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Imported</p>
                <p className="text-3xl font-bold text-[#6BCB77] mt-1">
                  {progress.inserted + progress.updated}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-3xl font-bold text-[#FF6B9D] mt-1">
                  {progress.errors.length}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex gap-3">
          <Button
            onClick={startImport}
            disabled={importing || pendingCount === 0}
            className="flex-1 bg-[#00FFFF] text-[#0B0C10] hover:brightness-110 disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {pendingCount} Transaction{pendingCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
          <Button
            onClick={handleClearSynced}
            variant="outline"
            className="glass border-[rgba(255,255,255,0.2)]"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Synced
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Import Failed</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
                <Button
                  onClick={reset}
                  size="sm"
                  variant="outline"
                  className="mt-3 border-red-500/30 text-red-400"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {progress && progress.processed === progress.total && !error && (
          <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400">Import Complete!</p>
                <div className="text-sm text-green-300 mt-2 space-y-1">
                  <p>✓ Inserted: {progress.inserted}</p>
                  <p>✓ Updated: {progress.updated}</p>
                  {progress.skipped > 0 && <p>⊘ Skipped: {progress.skipped}</p>}
                  {progress.errors.length > 0 && (
                    <p className="text-red-300">✗ Errors: {progress.errors.length}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {progress && progress.errors.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm font-medium text-yellow-400 mb-2">Errors:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {progress.errors.map((err, idx) => (
                <p key={idx} className="text-xs text-yellow-300">
                  {err.clientId ? `[${err.clientId}] ` : ''}
                  {err.error}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending Transactions List */}
      {pendingCount > 0 && (
        <div className="glass-strong p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Pending Transactions ({pendingCount})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingTransactions.slice(0, 20).map((tx) => (
              <div
                key={tx.id}
                className="glass rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.category}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(tx.createdAt).toLocaleDateString()} • {tx.note || 'No note'}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.amountMinor < 0 ? 'text-[#FF6B9D]' : 'text-[#00FFFF]'
                    }`}
                  >
                    {tx.amountMinor < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(tx.amountMinor) / 100, tx.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tx.clientId}</p>
                </div>
              </div>
            ))}
            {pendingCount > 20 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                ... and {pendingCount - 20} more
              </p>
            )}
          </div>
        </div>
      )}

      {pendingCount === 0 && !importing && (
        <div className="glass-strong p-8 rounded-2xl text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[#6BCB77]" />
          <p className="text-foreground font-medium">All transactions synced!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No pending transactions to import
          </p>
        </div>
      )}
    </div>
  );
}
