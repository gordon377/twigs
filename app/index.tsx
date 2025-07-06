import Button from '@/components/Button';
import CustomInput from '@/components/TextInput';
import { useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, TextInput, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as v from 'valibot'; //Validator Library
import type { AxiosResponse } from 'axios';

const axios = require('axios').default;

export default function ProfileScreen() {
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


  const LogInAsync = async () => { // Function to save credentials
    console.log("Password: " + password)
    console.log("Email: " + email)
   };

  return ( //Create modals to explain each of the sign up componenets (reasoning, security, etc.)
    <SafeAreaView style={styles.container}>
      
      <CustomInput onChangeText={setEmail} placeholder="Email" value={email}/>
      <CustomInput onChangeText={setPassword} placeholder="Password" value={password}/>
      <Button theme='primary' label="Log In" onPress={LogInAsync}/> 

      {errors.length > 0 && (
        <View style={styles.footerContainer}>
          {errors.map((error, index) => (
            <Text key={index} style={{ color: 'red'}}>
              {error}
            </Text>
          ))}
        </View>
      )}
      <Link href="/signup" style={styles.button}>New? Register Here</Link>
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
  text:{
    color: '#fff',
    fontSize: 20
  },
  button:{
    fontSize: 20,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer:{
    flex: 1/3,
    alignItems: 'center',
  }
});