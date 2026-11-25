import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { componentTokens, shape, spacing, typography, useTheme } from '../theme';

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function DurationField({ value, onChange, onBlur, hasError, inputRef }: any) {
  const { theme } = useTheme();
  const [initH = '', initM = ''] = value ? String(value).split(':') : [];
  const [h, setH] = useState(initH);
  const [m, setM] = useState(initM);

  const update = (nh: string, nm: string) => {
    setH(nh);
    setM(nm);
    // both boxes empty → '' so "required" works
    onChange(nh === '' && nm === '' ? '' : `${nh || '0'}:${nm || '0'}`);
  };

  const borderColor = hasError ? theme.colors.error : theme.colors.outline;

  return (
    <View style={styles.row}>
      <TextInput
        ref={inputRef}
        style={[styles.input, { borderColor, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
        value={h}
        onChangeText={(t) => update(onlyDigits(t).slice(0, 4), m)}
        onBlur={onBlur}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={theme.colors.textSecondary}
        accessibilityLabel="Hours"
      />
      <Text style={styles.unit}>h</Text>
      <TextInput
        style={[styles.input, { borderColor, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
        value={m}
        onChangeText={(t) => update(h, onlyDigits(t).slice(0, 2))}
        onBlur={onBlur}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={theme.colors.textSecondary}
        accessibilityLabel="Minutes"
      />
      <Text style={styles.unit}>min</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { minHeight: componentTokens.input.height, borderWidth: componentTokens.card.borderWidth, borderRadius: shape.medium, padding: spacing.md, width: componentTokens.duration.inputWidth, textAlign: 'center', ...typography.body },
  unit: { marginHorizontal: spacing.sm, ...typography.bodySmall },
});
