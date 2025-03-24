import Button from '@/components/Button';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const [username, setUsername] = useState(""); // Initialize useState to store username 
  const [password, setPassword] = useState(""); 
  const [phoneNum, setPhoneNum] = useState("");
  const [email, setEmail] = useState("");

  const credentialAsync = async () => { // Function to save credentials
    setUsername("");
    setPassword("");
    console.log("Username: " + username)
    console.log("Password: " + password)
   };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor={'#AFAFAF'}
        value={username}
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
        <Button theme='primary' label="Log In" onPress={credentialAsync}/> 
        <Button theme='primary' label="Sign Up" onPress={credentialAsync}/>
      </View>
    </View>
  );
}

/*

*/

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