import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
    const router = useRouter();
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
        <View style={settingStyles.settingsDrawer}>
          <DrawerHeader title="Edit Profile" onBack={() => router.back()} />
          <ScrollView style={settingStyles.settingsContent}>
            <TouchableOpacity style={settingStyles.settingItem} onPress={() => router.push("/(tabs)/profile/editEmail" as any)}>
              <Ionicons name="at-outline" size={20} color="#fff" />
              <Text style={settingStyles.settingText}>Email</Text>
              <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            <TouchableOpacity style={settingStyles.settingItem} onPress={() => router.push("/(tabs)/profile/editPassword" as any)}>
              <Ionicons name="lock-closed-outline" size={20} color="#fff" />
              <Text style={settingStyles.settingText}>Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
}