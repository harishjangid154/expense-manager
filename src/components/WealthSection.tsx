import { useState } from 'react';
import { BankAccount, Asset, UserSettings } from '../types';
import { Building2, Wallet, TrendingUp, PieChart, Settings, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatCurrency } from '../utils/currency';

interface WealthSectionProps {
  accounts: BankAccount[];
  assets: Asset[];
  onManageAccounts: () => void;
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

export function WealthSection({ accounts, assets, onManageAccounts, settings }: WealthSectionProps) {
  const [expandedAssetTypes, setExpandedAssetTypes] = useState<string[]>([]);
  
  const totalAccountBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalWealth = totalAccountBalance + totalAssetValue;

  // Group assets by type
  const assetsByType = assets.reduce((acc, asset) => {
    if (!acc[asset.type]) {
      acc[asset.type] = [];
    }
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  const toggleAssetType = (type: string) => {
    setExpandedAssetTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return TrendingUp;
      case 'wallet':
        return Wallet;
      default:
        return Building2;
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6BCB77] to-[#00FFFF] flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl text-foreground">Total Wealth</h3>
            <p className="text-3xl text-[#6BCB77] tracking-tight mt-1">
              {formatCurrency(totalWealth, settings.defaultCurrency)}
            </p>
          </div>
        </div>
        <Button
          onClick={onManageAccounts}
          className="glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-xl h-10"
          variant="outline"
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage Accounts
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Accounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-foreground">Bank Accounts</h4>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalAccountBalance, settings.defaultCurrency)}
            </span>
          </div>
          {accounts.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No accounts yet</p>
              <Button
                onClick={onManageAccounts}
                size="sm"
                className="mt-3 glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-lg"
                variant="outline"
              >
                Add Account
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => {
                const Icon = getAccountIcon(account.type);
                return (
                  <div
                    key={account.id}
                    className="glass-strong rounded-xl p-3 flex items-center justify-between hover:neon-glow-blue transition-all"
                    style={{ borderLeft: `3px solid ${account.color}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg glass" style={{ color: account.color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground">
                      {formatCurrency(account.balance, settings.defaultCurrency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-foreground">Assets</h4>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalAssetValue, settings.defaultCurrency)}
            </span>
          </div>
          {assets.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No assets yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add investments like SIP, stocks, etc.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="grouped" className="w-full">
              <TabsList className="glass border-[rgba(255,255,255,0.15)] rounded-xl mb-3 w-full grid grid-cols-2">
                <TabsTrigger value="grouped" className="rounded-lg">Grouped</TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg">All Assets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="grouped" className="space-y-2 mt-0">
                {Object.entries(assetsByType).map(([type, typeAssets]) => {
                  const isExpanded = expandedAssetTypes.includes(type);
                  const typeTotal = typeAssets.reduce((sum, a) => sum + a.value, 0);
                  
                  return (
                    <div key={type} className="glass-strong rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleAssetType(type)}
                        className="w-full p-3 flex items-center justify-between hover:glass transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{assetIcons[type] || assetIcons.other}</span>
                          <div className="text-left">
                            <p className="text-sm text-foreground capitalize">{type}</p>
                            <p className="text-xs text-muted-foreground">{typeAssets.length} {typeAssets.length === 1 ? 'item' : 'items'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-foreground">
                            {formatCurrency(typeTotal, settings.defaultCurrency)}
                          </p>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-[rgba(255,255,255,0.1)] space-y-0">
                          {typeAssets
                            .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                            .map((asset) => (
                              <div
                                key={asset.id}
                                className="p-3 pl-14 flex items-center justify-between hover:glass transition-all border-t border-[rgba(255,255,255,0.05)]"
                              >
                                <div>
                                  <p className="text-sm text-foreground">{asset.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">{formatDate(asset.purchaseDate)}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-[#A259FF]">
                                  {formatCurrency(asset.value, settings.defaultCurrency)}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsContent>
              
              <TabsContent value="all" className="space-y-2 mt-0">
                {assets
                  .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="glass-strong rounded-xl p-3 flex items-center justify-between hover:neon-glow-purple transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{assetIcons[asset.type] || assetIcons.other}</span>
                        <div>
                          <p className="text-sm text-foreground">{asset.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                            <span className="text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">{formatDate(asset.purchaseDate)}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-foreground">
                        {formatCurrency(asset.value, settings.defaultCurrency)}
                      </p>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
