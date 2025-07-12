import { StyleSheet, Text, View, Image, Button, Modal, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import type { AxiosResponse } from 'axios';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const axios = require('axios').default;

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  async function updateProfileScreen() {
    console.log('updateProfileScreen called');
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken'); // Get refresh token
      
      console.log('Token retrieved:', token ? 'exists' : 'null');
      console.log('Refresh token retrieved:', refreshToken ? 'exists' : 'null');
      
      if (!token) {
        console.log('No access token found');
        return;
      }

      if (!refreshToken) {
        console.log('No refresh token found');
        return;
      }

      console.log('=== DEBUG INFO ===');
      console.log('Token type:', typeof token);
      console.log('Token value:', token);
      console.log('Refresh token type:', typeof refreshToken);
      console.log('Refresh token value:', refreshToken);
      console.log('Refresh token length:', refreshToken?.length);
      console.log('==================');
      
      console.log('Making API call...');
      const response = await axios.post(
        'https://twig-production.up.railway.app/profile',
        {
          refresh_token: refreshToken // Include refresh token in request body
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('API call successful');
      console.log('Response data:', response.data);
      setProfileData(response.data);
    } catch (error: any) {
      console.log('=== ERROR DETAILS ===');
      console.log('Error type:', typeof error);
      console.log('Error message:', error.message);
      console.log('Error response status:', error.response?.status);
      console.log('Error response data:', error.response?.data);
      console.log('Request config:', error.config);
      console.log('=====================');

      console.log('Error in updateProfileScreen:', error);
      if (error.response && error.response.data) {
        console.log('Server Error Data: ', error.response.data);
      } else {
        console.log('Server Error: ', error);
      }
    }
  }

  const swipeDown = Gesture.Pan()
    .onEnd((event) => {
      if (event && event.translationY > 50) {
        setTimeout(() => {
          updateProfileScreen();
        }, 0);
      }
    });

  const SettingsDrawer = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={settingsVisible}
      onRequestClose={() => setSettingsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.settingsDrawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsContent}>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="person-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="lock-closed-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="help-circle-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="information-circle-outline" size={20} color="#fff" />
              <Text style={styles.settingText}>About</Text>
              <Ionicons name="chevron-forward" size={20} color="#AFAFAF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.settingItem, styles.logoutItem]}>
              <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
              <Text style={[styles.settingText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <GestureDetector gesture={swipeDown}>
      <View style={styles.container}>
        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <Image
          source={{ uri: 'https://ui-avatars.com/api/?name=User&background=585ABF&color=fff&size=128' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>johndoe@email.com</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Bio:</Text>
          <Text style={styles.infoText}>This is a placeholder profile. Update your information here.</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Test API Call" onPress={updateProfileScreen} color="#ffd33d" />
        </View>
        
        <SettingsDrawer />
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
  settingsDrawer: {
    backgroundColor: '#25292e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    padding: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  drawerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsContent: {
    marginTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  logoutItem: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#ff6b6b',
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