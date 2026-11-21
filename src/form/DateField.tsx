// import {ChangeEvent,MouseEvent,createElement, useState } from 'react';
// import { Platform } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import {  colors, PickerButton } from '../components/ui';
// import type { FieldProps } from './fieldComponents';
// import { View, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { isFutureOnly, todayText } from './dateRules';

// // Built from local date parts. toISOString() uses UTC, which can give yesterday's date in India.
// function toDateText(date: Date) {
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   return `${date.getFullYear()}-${month}-${day}`;
// }

// function toDate(text: string) {
//   const [year, month, day] = text.split('-').map(Number);
//   return new Date(year, month - 1, day);
// }

// export function DateField({ field, value, onChange, onBlur, hasError }: FieldProps) {
//   const [open, setOpen] = useState(false);

//   // The native picker doesn't exist in the browser, so type the date there.
//   if (Platform.OS === 'web') {
//     return createElement('input',{
//       type:'date',
//       value,
//       onChange:(e:ChangeEvent<HTMLInputElement>)=>onChange(e.target.value),
//       onClick:(e:MouseEvent<HTMLInputElement>)=>e.currentTarget.showPicker(),
//       onBlur,
//       style:{
//         padding: 12, fontSize: 16, borderRadius: 10, color: colors.text, backgroundColor: colors.card,
//         border: `1px solid ${hasError ? colors.danger : colors.border}`,
//       },
//     });
//   }

//   return (
//     <>
//       <PickerButton
//         text={value}
//         placeholder={`Select ${field.label}`}
//         onPress={() => setOpen((o) => !o)}
//         onClear={() => { onChange(''); onBlur(); }}
//         hasError={hasError}
//       />
//       {open && (
//         <DateTimePicker
//           mode="date"
//           display={Platform.OS === 'ios' ? 'inline' : 'default'}
//           value={value ? toDate(value) : new Date()}
//           onValueChange={(_event, date) => {
//             setOpen(false);
//             onChange(toDateText(date));
//             onBlur();
//           }}
//           onDismiss={() => { setOpen(false); onBlur(); }}
//         />
//       )}
//     </>
//   );
// }

import { ChangeEvent, MouseEvent, createElement, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, PickerButton } from '../components/ui';
import type { FieldProps } from './fieldComponents';
import { isFutureOnly, todayText } from './dateRules';

// Built from local date parts. toISOString() uses UTC, which can give yesterday's date in India.
function toDateText(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function toDate(text: string) {
  const [year, month, day] = text.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function DateField({ field, value, onChange, onBlur, hasError }: FieldProps) {
  const [open, setOpen] = useState(false);
  const futureOnly = isFutureOnly(field); // ← NEW: true for expiry / next service dates

  // The native picker doesn't exist in the browser, so type the date there.
  if (Platform.OS === 'web') {
    return createElement('input', {
      type: 'date',
      value,
      min: futureOnly ? todayText() : undefined, // ← NEW: blocks past dates on web
      onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      onClick: (e: MouseEvent<HTMLInputElement>) => e.currentTarget.showPicker(),
      onBlur,
      style: {
        padding: 12, fontSize: 16, borderRadius: 10, color: colors.text, backgroundColor: colors.card,
        border: `1px solid ${hasError ? colors.danger : colors.border}`,
      },
    });
  }

  return (
    <>
      {/* NEW: calendar icon beside the button */}
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={22} color={colors.muted} style={styles.icon} />
        <View style={{ flex: 1 }}>
          <PickerButton
            text={value}
            placeholder={`Select ${field.label}`}
            onPress={() => setOpen((o) => !o)}
            onClear={() => { onChange(''); onBlur(); }}
            hasError={hasError}
          />
        </View>
      </View>
      {open && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          value={value ? toDate(value) : new Date()}
          minimumDate={futureOnly ? new Date() : undefined} // ← NEW: blocks past dates on mobile
          onValueChange={(_event, date) => {
            setOpen(false);
            onChange(toDateText(date));
            onBlur();
          }}
          onDismiss={() => { setOpen(false); onBlur(); }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
});