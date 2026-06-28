import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  accentColor: string;
  accentGlow: string;
  animationsEnabled: boolean;
  compactMode: boolean;
  showGameNames: boolean;
  gamesPerRow: number;
}

const defaultSettings: Settings = {
  accentColor: '#3b82f6',
  accentGlow: 'rgba(59, 130, 246, 0.3)',
  animationsEnabled: true,
  compactMode: false,
  showGameNames: true,
  gamesPerRow: 5,
};

const accentColors: Record<string, { color: string; glow: string; name: string }> = {
  blue: { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)', name: 'Ocean Blue' },
  green: { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)', name: 'Forest Green' },
  red: { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)', name: 'Crimson Red' },
  orange: { color: '#f97316', glow: 'rgba(249, 115, 22, 0.3)', name: 'Sunset Orange' },
  cyan: { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.3)', name: 'Arctic Cyan' },
  pink: { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.3)', name: 'Rose Pink' },
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  accentColors: typeof accentColors;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('forge-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('forge-settings', JSON.stringify(settings));

    document.documentElement.style.setProperty('--accent-primary', settings.accentColor);
    document.documentElement.style.setProperty('--accent-secondary', settings.accentColor);
    document.documentElement.style.setProperty('--accent-glow', settings.accentGlow);
    document.documentElement.style.setProperty('--border-glow', settings.accentGlow);
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, accentColors }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
