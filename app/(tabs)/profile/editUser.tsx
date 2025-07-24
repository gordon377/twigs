import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';
import { changeUserInfo } from '@/utils/api';
import * as v from 'valibot';
import { displayNameSchema, usernameSchema, phoneNumSchema, bioSchema } from '@/schemas/textSchemas';

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
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    setErrors([]);
    if (!editProfileFields.displayName || !editProfileFields.username || !editProfileFields.phoneNumber || !editProfileFields.bio) {
      setErrors(["All fields are required"]);
      return;
     }
    try {
      console.log("Validating fields...");
      v.parse(displayNameSchema, editProfileFields.displayName);
      console.log("Display Name is valid");
      v.parse(usernameSchema, editProfileFields.username);
      console.log("Username is valid");
      v.parse(phoneNumSchema, Number(editProfileFields.phoneNumber));
      console.log("Phone Number is valid");
      v.parse(bioSchema, editProfileFields.bio);
      console.log("All fields are valid");
    changeUserInfo(
      setIsChanging,
      editProfileFields,
      setProfileData,
      setIsLoading
    );
    } catch (errors:any) {
      console.log("Validation failed:", errors);
      setErrors([errors.message || 'An error occurred during sign up']);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <DrawerHeader title="Edit Info" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.infoLabel}>Username</Text>
            <CustomInput
              value={editProfileFields.username}
              onChangeText={username =>
                setEditProfileFields(prev => ({ ...prev, username }))
              }
              autoCapitalize="none"
              placeholder={'Enter new username'}
              style={styles.input}
            />
            <Text style={styles.infoLabel}>Phone Number</Text>
            <CustomInput
              value={editProfileFields.phoneNumber}
              onChangeText={phoneNum => {
                if (!isNaN(Number(phoneNum)) || phoneNum === "") {
                  setEditProfileFields(prev => ({ ...prev, phoneNumber: phoneNum }));
                }
              }}
              keyboardType="phone-pad"
              placeholder={'Enter new phone number'}
              style={styles.input}
            />
            <Text style={styles.infoLabel}>Display Name</Text>
            <CustomInput
              value={editProfileFields.displayName}
              onChangeText={displayName =>
                setEditProfileFields(prev => ({ ...prev, displayName }))
              }
              placeholder={'Enter new display name'}
              style={styles.input}
            />
            <Text style={styles.infoLabel}>Bio (100 Character Limit)</Text>
            <CustomInput
              value={editProfileFields.bio}
              onChangeText={bio =>
                setEditProfileFields(prev => ({ ...prev, bio }))
              }
              placeholder={'Enter new bio'}
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
            {/* Errors */}
            {errors.length > 0 && (
              <View style={styles.footerContainer}>
                {errors.map((error, index) => (
                  <Text key={index} style={{ color: 'red' }}>
                    {error}
                  </Text>
                ))}
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
  footerContainer: {
    marginTop: 8,
    alignItems: 'center',
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