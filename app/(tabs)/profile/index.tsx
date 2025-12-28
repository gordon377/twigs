import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import { uploadProfilePicture, getProfilePicture, deleteProfilePicture, changeUserInfo, changePassword, changeEmail } from '@/utils/api';
import * as SecureStore from 'expo-secure-store';
import { commonStyles } from '@/styles/styles';
// FileSystem not used here after refactor


export default function ProfileScreen() {
  const avatarShotRef = React.useRef<any>(null);
  const router = useRouter();
  const { profileData, setProfileData, isLoading, setIsLoading, profilePicture, setProfilePicture } = useProfile();

  // Avatar state
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState<string | undefined>(undefined);
  const [avatarColor] = useState(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  });
  const [refreshing, setRefreshing] = useState(false);

  // Helper to create object URL from blob
  const getBlobUrl = useCallback((blob: Blob | null) => {
    if (!blob) return undefined;
    try {
      return URL.createObjectURL(blob);
    } catch {
      return undefined;
    }
  }, []);
  const profileBlobUrl = getBlobUrl(profilePicture);

  // Load profile data and picture on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading?.(true);
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        await updateProfile(setProfileData, setIsLoading, setProfilePicture);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading?.(false);
      }
    };
    fetchProfile();
  }, [setProfileData, setIsLoading, setProfilePicture, getBlobUrl]);

  // Pick image from library
  const pickImageAsync = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access photo library is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        setImageError(undefined);
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        // Upload by passing the image URI directly (api.uploadProfilePicture resizes to 512x512)
        await uploadProfilePicture(result.assets[0].uri, refreshToken || '');
        await getProfilePicture(setProfilePicture);
      } else {
        setImageError('Invalid image URI');
      }
    } catch (error) {
      setImageError('Failed to pick image');
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Image picker error:', error);
    }
  }, [setSelectedImage, setImageError, setProfilePicture]);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      console.log('Camera result:', result); // Debug log

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        setImageError(undefined);
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const asset = result.assets[0];
        // Upload by passing the image URI directly (api.uploadProfilePicture resizes to 512x512)
        await uploadProfilePicture(asset.uri, refreshToken || '');
        await getProfilePicture(setProfilePicture);
      } else {
        setImageError('Invalid image URI');
        Alert.alert('Error', 'Invalid image URI returned from camera.');
        console.error('Camera result error:', result);
      }
    } catch (error) {
      setImageError('Failed to take photo');
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    }
  }, [setSelectedImage, setImageError, setProfilePicture]);
  // Show image options
  const showImageOptions = useCallback(() => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImageAsync },
        { text: 'Delete Profile Picture', onPress: async () => {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            await deleteProfilePicture(refreshToken || '');
            setProfilePicture(null);
            setSelectedImage(undefined);
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [takePhoto, pickImageAsync, setProfilePicture]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsLoading?.(true);
    try {
      await updateProfile(setProfileData, setIsLoading, setProfilePicture);
    } catch (err) {
      console.error('Pull to refresh error:', err);
    } finally {
      setIsLoading?.(false);
      setRefreshing(false);
    }
  }, [setProfileData, setIsLoading, setProfilePicture]);

  // UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', paddingVertical: 8 }}>
          <ActivityIndicator color="#585ABF" />
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#585ABF']} />
        }
      >
        {/* Top right settings button */}
        <View style={commonStyles.headerRow}>
          <TouchableOpacity
            style={commonStyles.circularButton}
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
              {selectedImage && typeof selectedImage === 'string' && (selectedImage ?? '').trim() !== '' ? (
                <Image
                  source={{ uri: selectedImage as string }}
                  style={styles.avatarImage}
                  onError={e => {
                    setImageError('Failed to load selected image');
                    Alert.alert('Error', 'Failed to load selected image.');
                  }}
                />
              ) : profileBlobUrl ? (
                <Image
                  source={{ uri: profileBlobUrl }}
                  style={styles.avatarImage}
                  onError={e => {
                    setImageError('Failed to load profile image');
                    Alert.alert('Error', 'Failed to load profile image.');
                  }}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}> 
                  <Text style={styles.avatarText}>
                    {(profileData?.data?.displayName || 'User').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
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
            onPress={() => updateProfile(setProfileData, setIsLoading, setProfilePicture)}
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
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 500,
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