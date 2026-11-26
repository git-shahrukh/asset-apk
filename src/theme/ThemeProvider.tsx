import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { lightTheme, AppTheme } from './theme';

interface ThemeContextValue {
  theme: AppTheme;
  reduceMotion: boolean;
  duration: (milliseconds: number) => number;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [reduceMotion, setReduceMotion] = useState(false);

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

  const value = useMemo<ThemeContextValue>(() => ({
    theme: lightTheme,
    reduceMotion,
    duration: (milliseconds) => reduceMotion ? 0 : milliseconds,
  }), [reduceMotion]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
