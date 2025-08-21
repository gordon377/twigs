import React, { useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { colors } from '@/styles/styles';
import { CalendarEvent, dateTimeHelpers, getAllTimezones } from '@/types/events';
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
  
  // ✅ SIMPLIFIED: Initialize with ISO format
  const [eventData, setEventData] = useState<Partial<CalendarEvent>>(() => {
    // Default to today with default times
    const todayDate = dateTimeHelpers.getTodayStringInTimezone();
    const defaultStartISO = dateTimeHelpers.createISOString(todayDate, '12:00:00');
    const defaultEndISO = dateTimeHelpers.createISOString(todayDate, '13:00:00');
    
    return {
      title: '',
      startDate: defaultStartISO,
      endDate: defaultEndISO,
      timezone: getUserTimezone(),
      location: '',
      description: '',
      invitees: [],
      calendar: 'Default',
      calendarId: '1',
      ...initialData, // Override with provided data
    };
  });
  
  // ✅ Determine if event is all-day
  const isAllDay = dateTimeHelpers.isAllDayEvent(
    eventData.startDate || '', 
    eventData.endDate || ''
  );

  // ✅ Update function for form fields
  const updateEventData = (field: keyof CalendarEvent, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ Handle date/time changes (receives ISO strings)
  const handleDateTimeChange = useCallback((type: 'start' | 'end', isoString: string) => {
    if (type === 'start') {
      updateEventData('startDate', isoString);
      
      // Auto-adjust end time if it's before start time
      const currentEnd = eventData.endDate;
      if (currentEnd && new Date(isoString) >= new Date(currentEnd)) {
        const suggestedEnd = dateTimeHelpers.suggestEndISOTime(isoString);
        updateEventData('endDate', suggestedEnd);
      }
    } else {
      updateEventData('endDate', isoString);
    }
  }, [eventData.endDate]);

  // ✅ All-day toggle
  const handleAllDayToggle = () => {
    const currentStartDate = dateTimeHelpers.extractDateFromISO(eventData.startDate || '');
    const currentEndDate = dateTimeHelpers.extractDateFromISO(eventData.endDate || '');
    
    if (isAllDay) {
      // Switch to timed event
      const newStartISO = dateTimeHelpers.createISOString(currentStartDate, '12:00:00');
      const newEndISO = dateTimeHelpers.createISOString(currentEndDate, '13:00:00');
      updateEventData('startDate', newStartISO);
      updateEventData('endDate', newEndISO);
    } else {
      // Switch to all-day event
      const { start, end } = dateTimeHelpers.createAllDayEventISO(currentStartDate);
      updateEventData('startDate', start);
      updateEventData('endDate', end);
    }
  };

  const handleCalendarSelect = (calendar: any) => {
    updateEventData('calendarId', calendar.id);
    updateEventData('calendar', calendar.name);
    updateEventData('hexcode', calendar.hexcode);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!eventData.title?.trim()) {
      alert('Event title is required');
      return;
    }

    if (!eventData.startDate) {
      alert('Start date is required');
      return;
    }

    // Auto-correct dates if needed
    const corrected = dateTimeHelpers.autoCorrectDateTime(
      eventData.startDate,
      eventData.endDate || eventData.startDate
    );

    const finalEventData = {
      ...eventData,
      startDate: corrected.startDate,
      endDate: corrected.endDate,
    };

    await onSubmit(finalEventData);
  };

  // Expose handleSubmit to parent
  useImperativeHandle(ref, () => ({
    handleSubmit
  }));

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

        {/* All Day Toggle */}
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

        {/* Date/Time Picker */}
        <FormCard>
          <EventDateTimePicker
            startDate={eventData.startDate || ''}
            endDate={eventData.endDate || ''}
            isAllDay={isAllDay}
            onDateTimeChange={handleDateTimeChange}
          />
        </FormCard>

        {/* Timezone */}
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

        {/* Calendar */}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 20,
  },
  scrollView: { 
    flex: 1,
    paddingHorizontal: 0,
  },
  scrollContent: { 
    paddingTop: 12,
    paddingBottom: 24,
  },
  titleInput: { 
    fontSize: 20, 
    color: colors.text, 
    fontWeight: '600', 
    minHeight: 28 
  },
  input: { 
    fontSize: 16, 
    color: colors.text, 
    minHeight: 22 
  },
  descriptionInput: {
    fontSize: 16, 
    color: colors.text, 
    lineHeight: 22, 
    minHeight: 80,
    textAlignVertical: 'top', 
    fontWeight: '500',
  },
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
  toggleContainer: { 
    alignItems: 'flex-end' 
  },
  toggle: {
    width: 52, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: colors.lightGrey,
    justifyContent: 'center', 
    paddingHorizontal: 2,
  },
  toggleActive: { 
    backgroundColor: colors.success 
  },
  toggleIndicator: {
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: colors.white,
    alignSelf: 'flex-start', 
    shadowColor: colors.black, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 2,
  },
  toggleIndicatorActive: { 
    alignSelf: 'flex-end' 
  },
});