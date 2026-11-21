import { OptionPicker, colors } from '../components/ui';
import { Text } from 'react-native';
import { useUserOptions } from '../api/queries';
import type { FieldProps } from './fieldComponents';

export function UserField({ field, value, onChange, onBlur, hasError, onReveal }: FieldProps) {
  const { data: options = [], isLoading, error } = useUserOptions();

  if (error) return <Text style={{ color: colors.danger }}>{`Couldn't load the user list: ${String(error)}`}</Text>;

  return (
    <OptionPicker
      placeholder={isLoading ? 'Loading…' : `Select ${field.label}`}
      value={value}
      options={options}
      onChange={(v) => { onChange(v); onBlur(); }}
      hasError={hasError}
      onReveal={onReveal}
    />
  );
}