import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

//TO-DO: Add API Integration for pulling and changing avatar once backend is ready

export default function ProfileScreen() {
  const router = useRouter();
  const { profileData, setProfileData, isLoading, setIsLoading } = useProfile();

  // Avatar state
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  // Generate a random color for the avatar
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const [avatarColor] = useState(getRandomColor());

  const pickImageAsync = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access photo library is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatar
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImageAsync,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const swipeDown = Gesture.Pan()
    .onEnd(event => {
      if (event.translationY > 50) {
        console.log("Swipe down registered");
      }
    });

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
            {/* Interactive Avatar */}
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              <View style={styles.avatarWrapper}>
                {selectedImage ? (
                  <Image 
                    source={{ uri: selectedImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>
                      {(profileData?.data?.displayName || 'User').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                
                {/* Camera overlay icon */}
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

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
    minHeight: 500,
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
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#585ABF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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