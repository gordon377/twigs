import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, SIZES } from '@/styles/styles';

export default function AboutUsScreen() {
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
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/icons/splash-icon-light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Twigs</Text>

        <Text style={styles.version}>Version 1.0.0</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.bodyText}>
            Twigs is designed to help you grow your connections and discover meaningful
            events in your community. We believe in fostering authentic relationships
            and creating opportunities for people to come together.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Do</Text>
          <Text style={styles.bodyText}>
            Our platform connects you with like-minded individuals, helps you discover
            local events, and provides insights into your social network. Whether you're
            looking to expand your professional network or find new friends, Twigs is
            here to help you grow.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.bodyText}>
            Have questions or feedback? We'd love to hear from you. Reach out to us
            at support@twigs.app
          </Text>
        </View>

        <Text style={styles.footer}>Made with ❤️ by the Twigs team</Text>
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
    alignItems: 'center',
    padding: SIZES.spacing.xxl,
    paddingTop: SIZES.spacing.xl,
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: SIZES.spacing.sm,
    letterSpacing: 0.5,
  },
  version: {
    fontSize: SIZES.font.md,
    color: colors.textMuted,
    marginBottom: SIZES.spacing.xxl,
  },
  section: {
    width: '100%',
    marginBottom: SIZES.spacing.xxl,
  },
  sectionTitle: {
    fontSize: SIZES.font.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: SIZES.spacing.md,
  },
  bodyText: {
    fontSize: SIZES.font.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    fontSize: SIZES.font.sm,
    color: colors.textMuted,
    marginTop: SIZES.spacing.xl,
    marginBottom: SIZES.spacing.xxl,
    fontStyle: 'italic',
  },
});
