import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BankAccount, UserSettings } from '../types';
import { formatCurrency } from '../utils/currency';
import { Building2, Wallet, TrendingUp, CreditCard, Trash2, Plus } from 'lucide-react';

interface AccountsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: BankAccount[];
  onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
        onDeleteAccount: (id: string) => void;
      settings: UserSettings;
}

const accountTypes = [
  { value: 'savings', label: 'Savings Account', icon: Building2 },
  { value: 'current', label: 'Current Account', icon: Building2 },
  { value: 'investment', label: 'Investment Account', icon: TrendingUp },
  { value: 'wallet', label: 'Digital Wallet', icon: Wallet },
];

const accountColors = [
  { value: '#00FFFF', label: 'Cyan' },
  { value: '#A259FF', label: 'Purple' },
  { value: '#FF6B9D', label: 'Pink' },
  { value: '#FFD93D', label: 'Yellow' },
  { value: '#6BCB77', label: 'Green' },
  { value: '#FF6B6B', label: 'Red' },
];

export function AccountsModal({ open, onOpenChange, accounts, onAddAccount, onDeleteAccount, settings }: AccountsModalProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'savings' | 'current' | 'investment' | 'wallet'>('savings');
  const [color, setColor] = useState('#00FFFF');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    onAddAccount({
      name,
      balance: parseFloat(balance),
      type,
      color,
    });

    // Reset form
    setName('');
    setBalance('');
    setType('savings');
    setColor('#00FFFF');
    setShowForm(false);
  };

  const getAccountIcon = (accountType: string) => {
    const typeObj = accountTypes.find(t => t.value === accountType);
    return typeObj ? typeObj.icon : Building2;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-3xl max-w-2xl backdrop-blur-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Manage Bank Accounts</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Existing Accounts */}
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No accounts yet. Add your first account!</p>
              </div>
            ) : (
              accounts.map((account) => {
                const Icon = getAccountIcon(account.type);
                return (
                  <div
                    key={account.id}
                    className="glass rounded-xl p-4 flex items-center justify-between hover:glass-strong transition-all"
                    style={{ borderLeft: `3px solid ${account.color}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg glass-strong"
                        style={{ color: account.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-foreground">{account.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-foreground">{formatCurrency(account.balance, settings.defaultCurrency)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteAccount(account.id)}
                        className="hover:bg-red-500/20 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add New Account Button */}
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-xl h-11"
              variant="outline"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Account
            </Button>
          )}

          {/* Add Account Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="glass rounded-xl p-4 space-y-4">
              <h4 className="text-foreground">New Account</h4>
              
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., HDFC Savings"
                  className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue rounded-xl h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-type">Account Type</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
                    {accountTypes.map((t) => {
                      const Icon = t.icon;
                      return (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="account-balance">Current Balance</Label>
                  <Input
                    id="account-balance"
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                    className="glass border-[rgba(255,255,255,0.15)] focus:neon-border-blue rounded-xl h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-color">Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                        <span className="capitalize">{accountColors.find(c => c.value === color)?.label}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
                      {accountColors.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] neon-glow-blue rounded-xl h-11"
                >
                  Add Account
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
