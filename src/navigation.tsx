import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './auth/authStore';
import { AnimatedPressable, Loader } from './components/ui';
import { BlocksScreen } from './screens/BlocksScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RecordFormScreen } from './screens/RecordFormScreen';
import  OcrTestScreen  from './utils/OcrTestScreen';
import { componentTokens, spacing, typography, useTheme } from './theme';

export type RootStackParamList = {
  Login: undefined;
  Blocks: undefined;
  RecordForm: { blockId: string; blockName: string };
  OcrTest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  const { theme, isDark, toggleColorScheme } = useTheme();
  const status = useAuth((s) => s.status);
  const restore = useAuth((s) => s.restore);
  const logout = useAuth((s) => s.logout);

  useEffect(() => {
    restore();
  }, [restore]);

  if (status === 'loading') return <Loader />;

  return (
    <NavigationContainer theme={{
      ...DefaultTheme,
      dark: isDark,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.outline,
        notification: theme.colors.error,
      },
    }}>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: { ...typography.title },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
        {status === 'signedIn' ? (
          <>
            <Stack.Screen
              name="Blocks"
              component={BlocksScreen}
              options={{
                title: 'Asset Management',
                headerRight: () => (
                  <View style={styles.headerActions}>
                    <AnimatedPressable
                      onPress={toggleColorScheme}
                      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                      style={styles.iconButton}
                    >
                      <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.colors.primary} />
                    </AnimatedPressable>
                    <AnimatedPressable onPress={logout} accessibilityLabel="Log out" style={styles.iconButton}>
                      <Ionicons name="log-out-outline" size={20} color={theme.colors.primary} />
                    </AnimatedPressable>
                  </View>
                ),
              }}
            />
            <Stack.Screen
              name="RecordForm"
              component={RecordFormScreen}
              options={({ route }) => ({ title: `New ${route.params.blockName}` })}
            />
            <Stack.Screen name="OcrTest" component={OcrTestScreen} options={{ title: 'OCR Test' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    minWidth: componentTokens.touchTarget.minimum,
    minHeight: componentTokens.touchTarget.minimum,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
