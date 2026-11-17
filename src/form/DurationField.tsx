import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function DurationField({ value, onChange, onBlur, hasError, inputRef }: any) {
  const [initH = '', initM = ''] = value ? String(value).split(':') : [];
  const [h, setH] = useState(initH);
  const [m, setM] = useState(initM);

  const update = (nh: string, nm: string) => {
    setH(nh);
    setM(nm);
    // both boxes empty → '' so "required" works
    onChange(nh === '' && nm === '' ? '' : `${nh || '0'}:${nm || '0'}`);
  };

  const borderColor = hasError ? 'red' : '#ccc';

  return (
    <View style={styles.row}>
      <TextInput
        ref={inputRef}
        style={[styles.input, { borderColor }]}
        value={h}
        onChangeText={(t) => update(onlyDigits(t).slice(0, 4), m)}
        onBlur={onBlur}
        keyboardType="number-pad"
        placeholder="0"
      />
      <Text style={styles.unit}>h</Text>
      <TextInput
        style={[styles.input, { borderColor }]}
        value={m}
        onChangeText={(t) => update(h, onlyDigits(t).slice(0, 2))}
        onBlur={onBlur}
        keyboardType="number-pad"
        placeholder="0"
      />
      <Text style={styles.unit}>min</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, width: 80, textAlign: 'center' },
  unit: { marginHorizontal: 8 },
});