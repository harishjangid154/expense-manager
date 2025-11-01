'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Asset, Transaction, UserSettings } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { TrendingUp, Calendar, PieChart, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AssetDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  transactions: Transaction[];
  settings: UserSettings;
}

const assetIcons: Record<string, string> = {
  sip: '📊',
  stocks: '📈',
  crypto: '₿',
  gold: '🪙',
  property: '🏠',
  other: '💎',
};

export function AssetDetailModal({ 
  open, 
  onOpenChange, 
  asset, 
  transactions, 
  settings 
}: AssetDetailModalProps) {
  const assetTransactions = useMemo(() => {
    if (!asset) return [];
    return transactions
      .filter(t => t.assetId === asset.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [asset, transactions]);

  const metrics = useMemo(() => {
    if (!asset) return null;

    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date();
    const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate investments (expenses) and returns (earnings) from this asset
    const totalInvested = assetTransactions
      .filter(t => t.type === 'expense' && t.assetId === asset.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalReturns = assetTransactions
      .filter(t => t.type === 'earning' && t.assetId === asset.id)
      .reduce((sum, t) => sum + t.amount, 0);

    // If we have transactions, use them. Otherwise, estimate from current value
    const estimatedInitialValue = totalInvested > 0 ? totalInvested : asset.value * 0.8; // Estimate
    const currentValue = asset.value;
    const profit = currentValue - estimatedInitialValue;
    const roi = estimatedInitialValue > 0 ? ((profit / estimatedInitialValue) * 100) : 0;

    return {
      currentValue: asset.value,
      estimatedInitialValue,
      totalInvested,
      totalReturns,
      profit,
      roi,
      daysSincePurchase,
      transactionCount: assetTransactions.length,
      purchaseDate: asset.purchaseDate
    };
  }, [asset, assetTransactions]);

  const monthlyValueTrend = useMemo(() => {
    if (!asset) return [];
    
    const trendMap: Record<string, { value: number; invested: number; returns: number }> = {};
    
    // Group transactions by month
    assetTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!trendMap[monthKey]) {
        trendMap[monthKey] = { value: 0, invested: 0, returns: 0 };
      }
      
      if (tx.type === 'expense') {
        trendMap[monthKey].invested += tx.amount;
      } else {
        trendMap[monthKey].returns += tx.amount;
      }
    });

    // Calculate cumulative values
    let runningValue = metrics?.estimatedInitialValue || asset.value * 0.8;
    const purchaseDate = new Date(asset.purchaseDate);
    const purchaseMonthKey = purchaseDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    return Object.entries(trendMap)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([month, data]) => {
        runningValue += data.returns - data.invested;
        return {
          month,
          value: Math.max(runningValue, 0),
          invested: data.invested,
          returns: data.returns
        };
      })
      .concat([{
        month: 'Current',
        value: asset.value,
        invested: 0,
        returns: 0
      }])
      .slice(-6); // Last 6 months
  }, [asset, assetTransactions, metrics]);

  if (!asset) return null;

  const purchaseDate = new Date(asset.purchaseDate);
  const daysSincePurchase = metrics?.daysSincePurchase || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-strong border-[rgba(255,255,255,0.2)]">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl glass border border-[rgba(255,255,255,0.1)]">
              <span className="text-3xl">{assetIcons[asset.type] || assetIcons.other}</span>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl text-foreground">{asset.name}</DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-muted-foreground capitalize">{asset.type}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{asset.category}</span>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {purchaseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold text-[#A259FF]">
                {formatCurrency(asset.value, settings.defaultCurrency)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <p className="text-xs text-muted-foreground">Profit</p>
              </div>
              <p 
                className={`text-lg font-bold ${metrics.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {formatCurrency(metrics.profit, settings.defaultCurrency)}
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <p className="text-xs text-muted-foreground">ROI</p>
              </div>
              <p 
                className={`text-lg font-bold ${metrics.roi >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}
              >
                {metrics.roi.toFixed(1)}%
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-purple-400" />
                <p className="text-xs text-muted-foreground">Total Invested</p>
              </div>
              <p className="text-lg font-bold text-purple-400">
                {formatCurrency(metrics.totalInvested || metrics.estimatedInitialValue, settings.defaultCurrency)}
              </p>
            </div>

            <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <p className="text-xs text-muted-foreground">Days Held</p>
              </div>
              <p className="text-lg font-bold text-yellow-400">
                {daysSincePurchase}
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="glass border-[rgba(255,255,255,0.15)] rounded-xl mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg">Performance</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Value Trend */}
            {monthlyValueTrend.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Value Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyValueTrend}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A259FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#A259FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      formatter={(value) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#A259FF" 
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name="Value"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Asset Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Asset Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm text-foreground capitalize">{asset.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="text-sm text-foreground">{asset.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Purchase Date</span>
                    <span className="text-sm text-foreground">
                      {purchaseDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Holding Period</span>
                    <span className="text-sm text-foreground">
                      {Math.floor(daysSincePurchase / 30)} months ({daysSincePurchase} days)
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Performance Summary</h3>
                <div className="space-y-3">
                  {metrics && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Initial Value</span>
                        <span className="text-sm text-foreground">
                          {formatCurrency(metrics.estimatedInitialValue, settings.defaultCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Value</span>
                        <span className="text-sm font-bold text-[#A259FF]">
                          {formatCurrency(metrics.currentValue, settings.defaultCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Return on Investment</span>
                        <span className={`text-sm font-bold ${metrics.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Absolute Profit</span>
                        <span className={`text-sm font-bold ${metrics.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {metrics.profit >= 0 ? '+' : ''}
                          {formatCurrency(metrics.profit, settings.defaultCurrency)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {monthlyValueTrend.length > 1 ? (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Chart</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyValueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      formatter={(value) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value, settings.defaultCurrency)}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#A259FF" 
                      strokeWidth={3}
                      dot={{ fill: '#A259FF', r: 5 }}
                      name="Asset Value"
                    />
                    {metrics && metrics.totalInvested > 0 && (
                      <Line 
                        type="monotone" 
                        dataKey="invested" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#ef4444', r: 3 }}
                        name="Invested"
                      />
                    )}
                    {metrics && metrics.totalReturns > 0 && (
                      <Line 
                        type="monotone" 
                        dataKey="returns" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#10b981', r: 3 }}
                        name="Returns"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Not enough data to show performance trend</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {assetTransactions.length > 0 ? (
              <div className="space-y-2">
                {assetTransactions.map((tx) => {
                  const date = new Date(tx.date);
                  return (
                    <div
                      key={tx.id}
                      className="glass rounded-xl p-4 flex items-center justify-between hover:glass-strong transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            tx.type === 'earning' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {tx.type === 'earning' ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.comment}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground capitalize">{tx.category}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p 
                        className={`text-sm font-bold ${
                          tx.type === 'earning' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {tx.type === 'earning' ? '+' : '-'}
                        {formatCurrency(tx.amount, settings.defaultCurrency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No transaction history for this asset</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Transactions linked to this asset will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

