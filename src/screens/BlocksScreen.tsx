import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBlocks } from '../api/queries';
import { useAuth } from '../auth/authStore';
import { ModuleCard } from '../components/ModuleCard';
import { EmptyView, ErrorView, Input, Loader } from '../components/ui';
import { componentTokens, spacing, typography, useTheme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Blocks'>;

// Keep emoji sequences such as a base character plus variation selector/joiners together.
function firstEmoji(icon: string) {
  const chars = Array.from(icon.trim());
  let out = chars[0] ?? '';
  for (let i = 1; i < chars.length; i++) {
    if (chars[i] === '\uFE0F' || chars[i] === '\u200D' || chars[i - 1] === '\u200D') out += chars[i];
    else break;
  }
  return out || '\uD83D\uDCC1';
}

export function BlocksScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const user = useAuth((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useBlocks();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const columns = width >= 360 ? 2 : 1;
  const cardWidth = columns === 2
    ? (width - spacing.lg * 2 - spacing.md) / 2
    : width - spacing.lg * 2;

  const blocks = useMemo(
    () => (data ?? []).filter((b) => b.pluralName.toLowerCase().includes(search.trim().toLowerCase())),
    [data, search],
  );

  if (!user?.clientId) return <EmptyView message="Your account is not linked to a client." />;
  if (isLoading) return <Loader />;
  if (error) return <ErrorView message={error.message} onRetry={refetch} />;

  return (
    <FlatList
      key={columns}
      data={blocks}
      numColumns={columns}
      keyExtractor={(b) => b.id}
      contentContainerStyle={[styles.list, { backgroundColor: theme.colors.background }]}
      columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
      refreshing={isRefetching}
      onRefresh={refetch}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Asset workspace</Text>
          <Text style={[styles.hello, { color: theme.colors.textPrimary }]}>Hi, {user.name}</Text>
          <Text style={[styles.role, { color: theme.colors.textSecondary }]}>{user.roleName}</Text>
          <View style={styles.searchWrap}>
            <Input
              placeholder="Search modules"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              accessibilityLabel="Search modules"
              right={<Ionicons name="search-outline" size={componentTokens.iconSize.medium} color={theme.colors.textSecondary} />}
            />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Modules</Text>
          <Text style={[styles.sectionMeta, { color: theme.colors.textSecondary }]}>
            {blocks.length} {blocks.length === 1 ? 'module' : 'modules'} available
          </Text>
        </View>
      }
      ListEmptyComponent={<EmptyView title={search ? 'No matching modules' : 'No modules available'} message={search ? 'Try a different search term.' : 'Modules will appear here when they are assigned to your account.'} icon="grid-outline" />}
      renderItem={({ item }) => (
        <ModuleCard
          icon={firstEmoji(item.icon)}
          title={item.pluralName}
          subtitle={`Add ${item.name}`}
          cardWidth={cardWidth}
          onPress={() => navigation.navigate('RecordForm', { blockId: item.id, blockName: item.name })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1, gap: spacing.md },
  columnWrapper: { gap: spacing.md },
  header: { marginBottom: spacing.xs, gap: spacing.xs },
  eyebrow: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.8 },
  hello: { ...typography.headline, textTransform: 'capitalize', marginTop: spacing.xs },
  role: { ...typography.bodySmall, marginBottom: spacing.sm },
  searchWrap: { marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionTitle: { ...typography.title },
  sectionMeta: { ...typography.bodySmall },
});
