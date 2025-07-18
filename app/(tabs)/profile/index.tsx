import { StyleSheet, Text, View, Image, Button, Modal, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import CustomInput from '@/components/TextInput'
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { profileData, setProfileData, isLoading, setIsLoading } = useProfile(); // Use context
  const [modals, setModals] = useState({
    settings: false,
    editProfile: false,
    editGeneral: false,
    editPersonal: false,
    editPassword: false,
  });

  const swipeDown = Gesture.Pan()
    .onEnd(event => {
      if (event.translationY > 50) {
        console.log("Swipe down registered");
      }
    }
    )
  {/* This gesture is currently crashing the app
  const swipeDown = Gesture.Pan()
    .onUpdate((event) =>{
      console.log("Translation Y: " + event.translationY);
    }
  )
    .onEnd(async(event) => {
      console.log("Debug 2")
      try{
        if (event && event.translationY > 50) {
            console.log("Debug 1")
            setIsLoading(true); // Show spinner
            await updateProfile(setProfileData, setIsLoading)
            console.log("Debug 3")
          }
        } 
      catch (error) {
        console.error('Error during swipe down:', error);
        }
      setIsLoading(false); // Hide spinner
      console.log("Debug 4")
      }
    );
  */}

  return (
    <GestureDetector gesture={swipeDown}>
      <View style={styles.container}>
        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/profile/settings' as any)} //Expo Router's type definitions are out of dat so as any is needed?
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <Image
          source={{ uri: 'https://ui-avatars.com/api/?name=User&background=585ABF&color=fff&size=128' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {profileData?.data?.displayName || 'John Doe'}
        </Text>
        <Text style={styles.email}>
          {profileData?.email || 'johndoe@email.com'}
        </Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Bio:</Text>
          <Text style={styles.infoText}>
            {profileData?.data?.bio || 'This is a placeholder profile.'}
          </Text>
        </View>
        {isLoading && (
          <ActivityIndicator size="large" color="#ffd33d" style={{ marginBottom: 16 }} />
        )}
        <View style={styles.buttonContainer}>
          <Button title="Update Profile" onPress={() => updateProfile(setProfileData, setIsLoading)} color="#ffd33d" />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    backgroundColor: '#585ABF',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#AFAFAF',
    fontSize: 16,
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    color: '#fff',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 8,
  },
});