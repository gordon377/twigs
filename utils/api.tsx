import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';

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

export const changeUserInfo = async (
  setIsChanging: (loading: boolean) => void,
  editUserInfoFields: any,
  setProfileData: (data: any) => void,
  setIsLoading: (loading: boolean) => void
) => {
  console.log('changeUserInfo called');
  
  // Set loading to true if callback provided
  if (setIsChanging) {
    setIsChanging(true);
  }
  
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    console.log('Token retrieved:', token ? 'exists' : 'null');
    console.log('Refresh token retrieved:', refreshToken ? 'exists' : 'null');
    
    if (!token) {
      console.log('No access token found');
      if (setIsChanging) setIsChanging(false);
      return null;
    }

    if (!refreshToken) {
      console.log('No refresh token found');
      if (setIsChanging) setIsChanging(false);
      return null;
    }
    
    console.log('Making API call...');
    const response = await axios.patch(
      'https://twig-production.up.railway.app/change-profile',
      {
        refreshToken: refreshToken,
        id: editUserInfoFields.id,
        username: editUserInfoFields.username,
        displayName: editUserInfoFields.displayName,
        phoneNumber: editUserInfoFields.phoneNumber,
        bio: editUserInfoFields.bio,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    // Instead of calling useProfile(), use the passed-in setProfileData and setIsLoading
    try {
      await updateProfile(setProfileData, setIsLoading);
    } catch (error) {
      console.log('Error updating profile:', error);
    }
  
    return response.data;
  } catch (error: any) {
    console.log('Error in changeUserInfo:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
    } else {
      console.log('Server Error: ', error);
    }
    throw error;
  } finally {
    // Set loading to false when done
    if (setIsChanging) {
      setIsChanging(false);
    }
  }
}; 

export const changePassword = async (
  setIsChanging: (loading: boolean) => void,
  newPassword: any,
  setProfileData: (data: any) => void,
  setIsLoading: (loading: boolean) => void
) => {
  console.log('changePassword called');

  if (setIsChanging) setIsChanging(true);

  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    console.log('Token retrieved:', token ? 'exists' : 'null');
    console.log('Refresh token retrieved:', refreshToken ? 'exists' : 'null');

    if (!token) {
      console.log('No access token found');
      if (setIsChanging) setIsChanging(false);
      return null;
    }

    if (!refreshToken) {
      console.log('No refresh token found');
      if (setIsChanging) setIsChanging(false);
      return null;
    }

    console.log('Making API call...');
    const response = await axios.patch(
      'https://twig-production.up.railway.app/change-password',
      {
        refreshToken: refreshToken,
        newPassword: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    // Update Profile after changing credentials
    try {
      await updateProfile(setProfileData, setIsLoading);
    } catch (error) {
      console.log('Error updating profile:', error);
    }

    return response.data;
  } catch (error: any) {
    console.log('Error in changePassword:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
      alert(error.response.data.detail || 'An error occurred while changing password');
    } else {
      console.log('Server Error: ', error);
    }
    throw error;
  } finally {
    if (setIsChanging) setIsChanging(false);
  }
};

export const changeEmail = async (
  setIsChanging: (loading: boolean) => void,
  newEmail: any,
  setProfileData: (data: any) => void,
  setIsLoading: (loading: boolean) => void
) => {
  console.log('changeEmail called');

  if (setIsChanging) setIsChanging(true);

  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    console.log('Token retrieved:', token ? 'exists' : 'null');
    console.log('Refresh token retrieved:', refreshToken ? 'exists' : 'null');

    if (!token) {
      console.log('No access token found');
      if (setIsChanging) setIsChanging(false);
      return null;
    }

    if (!refreshToken) {
      console.log('No refresh token found');
      if (setIsChanging) setIsChanging(false);
      return null;
    }

    console.log('Making API call...');
    const response = await axios.patch(
      'https://twig-production.up.railway.app/change-email',
      {
        refreshToken: refreshToken,
        newEmail: newEmail,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    // Update Profile after changing credentials
    try {
      await updateProfile(setProfileData, setIsLoading);
    } catch (error) {
      console.log('Error updating profile:', error);
    }

    return response.data;
  } catch (error: any) {
    console.log('Error in changeEmail:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
    } else {
      console.log('Server Error: ', error);
    }
    throw error;
  } finally {
    if (setIsChanging) setIsChanging(false);
  }
};
