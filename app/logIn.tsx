import CustomInput from '@/components/TextInput';
import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Image, View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as v from 'valibot';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import { logIn } from '@/utils/api';

const axios = require('axios').default;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const { setProfileData, setIsLoading } = useProfile();

  // Wrap logIn in a function to match the expected onPress signature
  const handleLogIn = async () => {
    setErrors([]); // Clear previous errors
    if (isLoggingIn) return; // Prevent multiple submissions
    console.log("Logging in with:", { email, password });
    if (!email || !password) {
      setErrors(["Email and password required"]);
      return;
    }
    await logIn(setIsLoggingIn, password, email, setErrors, setProfileData, setIsLoading, router);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Centered logo/title */}
      <View style={styles.logoContainer}>
        {/* <LeafTwig width={80} height={80} /> */}
        <Text style={styles.title}>Twigs</Text>
      </View>
      {/* Subtitle */}
      <Text style={styles.subtitle}>Log-In to your account</Text>
      <Text style={styles.subsubtitle}>Enter your email and password for your account</Text>
      {/* Form */}
      <View style={styles.formContainer}>
        <CustomInput
          onChangeText={setEmail}
          placeholder="email@domain.com"
          value={email}
          style={styles.input}
        />
        <CustomInput
          onChangeText={setPassword}
          placeholder="Password"
          value={password}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleLogIn}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Log-In</Text>
          )}
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.socialButton} disabled>
          <Ionicons name="logo-google" size={20} color="#4285F4" style={{ marginRight: 8 }} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} disabled>
          <Ionicons name="logo-apple" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
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
      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        By clicking continue, you agree to our{' '}
        <Text style={styles.link}>Terms of Service</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>
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