import React, { useState, useRef } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import { createEvent as createEventAPI } from '@/utils/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EventForm } from '@/components/EventForm/EventForm';

export default function CreateEventScreen() {
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams<{ selectedDate?: string }>(); // ✅ Get selected date
  const { 
    addEvent, 
    getRemoteCalendarId, 
    getLocalCalendarId, 
    getCalendarByName 
  } = useEvents();
  
  const [isLoading, setIsLoading] = useState(false);
  const eventFormRef = useRef<any>(null);

  const handleSubmit = async (eventData: Partial<CalendarEvent>) => {
    // Validation
    if (!eventData.title?.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!eventData.calendarId) {
      Alert.alert('Error', 'Please select a calendar');
      return;
    }

    setIsLoading(true);
    try {
      // Get remote calendar ID for API
      const remoteCalendarId = getRemoteCalendarId(eventData.calendarId);
      
      if (!remoteCalendarId) {
        Alert.alert('Error', 'Calendar mapping not found. Please check your calendar setup.');
        return;
      }

      console.log('🎯 Creating event with remote calendar ID:', remoteCalendarId);

      // Prepare API data
      const apiEventData = {
        ...eventData,
        calendarId: remoteCalendarId,
      };

      // Create via API
      const response = await createEventAPI(apiEventData);
      
      if (response.success && response.data) {
        const apiResponseData = response.data.data[0];
        
        console.log('✅ API response data:', apiResponseData);
        
        // Map back to local calendar ID
        const localCalendarId = getLocalCalendarId(apiResponseData.calendar_id) || 
                               getCalendarByName(apiResponseData.calendar)?.id ||
                               eventData.calendarId;

        // ✅ FIXED: Ensure the dates are proper ISO strings
        const startDateISO = apiResponseData.startDate;
        const endDateISO = apiResponseData.endDate;
        
        console.log('🔍 Checking date formats:', {
          startDate: startDateISO,
          endDate: endDateISO,
          startValid: dateTimeHelpers.isValidISOString(startDateISO),
          endValid: dateTimeHelpers.isValidISOString(endDateISO)
        });

        // Create local event object
        const newEventObject: CalendarEvent = {
          id: apiResponseData.id.toString(),
          title: apiResponseData.name,
          startDate: startDateISO,  // ✅ ISO format from API
          endDate: endDateISO,      // ✅ ISO format from API
          description: apiResponseData.description || '',
          hexcode: apiResponseData.hexcode || colors.primary,
          timezone: apiResponseData.timeZone,
          location: apiResponseData.location || '',
          calendar: apiResponseData.calendar,
          invitees: apiResponseData.invitees || [],
          calendarId: localCalendarId,
        };
        
        console.log('✅ Created event object for local storage:', {
          id: newEventObject.id,
          title: newEventObject.title,
          startDate: newEventObject.startDate,
          endDate: newEventObject.endDate,
          calendarId: newEventObject.calendarId
        });
        
        // Add to local database
        const success = await addEvent(newEventObject);
        
        if (success) {
          Alert.alert('Success', 'Event created successfully!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Warning', 'Event created on server but failed to save locally');
        }
      } else {
        Alert.alert('Error', `Failed to create event: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Exception during event creation:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to trigger form submission from header button
  const handleHeaderSave = () => {
    if (eventFormRef.current?.handleSubmit) {
      eventFormRef.current.handleSubmit();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHeader
        title="New Event"
        leftAction={{
          icon: <Ionicons name="close" size={24} color={colors.textMuted} />,
          onPress: () => router.back()
        }}
        rightActions={[
          {
            icon: isLoading ? (
              <Ionicons name="hourglass" size={24} color={colors.textMuted} />
            ) : (
              <Ionicons name="checkmark" size={24} color={colors.success} />
            ),
            onPress: handleHeaderSave
          }
        ]}
      />
      
      <EventForm
        ref={eventFormRef}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        // ✅ Pass the selected date as initial data
        initialData={{
          startDate: selectedDate || undefined,
          endDate: selectedDate || undefined,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});