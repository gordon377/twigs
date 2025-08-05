import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, 
  Platform, KeyboardAvoidingView, Animated, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createEvent } from '@/utils/api';

export default function CreateEventScreen() {
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams<{ selectedDate?: string }>();
  const { addEvent, calendars, getUserTimezone, commonTimezones } = useEvents();

  console.log('selectedDate:', selectedDate);
  console.log('getTodayStringInTimezone:', dateTimeHelpers.getTodayStringInTimezone());
  
  // Core state
  const [eventData, setEventData] = useState<Partial<CalendarEvent>>({
    title: '',
    startDate: selectedDate || dateTimeHelpers.getTodayStringInTimezone(),
    endDate: selectedDate || dateTimeHelpers.getTodayStringInTimezone(),
    startTime: null,
    endTime: null,
    description: '',
    location: '',
    hexcode: colors.primary,
    timezone: getUserTimezone(),
    calendar: 'Loading...',
    calendarId: undefined,
    invitees: [],
  });

  const [newInvitee, setNewInvitee] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [modals, setModals] = useState({ datePicker: false, timePicker: false, calendar: false });
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempPickerValue, setTempPickerValue] = useState(new Date());
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneDropdownHeight] = useState(new Animated.Value(0));

  // Animation values
  const modalAnimations = {
    opacity: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(300)).current,
  };

  // Initialize calendar selection
  useEffect(() => {
    if (calendars.length > 0 && !eventData.calendarId) {
      const defaultCalendar = calendars.find(cal => cal.id === '1') || calendars[0];
      if (defaultCalendar) {
        setEventData(prev => ({
          ...prev,
          calendar: defaultCalendar.name,
          hexcode: defaultCalendar.hexcode,
          calendarId: defaultCalendar.id
        }));
      }
    }
  }, [calendars, eventData.calendarId]);

  // Helper functions
  const updateEventData = (field: keyof CalendarEvent, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentTimeDefaults = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const roundToFiveMinutes = (date: Date) => {
      const minutes = Math.round(date.getMinutes() / 5) * 5;
      return new Date(date.setMinutes(minutes, 0, 0));
    };
    
    return {
      startTime: dateTimeHelpers.formatTimeForStorage(roundToFiveMinutes(now)),
      endTime: dateTimeHelpers.formatTimeForStorage(roundToFiveMinutes(oneHourLater))
    };
  };

  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';

    // ✅ BULLETPROOF: Use Intl.DateTimeFormat with explicit date parsing
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    return formatter.format(date);
  };

  // Modal controls
  const openModal = (type: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [type]: true }));
    if (type !== 'calendar') {
      Animated.parallel([
        Animated.timing(modalAnimations.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(modalAnimations.translateY, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  };

  const closeModal = (type: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [type]: false }));
  };

  // Event handlers
  const handleAllDayToggle = () => {
    setIsAllDay(prev => !prev);
    if (!isAllDay) {
      updateEventData('startTime', null);
      updateEventData('endTime', null);
    } else {
      const { startTime, endTime } = getCurrentTimeDefaults();
      updateEventData('startTime', startTime);
      updateEventData('endTime', endTime);
    }
  };

  const confirmPickerSelection = () => {
    if (pickerMode === 'date') {
      const dateStr = dateTimeHelpers.formatDateForStorage(tempPickerValue);
      updateEventData(pickerTarget === 'start' ? 'startDate' : 'endDate', dateStr);
      if (pickerTarget === 'start' && eventData.endDate && eventData.endDate < dateStr) {
        updateEventData('endDate', dateStr);
      }
    } else {
      const timeStr = dateTimeHelpers.formatTimeForStorage(tempPickerValue);
      updateEventData(pickerTarget === 'start' ? 'startTime' : 'endTime', timeStr);
      if (pickerTarget === 'start' && (!eventData.endTime || eventData.endTime <= timeStr)) {
        const endTime = new Date(tempPickerValue.getTime() + 60 * 60 * 1000);
        updateEventData('endTime', dateTimeHelpers.formatTimeForStorage(endTime));
      }
    }
    closeModal(pickerMode === 'date' ? 'datePicker' : 'timePicker');
  };

  const toggleTimezoneDropdown = () => {
    const toValue = showTimezoneDropdown ? 0 : 180;
    setShowTimezoneDropdown(!showTimezoneDropdown);
    Animated.timing(timezoneDropdownHeight, { toValue, duration: 250, useNativeDriver: false }).start();
  };

  // Invitee management
  const addInvitee = () => {
    const email = newInvitee.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    const currentInvitees = eventData.invitees || [];
    if (currentInvitees.includes(email)) {
      Alert.alert('Error', 'This email is already added');
      return;
    }
    updateEventData('invitees', [...currentInvitees, email]);
    setNewInvitee('');
  };

  const removeInvitee = (email: string) => {
    updateEventData('invitees', (eventData.invitees || []).filter(invitee => invitee !== email));
  };

  // Form validation and save
  const handleSave = async () => {
    if (!eventData.title?.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    setIsLoading(true);
    try {
      const success = await createEvent(eventData);
      if (success.success) {
        const localEventObject: CalendarEvent = {
          id: success.data.id,
          title: success.data.name,
          startDate: success.data.startDate,
          endDate: success.data.endDate,
          startTime: success.data.startTime,
          endTime: success.data.endTime,
          description: success.data.description,
          hexcode: success.data.hexcode || eventData.hexcode || colors.primary,
          timezone: success.data.timeZone,
          location: success.data.location,
          calendar: success.data.calendar,
          invitees: eventData.invitees || [],
          calendarId: success.data.calendar_id,
        };
        
        await addEvent(localEventObject);
        Alert.alert('Success', 'Event created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to create event. Please try again.');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCalendarColor = () => {
    return calendars.find(cal => cal.name === eventData.calendar)?.hexcode || colors.primary;
  };

  // Render functions for cleaner JSX
  const renderDateTimeButton = (type: 'start' | 'end', mode: 'date' | 'time') => {
    const isDate = mode === 'date';
    const value = isDate 
      ? formatDateForDisplay(eventData[type === 'start' ? 'startDate' : 'endDate'] || dateTimeHelpers.getTodayStringInTimezone())
      : formatTimeForDisplay(eventData[type === 'start' ? 'startTime' : 'endTime'] || getCurrentTimeDefaults()[type === 'start' ? 'startTime' : 'endTime']);
    
    return (
      <TouchableOpacity 
        style={isDate ? styles.dateButton : styles.timeButton}
        onPress={() => {
          setPickerTarget(type);
          setPickerMode(mode);
          if (isDate) {
            setTempPickerValue(new Date(eventData[type === 'start' ? 'startDate' : 'endDate'] || new Date()));
          } else {
            const currentTime = eventData[type === 'start' ? 'startTime' : 'endTime'] || getCurrentTimeDefaults()[type === 'start' ? 'startTime' : 'endTime'];
            const [hours, minutes] = currentTime.split(':');
            const timeDate = new Date();
            timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
            setTempPickerValue(timeDate);
          }
          openModal(isDate ? 'datePicker' : 'timePicker');
        }}
      >
        <Ionicons name={isDate ? "calendar-outline" : "time-outline"} size={16} color={isDate ? colors.primary : colors.white} />
        <Text style={isDate ? styles.dateButtonText : styles.timeButtonText}>{value}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHeader
        title="Event Creation"
        leftAction={{
          icon: <Ionicons name="close" size={24} color={colors.text} />,
          onPress: () => router.back()
        }}
        rightActions={[{
          icon: (
            <View style={styles.saveButton}>
              <Ionicons name="checkmark" size={24} color={colors.white} />
            </View>
          ),
          onPress: handleSave,
        }]}
      />

      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.flex} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TITLE</Text>
            <TextInput
              style={styles.titleInput}
              value={eventData.title || ''}
              onChangeText={(text) => updateEventData('title', text)}
              placeholder="Enter event title"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Location */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.sectionLabel}>LOCATION</Text>
            </View>
            <TextInput
              style={styles.input}
              value={eventData.location || ''}
              onChangeText={(text) => updateEventData('location', text)}
              placeholder="Add location or video call link"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* All Day Toggle */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sunny" size={16} color={colors.warning} />
                <Text style={styles.toggleLabel}>All-day event</Text>
              </View>
              <TouchableOpacity onPress={handleAllDayToggle}>
                <View style={[styles.toggle, isAllDay && styles.toggleActive]}>
                  <View style={[styles.toggleIndicator, isAllDay && styles.toggleIndicatorActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Start Date/Time */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="play" size={16} color={colors.success} />
              <Text style={styles.sectionLabel}>STARTS</Text>
            </View>
            <View style={styles.dateTimeRow}>
              {renderDateTimeButton('start', 'date')}
              {!isAllDay && renderDateTimeButton('start', 'time')}
            </View>
          </View>

          {/* End Date/Time */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stop" size={16} color={colors.danger} />
              <Text style={styles.sectionLabel}>ENDS</Text>
            </View>
            <View style={styles.dateTimeRow}>
              {renderDateTimeButton('end', 'date')}
              {!isAllDay && renderDateTimeButton('end', 'time')}
            </View>
          </View>

          {/* Timezone */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={toggleTimezoneDropdown}>
              <View style={styles.sectionHeader}>
                <Ionicons name="globe" size={16} color={colors.info} />
                <Text style={styles.sectionLabel}>TIME ZONE</Text>
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.value}>
                  {eventData.timezone?.split('/').pop()?.replace('_', ' ') || 'New York'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <Animated.View style={[styles.dropdown, { height: timezoneDropdownHeight }]}>
              {showTimezoneDropdown && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {commonTimezones.map((tz) => (
                    <TouchableOpacity
                      key={tz}
                      style={[styles.dropdownOption, eventData.timezone === tz && styles.dropdownOptionSelected]}
                      onPress={() => {
                        updateEventData('timezone', tz);
                        toggleTimezoneDropdown();
                      }}
                    >
                      <Text style={[styles.dropdownText, eventData.timezone === tz && styles.dropdownTextSelected]}>
                        {tz.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Animated.View>
          </View>

          {/* Calendar */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => openModal('calendar')}>
              <View style={styles.sectionHeader}>
                <Ionicons name="folder-open" size={16} color={colors.purple} />
                <Text style={styles.sectionLabel}>CALENDAR</Text>
              </View>
              <View style={styles.valueRow}>
                <View style={[styles.calendarDot, { backgroundColor: getSelectedCalendarColor() }]} />
                <Text style={styles.value}>{eventData.calendar || 'Default Calendar'}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Invitees */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.sectionHeader}>
                <Ionicons name="mail" size={16} color={colors.info} />
                <Text style={styles.sectionLabel}>INVITEES</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{eventData.invitees?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.inviteeRow}>
              <TextInput
                style={styles.inviteeInput}
                value={newInvitee}
                onChangeText={setNewInvitee}
                placeholder="Enter email address"
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={addInvitee}
              />
              <TouchableOpacity style={styles.addButton} onPress={addInvitee}>
                <Ionicons name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            {eventData.invitees && eventData.invitees.length > 0 && (
              <View style={styles.inviteesList}>
                {eventData.invitees.map((invitee, index) => (
                  <View key={index} style={styles.inviteeItem}>
                    <View style={styles.inviteeInfo}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{invitee.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.inviteeEmail}>{invitee}</Text>
                    </View>
                    <TouchableOpacity style={styles.removeButton} onPress={() => removeInvitee(invitee)}>
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={16} color={colors.warning} />
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            </View>
            <TextInput
              style={styles.descriptionInput}
              value={eventData.description || ''}
              onChangeText={(text) => updateEventData('description', text)}
              placeholder="Add event description, agenda, or additional details..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date/Time Picker Modal */}
      <Modal visible={modals.datePicker || modals.timePicker} transparent animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: modalAnimations.opacity }]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            onPress={() => closeModal(modals.datePicker ? 'datePicker' : 'timePicker')}
          />
          
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: modalAnimations.translateY }] }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => closeModal(modals.datePicker ? 'datePicker' : 'timePicker')}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={confirmPickerSelection}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempPickerValue}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => selectedDate && setTempPickerValue(selectedDate)}
                style={styles.picker}
                textColor={colors.text}
                accentColor={colors.primary}
                minuteInterval={5}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Calendar Selection Modal */}
      <Modal visible={modals.calendar} transparent animationType="slide">
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => closeModal('calendar')}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Calendar</Text>
              <TouchableOpacity onPress={() => closeModal('calendar')}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.calendarList} showsVerticalScrollIndicator={false}>
              {calendars.map((calendar) => (
                <TouchableOpacity
                  key={calendar.id}
                  style={[styles.calendarOption, eventData.calendarId === calendar.id && styles.calendarOptionSelected]}
                  onPress={() => {
                    updateEventData('calendarId', calendar.id);
                    updateEventData('calendar', calendar.name);
                    updateEventData('hexcode', calendar.hexcode);
                    closeModal('calendar');
                  }}
                >
                  <View style={styles.calendarOptionContent}>
                    <View style={[styles.calendarColorDot, { backgroundColor: calendar.hexcode }]} />
                    <Text style={[
                      styles.calendarOptionText,
                      eventData.calendarId === calendar.id && styles.calendarOptionTextSelected
                    ]}>
                      {calendar.name}
                    </Text>
                  </View>
                  
                  {eventData.calendarId === calendar.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base styles
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  
  // Header
  saveButton: {
    backgroundColor: colors.success, width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.success, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.cardBackground, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 16, 
    shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2, 
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  
  // Section headers - ✅ FIXED ALIGNMENT
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    // ✅ REMOVED: marginBottom: 8 
  },
  sectionLabel: {
    fontSize: 11, 
    fontWeight: '700', 
    color: colors.textSecondary,
    textTransform: 'uppercase', 
    letterSpacing: 0.8,
  },
  
  // Toggle
  toggleLabel: { 
    fontSize: 11,           // ✅ CHANGE: from 17 to 11
    fontWeight: '700',      // ✅ KEEP
    color: colors.textSecondary, // ✅ CHANGE: from colors.text to colors.textSecondary
    textTransform: 'uppercase',   // ✅ ADD
    letterSpacing: 0.8,          // ✅ ADD
  },
  // Layout
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  
  // Inputs
  titleInput: { fontSize: 20, color: colors.text, fontWeight: '600', minHeight: 28 },
  input: { fontSize: 16, color: colors.text, minHeight: 22 },
  descriptionInput: {
    fontSize: 16, color: colors.text, lineHeight: 22, minHeight: 80,
    textAlignVertical: 'top', fontWeight: '500',
  },
  
  // Toggle
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
  
  // Date/Time buttons
  dateTimeRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  dateButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '20',
  },
  dateButtonText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  timeButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, minWidth: 110,
  },
  timeButtonText: { fontSize: 15, color: colors.white, fontWeight: '600' },
  
  // Values
  value: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  calendarDot: {
    width: 16, height: 16, borderRadius: 8,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 1,
  },
  
  // Dropdown
  dropdown: { backgroundColor: colors.background, overflow: 'hidden', marginTop: 6 },
  dropdownOption: {
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder, backgroundColor: colors.cardBackground,
  },
  dropdownOptionSelected: { backgroundColor: colors.primaryLight },
  dropdownText: { fontSize: 15, color: colors.text, fontWeight: '500', textAlign: 'center' },
  dropdownTextSelected: { color: colors.primary, fontWeight: '700' },
  
  // Invitees
  badge: {
    backgroundColor: colors.info, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, minWidth: 20, alignItems: 'center',
  },
  badgeText: { fontSize: 11, color: colors.white, fontWeight: '700' },
  inviteeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  inviteeInput: {
    flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.offWhite, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder,
  },
  addButton: {
    backgroundColor: colors.info, width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  inviteesList: { marginTop: 10 },
  inviteeItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.offWhite,
    marginBottom: 6, borderRadius: 10,
  },
  inviteeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 13, color: colors.white, fontWeight: '700' },
  inviteeEmail: { fontSize: 15, color: colors.text, fontWeight: '500', flex: 1 },
  removeButton: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.lightGrey,
    justifyContent: 'center', alignItems: 'center',
  },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, width: '100%' },
  modalContainer: {
    backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder, backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  cancelText: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
  doneButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 8 },
  doneText: { fontSize: 16, color: colors.white, fontWeight: '700' },
  pickerContainer: { paddingVertical: 20, alignItems: 'center', minHeight: 200 },
  picker: { width: '100%', height: 200, backgroundColor: colors.background },
  
  // Calendar modal
  calendarModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  calendarModal: { 
    flex: 1, backgroundColor: colors.background, marginTop: 60,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  calendarList: { flex: 1, padding: 16 },
  calendarOption: {
    backgroundColor: colors.cardBackground, padding: 16, marginBottom: 8,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 2, borderColor: colors.cardBorder,
  },
  calendarOptionSelected: { 
    backgroundColor: colors.primaryLight, borderColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  calendarOptionContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  calendarColorDot: { width: 20, height: 20, borderRadius: 10 },
  calendarOptionText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  calendarOptionTextSelected: { color: colors.primary, fontWeight: '700' },
});