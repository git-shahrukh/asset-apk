import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './ui';
import { componentTokens, elevation, shape, spacing, typography, useTheme } from '../theme';

interface ModuleCardProps {
  icon: string;
  title: string;
  subtitle: string;
  cardWidth: number;
  onPress: () => void;
}

export function ModuleCard({ icon, title, subtitle, cardWidth, onPress }: ModuleCardProps) {
  const { theme } = useTheme();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      onPress={onPress}
      contentStyle={styles.cardContent}
      style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
    >
      <View style={[styles.logoBox, { backgroundColor: theme.colors.primaryContainer }]}>
        <Text style={styles.logo}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>{title}</Text>
        </View>
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={2}>{subtitle}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardContent: { width: '100%', alignItems: 'center' },
  card: {
    flexGrow: 0,
    flexShrink: 0,
    height: componentTokens.module.height,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: shape.large,
    borderWidth: componentTokens.card.borderWidth,
    ...elevation.low,
  },
  logoBox: {
    width: componentTokens.module.logoSize,
    height: componentTokens.module.logoSize,
    borderRadius: shape.large,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  logo: { fontSize: componentTokens.iconSize.large + spacing.xs },
  content: { width: '100%', minWidth: 0, alignItems: 'center' },
  titleContainer: { height: componentTokens.module.titleSlotHeight, width: '100%', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.body, fontWeight: '700', textAlign: 'center' },
  subtitleContainer: { height: componentTokens.module.subtitleSlotHeight, width: '100%', alignItems: 'center', justifyContent: 'flex-start' },
  subtitle: { ...typography.bodySmall, textAlign: 'center' },
});
