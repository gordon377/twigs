import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import { logOut } from '@/utils/api'; 
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingScreen() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <DrawerHeader title="Settings" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/profile/manageAccount" as any)}>
            <Ionicons name="person-outline" size={20} color="#585ABF" style={styles.iconLeft} />
            <Text style={styles.settingText}>Account Management</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" style={styles.iconRight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#585ABF" style={styles.iconLeft} />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" style={styles.iconRight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="lock-closed-outline" size={20} color="#585ABF" style={styles.iconLeft} />
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" style={styles.iconRight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={20} color="#585ABF" style={styles.iconLeft} />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" style={styles.iconRight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/profile/about" as any)}>
            <Ionicons name="information-circle-outline" size={20} color="#585ABF" style={styles.iconLeft} />
            <Text style={styles.settingText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" style={styles.iconRight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutItem]}
            onPress={() => logOut(setIsLoggingOut, router)}
          >
            <Ionicons name="log-out-outline" size={20} color="#ff6b6b" style={styles.iconLeft} />
            <Text style={[styles.settingText, styles.logoutText]}>Log Out</Text>
            {isLoggingOut && <Text style={styles.loadingText}>Logging out...</Text>}
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
    color: '#070c1f',
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
  logoutItem: {
    backgroundColor: '#fff0f0',
    marginTop: 20,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#AFAFAF',
    fontSize: 16,
    marginLeft: 12,
  },
});