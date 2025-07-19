import { StyleSheet, Text, View, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';
import { changeUserInfo } from '@/utils/api';

export default function EditGeneralInfoScreen() {
    const router = useRouter();
    const { profileData, setProfileData, setIsLoading } = useProfile();
    const [isChanging, setIsChanging] = useState(false);
    const [editProfileFields, setEditProfileFields] = useState({
        email: '',
        phoneNumber: '',
        username: '',
        displayName: '',
        bio: '',
    });
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
        <View style={settingStyles.settingsDrawer}>
          <DrawerHeader title="Edit Info" onBack={() => router.back()} />
          <ScrollView style={settingStyles.settingsContent} contentContainerStyle={{ padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>

            <Text style={styles.infoLabel}>Username: </Text>
            <CustomInput
              value={editProfileFields.username}
              onChangeText={username =>
                setEditProfileFields(prev => ({ ...prev, username }))
              }
              autoCapitalize="none"
              placeholder={profileData?.username || 'Enter new username'}
            />
            <Text style={styles.infoLabel}>Phone Number:</Text>
            <CustomInput
                value={editProfileFields.phoneNumber}
                onChangeText={phoneNum => {
                    // Only update if the value is numeric or empty
                    if (!isNaN(Number(phoneNum)) || phoneNum === "") {
                        setEditProfileFields(prev => ({ ...prev, phoneNumber: phoneNum }));
                    }
                }}
                keyboardType="phone-pad"
                placeholder={profileData?.data?.phoneNumber || 'Enter new phone number'}
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
                changeUserInfo(
                  setIsChanging,
                  editProfileFields,
                  setProfileData,
                  setIsLoading
                );
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