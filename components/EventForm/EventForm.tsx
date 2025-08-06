import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Animated, Alert } from 'react-native';
import { colors } from '@/styles/styles';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FormCard } from './FormCard';
import { EventDateTimePicker } from './DateTimePicker';
import { CalendarSelector } from './CalendarSelector';
import { InviteesManager } from './InviteesManager';
import { TimezoneSelector } from './TimezoneSelector';

interface EventFormProps {
  initialData?: Partial<CalendarEvent>;
  onSubmit: (eventData: Partial<CalendarEvent>) => Promise<void>;
  submitButtonText?: string;
  isLoading?: boolean;
}

export const EventForm = forwardRef<any, EventFormProps>(({ 
  initialData, 
  onSubmit, 
  submitButtonText = 'Save Event', 
  isLoading = false 
}, ref) => {
  const { calendars, getUserTimezone } = useEvents();
  
  // ✅ Better default date handling
  const getDefaultDate = () => {
    // If initialData has dates, use them
    if (initialData?.startDate) return initialData.startDate;
    if (initialData?.endDate) return initialData.endDate;
    
    // Otherwise use today in user's timezone
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error getting default date:', error);
      return '2024-01-01'; // Safe fallback
    }
  };
  
  // Form state
  const [eventData, setEventData] = useState<Partial<CalendarEvent>>({
    title: '',
    startDate: getDefaultDate(),
    endDate: getDefaultDate(),
    startTime: dateTimeHelpers.formatTimeForStorage(new Date()),
    endTime: dateTimeHelpers.formatTimeForStorage(new Date(Date.now() + 60 * 60 * 1000)),
    timezone: getUserTimezone(),
    location: '',
    description: '',
    invitees: [],
    calendar: 'Default',
    calendarId: '1',
    ...initialData, // ✅ This will override defaults with passed data
  });
  
  const [isAllDay, setIsAllDay] = useState(false);

  // Initialize all-day state
  useEffect(() => {
    if (initialData) {
      setIsAllDay(!initialData.startTime && !initialData.endTime);
    }
  }, [initialData]);

  // ✅ NEW: Auto-correction state
  const [lastCorrection, setLastCorrection] = useState<{
    message: string;
    timestamp: number;
  } | null>(null);

  // ✅ NEW: Auto-correct function with user feedback
  const autoCorrectDateTimes = useCallback((
    startDate: string,
    startTime: string | null,
    endDate: string,
    endTime: string | null,
    showAlert: boolean = true
  ) => {
    const correction = dateTimeHelpers.autoCorrectDateTime(
      startDate, startTime, endDate, endTime, isAllDay
    );

    if (correction.corrected) {
      // Update the form data
      setEventData(prev => ({
        ...prev,
        startDate: correction.startDate,
        endDate: correction.endDate,
        startTime: correction.startTime,
        endTime: correction.endTime,
      }));

      // Show user-friendly notification
      if (showAlert) {
        setLastCorrection({
          message: correction.reason || 'Date/time automatically corrected',
          timestamp: Date.now()
        });

        // Clear notification after 4 seconds
        setTimeout(() => setLastCorrection(null), 4000);
      }

      return true;
    }
    return false;
  }, [isAllDay]);

  // ✅ NEW: Enhanced updateEventData with auto-correction
  const updateEventData = (field: keyof CalendarEvent, value: any) => {
    setEventData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-correct when date/time fields change
      if (['startDate', 'endDate', 'startTime', 'endTime'].includes(field)) {
        // Small delay to avoid correction loops
        setTimeout(() => {
          autoCorrectDateTimes(
            newData.startDate || '',
            (newData.startTime ?? null) as string | null,
            newData.endDate || '',
            (newData.endTime ?? null) as string | null,
            true // Show alert
          );
        }, 100);
      }

      return newData;
    });
  };

  // ✅ NEW: Smart time adjustment when start time changes
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      updateEventData('startTime', value);
      
      // Auto-suggest end time if not set or if end time is before start time
      const currentEndTime = eventData.endTime;
      if (!currentEndTime || value >= currentEndTime) {
        const suggestedEndTime = dateTimeHelpers.suggestEndTime(value);
        setTimeout(() => updateEventData('endTime', suggestedEndTime), 50);
      }
    } else {
      updateEventData('endTime', value);
    }
  };

  // ✅ NEW: Smart date adjustment
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      updateEventData('startDate', value);
      
      // If end date is before start date, update it
      if (eventData.endDate && value > eventData.endDate) {
        setTimeout(() => updateEventData('endDate', value), 50);
      }
    } else {
      updateEventData('endDate', value);
    }
  };

  const handleAllDayToggle = () => {
    setIsAllDay(prev => {
      const newIsAllDay = !prev;
      if (newIsAllDay) {
        updateEventData('startTime', null);
        updateEventData('endTime', null);
      } else {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        updateEventData('startTime', dateTimeHelpers.formatTimeForStorage(now));
        updateEventData('endTime', dateTimeHelpers.formatTimeForStorage(oneHourLater));
      }
      return newIsAllDay;
    });
  };

  const handleCalendarSelect = (calendar: any) => {
    updateEventData('calendarId', calendar.id);
    updateEventData('calendar', calendar.name);
    updateEventData('hexcode', calendar.hexcode);
  };

  const handleSubmit = async () => {
    // ✅ Final validation and correction before submit
    const finalCorrection = autoCorrectDateTimes(
      eventData.startDate || '',
      eventData.startTime ?? null,
      eventData.endDate || '',
      eventData.endTime ?? null,
      false // Don't show alert for final validation
    );

    // Basic validation
    if (!eventData.title?.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    if (!eventData.startDate) {
      Alert.alert('Error', 'Start date is required');
      return;
    }

    // Submit the corrected data
    await onSubmit(eventData);
  };

  // Expose handleSubmit to parent component
  useImperativeHandle(ref, () => ({
    handleSubmit
  }));

  const timezones = dateTimeHelpers.commonTimezones.map(tz => ({
    name: tz.replace(/_/g, ' '), // Convert underscores to spaces for display
    tz: tz
  }));

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ✅ NEW: Correction notification */}
      {lastCorrection && (
        <Animated.View style={styles.correctionNotification}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.correctionText}>{lastCorrection.message}</Text>
        </Animated.View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <FormCard label="TITLE">
          <TextInput
            style={styles.titleInput}
            value={eventData.title || ''}
            onChangeText={(text) => updateEventData('title', text)}
            placeholder="Enter event title"
            placeholderTextColor={colors.textMuted}
          />
        </FormCard>

        {/* Location */}
        <FormCard icon="location" label="LOCATION">
          <TextInput
            style={styles.input}
            value={eventData.location || ''}
            onChangeText={(text) => updateEventData('location', text)}
            placeholder="Add location or video call link"
            placeholderTextColor={colors.textMuted}
          />
        </FormCard>

        {/* All Day Toggle - Restore original compact format */}
        <FormCard>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="sunny" size={20} color={colors.warning} />
              <Text style={styles.settingLabel}>All-day event</Text>
            </View>
            <TouchableOpacity style={styles.toggleContainer} onPress={handleAllDayToggle}>
              <View style={[styles.toggle, isAllDay && styles.toggleActive]}>
                <View style={[styles.toggleIndicator, isAllDay && styles.toggleIndicatorActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </FormCard>

        {/* Date/Time Picker with smart handlers */}
        <FormCard>
          <EventDateTimePicker
            startDate={eventData.startDate || ''}
            endDate={eventData.endDate || ''}
            startTime={eventData.startTime ?? undefined}
            endTime={eventData.endTime ?? undefined}
            isAllDay={isAllDay}
            onDateChange={handleDateChange} // ✅ Use smart handler
            onTimeChange={handleTimeChange} // ✅ Use smart handler
          />
        </FormCard>

        {/* Timezone - Restore original compact format */}
        <FormCard>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="globe" size={20} color={colors.info} />
              <Text style={styles.settingLabel}>Time zone</Text>
            </View>
            <TimezoneSelector
              selectedTimezone={eventData.timezone || getUserTimezone()}
              timezones={[...dateTimeHelpers.commonTimezones]}
              onTimezoneSelect={(timezone) => updateEventData('timezone', timezone)}
            />
          </View>
        </FormCard>

        {/* Calendar - Restore original compact format */}
        <FormCard>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="folder-open" size={20} color={colors.primary} />
              <Text style={styles.settingLabel}>Calendar</Text>
            </View>
            <CalendarSelector
              calendars={calendars}
              selectedCalendarId={eventData.calendarId}
              selectedCalendarName={eventData.calendar}
              onCalendarSelect={handleCalendarSelect}
            />
          </View>
        </FormCard>

        {/* Invitees */}
        <FormCard>
          <InviteesManager
            invitees={eventData.invitees || []}
            onInviteesChange={(invitees) => updateEventData('invitees', invitees)}
          />
        </FormCard>

        {/* Description */}
        <FormCard icon="document-text" label="DESCRIPTION">
          <TextInput
            style={styles.descriptionInput}
            value={eventData.description || ''}
            onChangeText={(text) => updateEventData('description', text)}
            placeholder="Add event description, agenda, or additional details..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </FormCard>

        {/* Remove the submit button container - it will be in the header now */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

// Add new styles for compact settings rows
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 20, // ✅ Add this line - space from header
  },
  scrollView: { 
    flex: 1,
    paddingHorizontal: 0, // ✅ Add this line - keep horizontal padding at 0
  },
  scrollContent: { 
    paddingTop: 12,    // ✅ Add this line - additional top padding for first form card
    paddingBottom: 24, // This line already exists
  },
  
  // Inputs
  titleInput: { fontSize: 20, color: colors.text, fontWeight: '600', minHeight: 28 },
  input: { fontSize: 16, color: colors.text, minHeight: 22 },
  descriptionInput: {
    fontSize: 16, color: colors.text, lineHeight: 22, minHeight: 80,
    textAlignVertical: 'top', fontWeight: '500',
  },
  
  // New compact setting row styles
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  
  // Toggle styles (keep existing)
  toggleContainer: { alignItems: 'flex-end' },
  toggle: {
    width: 52, height: 32, borderRadius: 16, backgroundColor: colors.lightGrey,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: colors.success },
  toggleIndicator: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white,
    alignSelf: 'flex-start', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  toggleIndicatorActive: { alignSelf: 'flex-end' },

  // ✅ NEW: Styles for correction notification
  correctionNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  correctionText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
});