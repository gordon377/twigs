import { View, Text, StyleSheet } from 'react-native';
import { colors, SIZES } from '@/styles/styles';

export default function RecommendationsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommendations</Text>
      <Text style={styles.subtitle}>AI-powered suggestions coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: SIZES.spacing.md,
  },
  subtitle: {
    fontSize: SIZES.font.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
