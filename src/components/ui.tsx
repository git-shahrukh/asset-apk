import { ComponentRef, ReactNode, Ref, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { componentTokens, elevation, motion, shape, spacing, typography, useTheme } from '../theme';

export { colors } from '../theme';

const KEYBOARD_GAP = 80;

export function showPopup(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

export function revealFocusedInput(list: ComponentRef<typeof ScrollView> | FlatList<any> | null, headerHeight = 0) {
  if (Platform.OS === 'web') return;
  const input = TextInput.State.currentlyFocusedInput();
  if (!input) return;
  list?.getScrollResponder()?.scrollResponderScrollNativeHandleToKeyboard(input, headerHeight + KEYBOARD_GAP, true);
}

type AnimatedPressableProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityRole?: 'button' | 'link' | 'checkbox' | 'switch' | 'tab';
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; selected?: boolean; busy?: boolean };
  testID?: string;
};

export function AnimatedPressable({
  children,
  onPress,
  disabled,
  style,
  contentStyle,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  testID,
}: AnimatedPressableProps) {
  const { duration, theme } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(1));
  const useNativeDriver = Platform.OS !== 'web';

  const animate = (toScale: number, toOpacity: number) => {
    Animated.parallel([
      Animated.timing(scale, { toValue: toScale, duration: duration(motion.duration.fast), easing: motion.easing.standard, useNativeDriver }),
      Animated.timing(opacity, { toValue: toOpacity, duration: duration(motion.duration.fast), easing: motion.easing.standard, useNativeDriver }),
    ]).start();
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled }}
      onPressIn={() => !disabled && animate(motion.scale.pressed, motion.opacity.pressed)}
      onPressOut={() => animate(1, 1)}
      style={[style, Platform.OS === 'web' && styles.webPressableReset]}
      android_ripple={{ color: theme.colors.primaryContainer }}
    >
      <Animated.View style={[styles.animatedContent, contentStyle, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'text' | 'danger';

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  hasError,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  hasError?: boolean;
  accessibilityLabel?: string;
}) {
  const { theme } = useTheme();
  const off = disabled || loading;
  const variantStyle = {
    primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
    tonal: { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primaryContainer },
    text: { backgroundColor: 'transparent', borderColor: 'transparent' },
    danger: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  }[variant];
  const textColor = variant === 'primary' || variant === 'danger'
    ? theme.colors.onPrimary
    : variant === 'tonal' ? theme.colors.onPrimaryContainer : theme.colors.primary;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={off}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ busy: loading, disabled: off }}
      style={[styles.button, variantStyle, hasError && { borderColor: theme.colors.error }, off && styles.disabledButton]}
    >
      <View style={styles.buttonContent}>
        {loading ? <ActivityIndicator color={textColor} /> : null}
        {!loading && icon ? <Ionicons name={icon} size={componentTokens.iconSize.medium} color={textColor} /> : null}
        <Text style={[styles.buttonText, { color: textColor }]}>{loading ? 'Please wait…' : title}</Text>
      </View>
    </AnimatedPressable>
  );
}

type InputProps = TextInputProps & {
  hasError?: boolean;
  right?: ReactNode;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function Input({ hasError, right, style, ref, onFocus, onBlur, ...props }: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const disabled = props.editable === false;
  const borderColor = hasError ? theme.colors.error : focused ? theme.colors.outlineFocused : theme.colors.outline;

  return (
    <View style={[styles.inputBox, { borderColor, backgroundColor: disabled ? theme.colors.surfaceVariant : theme.colors.surface }, hasError && styles.inputError, focused && styles.inputFocused, disabled && styles.disabledInput]}>
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.inputText,
          { color: theme.colors.textPrimary },
          Platform.OS === 'web' && styles.webInputReset,
          style,
        ]}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        {...props}
      />
      {right}
    </View>
  );
}

export function Surface({ children, style, outlined = false }: { children: ReactNode; style?: StyleProp<ViewStyle>; outlined?: boolean }) {
  const { theme } = useTheme();
  return <View style={[styles.surface, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }, outlined && styles.outlined, style]}>{children}</View>;
}

export function FormItem({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.formItem}>
      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
        {label}
        {required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
    </View>
  );
}

export function Loader({ message = 'Loading…' }: { message?: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.centerText, { color: theme.colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.stateCard}>
        <View style={[styles.stateIcon, { backgroundColor: theme.colors.errorContainer }]}>
          <Ionicons name="alert-circle-outline" size={componentTokens.iconSize.extraLarge} color={theme.colors.error} />
        </View>
        <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>Something went wrong</Text>
        <Text style={[styles.centerText, { color: theme.colors.textSecondary }]}>{message}</Text>
        {onRetry && <Button title="Try again" onPress={onRetry} icon="refresh-outline" />}
      </Surface>
    </View>
  );
}

export function EmptyView({ message, title = 'Nothing here yet', icon = 'file-tray-outline' }: { message: string; title?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.stateCard}>
        <View style={[styles.stateIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons name={icon} size={componentTokens.iconSize.extraLarge} color={theme.colors.primary} />
        </View>
        <Text style={[styles.stateTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.centerText, { color: theme.colors.textSecondary }]}>{message}</Text>
      </Surface>
    </View>
  );
}

export interface Option { label: string; value: string }

export function PickerButton({ text, placeholder, onPress, onClear, hasError }: {
  text?: string; placeholder: string; onPress: () => void; onClear?: () => void; hasError?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.inputBox, { backgroundColor: theme.colors.surface, borderColor: hasError ? theme.colors.error : theme.colors.outline }]}>
      <AnimatedPressable onPress={onPress} style={styles.pickerAction} contentStyle={styles.pickerContent}>
        <Text style={[styles.pickerText, { color: text ? theme.colors.textPrimary : theme.colors.textSecondary }]} numberOfLines={1}>
          {text || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={componentTokens.iconSize.medium} color={theme.colors.textSecondary} />
      </AnimatedPressable>
      {text && onClear ? (
        <AnimatedPressable onPress={onClear} style={styles.clearButton} accessibilityLabel="Clear selection">
          <Ionicons name="close-circle" size={componentTokens.iconSize.medium} color={theme.colors.textSecondary} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const SEARCH_MIN_OPTIONS = 8;

export function OptionPicker({ value, options, onChange, placeholder = 'Select', loading, hasError, onReveal }: {
  value: string; options: Option[]; onChange: (value: string) => void;
  placeholder?: string; loading?: boolean; hasError?: boolean; onReveal?: () => void;
}) {
  const { theme, duration } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<ComponentRef<typeof View>>(null);
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())), [options, search]);
  const [menuOpacity] = useState(() => new Animated.Value(0));
  const useNativeDriver = Platform.OS !== 'web';

  const close = () => { setOpen(false); setSearch(''); };
  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.timing(menuOpacity, { toValue: next ? 1 : 0, duration: duration(motion.duration.fast), easing: motion.easing.standard, useNativeDriver }).start();
  };
  const revealIfCutOff = () => {
    dropdownRef.current?.measureInWindow((_x, y, _width, height) => {
      if (y + height > Dimensions.get('window').height) onReveal?.();
    });
  };

  return (
    <>
      <AnimatedPressable onPress={toggle} style={[styles.inputBox, styles.picker, { backgroundColor: theme.colors.surface, borderColor: hasError ? theme.colors.error : theme.colors.outline }]} contentStyle={styles.pickerContent} accessibilityState={{ disabled: false, selected: open }}>
        <Text style={[styles.pickerText, { color: selected ? theme.colors.textPrimary : theme.colors.textSecondary }]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={componentTokens.iconSize.medium} color={theme.colors.textSecondary} />}
      </AnimatedPressable>

      {open && (
        <Animated.View ref={dropdownRef} onLayout={revealIfCutOff} style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline, opacity: menuOpacity }]}>
          {options.length >= SEARCH_MIN_OPTIONS && (
            <View style={styles.dropdownSearch}>
              <Input
                placeholder="Search options"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                right={<Ionicons name="search-outline" size={componentTokens.iconSize.medium} color={theme.colors.textSecondary} />}
              />
            </View>
          )}
          <ScrollView style={{ maxHeight: componentTokens.menu.maxHeight }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 && <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>{loading ? 'Loading…' : 'No options found'}</Text>}
            {filtered.map((item) => (
              <AnimatedPressable key={item.value} onPress={() => { onChange(item.value); close(); }} style={[styles.option, { borderBottomColor: theme.colors.outline }]} contentStyle={styles.optionContent}>
                <Text style={[styles.optionText, { color: item.value === value ? theme.colors.primary : theme.colors.textPrimary, fontWeight: item.value === value ? '600' : '400' }]}>
                  {item.label}
                </Text>
                {item.value === value ? <Ionicons name="checkmark" size={componentTokens.iconSize.medium} color={theme.colors.primary} /> : null}
              </AnimatedPressable>
            ))}
          </ScrollView>
          {value ? (
            <AnimatedPressable onPress={() => { onChange(''); close(); }} style={[styles.dropdownClear, { borderTopColor: theme.colors.outline }]} contentStyle={styles.dropdownClearContent}>
              <Ionicons name="close-circle-outline" size={componentTokens.iconSize.medium} color={theme.colors.primary} />
              <Text style={[styles.link, { color: theme.colors.primary }]}>Clear selection</Text>
            </AnimatedPressable>
          ) : null}
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  animatedContent: { width: '100%' },
  button: {
    minHeight: componentTokens.button.height,
    paddingHorizontal: componentTokens.button.horizontalPadding,
    borderRadius: componentTokens.button.radius,
    borderWidth: componentTokens.card.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: componentTokens.button.gap },
  buttonText: { ...typography.body, fontWeight: '600' as TextStyle['fontWeight'] },
  disabledButton: { opacity: motion.opacity.disabled },
  inputBox: {
    minHeight: componentTokens.input.height,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: componentTokens.card.borderWidth,
    borderRadius: componentTokens.input.radius,
    paddingHorizontal: componentTokens.input.horizontalPadding,
  },
  inputFocused: { borderWidth: componentTokens.focusRing.width },
  inputText: { flex: 1, paddingVertical: componentTokens.input.verticalPadding, borderWidth: 0, backgroundColor: 'transparent', ...typography.body },
  webInputReset: { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent', boxShadow: 'none' } as any,
  webPressableReset: { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent', boxShadow: 'none' } as any,
  inputError: { borderWidth: componentTokens.focusRing.width },
  disabledInput: { opacity: motion.opacity.disabled },
  picker: { paddingVertical: spacing.sm, gap: spacing.sm },
  pickerContent: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: spacing.sm },
  pickerAction: { flex: 1, minHeight: componentTokens.input.height - spacing.sm * 2 },
  pickerText: { flex: 1, ...typography.body },
  clearButton: { padding: spacing.xs },
  surface: { padding: componentTokens.card.padding, borderRadius: componentTokens.card.radius, ...elevation.low },
  outlined: { borderWidth: componentTokens.card.borderWidth },
  formItem: { marginBottom: componentTokens.layout.fieldGap },
  label: { ...typography.label, marginBottom: spacing.sm },
  error: { ...typography.bodySmall, marginTop: spacing.xs },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  stateCard: { width: '100%', maxWidth: 420, alignItems: 'center', gap: spacing.md },
  stateIcon: { width: componentTokens.state.iconSize, height: componentTokens.state.iconSize, borderRadius: shape.extraLarge, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { ...typography.title, textAlign: 'center' },
  centerText: { ...typography.body, textAlign: 'center' },
  dropdown: { marginTop: spacing.xs, borderWidth: componentTokens.card.borderWidth, borderRadius: shape.medium, overflow: 'hidden', ...elevation.medium },
  dropdownSearch: { padding: spacing.sm },
  dropdownClear: { minHeight: componentTokens.menu.itemHeight, padding: spacing.md, alignItems: 'center', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  dropdownClearContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  link: { ...typography.body, fontWeight: '600' },
  option: { minHeight: componentTokens.menu.itemHeight, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  optionText: { ...typography.body },
  empty: { textAlign: 'center', padding: spacing.lg, ...typography.bodySmall },
});
