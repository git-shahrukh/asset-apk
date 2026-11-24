// import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { useCreateRecord, useFields } from '../api/queries';
// import { EmptyView, ErrorView, Loader, showPopup } from '../components/ui';
// import { DynamicForm } from '../form/DynamicForm';
// import type { RootStackParamList } from '../navigation';

// type Props = NativeStackScreenProps<RootStackParamList, 'RecordForm'>;

// export function RecordFormScreen({ route, navigation }: Props) {
//   const { blockId, blockName } = route.params;
//   const { data: fields, isLoading, error, refetch } = useFields(blockId);
//   const createRecord = useCreateRecord(blockId);

//   if (isLoading) return <Loader />;
//   if (error) return <ErrorView message={error.message} onRetry={refetch} />;
//   if (!fields?.length) return <EmptyView message="This module has no fields yet." />;

//   return (
//     <DynamicForm
//       fields={fields}
//       submitLabel="Save"
//       onSubmit={async (values) => {
//         await createRecord.mutateAsync(values);
//         navigation.goBack();
//         showPopup('Data saved', `${blockName} was saved successfully.`);
//       }}
//     />
//   );
// }

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateRecord, useFields } from '../api/queries';
import { EmptyView, ErrorView, Loader, showPopup } from '../components/ui';
import { DynamicForm } from '../form/DynamicForm';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordForm'>;

export function RecordFormScreen({ route, navigation }: Props) {
  const { blockId, blockName } = route.params;
  const { data: fields, isLoading, error, refetch } = useFields(blockId);
  const createRecord = useCreateRecord(blockId);

  if (isLoading) return <Loader />;
  if (error) return <ErrorView message={error.message} onRetry={refetch} />;
  if (!fields?.length) return <EmptyView message="This module has no fields yet." />;

  return (
    <DynamicForm
      fields={fields}
      submitLabel="Save"
      onSubmit={async (values) => {
        await createRecord.mutateAsync(values);
        navigation.goBack();
        showPopup('Data saved', `${blockName} was saved successfully.`);
      }}
    />
  );
}