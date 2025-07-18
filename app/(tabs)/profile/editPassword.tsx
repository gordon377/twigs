import { StyleSheet, Text, View, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditPasswordScreen() {
    const router = useRouter();
    const [editProfileFields, setEditProfileFields] = useState({
        password: '',
        confirmPassword: '',
      });
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
        <View style={settingStyles.settingsDrawer}>
          <DrawerHeader title="Edit Profile" onBack={() => router.back()} />
          <ScrollView style={settingStyles.settingsContent} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.infoLabel}>Password</Text>
            <CustomInput
                placeholder="Password"
                value={editProfileFields.password}
                onChangeText={password =>
                  setEditProfileFields(prev => ({ ...prev, password }))
                }
                secureTextEntry
            />
            <Text style={styles.infoLabel}>Confirm Password</Text>
            <CustomInput
                placeholder="Confirm Password"
                value={editProfileFields.confirmPassword}
                onChangeText={confirmPassword =>
                  setEditProfileFields(prev => ({ ...prev, confirmPassword }))
                }
                secureTextEntry
            />
            <Button
                title="Save Changes"
                onPress={() => {
                  alert('Save changes pressed');
                }}
                color="#ffd33d"
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    infoLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    color: '#fff',
  },
});