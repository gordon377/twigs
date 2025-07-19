import { StyleSheet, Text, View, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { changePassword } from '@/utils/api';
import { passwordSchema } from '@/app/schemas/textSchemas';
import * as v from 'valibot'; // Validator Library
import { useProfile } from '@/contexts/ProfileContext'; 

export default function EditPasswordScreen() {
    const router = useRouter();
    const { setProfileData, setIsLoading } = useProfile(); 
    const [isChanging, setIsChanging] = useState(false);
    const [editProfileFields, setEditProfileFields] = useState({
        password: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState<string | null>(null); 
    const [confirmError, setConfirmError] = useState<string | null>(null);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
        <View style={settingStyles.settingsDrawer}>
          <DrawerHeader title="Edit Profile" onBack={() => router.back()} />
          <ScrollView style={settingStyles.settingsContent} contentContainerStyle={{ padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.infoLabel}>Password</Text>
              <CustomInput
                placeholder="Password"
                value={editProfileFields.password}
                onChangeText={password => setEditProfileFields(prev => ({ ...prev, password }))}
                secureTextEntry
              />
              {passwordError && (
                <Text style={{ color: 'red', alignSelf: 'flex-start', marginBottom: 8 }}>
                  {passwordError}
                </Text>
              )}
              <Text style={styles.infoLabel}>Confirm Password</Text>
              <CustomInput
                placeholder="Confirm Password"
                value={editProfileFields.confirmPassword}
                onChangeText={confirmPassword =>
                  setEditProfileFields(prev => ({ ...prev, confirmPassword }))
                }
                secureTextEntry
              />
              {confirmError && (
                <Text style={{ color: 'red', alignSelf: 'flex-start', marginBottom: 8 }}>
                  {confirmError}
                </Text>
              )}
              <Button
                title="Save Changes"
                onPress={() => {
                  try {
                    v.parse(passwordSchema, editProfileFields.password);
                    setPasswordError(null);
                  } catch (error: any) {
                    setPasswordError("Password must be at least 8 characters, contain a lowercase letter, an uppercase letter, a number, and a special character.");
                  }
                  if (editProfileFields.password === editProfileFields.confirmPassword) {
                    changePassword(
                      setIsChanging,
                      editProfileFields.password,
                      setProfileData,
                      setIsLoading
                    );
                    setEditProfileFields({ password: '', confirmPassword: '' });
                    setConfirmError(null);
                  } else {
                    setConfirmError('Passwords do not match');
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