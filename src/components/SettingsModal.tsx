import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Settings, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { UserSettings } from '../types';
import { SUPPORTED_CURRENCIES, fetchExchangeRates } from '../utils/currency';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export function SettingsModal({ open, onOpenChange, settings, onUpdateSettings }: SettingsModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(settings.defaultCurrency);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | undefined>(settings.lastRateUpdate);

  useEffect(() => {
    setSelectedCurrency(settings.defaultCurrency);
    setLastUpdate(settings.lastRateUpdate);
  }, [settings]);

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    try {
      const rates = await fetchExchangeRates(selectedCurrency);
      const now = new Date();
      
      onUpdateSettings({
        ...settings,
        exchangeRates: rates,
        lastRateUpdate: now,
      });
      
      setLastUpdate(now);
      toast.success('Exchange rates updated successfully');
    } catch (error) {
      toast.error('Failed to update exchange rates');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleSave = async () => {
    if (selectedCurrency !== settings.defaultCurrency) {
      // Currency changed, fetch new rates
      setIsUpdatingRates(true);
      try {
        const rates = await fetchExchangeRates(selectedCurrency);
        const now = new Date();
        
        onUpdateSettings({
          defaultCurrency: selectedCurrency,
          exchangeRates: rates,
          lastRateUpdate: now,
        });
        
        setLastUpdate(now);
        toast.success('Default currency updated');
      } catch (error) {
        toast.error('Failed to update currency');
      } finally {
        setIsUpdatingRates(false);
      }
    }
    onOpenChange(false);
  };

  const formatLastUpdate = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-3xl max-w-lg backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#00FFFF]" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your expense manager preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Default Currency */}
          <div className="space-y-3">
            <Label htmlFor="currency" className="text-foreground">Default Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger 
                id="currency"
                className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-12"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl max-h-[300px]">
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-muted-foreground">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All transactions will be converted to this currency for calculations and display
            </p>
          </div>

          {/* Exchange Rates */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-foreground">Exchange Rates</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {formatLastUpdate(lastUpdate)}
                </p>
              </div>
              <Button
                onClick={handleUpdateRates}
                disabled={isUpdatingRates}
                size="sm"
                className="glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-lg h-9"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingRates ? 'animate-spin' : ''}`} />
                Update
              </Button>
            </div>

            <Alert className="glass border-[rgba(255,255,255,0.15)]">
              <Info className="w-4 h-4 text-[#00FFFF]" />
              <AlertDescription className="text-xs text-muted-foreground">
                Exchange rates are fetched from live APIs. Rates are automatically updated when you change the default currency.
              </AlertDescription>
            </Alert>
          </div>

          {/* Current Rates Preview */}
          <div className="glass rounded-xl p-4 space-y-2">
            <h4 className="text-sm text-foreground mb-2">Current Rates (1 {selectedCurrency} =)</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
              {SUPPORTED_CURRENCIES
                .filter(c => c.code !== selectedCurrency)
                .slice(0, 6)
                .map((currency) => {
                  const rate = settings.exchangeRates[currency.code];
                  return (
                    <div key={currency.code} className="glass-strong rounded-lg p-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{currency.code}</span>
                      <span className="text-xs text-foreground">
                        {rate ? rate.toFixed(4) : 'N/A'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdatingRates}
              className="flex-1 bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] neon-glow-blue rounded-xl h-11"
            >
              {isUpdatingRates ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
