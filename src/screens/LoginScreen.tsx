import { ComponentRef, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/authStore';
import { Button, FormItem, Input, colors, revealFocusedInput } from '../components/ui';

type Errors = { username?: string; password?: string; form?: string };

export function LoginScreen() {
  const login = useAuth((s) => s.login);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    // 1. Check the inputs before calling the API.
    const found: Errors = {
      username: username.trim() ? undefined : 'Enter your username',
      password: password ? undefined : 'Enter your password',
    };
    setErrors(found);
    if (found.username || found.password) return;

    // 2. Call the API. On success the navigator switches to Home by itself.
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Login failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          ref={scrollRef}
          onLayout={() => revealFocusedInput(scrollRef.current)}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.appName}>Asset Management</Text>
            <Text style={styles.subtitle}>Sign in to track and manage your assets</Text>
          </View>

          <View style={styles.card}>
            {errors.form ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>{errors.form}</Text>
              </View>
            ) : null}

            <FormItem label="Username" error={errors.username}>
              <Input
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setErrors({});
                }}
                placeholder="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading}
                hasError={!!errors.username}
              />
            </FormItem>

            <FormItem label="Password" error={errors.password}>
              <Input
                ref={passwordRef}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({});
                }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                editable={!loading}
                hasError={!!errors.password}
                right={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                    <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </Pressable>
                }
              />
            </FormItem>

            <Button title="Sign in" onPress={handleLogin} loading={loading} />
          </View>

          <Text style={styles.footer}>Need access? Contact your administrator.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 88, height: 88, borderRadius: 20, marginBottom: 16 },
  appName: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  banner: { backgroundColor: colors.dangerBg, borderRadius: 8, padding: 12, marginBottom: 16 },
  bannerText: { color: colors.danger, fontSize: 14 },
  toggle: { color: colors.primary, fontWeight: '600', paddingLeft: 8 },
  footer: { textAlign: 'center', color: colors.muted, marginTop: 24, fontSize: 13 },
});
