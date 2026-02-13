import { ScrollView, View, StyleSheet } from 'react-native';
import { colors, SIZES } from '@/styles/styles';
import { StatCard } from './StatCard';
import { TimeChart } from './TimeChart';
import { mockStats } from '../data/mockStats';

export default function StatsTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.cardsRow}>
        <StatCard
          icon="calculator"
          label="Alternatives Calculated"
          value={mockStats.alternativesCalculated.value}
          change={mockStats.alternativesCalculated.change}
          changeLabel="month over month"
        />

        <View style={styles.cardSpacer} />

        <StatCard
          icon="trophy"
          label="Goals Progressed"
          value={`${mockStats.goalsProgressed.value}%`}
          change={mockStats.goalsProgressed.change}
          changeLabel="month over..."
        />
      </View>

      <TimeChart data={mockStats.timeSaved} title="Time Saved" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: SIZES.spacing.xl,
    paddingBottom: 100, // Space for FAB
  },
  cardsRow: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.xxl,
  },
  cardSpacer: {
    width: SIZES.spacing.lg,
  },
});
