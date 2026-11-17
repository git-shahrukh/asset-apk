import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './auth/authStore';
import { Loader, colors } from './components/ui';
import { BlocksScreen } from './screens/BlocksScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RecordFormScreen } from './screens/RecordFormScreen';
import  OcrTestScreen  from './utils/OcrTestScreen';

export type RootStackParamList = {
  Login: undefined;
  Blocks: undefined;
  RecordForm: { blockId: string; blockName: string };
  OcrTest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  const status = useAuth((s) => s.status);
  const restore = useAuth((s) => s.restore);
  const logout = useAuth((s) => s.logout);

  useEffect(() => {
    restore();
  }, [restore]);

  if (status === 'loading') return <Loader />;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {status === 'signedIn' ? (
          <>
            <Stack.Screen
              name="Blocks"
              component={BlocksScreen}
              options={{
                title: 'Asset Management',
                headerRight: () => (
                  <Pressable onPress={logout} hitSlop={10}>
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Logout</Text>
                  </Pressable>
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
