import { ComponentType } from 'react';
import { Text } from 'react-native';
import type { RefCallBack } from 'react-hook-form';
import { Field } from '../api/types';
import { Input, OptionPicker, colors } from '../components/ui';
import { RelationshipField } from './RelationshipField';
import { AttachmentField } from './AttachmentField';
import { DateField } from './DateField';
import { LocationField } from './LocationField';
import { DurationField } from './DurationField';
import { UserField } from './UserField';
export interface FieldProps {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  hasError: boolean;
  onReveal: () => void; // scrolls this field's row into view
  inputRef: RefCallBack; // lets the form put the cursor in this field
  onCoordinates: (latitude: number, longitude: number) => void; // a location field's pin moved
}

export const TEXT_MAX_LENGTH = 255;

function TextField({ field, value, onChange, onBlur, hasError, inputRef }: FieldProps) {
  return (
    <Input
      ref={inputRef}
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      placeholder={`Enter ${field.label}`}
      maxLength={TEXT_MAX_LENGTH}
      hasError={hasError}
    />
  );
}

// Keeps only digits, one "." and a leading "-", so letters can't be typed at all.
function toNumberText(text: string) {
  const cleaned = text.replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '');
  const [whole, ...decimals] = cleaned.split('.');
  return decimals.length ? `${whole}.${decimals.join('')}` : whole;
}

function NumberField({ field, value, onChange, onBlur, hasError, inputRef }: FieldProps) {
  return (
    <Input
      ref={inputRef}
      value={value}
      onChangeText={(text) => onChange(toNumberText(text))}
      onBlur={onBlur}
      placeholder={`Enter ${field.label}`}
      keyboardType="decimal-pad"
      hasError={hasError}
    />
  );
}

// Like toNumberText, but no minus sign and at most 2 decimals.
function toAmountText(text: string) {
  const [whole, decimals] = toNumberText(text).replace('-', '').split('.');
  return decimals === undefined ? whole : `${whole}.${decimals.slice(0, 2)}`;
}

function CurrencyField({ field, value, onChange, onBlur, hasError, inputRef }: FieldProps) {
  return (
    <Input
      ref={inputRef}
      value={value}
      onChangeText={(text) => onChange(toAmountText(text))}
      onBlur={onBlur}
      placeholder="0.00"
      keyboardType="decimal-pad"
      hasError={hasError}
    />
  );
}


function SelectField({ field, value, onChange, onBlur, hasError, onReveal }: FieldProps) {
  const options = field.options.map((o) => ({ label: o, value: o }));
  return (
    <OptionPicker
      placeholder={`Select ${field.label}`}
      value={value}
      options={options}
      onChange={(v) => { onChange(v); onBlur(); }}
      hasError={hasError}
      onReveal={onReveal}
    />
  );
}

export function UnsupportedField({ field }: FieldProps) {
  return <Text style={{ color: colors.muted }}>{`Field type "${field.type}" is not supported yet.`}</Text>;
}

// Backend `type` → component. To support a new type, add one line here.
export const fieldComponents: Record<string, ComponentType<FieldProps>> = {
  text: TextField,
  number: NumberField,
  select: SelectField,
  relationship: RelationshipField,
  date:DateField,
  attachment:AttachmentField,
  currency: CurrencyField,
  location: LocationField,
  duration: DurationField,
  user: UserField,
};
