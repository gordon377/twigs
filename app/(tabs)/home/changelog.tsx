import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, SIZES } from '@/styles/styles';

export default function ChangelogScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Changelog</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>What's new in Twigs</Text>

        {/* Version 1.0.0 */}
        <View style={styles.versionBlock}>
          <View style={styles.versionHeader}>
            <Text style={styles.versionNumber}>Version 1.0.0</Text>
            <Text style={styles.versionDate}>December 2024</Text>
          </View>

          <View style={styles.changeItem}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>Dashboard & Stats</Text>
              <Text style={styles.changeDescription}>
                New home dashboard with activity statistics and time-saved tracking
              </Text>
            </View>
          </View>

          <View style={styles.changeItem}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>Network Visualization</Text>
              <Text style={styles.changeDescription}>
                Interactive network tree to visualize your connections
              </Text>
            </View>
          </View>

          <View style={styles.changeItem}>
            <View style={[styles.badge, styles.badgeImproved]}>
              <Text style={styles.badgeText}>IMPROVED</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>Connection Management</Text>
              <Text style={styles.changeDescription}>
                Better organization of incoming, outgoing, and active connections
              </Text>
            </View>
          </View>

          <View style={styles.changeItem}>
            <View style={[styles.badge, styles.badgeFixed]}>
              <Text style={styles.badgeText}>FIXED</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>Profile Updates</Text>
              <Text style={styles.changeDescription}>
                Resolved issues with profile picture uploads and display
              </Text>
            </View>
          </View>
        </View>

        {/* Version 0.9.0 */}
        <View style={styles.versionBlock}>
          <View style={styles.versionHeader}>
            <Text style={styles.versionNumber}>Version 0.9.0</Text>
            <Text style={styles.versionDate}>November 2024</Text>
          </View>

          <View style={styles.changeItem}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>Event Discovery</Text>
              <Text style={styles.changeDescription}>
                Browse and discover events in your area
              </Text>
            </View>
          </View>

          <View style={styles.changeItem}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>Calendar Integration</Text>
              <Text style={styles.changeDescription}>
                View all your events in a beautiful calendar interface
              </Text>
            </View>
          </View>
        </View>

        {/* Version 0.8.0 */}
        <View style={styles.versionBlock}>
          <View style={styles.versionHeader}>
            <Text style={styles.versionNumber}>Version 0.8.0</Text>
            <Text style={styles.versionDate}>October 2024</Text>
          </View>

          <View style={styles.changeItem}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>User Profiles</Text>
              <Text style={styles.changeDescription}>
                Create and customize your profile with bio and avatar
              </Text>
            </View>
          </View>

          <View style={styles.changeItem}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeTitle}>User Search</Text>
              <Text style={styles.changeDescription}>
                Find and connect with other users on the platform
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Stay tuned for more updates!</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.font.lg,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.spacing.xl,
    paddingBottom: SIZES.spacing.xxl,
  },
  subtitle: {
    fontSize: SIZES.font.md,
    color: colors.textSecondary,
    marginBottom: SIZES.spacing.xxl,
  },
  versionBlock: {
    marginBottom: SIZES.spacing.xxl,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  versionNumber: {
    fontSize: SIZES.font.xl,
    fontWeight: '700',
    color: colors.text,
  },
  versionDate: {
    fontSize: SIZES.font.sm,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeItem: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
  },
  badgeImproved: {
    backgroundColor: colors.success,
  },
  badgeFixed: {
    backgroundColor: colors.warning,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  changeContent: {
    flex: 1,
  },
  changeTitle: {
    fontSize: SIZES.font.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  changeDescription: {
    fontSize: SIZES.font.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    fontSize: SIZES.font.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: SIZES.spacing.xl,
    fontStyle: 'italic',
  },
});
