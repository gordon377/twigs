import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import { logOut } from '@/utils/api'; 
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingScreen() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
    <View style={settingStyles.settingsDrawer}>
        <DrawerHeader title="Settings" onBack={() => router.back()} />
        <ScrollView style={settingStyles.settingsContent}>
            <TouchableOpacity style={settingStyles.settingItem} onPress={() => router.push("/profile/editProfile" as any)}>
            <Ionicons name="person-outline" size={20} color="#fff" />
            <Text style={settingStyles.settingText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            <TouchableOpacity style={settingStyles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={settingStyles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            <TouchableOpacity style={settingStyles.settingItem}>
            <Ionicons name="lock-closed-outline" size={20} color="#fff" />
            <Text style={settingStyles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            <TouchableOpacity style={settingStyles.settingItem}>
            <Ionicons name="help-circle-outline" size={20} color="#fff" />
            <Text style={settingStyles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            <TouchableOpacity style={settingStyles.settingItem}>
            <Ionicons name="information-circle-outline" size={20} color="#fff" />
            <Text style={settingStyles.settingText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            <TouchableOpacity
            style={[settingStyles.settingItem, styles.logoutItem]}
            onPress={() => logOut(setIsLoggingOut)}
            >
            <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
            <Text style={[settingStyles.settingText, styles.logoutText]}>Log Out</Text>
            {isLoggingOut && <Text style={
                styles.loadingText}>Logging out...</Text>}
            </TouchableOpacity>
        </ScrollView>
      </View>
      </SafeAreaView>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
  logoutItem: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#ff6b6b',
  },
  loadingText: {
    color: '#AFAFAF',
    fontSize: 16,
    marginBottom: 16,
  },
});