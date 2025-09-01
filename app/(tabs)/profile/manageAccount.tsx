import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { deleteAccount } from '@/utils/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DrawerHeader } from '@/components/Drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountManagementScreen() {
  const router = useRouter();
  // ...existing code...
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This is your last chance! Deleting your account will permanently erase all your data. Proceed?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const result = await deleteAccount();
                      if (result.success) {
                        Alert.alert('Account deleted successfully.');
                        router.replace('/');
                      } else {
                        Alert.alert('Failed to delete account', result.error || 'Unknown error');
                      }
                    } catch (err) {
                      Alert.alert('Error deleting account', String(err));
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

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
          {/* Delete Account Button */}
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: '#ffeaea', borderColor: '#ff4d4f', borderWidth: 1 }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4d4f" style={styles.iconLeft} />
            <Text style={[styles.settingText, { color: '#ff4d4f' }]}>Delete Account</Text>
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