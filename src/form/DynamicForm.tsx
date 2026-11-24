import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { Control, Controller, Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '../api/client';
import { Field, FormValues, Place } from '../api/types';
import { Button, FormItem, colors,revealFocusedInput,showPopup  } from '../components/ui';
import { TEXT_MAX_LENGTH, UnsupportedField, fieldComponents } from './fieldComponents';
import { useHeaderHeight } from '@react-navigation/elements';
import { Platform } from 'react-native';
import { ScanError, scanText } from '../utils/scanText';
import { parseScan } from '../services/parseScan';
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FOCUS_DELAY_MS = 350; // lets the scroll finish, so a row that was off screen exists
const DURATION_PATTERN = /^\d{1,4}:[0-5]?\d$/; // H:MM, minutes 0-59
// A location counts as filled in once it has an address, because the address is what gets saved.
const hasPlace = (v: Place | '') => !!v && v.location.trim() !== '';

// ---------- Validation rules, built from each field's type + isRequired ----------
function fieldSchema(field: Field) {
  const required = (v: string) => !field.required || v.trim() !== '';
  const requiredMsg = `${field.label} is required`;

  switch (field.type) {
    case 'text':
      return z
        .string()
        .refine(required, requiredMsg)
        .refine((v) => v.length <= TEXT_MAX_LENGTH, `${field.label} must be at most ${TEXT_MAX_LENGTH} characters`)
        .transform((v) => v.trim());

    case 'number':
      return z
        .string()
        .refine(required, requiredMsg)
        .refine((v) => v.trim() === '' || NUMBER_PATTERN.test(v.trim()), `${field.label} must be a valid number`)
        .transform((v) => (v.trim() === '' ? null : Number(v)));

    case 'select':
      return z
        .string()
        .refine(required, requiredMsg)
        .refine((v) => v === '' || field.options.includes(v), 'Choose an option from the list')
        .transform((v) => v || null);
    case 'currency':
      return z
        .string()
        .refine(required, requiredMsg)
        .refine((v) => v.trim() === '' || AMOUNT_PATTERN.test(v.trim()), `${field.label} must be a valid amount`)
        .transform((v) => (v.trim() === '' ? null : Number(v).toFixed(2))); // 2 decimals, e.g. 12.30

    case 'date':
      return z
        .string()
        .refine(required, requiredMsg)
        .refine((v) => v === '' || DATE_PATTERN.test(v), `${field.label} must be a date like 2026-10-31`)
        .transform((v) => v || null);

    case 'attachment':
      return z
        .any()
        .refine((v) => !field.required || !!v, requiredMsg)
        .transform((v) => v || null);
     
    case 'user':
      return z
        .string()
        .refine(required, requiredMsg)
        .transform((v) =>( v ? [v] : null));    

    case 'location':
      return z
        .any()
        .refine((v) => !field.required || hasPlace(v), requiredMsg)
        .transform((v) => (hasPlace(v) ? v.location.trim() : null));
    case 'duration':
        return z
          .string()
          .refine(required, requiredMsg)
          .refine((v) => v === '' || DURATION_PATTERN.test(v), `${field.label} must be hours and minutes, e.g. 2h 30m`)
          .transform((v) => {
            if (v === '') return null;
            const [h, m] = v.split(':').map(Number);
            return h * 60 + m; // total minutes. For "02:30" text instead: return v;
          });    

    case 'relationship':
      return z.string().refine(required, requiredMsg).transform((v) => (v ? [v] : null));


    default:
      return null; // unsupported type: not validated and not submitted
  }
}

function buildSchema(fields: Field[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    const schema = fieldSchema(f);
    if (schema) shape[f.id] = schema;
  }
  return z.object(shape);
}

function toInputValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object' && 'id' in value) return String((value as { id: unknown }).id);
  return String(value);
}

function buildDefaults(fields: Field[], initial?: FormValues): FormValues {
  return Object.fromEntries(fields.map((f) => [f.id, toInputValue(initial?.[f.id])]));
}

// ---------- Component ----------
interface Props {
  fields: Field[];
  initialValues?: FormValues;
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<void>;
}

export function DynamicForm({ fields, initialValues, submitLabel, onSubmit }: Props) {
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const { control, handleSubmit, setError, setFocus, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: buildDefaults(fields, initialValues),
    shouldFocusError: false, // goToFirstError does this, because it has to scroll first
  });
  const [formError, setFormError] = useState<string | null>(null);
  const headerHeight = useHeaderHeight();
  const listRef = useRef<FlatList<Field>>(null);

  // Moves a row to the top of the list, e.g. a dropdown that opened past the screen bottom.
  const revealRow = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index, viewPosition: 0 });
  }, []);

  // Copies the pin into the block's own Latitude and Longitude fields, matched by label because
  // field ids differ per block. shouldValidate clears any "required" error already showing.
  const fillCoordinates = useCallback((latitude: number, longitude: number) => {
    for (const [label, value] of [['latitude', latitude], ['longitude', longitude]] as const) {
      const target = fields.find((f) => f.label.toLowerCase() === label);
      if (target) setValue(target.id, String(value), { shouldValidate: true });
    }
  }, [fields, setValue]);

  // Scrolls to the first field with an error, then puts the cursor in it if it can take one.
  const goToFirstError = (hasError: (id: string) => boolean) => {
    const index = fields.findIndex((f) => hasError(f.id));
    if (index === -1) return;
    revealRow(index);
    setTimeout(() => setFocus(fields[index].id), FOCUS_DELAY_MS);
  };

  const submit = () => handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('Something went wrong');
      // Backend field errors, e.g. { "<fieldId>": "SKU must be unique" } → shown under that field.
      if (err.errors && typeof err.errors === 'object') {
        for (const [key, message] of Object.entries(err.errors as Record<string, unknown>)) {
          if (fields.some((f) => f.id === key)) setError(key, { message: String(message) });
        }
        goToFirstError((id) => id in (err.errors as object));
      }
      setFormError(err.message);
    }
  }, (errors) => goToFirstError((id) => !!errors[id]))();


 // ---------- state Scan label with OCR ----------
  const [scanning, setScanning] = useState(false);

const scanLabel = async () => {
  setScanning(true);
  try {
    const scan = await scanText();
    if (!scan) return;

    const parsed = parseScan(scan.lines, fields);
    console.log('MATCHED:', parsed.values, '| description field id:', parsed.descriptionId);

    const opts = { shouldDirty: true, shouldTouch: true, shouldValidate: true };
    for (const [id, value] of Object.entries(parsed.values)) setValue(id, value, opts);

    if (parsed.description && parsed.descriptionId) {
      setValue(parsed.descriptionId, parsed.description, opts);
    }
    if (!Object.keys(parsed.values).length) {
      showPopup('Nothing matched', 'No labels recognised. Unmatched text went to Description.');
    }
  } catch (e) {
    showPopup('Scan failed', e instanceof ScanError ? e.message : String(e));
  } finally {
    setScanning(false);
  }
};
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <FlatList
        ref={listRef}
        onLayout={() => revealFocusedInput(listRef.current, headerHeight)}
        // A row far down may not exist yet: jump near it so it renders, then try again.
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
          setTimeout(() => revealRow(index), 100);
        }}
        data={fields}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <FieldRow field={item} index={index} control={control} onReveal={revealRow} onCoordinates={fillCoordinates} />
        )}
        ListFooterComponent={
          <View>
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
          </View>
        }
        
        ListHeaderComponent={
  Platform.OS !== 'web' ? (
    <View style={{ marginBottom: 16 }}>
      <Button title="Scan label" onPress={scanLabel} loading={scanning} />
    </View>
  ) : undefined
}
      />
    </KeyboardAvoidingView>
  );
}

// Each row subscribes only to its own field, so typing doesn't re-render the whole form.
const FieldRow = memo(function FieldRow({ field, index, control, onReveal, onCoordinates }: {
  field: Field; index: number; control: Control<FormValues>; onReveal: (index: number) => void;
  onCoordinates: (latitude: number, longitude: number) => void;
}) {
  const Component = fieldComponents[field.type] ?? UnsupportedField;
  return (
    <Controller
      control={control}
      name={field.id}
      render={({ field: input, fieldState }) => (
        <FormItem label={field.label} required={field.required} error={fieldState.error?.message}>
          <Component
            field={field}
            value={(input.value ?? '')}
            onChange={input.onChange}
            onBlur={input.onBlur}
            hasError={!!fieldState.error}
            onReveal={() => onReveal(index)}
            inputRef={input.ref}
            onCoordinates={onCoordinates}
          />
        </FormItem>
      )}
    />
  );
});

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, backgroundColor: colors.bg, flexGrow: 1 },
  formError: { color: colors.danger, marginBottom: 8, textAlign: 'center' },
});
