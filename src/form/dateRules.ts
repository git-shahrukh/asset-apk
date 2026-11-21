import type { Field } from '../api/types';

// Date fields that must not be in the past. Edit this list to match your labels.
const FUTURE_ONLY = /expir|next|service/i;

export const isFutureOnly = (field: Field) => FUTURE_ONLY.test(field.label);

// Local date as YYYY-MM-DD (toISOString uses UTC and can give yesterday in India).
export function todayText() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}