import Button from '@/components/Button';
import CustomInput from '@/components/TextInput';
import { useState } from 'react';
import { StyleSheet, ActivityIndicator, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as v from 'valibot';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { displayNameSchema, usernameSchema, phoneNumSchema, bioSchema } from '@/schemas/textSchemas';
import { logIn, signUp } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import LeafTwig from '@/assets/appIcons/leafTwig.svg';

const axios = require('axios').default;

export default function ProfileScreen() {
  const router = useRouter();
  const { setProfileData, setIsLoading } = useProfile();
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState<string[]>([]);
  const { email, password } = useLocalSearchParams();

  const safeEmail = Array.isArray(email) ? email[0] : email ?? '';
  const safePassword = Array.isArray(password) ? password[0] : password ?? '';

  // Add state for new fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  //TO-DO: Add API Integration for generating a default avatar and uploading once backend is ready

  // Generate a random color for the avatar
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const [avatarColor] = useState(getRandomColor());


  const handleSignUp = async () => {
    setErrors([]);
    if (!displayName || !username || !phoneNumber || !bio) {
      setErrors(["All fields are required"]);
      return;
    }
    try {
      console.log("Validating fields...");
      v.parse(displayNameSchema, displayName);
      console.log("Display Name is valid");
      v.parse(usernameSchema, username);
      console.log("Username is valid");
      v.parse(phoneNumSchema, Number(phoneNumber));
      console.log("Phone Number is valid");
      v.parse(bioSchema, bio);
      console.log("All fields are valid");
      await signUp(
        setIsLoggingIn,
        setIsSigningUp,
        safePassword,
        safeEmail,
        displayName,
        username,
        bio,
        Number(phoneNumber),
        setErrors,
        setProfileData,
        setIsLoading,
        router
      );
    } catch (error:any) {
      setErrors([error.message || 'An error occurred during sign up']);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Centered logo/title */}
      <View style={styles.logoContainer}>
        {/* <LeafTwig width={80} height={80} /> */}
        <Text style={styles.title}>Twigs</Text>
      </View>
      {/* Subtitle */}
      <Text style={styles.subtitle}>Create an account</Text>
      <Text style={styles.subsubtitle}>Set-Up your profile information</Text>
      {/* Form */}
      <View style={styles.formContainer}>
        <CustomInput
          onChangeText={setDisplayName}
          placeholder="Display Name (Full Name)"
          value={displayName}
          style={styles.input}
        />
        <CustomInput
          onChangeText={setUsername}
          placeholder="Username"
          value={username}
          style={styles.input}
        />
        <CustomInput
          onChangeText={setPhoneNumber}
          placeholder="Phone Number"
          value={phoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <CustomInput
          onChangeText={setBio}
          placeholder="Bio (100 Characters Max)"
          value={bio}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleSignUp}
          disabled={isSigningUp}
        >
        {isSigningUp ?(
          <ActivityIndicator color='#fff' />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background as in the image
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  avatarContainer: {
    position: 'absolute',
    right: 24,
    zIndex: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#585ABF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  logoContainer: {
    marginTop: 60,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 4,
    textAlign: 'center',
  },
  subsubtitle: {
    fontSize: 14,
    color: '#25292e',
    marginBottom: 24,
    textAlign: 'center',
  },
  requirementsBox: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requirement: {
    fontSize: 14,
    color: '#25292e',
    marginBottom: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  socialButton: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  socialButtonText: {
    color: '#25292e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  link: {
    color: '#585ABF',
    textDecorationLine: 'underline',
  },
});