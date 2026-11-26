import { Text } from 'react-native';
import { useRelationOptions } from '../api/queries';
import { OptionPicker } from '../components/ui';
import { typography, useTheme } from '../theme';
import type { FieldProps } from './fieldComponents';

// e.g. "Warehouse": lets the user pick one record of the related block.
export function RelationshipField({ field, value, onChange, onBlur, hasError, onReveal }: FieldProps) {
  const { theme } = useTheme();
  const { data, isLoading, isError } = useRelationOptions(field.relation?.blockId);

  if (!field.relation) return <Text style={{ color: theme.colors.textSecondary }}>No related block configured.</Text>;
  const name = field.relation.blockName;

  return (
    <>
      <OptionPicker
        placeholder={`Select ${name}`}
        value={value}
        options={data ?? []}
        loading={isLoading}
        onChange={(v) => { onChange(v); onBlur(); }}
        hasError={hasError}
        onReveal={onReveal}
      />
      {isError && <Text style={{ color: theme.colors.error, ...typography.bodySmall }}>{`Couldn't load the ${name} list.`}</Text>}
    </>
  );
}
