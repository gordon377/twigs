import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export const logOut = async(setIsLoggingOut: (loading: boolean) => void) => {
  console.log('logOut called');
  const router = useRouter();

  if (setIsLoggingOut) {
    setIsLoggingOut(true);
  }

  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    console.log('Token retrieved:', token ? 'exists' : 'null');
    console.log('Refresh token retrieved:', refreshToken ? 'exists' : 'null');

    if (!token) {
      console.log('No access token found');
      if (setIsLoggingOut) setIsLoggingOut(false);
      return null;
    }

    console.log('Making API call...');
    const response = await axios.post(
      'https://twig-production.up.railway.app/logout',
      {refreshToken: refreshToken},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    )
    console.log('API call successful');
    console.log('Response data:', response.data);
    
    if (response.status === 200) {
      alert('Logged out successfully');
      // Clear tokens from SecureStore
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');

      console.log('Tokens cleared');
      router.replace('/');
      console.log('Back to Login');

    } else {
      console.log('Logout failed');
    }
  } catch (error: any) {
    console.log('Error in logOut:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
    } else {
      console.log('Server Error: ', error);
    }
    throw error;
  } finally {
    if (setIsLoggingOut) {
      setIsLoggingOut(false);
    }
  }
}

export const updateProfile = async (
  setProfileData?: (data: any) => void,
  setIsLoading?: (loading: boolean) => void
) => {
  console.log('updateProfile called');
  
  // Set loading to true if callback provided
  if (setIsLoading) {
    setIsLoading(true);
  }
  
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    console.log('Token retrieved:', token ? 'exists' : 'null');
    console.log('Refresh token retrieved:', refreshToken ? 'exists' : 'null');
    
    if (!token) {
      console.log('No access token found');
      if (setIsLoading) setIsLoading(false);
      return null;
    }
    
    console.log('Making API call...');
    const response = await axios.post(
      'https://twig-production.up.railway.app/profile',
      {refreshToken: refreshToken},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);
    
    // If setProfileData callback is provided, update the context
    if (setProfileData) {
      setProfileData(response.data);
    }
    
    return response.data;
  } catch (error: any) {
    console.log('Error in updateProfile:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
    } else {
      console.log('Server Error: ', error);
    }
    throw error;
  } finally {
    // Set loading to false when done
    if (setIsLoading) {
      setIsLoading(false);
    }
  }
}; 
