import Button from '@/components/Button';
import CustomInput from '@/components/TextInput';
import { useState } from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as v from 'valibot'; //Validator Library
import type { AxiosResponse } from 'axios';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors } from '@/styles/styles';

const axios = require('axios').default;

export default function ProfileScreen() {
  const router = useRouter();


  const SignUpSchema = v.object({
    displayName: v.pipe( 
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Display Name cannot be empty"),
    ),
    username: v.pipe( // If using full names, we need to generate a Unique ID for each user for security, similar to discord
      v.string("Invalid: Enter a string"),
      v.nonEmpty("User ID cannot be empty"),
    ),
    email: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Email cannot be empty"),
      v.email("Please enter a valid email address"),
    ),
    password: v.pipe(
      v.string("Invalid: Enter a string"),
      v.minLength(8, "Password must be at least 8 characters"),
      v.regex(/[a-z]/, 'Your password must contain a lowercase letter.'),
      v.regex(/[A-Z]/, 'Your password must contain a uppercase letter.'),
      v.regex(/[0-9]/, 'Your password must contain a number.'),
      v.regex(/[^A-Za-z0-9]/, 'Your password must contain a special character.'),
    ),
    phoneNum: v.pipe(
      v.number("Must use numbers only for your Phone Number"),
    ),
    bio: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Bio cannot be empty"),
      v.maxLength(100, "Bio cannot be more than 100 characters"),
    ),
  });

  function credentialsParse(data:unknown){
    return v.parse(SignUpSchema, data);
  }

  // Initialize useState to store login variables
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNum, setPhoneNum] = useState<number | undefined>(undefined); //Default to 0 as integer
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]); // Initialize useState to store errors

  function cleanUp() { // Function to clear stored values
    setDisplayName("");
    setUsername("");
    setPassword("");
    setPhoneNum(undefined);
    setEmail("");
    setBio("");
    setConfirmPassword("");
    setErrors([]);
    }

   const SignUpAsync = async () => { // Function to save credentials
    console.log("Display Name: " + displayName)
    console.log("Bio: " + bio)
    console.log("Username: " + username)
    console.log("Password: " + password)
    console.log("Confirm Password: " + confirmPassword)
    console.log("Phone Number: " + phoneNum)
    console.log("Email: " + email)

    if (password !== confirmPassword) {
      setErrors(["Passwords do not match"]);
      alert("Passwords do not match");
      return;
    }

    // Attempt to Validate user input
    try {
      const signUpData = credentialsParse({displayName, bio, username, password, phoneNum, email})
      console.log("Parsed Data: " + signUpData)

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
    axios.post('https://twig-production.up.railway.app/signup', {
      email: email,
      phonenumber: phoneNum?.toString(), // Conversion to string for backend
      password: password,
      username: username,
      displayname: displayName,
      bio: bio,
    })
    .then(function (response: AxiosResponse) {
      console.log("Server Response: ", response.data);
    })
    .catch(function(error:any) {
      if (error.response && error.response.data) {
        console.log("Server Error Data: ", error.response.data);
      } else {
        console.log("Server Error: ", error);
      }
      alert("Sign-Up failed, try again");
    })
    .finally(cleanUp());
   };
   

  return ( //Create modals to explain each of the sign up componenets (reasoning, security, etc.)
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Removed back button from header */}
      </View>

      <View style={styles.formContainer}>
        <CustomInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <CustomInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <CustomInput
          placeholder="Confirm Password"
          value={confirmPassword} 
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <CustomInput
          placeholder="Phone Number"
          value={phoneNum ? phoneNum.toString() : ""}
          onChangeText={(value) => { 
            if (!isNaN(Number(value))) {
              setPhoneNum(Number(value)); //String to Num for internal processing
            }
            }}
          keyboardType="phone-pad"
        />
        <CustomInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <CustomInput
          placeholder="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <CustomInput
          placeholder="Bio"
          value={bio}
          onChangeText={setBio}
        />
      
        <Button theme='primary' label="Sign Up" onPress={SignUpAsync}/>
        
        <TouchableOpacity 
          style={styles.arrowButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.arrowButtonText}>Back to Login</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
    flex: 1/3,
    alignItems: 'center',
    justifyContent: 'center',
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
  text:{
    color: '#fff',
    fontSize: 20
  },
  button:{
    fontSize: 20,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  input:{
    width: 250,
    height: 40,
    margin: 12,
    marginHorizontal: 20,
    color: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    padding: 10,
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer:{
    flex: 1/3,
    alignItems: 'center',
  },
  arrowButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
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