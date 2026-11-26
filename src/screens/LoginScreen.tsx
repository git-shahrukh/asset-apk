import { ComponentRef, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/authStore';
import { AnimatedPressable, Button, FormItem, Input, Surface, revealFocusedInput } from '../components/ui';
import { componentTokens, elevation, shape, spacing, typography, useTheme } from '../theme';

type Errors = { username?: string; password?: string; form?: string };

export function LoginScreen() {
  const { theme, isDark, toggleColorScheme } = useTheme();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          ref={scrollRef}
          onLayout={() => revealFocusedInput(scrollRef.current)}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modeToggleRow}>
            <AnimatedPressable
              onPress={toggleColorScheme}
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={styles.modeToggle}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={componentTokens.iconSize.medium} color={theme.colors.primary} />
            </AnimatedPressable>
          </View>
          <View style={styles.header}>
            <View style={[styles.logoFrame, { backgroundColor: theme.colors.primaryContainer }]}>
              <Image
                source={require('../../assets/app-logo-transparent.png')}
                style={[styles.logo, isDark && { tintColor: theme.colors.onPrimaryContainer }]}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>Asset Management</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Sign in to track and manage your assets</Text>
          </View>

          <Surface style={styles.card}>
            {errors.form ? (
              <View style={[styles.banner, { backgroundColor: theme.colors.errorContainer }]}>
                <Ionicons name="alert-circle-outline" size={componentTokens.iconSize.medium} color={theme.colors.error} />
                <Text style={[styles.bannerText, { color: theme.colors.onErrorContainer }]}>{errors.form}</Text>
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
                  <AnimatedPressable onPress={() => setShowPassword((v) => !v)} style={styles.toggleButton} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={componentTokens.iconSize.medium} color={theme.colors.primary} />
                  </AnimatedPressable>
                }
              />
            </FormItem>

            <Button title="Sign in" onPress={handleLogin} loading={loading} icon="arrow-forward" />
          </Surface>

          <Text style={[styles.footer, { color: theme.colors.textSecondary }]}>Need access? Contact your administrator.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  modeToggleRow: { width: '100%', alignItems: 'flex-end', marginBottom: spacing.sm },
  modeToggle: { minWidth: componentTokens.touchTarget.minimum, minHeight: componentTokens.touchTarget.minimum, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoFrame: { width: componentTokens.brand.frameSize, height: componentTokens.brand.frameSize, borderRadius: shape.extraLarge, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: componentTokens.brand.logoSize, height: componentTokens.brand.logoSize, borderRadius: shape.large },
  appName: { ...typography.headline, textAlign: 'center' },
  subtitle: { ...typography.bodySmall, marginTop: spacing.sm, textAlign: 'center' },
  card: { padding: spacing.xl, ...elevation.medium },
  banner: { borderRadius: shape.medium, padding: spacing.md, marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerText: { ...typography.bodySmall, flex: 1 },
  toggleButton: { padding: spacing.xs },
  footer: { textAlign: 'center', marginTop: spacing.xl, ...typography.bodySmall },
});
