import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DrawerHeader } from '@/components/Drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountManagementScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <DrawerHeader title="Account Management" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/(tabs)/profile/editUser" as any)}
          >
            <Ionicons name="accessibility-outline" size={20} color="#585ABF" style={styles.iconLeft} />
            <Text style={styles.settingText}>User Info</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" style={styles.iconRight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/(tabs)/profile/editCredentials" as any)}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#585ABF" style={styles.iconLeft} />
            <Text style={styles.settingText}>Credentials</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" style={styles.iconRight} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
  },
  settingText: {
    flex: 1,
    color: '#25292e',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});