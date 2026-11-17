import { Field } from '../api/types';

// Field-level access from the API: hideFrom = roles that can't see it,
// userType = roles that can (empty = everyone).
export function canSeeField(field: Field, roleSlug?: string) {
  if (!roleSlug) return true;
  if (field.hiddenFrom.includes(roleSlug)) return false;
  if (field.visibleTo.length > 0 && !field.visibleTo.includes(roleSlug)) return false;
  return true;
}
