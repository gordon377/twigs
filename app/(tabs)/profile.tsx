import Button from '@/components/Button';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import * as v from 'valibot'; //Validator Library

export default function ProfileScreen() {
  const LoginSchema = v.object({ 
    identity: v.pipe( // Can be Phone Num, Email, or Name
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Please enter your name, email, or phone number"),
    ),
    password: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Password cannot be empty"),
    ),
  });

  const SignUpSchema = v.object({
    name: v.pipe( // If using full names, we need to generate a Unique ID for each user for security, similar to discord
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Name cannot be empty"),
      v.minLength(8, "Name must be at least 8 characters"),
    ),
    email: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Email cannot be empty"),
      v.email("Please enter a valid email address"),
    ),
    password: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Password cannot be empty"),
      v.minLength(8, "Password must be at least 8 characters"),
      v.maxLength(30, "Password must be at most 30 characters"),
      v.regex(/[a-z]/, 'Your password must contain a lowercase letter.'),
      v.regex(/[A-Z]/, 'Your password must contain a uppercase letter.'),
      v.regex(/[0-9]/, 'Your password must contain a number.'),
      v.regex(/[^A-Za-z0-9]/, 'Your password must contain a special character.'),
    ),
    phoneNum: v.pipe(
      v.number("Must use numbers only"),
    ),
  });

  function createProfile(data:unknown){
    return v.parse(SignUpSchema, data);
  }

  const [name, setName] = useState(""); // Initialize useState to store name 
  const [password, setPassword] = useState(""); 
  const [phoneNum, setPhoneNum] = useState("");
  const [email, setEmail] = useState("");

  const LogInAsync = async () => { // Function to save credentials
    setName("");
    setPassword("");
    setPhoneNum("");
    setEmail("");
    console.log("Name: " + name)
    console.log("Password: " + password)
    console.log("Phone Number: " + phoneNum)
    console.log("Email: " + email)
   };

   const SignUpAsync = async () => { // Function to save credentials
    setName("");
    setPassword("");
    setPhoneNum("");
    setEmail("");
    console.log("Name: " + name)
    console.log("Password: " + password)
    console.log("Phone Number: " + phoneNum)
    console.log("Email: " + email)
    const signUpData = createProfile({name, password, phoneNum, email})
    console.log("Parsed Data: " + signUpData)
   };

  return ( //Create modals to explain each of the sign up componenets (reasoning, security, etc.)
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setName}
        placeholder="Full Name"
        placeholderTextColor={'#AFAFAF'}
        value={name}
      />
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        placeholder="Password" //Figure out how to change this color
        placeholderTextColor={'#AFAFAF'}
        value={password}
      />
      <TextInput
        style={styles.input}
        onChangeText={setPhoneNum}
        placeholder="Phone #" //Figure out how to change this color
        placeholderTextColor={'#AFAFAF'}
        value={phoneNum}
      />
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        placeholder="Email" //Figure out how to change this color
        placeholderTextColor={'#AFAFAF'}
        value={email}
      />
      <View style={styles.footerContainer}>
        <Button theme='primary' label="Log In" onPress={LogInAsync}/> 
        <Button theme='primary' label="Sign Up" onPress={SignUpAsync}/>
      </View>
    </View>
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
  input:{
    width: 250,
    height: 40,
    margin: 12,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
    padding: 20,
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer:{
    flex: 1/3,
    alignItems: 'center',
  }
});