import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from './api/client';
import { Navigation } from './navigation';
import { lightTheme, ThemeProvider } from './theme';

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Navigation />
          <StatusBar style={lightTheme.components.system.statusBar} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
