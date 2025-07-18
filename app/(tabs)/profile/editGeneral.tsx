import { StyleSheet, Text, View, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';

export default function EditGeneralInfoScreen() {
    const router = useRouter();
    const { profileData } = useProfile();
    const [editProfileFields, setEditProfileFields] = useState({
        email: '',
        username: '',
        displayName: '',
        bio: '',
    });
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
        <View style={settingStyles.settingsDrawer}>
          <DrawerHeader title="Edit Profile" onBack={() => router.back()} />
          <ScrollView style={settingStyles.settingsContent} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.infoLabel}>Email: </Text>
            <CustomInput
              value={editProfileFields.email}
              onChangeText={email =>
                setEditProfileFields(prev => ({ ...prev, email }))
              }
              placeholder={profileData?.data?.email || 'Enter new email'}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.infoLabel}>Username: </Text>
            <CustomInput
              value={editProfileFields.username}
              onChangeText={username =>
                setEditProfileFields(prev => ({ ...prev, username }))
              }
              autoCapitalize="none"
              placeholder={profileData?.username || 'Enter new username'}
            />
            <Text style={styles.infoLabel}>Display Name: </Text>
            <CustomInput
              value={editProfileFields.displayName}
              onChangeText={displayName =>
                setEditProfileFields(prev => ({ ...prev, displayName }))
              }
              placeholder={profileData?.displayName || 'Enter new display name'}
            />
            <Text style={styles.infoLabel}>Bio: </Text>
            <CustomInput
              value={editProfileFields.bio}
              onChangeText={bio =>
                setEditProfileFields(prev => ({ ...prev, bio }))
              }
              placeholder={profileData?.data?.bio || 'Enter new bio'}
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