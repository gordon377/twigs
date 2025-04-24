import Button from '@/components/Button';
import { useState } from 'react';
import { StyleSheet, TextInput, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as v from 'valibot'; //Validator Library
import axios from 'axios'; //HTTP Client Library

export default function ProfileScreen() {
  const LoginSchema = v.object({ 
    identity: v.pipe( // Can be Phone Num, Email, or userID
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Please enter your userID, email, or phone number"),
    ),
    password: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Password cannot be empty"),
    ),
  });

  const SignUpSchema = v.object({
    userID: v.pipe( // If using full userIDs, we need to generate a Unique ID for each user for security, similar to discord
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
      v.nonEmpty("Password cannot be empty"),
      v.minLength(8, "Password must be at least 8 characters"),
      v.regex(/[a-z]/, 'Your password must contain a lowercase letter.'),
      v.regex(/[A-Z]/, 'Your password must contain a uppercase letter.'),
      v.regex(/[0-9]/, 'Your password must contain a number.'),
      v.regex(/[^A-Za-z0-9]/, 'Your password must contain a special character.'),
    ),
    phoneNum: v.pipe(
      v.number("Must use numbers only for your Phone Number"),
    ),
  });

  function createProfile(data:unknown){
    return v.parse(SignUpSchema, data);
  }

  const [userID, setUserID] = useState(""); // Initialize useState to store login variables
  const [password, setPassword] = useState(""); 
  const [phoneNum, setPhoneNum] = useState<number | undefined>(undefined); //Default to 0 as integer
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]); // Initialize useState to store errors

  const LogInAsync = async () => { // Function to save credentials
    setUserID("");
    setPassword("");
    setPhoneNum(undefined);
    setEmail("");
    console.log("userID: " + userID)
    console.log("Password: " + password)
    console.log("Phone Number: " + phoneNum)
    console.log("Email: " + email)
   };

   const SignUpAsync = async () => { // Function to save credentials
    setUserID("");
    setPassword("");
    setPhoneNum(undefined);
    setEmail("");
    console.log("userID: " + userID)
    console.log("Password: " + password)
    console.log("Phone Number: " + phoneNum)
    console.log("Email: " + email)
    try {
      // Parse and Validate data
      const signUpData = createProfile({userID, password, phoneNum, email})
      console.log("Parsed Data: " + signUpData)


      // Send parsed data to server
      const response = await axios.post('https://twig-backend-production.railway.internal:8080/signup', signUpData);

      // Handle server response
      if(response.status === 200) {
        const responseData = await response.data();
        console.log("Server Response: ", responseData);
        setErrors([]); //Clear errors on successful validation & post request
      } else {
        const errorData = await response.data();
        console.log("Server Error: ", errorData);
        setErrors([errorData.message]); //Set errors if server returns an error
      }
    } catch (error) {
      if (error instanceof v.ValiError) { //Extract & Display Error Messages
        console.log("Validation Error: ", error.message);
        console.log("Validation Issue: ", error.issues);
        const errorMessages = error.issues.map((issue) => issue.message);
        setErrors(errorMessages);
      } else {
        console.log("Unexpected Error: ", error);
      }
    }
   };
   

  return ( //Create modals to explain each of the sign up componenets (reasoning, security, etc.)
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setUserID}
        placeholder="Unique User ID" //** Do we want a useruserID as well? */ */
        placeholderTextColor={'#AFAFAF'}
        value={userID}
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
        onChangeText={(value) => { 
          if (!isNaN(Number(value))) {
            setPhoneNum(Number(value)); //String to Num for internal processing
          }
         }} 
        placeholder="Phone #" //Figure out how to change this color
        placeholderTextColor={'#AFAFAF'}
        value={phoneNum ? phoneNum.toString() : ""} //Num back to string for display
      />
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        placeholder="Email" //Figure out how to change this color
        placeholderTextColor={'#AFAFAF'}
        value={email}
      />
      <Text style={styles.text}>Test Input Update (userID): {userID}</Text>
        <Button theme='primary' label="Log In" onPress={LogInAsync}/> 
        <Button theme='primary' label="Sign Up" onPress={SignUpAsync}/>
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
    justifyContent: "flex-start",
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
    color: '#fff',
    borderWidth: 3,
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