import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as v from 'valibot';
import { logInParsed, signUpParsed } from '@/schemas/textSchemas';
import { Alert } from 'react-native';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { colors } from '@/styles/styles';

const API_BASE = 'https://twig-production.up.railway.app';

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


{/* Profile Management Routes */}

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

{/* Calendar Management/CRUD Routes */}

//Create Calendar
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
      'https://twig-production.up.railway.app/calendar',
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

//Get Calendars
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
      'https://twig-production.up.railway.app/calendar',
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

//Update Calendar
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
      `https://twig-production.up.railway.app/calendar/${calendarData.calendarId}`,
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
      `https://twig-production.up.railway.app/calendar/${calendarData.calendarId}`,
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
      'https://twig-production.up.railway.app/events',
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
      `https://twig-production.up.railway.app/events/${rawEventData.id}`,
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

{/* Event Interaction Routes */}

// getEventParticipants for a specific event
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

{/* Connection Routes */}

// Accept a connection request
export const sendConnectionRequest = async (targetUsername: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/${encodeURIComponent(targetUsername)}`,
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
export const acceptConnectionRequest = async (targetUsername: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/accept/${encodeURIComponent(targetUsername)}`,
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
export const rejectConnectionRequest = async (targetUsername: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/reject/${encodeURIComponent(targetUsername)}`,
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

// Get outgoing connection requests
export const getSentConnectionRequests = async () => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/requests/sent`,
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
      return { success: false, error: errorData.detail || 'Failed to get sent connection requests' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get incoming connection requests
export const getReceivedConnectionRequests = async () => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await fetch(
      `${API_BASE}/connect/requests/received`,
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
      return { success: false, error: errorData.detail || 'Failed to get received connection requests' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Remove a connection (unconnect) with a user
export const removeConnection = async (targetUsername: string) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return { success: false, error: 'No access token found' };

    const response = await fetch(
      `${API_BASE}/unconnect/${encodeURIComponent(targetUsername)}`,
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

// Get the list of the current followers of the user
export const getFollowers = async () => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return { success: false, error: 'No access token found' };

    const response = await fetch(
      `${API_BASE}/followers`,
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
      return { success: false, error: errorData.message || 'Failed to get followers' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get the list of users the user is currently following
export const getFollowing = async () => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return { success: false, error: 'No access token found' };

    const response = await fetch(
      `${API_BASE}/following`,
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
      return { success: false, error: errorData.message || 'Failed to get following' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};