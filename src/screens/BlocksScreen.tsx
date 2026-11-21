import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBlocks } from '../api/queries';
import { useAuth } from '../auth/authStore';
import { EmptyView, ErrorView, Input, Loader, colors } from '../components/ui';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Blocks'>;

// "😄😀😃" → "😄". Keeps emoji like "⚙️" whole (base character + variation selector / joiners).
function firstEmoji(icon: string) {
  const chars = Array.from(icon.trim());
  let out = chars[0] ?? '';
  for (let i = 1; i < chars.length; i++) {
    if (chars[i] === '\uFE0F' || chars[i] === '\u200D' || chars[i - 1] === '\u200D') out += chars[i];
    else break;
  }
  return out || '📁';
}

export function BlocksScreen({ navigation }: Props) {
  const user = useAuth((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useBlocks();
  const [search, setSearch] = useState('');

  const blocks = useMemo(
    () => (data ?? []).filter((b) => b.pluralName.toLowerCase().includes(search.trim().toLowerCase())),
    [data, search],
  );

  if (!user?.clientId) return <EmptyView message="Your account is not linked to a client." />;
  if (isLoading) return <Loader />;
  if (error) return <ErrorView message={error.message} onRetry={refetch} />;

  return (
    <FlatList
      data={blocks}
      keyExtractor={(b) => b.id}
      contentContainerStyle={styles.list}
      refreshing={isRefetching}
      onRefresh={refetch}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.hello}>Hi, {user.name}</Text>
          <Text style={styles.role}>{user.roleName}</Text>
          <Input placeholder="Search modules" value={search} onChangeText={setSearch} autoCorrect={false} />
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{search ? 'No matching modules' : 'No modules available'}</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primaryLight }]}
          onPress={() => navigation.navigate('RecordForm', { blockId: item.id, blockName: item.name })}
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{firstEmoji(item.icon)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>{item.pluralName}</Text>
            <Text style={styles.sub}>Add {item.name}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
  header: { marginBottom: 12, gap: 4 },
  hello: { fontSize: 22, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  role: { fontSize: 14, color: colors.muted, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10,
    borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 26, color: colors.muted },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
