'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BrokerAccount, BankAccount, UserSettings, Asset } from '@/types';
import { Plus, TrendingUp, DollarSign, ArrowRightLeft, ShoppingCart, X } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BrokerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokerAccounts: BrokerAccount[];
  bankAccounts: BankAccount[];
  assets: Asset[];
  settings: UserSettings;
  onAddBroker: (broker: Omit<BrokerAccount, 'id' | 'createdAt'>) => void;
  onTransferToBroker: (brokerId: string, amount: number, fromAccountId: string) => void;
  onBuyStock: (data: {
    brokerId: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
  }) => void;
}

const BROKER_COLORS = ['#00FFFF', '#A259FF', '#FF6B9D', '#6BCB77', '#FFD93D'];

export function BrokerModal({
  open,
  onOpenChange,
  brokerAccounts,
  bankAccounts,
  assets,
  settings,
  onAddBroker,
  onTransferToBroker,
  onBuyStock,
}: BrokerModalProps) {
  const [view, setView] = useState<'list' | 'add' | 'transfer' | 'buy'>('list');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  
  const [addForm, setAddForm] = useState({
    name: '',
    balance: '',
    color: BROKER_COLORS[0],
  });

  const [transferForm, setTransferForm] = useState({
    amount: '',
    fromAccountId: bankAccounts[0]?.id || '',
  });

  const [buyForm, setBuyForm] = useState({
    name: '',
    quantity: '',
    pricePerUnit: '',
  });

  const resetForms = () => {
    setAddForm({ name: '', balance: '', color: BROKER_COLORS[0] });
    setTransferForm({ amount: '', fromAccountId: bankAccounts[0]?.id || '' });
    setBuyForm({ name: '', quantity: '', pricePerUnit: '' });
    setView('list');
    setSelectedBrokerId('');
  };

  const handleAddBroker = () => {
    if (!addForm.name) {
      toast.error('Please enter broker name');
      return;
    }

    const balance = parseFloat(addForm.balance) || 0;
    if (balance < 0) {
      toast.error('Balance cannot be negative');
      return;
    }

    onAddBroker({
      name: addForm.name,
      balance,
      type: 'broker',
      color: addForm.color,
    });

    toast.success('Broker account added!');
    resetForms();
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const fromAccount = bankAccounts.find(a => a.id === transferForm.fromAccountId);
    if (!fromAccount) {
      toast.error('Please select a bank account');
      return;
    }

    if (fromAccount.balance < amount) {
      toast.error('Insufficient balance in bank account');
      return;
    }

    onTransferToBroker(selectedBrokerId, amount, transferForm.fromAccountId);
    toast.success(`${formatCurrency(amount, settings.defaultCurrency)} transferred to broker`);
    resetForms();
  };

  const handleBuyStock = () => {
    if (!buyForm.name || !buyForm.quantity || !buyForm.pricePerUnit) {
      toast.error('Please fill all fields');
      return;
    }

    const quantity = parseFloat(buyForm.quantity);
    const pricePerUnit = parseFloat(buyForm.pricePerUnit);

    if (isNaN(quantity) || quantity <= 0 || isNaN(pricePerUnit) || pricePerUnit <= 0) {
      toast.error('Please enter valid values');
      return;
    }

    const totalAmount = quantity * pricePerUnit;
    const broker = brokerAccounts.find(b => b.id === selectedBrokerId);

    if (!broker) {
      toast.error('Broker not found');
      return;
    }

    if (broker.balance < totalAmount) {
      toast.error('Insufficient balance in broker account');
      return;
    }

    onBuyStock({
      brokerId: selectedBrokerId,
      name: buyForm.name,
      quantity,
      pricePerUnit,
      totalAmount,
    });

    toast.success(`Purchased ${quantity} units of ${buyForm.name}`);
    resetForms();
  };

  const totalBrokerBalance = brokerAccounts.reduce((sum, b) => sum + b.balance, 0);
  const stocksLinkedToBrokers = assets.filter(a => a.brokerId);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForms();
    }}>
      <DialogContent className="glass-strong border-[rgba(255,255,255,0.2)] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFFF] to-[#A259FF] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            Broker Accounts
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Manage broker accounts and buy stocks
          </p>
        </DialogHeader>

        {/* Summary */}
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Broker Balance</p>
            <p className="text-2xl text-[#00FFFF] font-semibold mt-1">
              {formatCurrency(totalBrokerBalance, settings.defaultCurrency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Stocks Purchased</p>
            <p className="text-2xl text-foreground font-semibold mt-1">
              {stocksLinkedToBrokers.length}
            </p>
          </div>
        </div>

        {/* Views */}
        {view === 'list' && (
          <>
            <Button
              onClick={() => setView('add')}
              className="w-full glass border-[rgba(255,255,255,0.2)] hover:glass-strong"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Broker Account
            </Button>

            <div className="space-y-3">
              {brokerAccounts.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No broker accounts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a broker account to start investing
                  </p>
                </div>
              ) : (
                brokerAccounts.map((broker) => {
                  const linkedStocks = assets.filter(a => a.brokerId === broker.id);
                  const totalInvested = linkedStocks.reduce((sum, a) => sum + a.value, 0);

                  return (
                    <div
                      key={broker.id}
                      className="glass-strong rounded-xl p-4"
                      style={{ borderLeft: `4px solid ${broker.color}` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-foreground font-semibold">{broker.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Available: {formatCurrency(broker.balance, settings.defaultCurrency)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBrokerId(broker.id);
                              setView('transfer');
                            }}
                            className="glass border-[rgba(255,255,255,0.2)] hover:glass-strong"
                            variant="outline"
                          >
                            <ArrowRightLeft className="w-4 h-4 mr-1" />
                            Transfer
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBrokerId(broker.id);
                              setView('buy');
                            }}
                            className="bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Buy Stock
                          </Button>
                        </div>
                      </div>

                      {linkedStocks.length > 0 && (
                        <div className="glass rounded-lg p-3 space-y-2">
                          <p className="text-xs text-muted-foreground font-semibold">Stocks ({linkedStocks.length})</p>
                          {linkedStocks.map((stock) => (
                            <div key={stock.id} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{stock.name}</span>
                              <div className="text-right">
                                <p className="text-foreground">{stock.quantity} units</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(stock.value, settings.defaultCurrency)}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-[rgba(255,255,255,0.1)] flex justify-between">
                            <span className="text-xs text-muted-foreground">Total Invested:</span>
                            <span className="text-sm text-[#A259FF] font-semibold">
                              {formatCurrency(totalInvested, settings.defaultCurrency)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {view === 'add' && (
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-foreground font-semibold">Add Broker Account</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForms}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brokerName">Broker Name *</Label>
              <Input
                id="brokerName"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g., Zerodha, Groww"
                className="glass border-[rgba(255,255,255,0.15)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialBalance">Initial Balance (Optional)</Label>
              <Input
                id="initialBalance"
                type="number"
                value={addForm.balance}
                onChange={(e) => setAddForm({ ...addForm, balance: e.target.value })}
                placeholder="0.00"
                className="glass border-[rgba(255,255,255,0.15)]"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {BROKER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAddForm({ ...addForm, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      addForm.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B0C10]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddBroker}
                className="flex-1 bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
              >
                Add Broker
              </Button>
              <Button
                onClick={resetForms}
                variant="outline"
                className="glass border-[rgba(255,255,255,0.2)]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {view === 'transfer' && (
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-foreground font-semibold">Transfer to Broker</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForms}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="glass-strong rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Transferring to:</p>
              <p className="text-lg text-foreground font-semibold">
                {brokerAccounts.find(b => b.id === selectedBrokerId)?.name}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromAccount">From Bank Account *</Label>
              <Select value={transferForm.fromAccountId} onValueChange={(value) => setTransferForm({ ...transferForm, fromAccountId: value })}>
                <SelectTrigger className="glass border-[rgba(255,255,255,0.15)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)]">
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance, settings.defaultCurrency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferAmount">Amount ({settings.defaultCurrency}) *</Label>
              <Input
                id="transferAmount"
                type="number"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                placeholder="0.00"
                className="glass border-[rgba(255,255,255,0.15)]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleTransfer}
                className="flex-1 bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
              >
                Transfer Money
              </Button>
              <Button
                onClick={resetForms}
                variant="outline"
                className="glass border-[rgba(255,255,255,0.2)]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {view === 'buy' && (
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-foreground font-semibold">Buy Stock</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForms}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="glass-strong rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Buying from:</p>
              <p className="text-lg text-foreground font-semibold">
                {brokerAccounts.find(b => b.id === selectedBrokerId)?.name}
              </p>
              <p className="text-sm text-[#00FFFF] mt-1">
                Available: {formatCurrency(brokerAccounts.find(b => b.id === selectedBrokerId)?.balance || 0, settings.defaultCurrency)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockName">Stock Name *</Label>
              <Input
                id="stockName"
                value={buyForm.name}
                onChange={(e) => setBuyForm({ ...buyForm, name: e.target.value })}
                placeholder="e.g., RELIANCE, TCS"
                className="glass border-[rgba(255,255,255,0.15)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={buyForm.quantity}
                  onChange={(e) => setBuyForm({ ...buyForm, quantity: e.target.value })}
                  placeholder="0"
                  className="glass border-[rgba(255,255,255,0.15)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerUnit">Price per Unit *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  value={buyForm.pricePerUnit}
                  onChange={(e) => setBuyForm({ ...buyForm, pricePerUnit: e.target.value })}
                  placeholder="0.00"
                  className="glass border-[rgba(255,255,255,0.15)]"
                />
              </div>
            </div>

            {buyForm.quantity && buyForm.pricePerUnit && (
              <div className="glass-strong rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="text-xl text-[#A259FF] font-semibold">
                    {formatCurrency(parseFloat(buyForm.quantity) * parseFloat(buyForm.pricePerUnit), settings.defaultCurrency)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleBuyStock}
                className="flex-1 bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
              >
                Buy Stock
              </Button>
              <Button
                onClick={resetForms}
                variant="outline"
                className="glass border-[rgba(255,255,255,0.2)]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
