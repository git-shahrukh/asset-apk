import { queryOptions,useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/authStore';
import { canSeeField } from '../auth/permissions';
import { queryClient } from './client';
import { createRecord,getBlocks, getFields,getRecords,  recordTitle } from './endpoints';
import { FormValues } from './types';
import { Field } from './types'; 
import {getUsers} from './endpoints';
const fieldsQuery = (blockId: string) =>
  queryOptions({ queryKey: ['fields', blockId], queryFn: () => getFields(blockId), staleTime: 10 * 60_000 });

// Blocks of the logged-in user's client.
export function useBlocks() {
  const clientId = useAuth((s) => s.user?.clientId);
  return useQuery({
    queryKey: ['blocks', clientId],
    queryFn: () => getBlocks(clientId!),
    enabled: !!clientId,
    staleTime: 5 * 60_000,
  });
}

// Active fields of a block that the current role is allowed to see.
export function useFields(blockId: string) {
  const roleSlug = useAuth((s) => s.user?.roleSlug);
  return useQuery({ ...fieldsQuery(blockId), select: (fields) => fields.filter((f) => canSeeField(f, roleSlug)) });
}

// Options for a relationship field: records of the related block, labelled by its title field.
// export function useRelationOptions(blockId?: string) {
//   return useQuery({
//     queryKey: ['relationOptions', blockId],
//     enabled: !!blockId,
//     staleTime: 60_000,
//     queryFn: async () => {
//       const [fields, records] = await Promise.all([
//         queryClient.ensureQueryData(fieldsQuery(blockId!)), // reuses cached fields
//         getRecords(blockId!),
//       ]);
//       return records.map((r) => ({ label: recordTitle(r, fields), value: r.id }));
//     },
//   });
// }
export function useRelationOptions(blockId?: string) {
  return useQuery({
    queryKey: ['relationOptions', blockId],
    enabled: !!blockId,
    staleTime: 60_000,
    queryFn: async () => {
      const records = await getRecords(blockId!);
      return records.map((r) => ({
        label: String(r.values.name || `#${r.id.slice(0, 8)}`),
        value: r.id,
      }));
    },
  });
}

export function useUserOptions() {
  const clientId = useAuth((s) => s.user?.clientId);
  return useQuery({
    queryKey: ['userOptions', clientId],
    enabled: !!clientId,
    staleTime: 5 * 60_000,
    queryFn: () => getUsers(clientId!),
  });
}

type Option = { label: string; value: string };

// Replaces the selected record id of every relationship field with that record's name.
function relationIdsToNames(blockId: string, values: FormValues): FormValues {
  const fields = queryClient.getQueryData<Field[]>(['fields', blockId]) ?? [];
  const result: FormValues = { ...values };

  for (const f of fields) {
    if (f.type !== 'relationship' || !f.relation) continue;
    const id = result[f.id];
    if (!id) continue;

    const options = queryClient.getQueryData<Option[]>(['relationOptions', f.relation.blockId]) ?? [];
    const match = options.find((o) => o.value === id);
    if (match) result[f.id] = match.label;
  }
  return result;
}

export function useCreateRecord(blockId:string){
  return useMutation({
    mutationFn:(values:FormValues)=>createRecord(blockId,relationIdsToNames(blockId, values)),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['records',blockId]});
      queryClient.invalidateQueries({queryKey:['relationOptions',blockId]});
    },
  }

  );
}