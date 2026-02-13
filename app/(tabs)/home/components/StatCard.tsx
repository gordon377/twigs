import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, SIZES } from '@/styles/styles';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  change: number;
  changeLabel?: string;
}

export function StatCard({ icon, label, value, change, changeLabel = '' }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>

      <Text style={styles.label}>{label}</Text>

      <Text style={styles.value}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>

      <View style={styles.changeContainer}>
        <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#dcfce7' : '#fee2e2' }]}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={14}
            color={isPositive ? colors.success : colors.danger}
          />
          <Text style={[styles.change, { color: isPositive ? colors.success : colors.danger }]}>
            {isPositive ? '+' : ''}{change}%
          </Text>
        </View>
        {changeLabel ? <Text style={styles.changeLabel}>{changeLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: SIZES.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SIZES.spacing.sm,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: SIZES.spacing.md,
    lineHeight: 38,
  },
  changeContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  change: {
    fontSize: 13,
    fontWeight: '700',
  },
  changeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
