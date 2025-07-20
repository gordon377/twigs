import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { changePassword } from '@/utils/api';
import { passwordSchema } from '@/schemas/textSchemas';
import * as v from 'valibot';
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

  const handleSave = () => {
    setPasswordError(null);
    setConfirmError(null);

    try {
      v.parse(passwordSchema, editProfileFields.password);
    } catch (error: any) {
      setPasswordError(
        "Password must be at least 8 characters, contain a lowercase letter, an uppercase letter, a number, and a special character."
      );
      return;
    }

    if (editProfileFields.password !== editProfileFields.confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    changePassword(
      setIsChanging,
      editProfileFields.password,
      setProfileData,
      setIsLoading
    );
    setEditProfileFields({ password: '', confirmPassword: '' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <DrawerHeader title="Edit Password" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.infoLabel}>Password</Text>
            <CustomInput
              placeholder="Password"
              value={editProfileFields.password}
              onChangeText={password => setEditProfileFields(prev => ({ ...prev, password }))}
              secureTextEntry
              style={styles.input}
            />
            {passwordError && (
              <Text style={styles.errorText}>
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
              style={styles.input}
            />
            {confirmError && (
              <Text style={styles.errorText}>
                {confirmError}
              </Text>
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isChanging}
            >
              {isChanging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  formContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    color: '#25292e',
    fontWeight: 'bold',
    marginBottom: 4,
    alignSelf: 'flex-start',
    fontSize: 16,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#585ABF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 8,
    alignSelf: 'flex-start',
    fontSize: 15,
  },
});