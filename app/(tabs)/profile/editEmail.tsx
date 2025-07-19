import { StyleSheet, Text, View, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';
import { changeEmail } from '@/utils/api';

export default function EditEmailScreen() {
    const router = useRouter();
    const { profileData, setProfileData, setIsLoading } = useProfile(); // <-- updated
    const [isChanging, setIsChanging] = useState(false);
    const [editProfileFields, setEditProfileFields] = useState({
        email: '',
        confirmEmail: '',
    });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
        <View style={settingStyles.settingsDrawer}>
          <DrawerHeader title="Edit Profile" onBack={() => router.back()} />
          <ScrollView style={settingStyles.settingsContent} contentContainerStyle={{ padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.infoLabel}>Email</Text>
              <CustomInput
                value={editProfileFields.email}
                onChangeText={email =>
                  setEditProfileFields(prev => ({ ...prev, email }))
                }
                placeholder={profileData?.email || 'Enter new email'}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.infoLabel}>Confirm Email</Text>
              <CustomInput
                value={editProfileFields.confirmEmail}
                onChangeText={confirmEmail =>
                  setEditProfileFields(prev => ({ ...prev, confirmEmail }))
                }
                placeholder="Confirm new email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                title="Save Changes"
                onPress={() => {
                  if (editProfileFields.email === editProfileFields.confirmEmail) {
                    changeEmail(
                      setIsChanging,
                      editProfileFields.email,
                      setProfileData,
                      setIsLoading
                    );
                  } else {
                    alert('Emails do not match');
                  }
                }}
                color="#ffd33d"
              />
            </View>
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