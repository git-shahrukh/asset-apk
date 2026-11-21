import { ComponentRef, ReactNode, Ref, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

export const colors = {
  primary: '#1d4ed8',
  primaryDark: '#1e3a8a',
  primaryLight: '#dbeafe',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  text: '#0f172a',
  muted: '#64748b',
  border: '#cbd5e1',
  bg: '#f1f5f9',
  card: '#ffffff',
};
const KEYBOARD_GAP = 80; // space kept between the focused input and the keyboard

// A popup on every platform. React Native's Alert does nothing in the browser.
export function showPopup(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

// Scrolls the focused input above the keyboard. Call it from the list's onLayout, because
// the list only has enough room to scroll after it has shrunk for the keyboard.
export function revealFocusedInput(list: ComponentRef<typeof ScrollView> | FlatList<any> | null, headerHeight = 0) {
  if (Platform.OS === 'web') return; // browsers have no on-screen keyboard to avoid here
  const input = TextInput.State.currentlyFocusedInput();
  if (!input) return;
  list?.getScrollResponder()?.scrollResponderScrollNativeHandleToKeyboard(input, headerHeight + KEYBOARD_GAP, true);
}

export function Button({ title, onPress, loading, disabled }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.primaryDark }, off && { opacity: 0.6 }]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

type InputProps = TextInputProps & {
  hasError?: boolean;
  right?: ReactNode; // e.g. a "Show" button inside the password box
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function Input({ hasError, right, style, ref, ...props }: InputProps) {
  return (
    <View style={[styles.inputBox, hasError && styles.inputError]}>
      <TextInput ref={ref} placeholderTextColor={colors.muted} style={[styles.inputText, style]} {...props} />
      {right}
    </View>
  );
}

export function FormItem({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: ReactNode;
}) {
  return (
    <View style={styles.formItem}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.centerText}>{message}</Text>
      {onRetry && <Button title="Try again" onPress={onRetry} />}
    </View>
  );
}

export function EmptyView({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.centerText}>{message}</Text>
    </View>
  );
}

export interface Option {
  label: string;
  value: string;
}

// Looks like an input, but opens a picker when tapped. Used by date and attachment fields.
export function PickerButton({ text, placeholder, onPress, onClear, hasError }: {
  text?: string; placeholder: string; onPress: () => void; onClear?: () => void; hasError?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.inputBox, styles.picker, hasError && styles.inputError]}>
      <Text style={{ color: text ? colors.text : colors.muted, fontSize: 16, flex: 1 }} numberOfLines={1}>
        {text || placeholder}
      </Text>
      {text && onClear ? (
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={[styles.link, { color: colors.danger }]}>Clear</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}


const DROPDOWN_MAX_HEIGHT = 240;
const SEARCH_MIN_OPTIONS = 8; // short lists don't need a search box

// Opens under its field and grows with the options, up to DROPDOWN_MAX_HEIGHT.
// Used by "select" and "relationship" fields. onReveal runs if the list opens past the screen bottom.
export function OptionPicker({ value, options, onChange, placeholder = 'Select', loading, hasError, onReveal }: {
  value: string; options: Option[]; onChange: (value: string) => void;
  placeholder?: string; loading?: boolean; hasError?: boolean; onReveal?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<ComponentRef<typeof View>>(null);
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );
  const close = () => {
    setOpen(false);
    setSearch('');
  };
  const revealIfCutOff = () => {
    dropdownRef.current?.measureInWindow((_x, y, _width, height) => {
      if (y + height > Dimensions.get('window').height) onReveal?.();
    });
  };

  return (
    <>
      <Pressable
        onPress={() => (open ? close() : setOpen(true))}
        style={[styles.inputBox, styles.picker, hasError && styles.inputError]}
      >
        <Text style={{ color: selected ? colors.text : colors.muted, fontSize: 16, flex: 1 }} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" /> : <Text style={{ color: colors.muted }}>{open ? '▴' : '▾'}</Text>}
      </Pressable>

      {open && (
        <View ref={dropdownRef} onLayout={revealIfCutOff} style={styles.dropdown}>
          {options.length >= SEARCH_MIN_OPTIONS && (
            <View style={styles.dropdownSearch}>
              <Input placeholder="Search" value={search} onChangeText={setSearch} autoCorrect={false} />
            </View>
          )}
          {/* A ScrollView, because a FlatList can't sit inside the form's FlatList. */}
          <ScrollView style={{ maxHeight: DROPDOWN_MAX_HEIGHT }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 && <Text style={styles.empty}>{loading ? 'Loading…' : 'No options'}</Text>}
            {filtered.map((item) => (
              <Pressable key={item.value} onPress={() => { onChange(item.value); close(); }} style={styles.option}>
                <Text style={[styles.optionText, item.value === value && { color: colors.primary, fontWeight: '600' }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {value ? (
            <Pressable onPress={() => { onChange(''); close(); }} style={styles.dropdownClear}>
              <Text style={[styles.link, { color: colors.danger }]}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.card,
  },
  inputText: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  inputError: { borderColor: colors.danger },
  picker: { paddingVertical: 13, gap: 8 },
  formItem: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12, backgroundColor: colors.bg },
  centerText: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  dropdown: {
    marginTop: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.card, overflow: 'hidden',
  },
  dropdownSearch: { padding: 8 },
  dropdownClear: { padding: 12, alignItems: 'center' },
  link: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  option: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  optionText: { fontSize: 16, color: colors.text },
  empty: { textAlign: 'center', color: colors.muted, padding: 16 },
});
