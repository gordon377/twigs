import Button from '@/components/Button';
import CustomInput from '@/components/TextInput';
import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Image, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as v from 'valibot';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import LeafTwig from '@/assets/appIcons/leafTwig.svg';
import { passwordSchema } from '@/schemas/textSchemas';


const axios = require('axios').default;

export default function ProfileScreen() {
  const router = useRouter();
  const { setProfileData, setIsLoading } = useProfile();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const { email } = useLocalSearchParams();

  const handleContinue = () => {
    setErrors([]);
    if (!password || !confirmPassword) {
      setErrors(["Password and confirmation are required"]);
      return;
    }
    if (password !== confirmPassword) {
      setErrors(["Passwords do not match"]);
      return;
    }
    try {
      v.parse(passwordSchema, password);
      router.push({ pathname: '/signUpUser', params: { email, password } });
    } catch (error) {
      setErrors(["Invalid password format"]);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Centered logo/title */}
      <View style={styles.logoContainer}>
        {/* <LeafTwig width={80} height={80} /> */}
        <Text style={styles.title}>Twigs</Text>
      </View>
      {/* Subtitle */}
      <Text style={styles.subtitle}>Create an account</Text>
      <Text style={styles.subsubtitle}>Enter your secure password</Text>
      <View style={styles.requirementsBox}>
        <Text style={styles.requirement}>• At least 8 characters</Text>
        <Text style={styles.requirement}>• One lowercase letter</Text>
        <Text style={styles.requirement}>• One uppercase letter</Text>
        <Text style={styles.requirement}>• One number</Text>
        <Text style={styles.requirement}>• One special character</Text>
      </View>
      {/* Form */}
      <View style={styles.formContainer}>
        <CustomInput
          onChangeText={setPassword}
          placeholder="Password"
          value={password}
          secureTextEntry
          style={styles.input}
        />
        <CustomInput
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          value={confirmPassword}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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