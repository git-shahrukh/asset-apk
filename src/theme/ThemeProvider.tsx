import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { storage } from '../api/client';
import { AppTheme, darkTheme, lightTheme } from './theme';

export type ColorScheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'appearanceMode';

interface ThemeContextValue {
  theme: AppTheme;
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  reduceMotion: boolean;
  duration: (milliseconds: number) => number;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    storage.get(THEME_STORAGE_KEY).then((saved) => {
      if (mounted && (saved === 'light' || saved === 'dark')) setColorSchemeState(saved);
    }).catch(() => {
      // Theme persistence is optional; keep the default light scheme if storage is unavailable.
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    void storage.set(THEME_STORAGE_KEY, scheme).catch(() => {
      // The in-memory theme still works when persistent storage is unavailable.
    });
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme, setColorScheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: colorScheme === 'dark' ? darkTheme : lightTheme,
    colorScheme,
    isDark: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
    reduceMotion,
    duration: (milliseconds) => reduceMotion ? 0 : milliseconds,
  }), [colorScheme, reduceMotion, setColorScheme, toggleColorScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
