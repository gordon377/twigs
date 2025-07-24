import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { profileData, setProfileData, isLoading, setIsLoading } = useProfile();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <GestureDetector gesture={swipeDown}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Top right settings button */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(tabs)/profile/settings' as any)}
          >
            <Ionicons name="settings-outline" size={24} color="#585ABF" />
          </TouchableOpacity>
        </View>

        {/* Centered profile content */}
        <View style={styles.centeredContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://ui-avatars.com/api/?name=User&background=585ABF&color=fff&size=128' }}
              style={styles.avatar}
            />
          </View>

          {/* Name and Email */}
          <Text style={styles.title}>
            {profileData?.data?.displayName || 'John Doe'}
          </Text>
          <Text style={styles.email}>
            {profileData?.email || 'johndoe@email.com'}
          </Text>

          {/* Bio */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoText}>
              {profileData?.data?.bio || 'This is a placeholder profile.'}
            </Text>
          </View>

          {/* Update Profile Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => updateProfile(setProfileData, setIsLoading)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 500, // Optional: ensures vertical centering on tall screens
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  avatarContainer: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#585ABF',
    borderWidth: 3,
    borderColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    color: '#585ABF',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoLabel: {
    color: '#25292e',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  infoText: {
    color: '#25292e',
    fontSize: 15,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#585ABF',
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
});