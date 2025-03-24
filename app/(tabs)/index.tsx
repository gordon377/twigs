import Button from '@/components/Button';
import ImageViewer from '@/components/ImageViewer';

import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PlaceholderImage = require('@/assets/images/sharing/places/image-5.png');

export default function Index() {

  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined); // Initialize useState to store selected image uri

  const pickImageAsync = async () => { // Function to pick image from gallery
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images'],
      allowsEditing: true, //Enables cropping (both iOS and Android)
      quality: 1,
    });

    if (!result.canceled) { // If image is selected
      alert('Image selected.');
      setSelectedImage(result.assets[0].uri); // Set selected image uri to state
    } else {
      alert('You did not select any image.');
      console.log('You did not select any image. Oh no');
    }
  };
  return ( // Visible Elements
    <View style={styles.container}>
      <Text style={styles.text}>HOME TEST!</Text>
      <View style={styles.imageContainer}>
        <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage}/>
      </View>
      <View style={styles.footerContainer}>
        <Button theme='primary' label="Press Me!" onPress={pickImageAsync}/>
        <Button label="Upload Photo" />
      </View>
      <Link href="/about" style={styles.button}>To About Screen</Link>
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
    fontSize: 20,
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