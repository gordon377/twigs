import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  const { profileData, setProfileData, setIsLoading } = useProfile();
  const [isChanging, setIsChanging] = useState(false);
  const [editProfileFields, setEditProfileFields] = useState({
    email: '',
    confirmEmail: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    if (!editProfileFields.email || !editProfileFields.confirmEmail) {
      setError('Please fill in both fields.');
      return;
    }
    if (editProfileFields.email !== editProfileFields.confirmEmail) {
      setError('Emails do not match');
      return;
    }
    changeEmail(
      setIsChanging,
      editProfileFields.email,
      setProfileData,
      setIsLoading
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <DrawerHeader title="Edit Email" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.infoLabel}>New Email</Text>
            <CustomInput
              value={editProfileFields.email}
              onChangeText={email =>
                setEditProfileFields(prev => ({ ...prev, email }))
              }
              placeholder={profileData?.email || 'Enter new email'}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
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
              style={styles.input}
            />
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
          {/* Error message below the form container */}
          {error && (
            <View style={styles.footerContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
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
    alignSelf: 'center',
    fontSize: 15,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
});