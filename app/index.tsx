import Button from '@/components/Button';
import CustomInput from '@/components/TextInput';
import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Image, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as v from 'valibot'; //Validator Library
import * as SecureStore from 'expo-secure-store'; // For secure storage of tokens
import { useRouter } from 'expo-router';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import LeafTwig from '@/assets/appIcons/leafTwig.svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const axios = require('axios').default;

export default function ProfileScreen() {

  const router = useRouter();
  const { setProfileData, setIsLoading } = useProfile(); // Get both from context

  const LoginSchema = v.object({ 
    email: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Email cannot be empty"),
      v.email("Please enter a valid email address"),
    ),
    password: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Password cannot be empty"),
    ),
  });

  function credentialsParse(data:unknown){
    return v.parse(LoginSchema, data);
  }

  const [password, setPassword] = useState(""); // Initialize useState to store login variables
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]); // Initialize useState to store errors

  function cleanUp() { // Function to clear stored values
    setPassword("");
    setEmail("");
    setErrors([]);
    }


  const LogInAsync = async () => {
    // Attempt to Validate user input
    try {
      const logInData = credentialsParse({email, password});
      console.log("Parsed Data: " + logInData)

    } catch (error) {
      if (error instanceof v.ValiError) { //Extract & Display Error Messages
        console.log("Validation Error: ", error.message);
        console.log("Validation Issue: ", error.issues);
        alert("Validation Error: " + error.message);
        const errorMessages = error.issues.map((issue) => issue.message);
        setErrors(errorMessages);
      } else {
        console.log("Unexpected Error: ", error);
      }
      return; // Stop execution if validation fails
    }
    
    // Send parsed data to server
    try {
      const response = await axios.post('https://twig-production.up.railway.app/login', {
        email,
        password,
      });

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', response.data.access_token);
      await SecureStore.setItemAsync('refreshToken', response.data.refresh_token);

      console.log("Access Token stored!");
      console.log("Refresh Token stored!");

      // Call updateProfile and pass setProfileData to store the result
      try {
        await updateProfile(setProfileData, setIsLoading);
      } catch (error) {
        console.log('Error updating profile:', error);
      }

      router.replace('/(tabs)/profile');
      
    } catch (error: any) {
      if (error.response && error.response.data) {
        console.log("Server Error Data: ", error.response.data);
      } else {
        console.log("Server Error: ", error);
      }
      alert("Login failed. Please check your credentials and try again.");
    } finally {
      cleanUp();
    }
   };

  return ( //Create modals to explain each of the sign up componenets (reasoning, security, etc.)
      <SafeAreaView style={styles.container}>
        {/* Placeholder image component */}
        {/* FOR LATER (LOGO SHOW)
        <View style={styles.imageContainer}>
          <LeafTwig width={500} height={500} style={{ alignSelf: 'center' }} />
        </View>
        */}
          <View style={styles.formContainer}>
            <CustomInput 
              onChangeText={setEmail} 
              placeholder="Email" 
              value={email}
              />
            <CustomInput 
              onChangeText={setPassword} 
              placeholder="Password" 
              value={password}
              secureTextEntry
              />
            <Button 
              theme='primary' 
              label="Log In" 
              onPress={LogInAsync}/> 
            <TouchableOpacity 
              onPress={() => router.push('/signup')}
              style={styles.arrowButton}
            >
              <Text style={styles.arrowButtonText}>Sign-Up</Text>
              <Ionicons name="arrow-forward" size={20} color={'#fff'}/>
            </TouchableOpacity>
          </View>
          
          {errors.length > 0 && (
            <View style={styles.footerContainer}>
              {errors.map((error, index) => (
                <Text key={index} style={{ color: 'red'}}>
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
    backgroundColor: '#25292e',
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingTop: 10,
  },
  text:{
    color: '#fff',
    fontSize: 20
  },
  button:{
    fontSize: 20,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: 'transparent',
    width: '100%',
  },
  arrowButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer:{
    flex: 1/3,
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});