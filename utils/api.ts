import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as v from 'valibot';
import { logInParsed, signUpParsed } from '@/schemas/textSchemas';
import { Alert } from 'react-native';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { colors } from '@/styles/styles';

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
    const response = await axios.post(
      'https://twig-production.up.railway.app/logout',
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

    if (response.status === 200) {
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
  router: any
) => {
  console.log("logIn: before validation");

  if (setIsLoggingIn) setIsLoggingIn(true);

  function cleanUp() {
    setErrors([]);
  }

  try {
    console.log("logIn: after validation");
    const logInData = logInParsed({ email, password });
    console.log("Parsed Data: " + logInData);
  } catch (error) {
    if (error instanceof v.ValiError) {
      console.log("Validation Error: ", error.message);
      console.log("Validation Issue: ", error.issues);
      alert("Validation Error: " + error.message);
      const errorMessages = error.issues.map((issue) => issue.message);
      setErrors(errorMessages);
    } else {
      console.log("Unexpected Error: ", error);
    }
    if (setIsLoggingIn) setIsLoggingIn(false);
    return;
  }

  try {
    const response = await axios.post('https://twig-production.up.railway.app/login', {
      email,
      password,
    });

    await SecureStore.setItemAsync('accessToken', response.data.access_token);
    await SecureStore.setItemAsync('refreshToken', response.data.refresh_token);

    console.log("Access Token stored!");
    console.log("Refresh Token stored!");

    try {
      await updateProfile(setProfileData, setIsLoading);
    } catch (error) {
      console.log('Error updating profile:', error);
    }

    router.replace('/(tabs)/profile');
  } catch (error: any) {
    if (error.response && error.response.data) {
      console.log("Server Error Data: ", error.response.data);
    } else {
      console.log("Server Error: ", error);
    }
    alert("Login failed. Please check your credentials and try again.");
  } finally {
    cleanUp();
    if (setIsLoggingIn) setIsLoggingIn(false);
  }
};

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

// updateProfile
export const updateProfile = async (
  setProfileData?: (data: any) => void,
  setIsLoading?: (loading: boolean) => void
) => {
  console.log('updateProfile called');

  if (setIsLoading) setIsLoading(true);

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
      'https://twig-production.up.railway.app/change-profile',
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
      'https://twig-production.up.railway.app/change-password',
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

{/* Connection Routes */}

// getConnections
export const getConnections = async (
  setConnectionData?: (data: any) => void,
  setIsLoading?: (loading: boolean) => void
) => {
  console.log('getConnections called');

  if (setIsLoading) setIsLoading(true);

  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    console.log('Token retrieved:', token ? 'exists' : 'null');

    if (!token) {
      console.log('No access token found');
      if (setIsLoading) setIsLoading(false);
      return null;
    }

    console.log('Making API call...');
    const response = await axios.get(
      'https://twig-production.up.railway.app/followers',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('API call successful');
    console.log('Response data:', response.data);

    if (setConnectionData) setConnectionData(response.data);

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

{/* Event Routes */}


// createEvent (runs in background)
export const createEvent = async (rawEventData: any) => {
  console.log('createEvent called with:', rawEventData);

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    console.log('Token retrieved:', token ? 'exists' : 'null');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }

    const participants = rawEventData.invitees

    const cloudEventObject = {
      name: rawEventData.title,
      startDate: rawEventData.startDate,
      endDate: rawEventData.endDate,
      startTime: rawEventData.startTime,
      endTime: rawEventData.endTime,
      description: rawEventData.description,
      hexcode: rawEventData.hexcode,
      timeZone: rawEventData.timezone,
      location: rawEventData.location,
      calendar: rawEventData.calendar,
    };


    console.log('Making API call...');
    const response = await axios.post(
      'https://twig-production.up.railway.app/events',
      { event: cloudEventObject, participants: participants },
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
    console.log('Error in createEventOnServer:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
    } else {
      console.log('Server Error: ', error);
    }
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to create event on server' 
    };
  }
};


export const updateEvent = async (rawEventData: any) => {
  console.log('updateEvent called with:', rawEventData);

  try {
    const token = await SecureStore.getItemAsync('accessToken');

    console.log('Token retrieved:', token ? 'exists' : 'null');

    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No authentication token' };
    }

    const participants = rawEventData.invitees

    console.log('Making API call...');
    const response = await axios.put(
      `https://twig-production.up.railway.app/events/${rawEventData.id}`,
      { name: rawEventData.title,
      startDate: rawEventData.startDate,
      endDate: rawEventData.endDate,
      startTime: rawEventData.startTime,
      endTime: rawEventData.endTime,
      description: rawEventData.description,
      hexcode: rawEventData.hexcode,
      timeZone: rawEventData.timezone,
      location: rawEventData.location,
      calendar: rawEventData.calendar, },
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
    console.log('Error in update EventOnServer:', error);
    if (error.response && error.response.data) {
      console.log('Server Error Data: ', error.response.data);
    } else {
      console.log('Server Error: ', error);
    }
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to update event on server' 
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
      `https://twig-production.up.railway.app/events/${eventId}`,
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




