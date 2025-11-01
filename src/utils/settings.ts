import { useState, useEffect } from 'react';
import { UserSettings } from '@/types';

const defaultSettings: UserSettings = {
  defaultCurrency: 'INR',
  exchangeRates: {},
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
  };

  return { settings, updateSettings };
}