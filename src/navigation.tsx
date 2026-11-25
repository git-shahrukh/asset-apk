import { useEffect } from 'react';
import { Text } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './auth/authStore';
import { AnimatedPressable, Loader } from './components/ui';
import { BlocksScreen } from './screens/BlocksScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RecordFormScreen } from './screens/RecordFormScreen';
import  OcrTestScreen  from './utils/OcrTestScreen';
import { spacing, typography, useTheme } from './theme';

export type RootStackParamList = {
  Login: undefined;
  Blocks: undefined;
  RecordForm: { blockId: string; blockName: string };
  OcrTest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  const { theme } = useTheme();
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
      dark: false,
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
                  <AnimatedPressable onPress={logout} accessibilityLabel="Log out" style={{ padding: spacing.sm }}>
                    <Text style={{ color: theme.colors.primary, ...typography.label }}>Log out</Text>
                  </AnimatedPressable>
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
