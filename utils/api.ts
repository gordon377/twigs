import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as v from 'valibot';
import { logInParsed, signUpParsed } from '@/schemas/textSchemas';
import { Alert } from 'react-native';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { colors } from '@/styles/styles';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const API_BASE_MAIN = 'https://twig-production.up.railway.app';
const API_BASE = 'http://twig-test.up.railway.app'; // Test server (currently in use)

{/* Profile/User Management */}

// logOut
export const logOut = async (
  setIsLoggingOut: (loading: boolean) => void,
  router: any
) => {
  console.log('logOut called');

  if (setIsLoggingOut) setIsLoggingOut(true);

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
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
        },
      body: JSON.stringify({ refreshToken: refreshToken }),
      });
    console.log('API call successful');
    console.log('Response:', response);

    const data = await response.json();
    console.log('Response data:', data);

    if (response.status === 200) {
      await SecureStore.deleteItemAsync('email');
      await SecureStore.deleteItemAsync('password');
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
    if (setIsLoggingOut) setIsLoggingOut(false);
  }
};

// logIn
export const logIn = async (
  setIsLoggingIn: (loading: boolean) => void,
  password: string,
  email: string,
  setErrors: (data: any) => void,
  setProfileData: (data: any) => void,
  setIsLoading: (loading: boolean) => void,
  router: any,
  options?: { silent?: boolean }
) => {
  const silent = options?.silent;

  if (!silent && setIsLoggingIn) setIsLoggingIn(true);

  function cleanUp() {
    if (!silent) setErrors([]);
  }

  try {
    if (!silent) {
      const logInData = logInParsed({ email, password });
    }
  } catch (error) {
    if (!silent) {
      if (error instanceof v.ValiError) {
        const errorMessages = error.issues.map((issue) => issue.message);
        setErrors(errorMessages);
        alert("Validation Error: " + error.message);
      } else {
        alert("Unexpected Error: " + error);
      }
      if (setIsLoggingIn) setIsLoggingIn(false);
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (!silent) alert("Login failed. Please check your credentials and try again.");
      return;
    }

    await SecureStore.setItemAsync('email', email);
    await SecureStore.setItemAsync('password', password);
    await SecureStore.setItemAsync('accessToken', data.access_token);
    await SecureStore.setItemAsync('refreshToken', data.refresh_token);

    try {
      await updateProfile(setProfileData, silent ? undefined : setIsLoading);
    } catch (error) {
      if (!silent) console.log('Error updating profile:', error);
    }

    if (!silent) {
      // Initialize calendars after successful login
      setTimeout(async () => {
        try {
          const { initializeCalendarsFromAPI } = require('@/contexts/EventsContext');
          if (initializeCalendarsFromAPI) {
            await initializeCalendarsFromAPI();
          }
        } catch (initError) {
          if (!silent) console.error('❌ Calendar initialization failed:', initError);
        }
      }, 1000);

      router.replace('/(tabs)/profile');
    }
  } catch (error: any) {
    if (!silent) {
      alert("Login failed. Please check your credentials and try again.");
    }
  } finally {
    cleanUp();
    if (!silent && setIsLoggingIn) setIsLoggingIn(false);
  }
};

// signUp
export const signUp = async (
  setIsLoggingIn: (loading: boolean) => void,
  setIsSigningUp: (loading: boolean) => void,
  password: string,
  email: string,
  displayName: string,
  username: string,
  bio: string,
  phoneNumber: number | undefined,
  setErrors: (data: any) => void,
  setProfileData: (data: any) => void,
  setIsLoading: (loading: boolean) => void,
  router: any
  ) => { // Function to save credentials
    console.log("Display Name: " + displayName)
    console.log("Bio: " + bio)
    console.log("Username: " + username)
    console.log("Password: " + password)
    console.log("Phone Number: " + phoneNumber)
    console.log("Email: " + email)

    function cleanUp() { // Function to clear stored values
        setErrors([]);
        }
    // Attempt to Validate user input
    try {
      const signUpData = signUpParsed({displayName, bio, username, password, phoneNumber, email})
      console.log("Parsed Data: " + signUpData)

    } catch (error) {
      if (error instanceof v.ValiError) { //Extract & Display Error Messages
        console.log("Validation Error: ", error.message);
        console.log("Validation Issue: ", error.issues);
        alert("Validation Error: " + error.message);
        const errorMessages = error.issues.map((issue) => issue.message);
        setErrors(errorMessages);
      } else {
        console.log("Unexpected Error: ", error);
      }
      return; // Stop execution if validation fails
    }
    
    // Send parsed data to server
    axios.post('https://twig-production.up.railway.app/signup', {
      email: email,
      phoneNumber: phoneNumber?.toString(), // Conversion to string for backend
      password: password,
      username: username,
      displayName: displayName,
      bio: bio,
    })
    .then(function (response: AxiosResponse) {
      console.log("Server Response: ", response.data);
      if (response.status === 200) {
        alert("Sign-Up Successful! Logging you in now...");
        setIsSigningUp(false);
        setIsLoggingIn(true);
        return logIn(setIsLoggingIn, password, email, setErrors, setProfileData, setIsLoading, router);
      } else {
        console.log("Sign-Up failed with status: ", response.status);
        alert("Sign-Up failed. Please try again.");
      }
    })
    .catch(function(error:any) {
      if (error.response && error.response.data) {
        console.log("Server Error Data: ", error.response.data);
      } else {
        console.log("Server Error: ", error);
      }
      alert("Sign-Up failed, try again");
    })
    .finally(cleanUp);
};

// Delete the current user's account
export const deleteAccount = async () => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return { success: false, error: 'No access token found' };

    const response = await fetch(
      `${API_BASE}/delete-account`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to delete account' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};


{/* Profile Management Routes */}

// updateProfile (Get User Profile Data)
export const updateProfile = async (
  setProfileData?: (data: any) => void,
  setIsLoading?: (loading: boolean) => void,
  setProfilePicture?: (blob: Blob | null) => void
) => {
  console.log('updateProfile called');

  if (setIsLoading) setIsLoading(true);

  await getProfilePicture(setProfilePicture);

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
      `${API_BASE}/profile`,
      { refreshToken: refreshToken },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    if (setProfileData) setProfileData(response.data);

    // Download profile picture as blob and save to context
    if (setProfilePicture && response.data?.profile_link) {
      try {
        const imgResp = await fetch(response.data.profile_link);
        if (imgResp.ok) {
          const blob = await imgResp.blob();
          setProfilePicture(blob);
        } else {
          setProfilePicture(null);
        }
      } catch (err) {
        setProfilePicture(null);
      }
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
    if (setIsLoading) setIsLoading(false);
  }
};

// POST /profile/picture - Upload profile picture
export const uploadProfilePicture = async (imageUri: string, refreshToken: string) => {
  console.log('uploadProfilePicture called');
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    if (!imageUri) throw new Error('No image URI provided');

    // Resize/normalize the image to 512x512 and compress it
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Build FormData with resized image and refreshToken
    const formData = new FormData();
    formData.append('refreshToken', refreshToken);

    // In React Native / Expo, append file as an object with uri, name, type
    // Cast to any to satisfy TypeScript's FormData.append typing for RN
    formData.append('file', {
      uri: manipulated.uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await fetch(`${API_BASE}/profile/picture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type here; let fetch set it automatically for FormData
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Failed to upload profile picture: ${data.detail || response.statusText}`);
    console.log('Upload response data:', data);
    return { success: true, data };
  } catch (error: any) {
    console.log('Error in uploadProfilePicture:', error);
    return { success: false, error: error.message };
  }
};

// GET /profile/picture - Retrieve profile picture
export const getProfilePicture = async (setProfilePicture?: (blob: Blob | null) => void) => {
  console.log('getProfilePicture called');
  try {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!accessToken) throw new Error('No access token found');

    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await fetch(`${API_BASE}/profile/get/picture`, {
      method: 'POST', //Temp Post for now
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshToken)
    });

    if (response.ok) {
      console.log(`Response: ${response}`); // Log the status code
    }
      const data = await response.json();
    if (!response.ok) throw new Error(`Failed to get profile picture: ${data.detail || response.statusText}`);
    console.log('Profile picture data:', data);

    // Download image as blob and save to context
    if (setProfilePicture && data?.data?.signed_url) {
      try {
        const imgResp = await fetch(data.data.signed_url);
        if (imgResp.ok) {
          const blob = await imgResp.blob();
          setProfilePicture(blob);
        } else {
          setProfilePicture(null);
        }
      } catch (err) {
        setProfilePicture(null);
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.log('Error in getProfilePicture:', error);
    return { success: false, error: error.message };
  }
};

// DELETE /profile/picture - Delete profile picture
export const deleteProfilePicture = async (refreshToken: string) => {
  console.log('deleteProfilePicture called');
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/profile/picture`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshToken),
    });

    if (!response.ok) throw new Error('Failed to delete profile picture');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// changeUserInfo
export const changeUserInfo = async (
  setIsChanging: (loading: boolean) => void,
  editUserInfoFields: any,
  setProfileData: (data: any) => void,
  setIsLoading: (loading: boolean) => void
) => {
  console.log('changeUserInfo called');

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
      `${API_BASE}/change-profile`,
      {
        refreshToken: refreshToken,
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
    if (setIsChanging) setIsChanging(false);
  }
};

// changePassword
export const changePassword = async (
  setIsChanging: (loading: boolean) => void,
  currentPassword: any,
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
      `${API_BASE}/change-password`,
      {
        refreshToken: refreshToken,
        newPassword: newPassword,
        currentPassword: currentPassword,
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

// changeEmail
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
      `${API_BASE}/change-email`,
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

{/* Calendar Management/CRUD Routes */}

// Create Calendar
export const createCalendar = async (calendarData: any) => {
  console.log('createCalendar called');

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }

    console.log('Making API call...');
    const response = await axios.post(
      `${API_BASE}/calendar`,
      { 
        name: calendarData.name,
        hexcode: calendarData.hexcode,
        is_private: calendarData.is_private || false,
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

    return { success: true, data: response.data };
  } catch (error: any) {
    console.log('Error in createCalendar:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to create calendar' 
    };
  }
};

// Get Calendars
export const getCalendars = async () => {
  console.log('getCalendars called');

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }

    console.log('Making API call...');
    const response = await axios.get(
      `${API_BASE}/calendar`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    return { success: true, data: response.data };
  } catch (error: any) {
    console.log('Error in getCalendars:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to get calendars' 
    };
  }
};

// Update Calendar
export const updateCalendar = async (calendarData: any) => {
  console.log('updateCalendar called');

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }

    console.log('Making API call...');
    const response = await axios.put(
      `${API_BASE}/calendar/${calendarData.calendarId}`,
      { 
        name: calendarData.name,
        hexcode: calendarData.hexcode,
        is_private: calendarData.is_private || false,
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

    return { success: true, data: response.data };
  } catch (error: any) {
    console.log('Error in updateCalendar:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to update calendar' 
    };
  }
};

// Delete Calendar

export const deleteCalendar = async (calendarData: any) => {
  console.log('deleteCalendar called');

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }

    console.log('Making API call...');
    const response = await axios.delete(
      `${API_BASE}/calendar/${calendarData.calendarId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    return { success: true, data: response.data };
  } catch (error: any) {
    console.log('Error in deleteCalendar:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to delete calendar' 
    };
  }
};

{/* Shared Calendar Routes */}

// Invite User to Calendar
export const inviteToCalendar = async (calendarId: string, targetUserId: string[], role: string[]) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/calendar/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calendarId,
        targetUserId,
        role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send calendar invites');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// GET Calendar Shares (Shared Calendars)
export const getCalendarShares = async (calendarId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    // CHECKBACK: Is calendarId here supposed to be a query param or in the body?
    const response = await fetch(`${API_BASE}/calendar/shares?calendarId=${encodeURIComponent(calendarId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get calendar shares');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update Shared Calendar Access
export const updateCalendarShares = async (calendarId: string, targetUserId: string[], role: string[]) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/calendar/shares`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calendarId,
        targetUserId,
        role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update calendar shares');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};


{/* CRUD Event Routes */}

// createEvent (runs in background)
export const createEvent = async (rawEventData: any) => {
  console.log('createEvent called with:', rawEventData);

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }



    console.log(rawEventData.startDate, rawEventData.endDate);

    const cloudEventObject = {
      name: rawEventData.title,
      startDate: rawEventData.startDate,  // ✅ Proper ISO format
      endDate: rawEventData.endDate,      // ✅ Proper ISO format
      description: rawEventData.description,
      hexcode: rawEventData.hexcode,
      timeZone: rawEventData.timezone,
      location: rawEventData.location,
      calendar: rawEventData.calendar,
    };

    console.log('Making API call with corrected ISO format:', cloudEventObject);
    const response = await axios.post(
      `${API_BASE}/events`,
      { event: cloudEventObject, participants: rawEventData.invitees },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    console.log('API call successful:', response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.log('Error in createEvent:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to create event' 
    };
  }
};

// ✅ FIXED: getEvents with proper date range
export const getEvents = async (startDate: string, endDate: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) {
      return { success: false, error: 'No authentication token' };
    }

    const startISO = `${startDate}T00:00:00Z`;
    const endISO = `${endDate}T23:59:59Z`;

    const response = await fetch(
      `${API_BASE}/events_detail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: startISO,
          endDate: endISO,
        }),
      }
    );

    if (response.ok) {
      const events = await response.json(); // This is an array
      return { success: true, data: events };
    } else {
      const error = await response.json();
      return { success: false, error: error.detail || 'No data received' };
    }
  } catch (error: any) {
    console.error('Error in getEvents:', error);
    return { success: false, error: error.message };
  }
};

// getEventDetails for a specific event
export const getEventDetails = async (eventId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) {
      return { success: false, error: 'No authentication token' };
    }

    const response = await fetch(
      `${API_BASE}/events/${eventId}/details`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const event = await response.json();
      return { success: true, data: event };
    } else {
      const error = await response.json();
      return { success: false, error: error.detail || 'No data received' };
    }
  } catch (error: any) {
    console.error('Error in getEventDetails:', error);
    return { success: false, error: error.message };
  }
};

export const updateEvent = async (rawEventData: any) => {
  console.log('updateEvent called with:', rawEventData);

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      return { success: false, error: 'No authentication token' };
    }

    const response = await axios.put(
      `${API_BASE}/events/${rawEventData.id}`,
      {
        name: rawEventData.title,
        startDate: rawEventData.startDate,  // ✅ ISO 8601 format
        endDate: rawEventData.endDate,      // ✅ ISO 8601 format
        description: rawEventData.description,
        hexcode: rawEventData.hexcode,
        timeZone: rawEventData.timezone,
        location: rawEventData.location,
        calendar: rawEventData.calendar,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to update event' 
    };
  }
};

export const deleteEvent = async (eventId: any) => {
  console.log('deleteEvent called with ID:', eventId);

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    console.log('Token retrieved:', token ? 'exists' : 'null');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }


    console.log('Making API call...');
    const response = await axios.delete(
      `${API_BASE}/events/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    return { success: true, data: response.data };
  } catch (error: any) {
    console.log('Error in deleteEventOnServer:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
    } else {
      console.log('Server Error: ', error);
    }
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to delete event on server' 
    };
  }
};

{/* Event Interaction Routes */}

// getEventParticipants for a specific event (may not be needed)
export const getEventParticipants = async (eventId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/events/${eventId}/participants`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to get participants' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// updateEventParticipants for a specific event
export const updateEventParticipants = async (eventId: string, participants: string[]) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/events/${eventId}/participants`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participants })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to update participants' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Leave a specific event as a participant
export const leaveEvent = async (eventId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/events/${eventId}/leave`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to leave event' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Respond to a specific event's invite
export const respondToEventInvite = async (eventId: string, statusState: 'accepted' | 'rejected') => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/events/${eventId}/respond?statusState=${statusState}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to respond to invite' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

{/* Event Proposal Routes */}

// proposalData includes a title, description (explanation), and proposed changes (startDate, endDate, and location)

// Create a proposal for an event
export const createEventProposal = async (eventId: string, proposalData: any) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/events/${eventId}/proposals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proposalData),
    });

    if (!response.ok) throw new Error('Failed to create proposal');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get Proposals for an Event
export const getEventProposals = async (eventId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/events/${eventId}/proposals`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to get proposals');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete Proposal
export const deleteEventProposal = async (eventId: string, proposalId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/events/${eventId}/proposals/${proposalId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to delete proposal');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Respond to proposal
export const respondToEventProposal = async (
  eventId: string,
  proposalId: string,
  responseData: { status: 'accepted' | 'rejected' | 'pending' }
) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/events/${eventId}/proposals/${proposalId}/respond`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    });

    if (!response.ok) throw new Error('Failed to respond to proposal');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

{/* Connection Routes */}

// Send a connection request
export const sendConnectionRequest = async (targetUserId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/request/${encodeURIComponent(targetUserId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to send connection request' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Accept a connection request
export const acceptConnectionRequest = async (targetUserId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/accept/${encodeURIComponent(targetUserId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to accept connection request' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Reject a connection request
export const rejectConnectionRequest = async (targetUserId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/reject/${encodeURIComponent(targetUserId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to reject connection request' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Remove a connection (unconnect) with a user
export const removeConnection = async (targetUserId: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return { success: false, error: 'No access token found' };

    const response = await fetch(
      `${API_BASE}/connection/delete/${encodeURIComponent(targetUserId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to remove connection' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get all connections for the current user
export const getConnections = async () => {
  console.log('getConnections called');
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${API_BASE}/connections`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch connections');
    }
    console.log('Response Data: ', response);

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

{/* Misc./Other User to User Interaction Routes */}

// Search for profiles by user_id, display_name, or username
export const searchProfiles = async (searchParams: {
  user_id?: string;
  display_name?: string;
  username?: string;
}) => {
  console.log('searchProfiles called with:', searchParams);
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return { success: false, error: 'No access token found' };

    const response = await fetch(
      `${API_BASE}/profile/search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Failed to search profiles' };
    }

    const data = await response.json();
    console.log('searchProfiles response data:', data);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};