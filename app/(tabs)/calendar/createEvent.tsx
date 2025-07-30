import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  StyleSheet, 
  Platform,
  KeyboardAvoidingView,
  Animated,
  Modal // ✅ Add Modal import
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEvents, createCalendarEventObject } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createEvent } from '@/utils/api';

export default function CreateEventScreen() {
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams<{ selectedDate?: string }>();
  const { addEvent, getUserTimezone, commonTimezones } = useEvents();

  // TextInput refs
  const scrollViewRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
  const locationInputRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
  const descriptionInputRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
  const inviteeInputRef = useRef<TextInput>(null) as React.RefObject<TextInput>;

  // State
  const [eventData, setEventData] = useState<Partial<CalendarEvent>>({
    title: '',
    startDate: selectedDate || dateTimeHelpers.getTodayString(),
    endDate: selectedDate || dateTimeHelpers.getTodayString(),
    startTime: null,
    endTime: null,
    description: '',
    location: '',
    hexcode: colors.primary,
    timezone: getUserTimezone(),
    calendar: 'Personal',
    invitees: [],
  });

  const [newInvitee, setNewInvitee] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle handler for All Day switch
  const handleAllDayToggle = () => {
    setIsAllDay((prev) => !prev);
    // Optionally clear times if toggling to all-day
    if (!isAllDay) {
      updateEventData('startTime', null);
      updateEventData('endTime', null);
    } else {
      const { startTime, endTime } = getCurrentTimeDefaults();
      updateEventData('startTime', startTime);
      updateEventData('endTime', endTime);
    }
  };
  
  // ✅ ENHANCED picker states with animation control
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState(new Date());
  const [tempPickerValue, setTempPickerValue] = useState(new Date());

  // ✅ NEW: Animation values for smooth modal transitions
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(300)).current;

  // ✅ RESTORED: Dropdown states for timezone and calendar selection
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [timezoneDropdownHeight] = useState(new Animated.Value(0));
  const [calendarDropdownHeight] = useState(new Animated.Value(0));

  // ✅ RESTORED: Calendar management
  const [availableCalendars, setAvailableCalendars] = useState([
    { name: 'Personal', hexcode: colors.primary },
  ]);
  const [showAddCalendarInput, setShowAddCalendarInput] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');

  // Set default calendar on mount
  useEffect(() => {
    if (!eventData.calendar && availableCalendars.length > 0) {
      setEventData(prev => ({ 
        ...prev, 
        calendar: availableCalendars[0].name,
        hexcode: availableCalendars[0].hexcode 
      }));
    }
  }, []);

  // Auto-scroll helper
  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    if (inputRef.current && scrollViewRef.current) {
      setTimeout(() => {
        let scrollY = 0;
        
        if (inputRef === titleInputRef) scrollY = 0;
        else if (inputRef === locationInputRef) scrollY = 100;
        else if (inputRef === inviteeInputRef) scrollY = 700;
        else if (inputRef === descriptionInputRef) scrollY = 800;
        
        scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
      }, 100);
    }
  };

  // Helper functions
  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCurrentTimeDefaults = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    // ✅ Round both times to nearest 5-minute intervals
    const roundedStart = roundToNearestFiveMinutes(now);
    const roundedEnd = roundToNearestFiveMinutes(oneHourLater);
    
    return {
      startTime: dateTimeHelpers.formatTimeForStorage(roundedStart),
      endTime: dateTimeHelpers.formatTimeForStorage(roundedEnd)
    };
  };

  const updateEventData = (field: keyof CalendarEvent, value: any) => {
    setEventData((prev: Partial<CalendarEvent>) => ({
      ...prev,
      [field]: value,
    }));
  };

  // TextInput focus handlers
  const handleTitleFocus = () => setTimeout(() => scrollToInput(titleInputRef), 100);
  const handleLocationFocus = () => setTimeout(() => scrollToInput(locationInputRef), 100);
  const handleDescriptionFocus = () => setTimeout(() => scrollToInput(descriptionInputRef), 100);
  const handleInviteeFocus = () => setTimeout(() => scrollToInput(inviteeInputRef), 100);

  // ✅ RESTORED: Dropdown animation helpers
  const toggleDropdown = (type: 'timezone' | 'calendar') => {
    if (type === 'timezone') {
      const toValue = showTimezoneDropdown ? 0 : 200;
      setShowTimezoneDropdown(!showTimezoneDropdown);
      
      Animated.timing(timezoneDropdownHeight, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      const toValue = showCalendarDropdown ? 0 : 250;
      setShowCalendarDropdown(!showCalendarDropdown);
      
      Animated.timing(calendarDropdownHeight, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const closeDropdown = (type: 'timezone' | 'calendar') => {
    if (type === 'timezone' && showTimezoneDropdown) {
      setShowTimezoneDropdown(false);
      Animated.timing(timezoneDropdownHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (type === 'calendar' && showCalendarDropdown) {
      setShowCalendarDropdown(false);
      Animated.timing(calendarDropdownHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // Invitee management
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addInvitee = () => {
    const trimmedInvitee = newInvitee.trim();
    

    if (!validateEmail(trimmedInvitee)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const currentInvitees = eventData.invitees || [];
    
    if (currentInvitees.includes(trimmedInvitee)) {
      Alert.alert('Error', 'This email is already added');
      return;
    }

    updateEventData('invitees', [...currentInvitees, trimmedInvitee]);
    setNewInvitee('');
  };

  const removeInvitee = (email: string) => {
    const currentInvitees = eventData.invitees || [];
    const updatedInvitees = currentInvitees.filter(invitee => invitee !== email);
    updateEventData('invitees', updatedInvitees);
  };

  // ✅ RESTORED: Calendar management
  const handleAddCalendar = async () => {
    if (!newCalendarName.trim()) {
      Alert.alert('Error', 'Please enter a calendar name');
      return;
    }

    const colors_list = [colors.primary, colors.info, colors.purple, colors.warning, colors.danger, colors.success];
    const randomColor = colors_list[Math.floor(Math.random() * colors_list.length)];

    const newCalendar = {
      id: `calendar_${Date.now()}`,
      name: newCalendarName.trim(),
      hexcode: randomColor
    };

    setAvailableCalendars(prev => [...prev, newCalendar]);
    
    updateEventData('calendar', newCalendarName.trim());
    updateEventData('hexcode', randomColor);
    
    setNewCalendarName('');
    setShowAddCalendarInput(false);
    
    Alert.alert('Success', 'Calendar added successfully!');
  };

  // ✅ ENHANCED Date/Time picker handlers with animations
  const openDatePicker = (target: 'start' | 'end') => {
    setPickerTarget(target);
    setPickerMode('date');
    const currentDate = target === 'start' ? eventData.startDate : eventData.endDate;
    const dateValue = currentDate ? new Date(currentDate) : new Date();
    setTempDate(dateValue);
    setTempPickerValue(dateValue);
    
    // ✅ Universal modal show with animation
    setShowDatePicker(true);
    
    // Animate in for ALL platforms
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Add this helper function at the top of your component:

  const roundToNearestFiveMinutes = (date: Date): Date => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 5) * 5;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes, 0, 0); // Also reset seconds and milliseconds
    return newDate;
  };

  // ✅ ENHANCED: Update your openTimePicker function
  const openTimePicker = (target: 'start' | 'end') => {
    setPickerTarget(target);
    setPickerMode('time');
    const currentTime = target === 'start' ? eventData.startTime : eventData.endTime;
    
    if (currentTime) {
      const [hours, minutes] = currentTime.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
      
      // ✅ Round to nearest 5-minute interval
      const roundedTime = roundToNearestFiveMinutes(timeDate);
      setTempDate(roundedTime);
      setTempPickerValue(roundedTime);
    } else {
      const { startTime, endTime } = getCurrentTimeDefaults();
      const timeStr = target === 'start' ? startTime : endTime;
      const [hours, minutes] = timeStr.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
      
      // ✅ Round to nearest 5-minute interval
      const roundedTime = roundToNearestFiveMinutes(timeDate);
      setTempDate(roundedTime);
      setTempPickerValue(roundedTime);
    }
    
    // ✅ Universal modal show with animation
    setShowTimePicker(true);
    
    // Same animation for ALL platforms
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ✅ UNIVERSAL picker change handler - no platform logic needed
  const handlePickerChange = (event: any, selectedDate?: Date) => {
    // Simply update the temp value - don't auto-close anything
    if (selectedDate) {
      setTempPickerValue(selectedDate);
    }
  };

  // ✅ UNIVERSAL confirm handler
  const confirmPickerSelection = () => {
    const dateToUse = tempPickerValue;
    
    if (pickerMode === 'date') {
      const dateStr = dateTimeHelpers.formatDateForStorage(dateToUse);
      if (pickerTarget === 'start') {
        updateEventData('startDate', dateStr);
        if (eventData.endDate && eventData.endDate < dateStr) {
          updateEventData('endDate', dateStr);
        }
      } else {
        updateEventData('endDate', dateStr);
      }
    } else {
      const timeStr = dateTimeHelpers.formatTimeForStorage(dateToUse);
      if (pickerTarget === 'start') {
        updateEventData('startTime', timeStr);
        if (!eventData.endTime || eventData.endTime <= timeStr) {
          const endTime = new Date(dateToUse.getTime() + 60 * 60 * 1000);
          updateEventData('endTime', dateTimeHelpers.formatTimeForStorage(endTime));
        }
      } else {
        updateEventData('endTime', timeStr);
      }
    }
    
    // ✅ Universal close with animation
    closePickerWithAnimation();
  };

  // ✅ UNIVERSAL cancel handler
  const cancelPickerSelection = () => {
    setTempPickerValue(tempDate); // Reset to original value
    closePickerWithAnimation();
  };

  const closePickerWithAnimation = () => {
    // Add animation logic here
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDatePicker(false);
      setShowTimePicker(false);
    });
  };

  // Validation and save
  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!eventData.title?.trim()) errors.push('Title is required');
    if (!eventData.timezone) errors.push('Timezone is required');
    if (!eventData.calendar?.trim()) errors.push('Calendar is required');
    
    if (eventData.startDate && !dateTimeHelpers.isValidDate(eventData.startDate)) {
      errors.push('Invalid start date format');
    }
    if (eventData.timezone && !dateTimeHelpers.isValidTimezone(eventData.timezone)) {
      errors.push('Invalid timezone');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      
      const success = await createEvent(eventData);

      if(success.success) {
        const localEventObject:CalendarEvent = {
          id: success.data.id,
          title: success.data.name,
          startDate: success.data.startDate,
          endDate: success.data.endDate,
          startTime: success.data.startTime,
          endTime: success.data.endTime,
          description: success.data.description,
          hexcode: success.data.hexcode,
          timezone: success.data.timeZone,
          location: success.data.location,
          calendar: success.data.calendar,
          invitees: eventData.invitees || [],
          calendarId: success.data.calendar_id,
        }
        const localSuccess = await addEvent(localEventObject);

        if (localSuccess) {
          Alert.alert('Success', 'Event created successfully!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Warning', 'Event saved to cloud but failed to save locally. Please refresh the app.');
          router.back(); // Still go back since cloud save succeeded
        }
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

  // Get selected calendar's color
  const getSelectedCalendarColor = () => {
    const selectedCalendar = availableCalendars.find(cal => cal.name === eventData.calendar);
    return selectedCalendar?.hexcode || colors.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHeader
        title="Event Creation"
        leftAction={{
          icon: <Ionicons name="close" size={24} color={colors.text} />,
          onPress: () => router.back()
        }}
        rightActions={[
          {
            // ✅ REPLACED: Green checkmark instead of "Save" button
            icon: (
              <View style={styles.checkmarkButtonContainer}>
                <Ionicons name="checkmark" size={24} color={colors.white} />
              </View>
            ),
            onPress: handleSave,
          }
        ]}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title */}
          <View style={styles.inputCard}>
            <View style={styles.inputLabelContainer}>
              <Text style={styles.inputLabel}>Title</Text>
            </View>
            <TextInput
              ref={titleInputRef}
              style={styles.titleInput}
              value={eventData.title || ''}
              onChangeText={(text) => updateEventData('title', text)}
              onFocus={handleTitleFocus}
              placeholder="Enter event title"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          {/* Location */}
          <View style={styles.inputCard}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.inputLabel}>Location</Text>
            </View>
            <TextInput
              ref={locationInputRef}
              style={styles.locationInput}
              value={eventData.location || ''}
              onChangeText={(text) => updateEventData('location', text)}
              onFocus={handleLocationFocus}
              placeholder="Add location or video call link"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
            />
          </View>

          {/* All Day Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabelContainer}>
                <Ionicons name="sunny" size={18} color={colors.warning} />
                <Text style={styles.toggleLabel}>All-day event</Text>
              </View>
              <TouchableOpacity onPress={handleAllDayToggle} style={styles.toggleWrapper}>
                <View style={[styles.toggle, isAllDay && styles.toggleActive]}>
                  <View style={[styles.toggleIndicator, isAllDay && styles.toggleIndicatorActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Start Date/Time */}
          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeHeader}>
              <View style={styles.dateTimeLabelContainer}>
                <Ionicons name="play" size={16} color={colors.success} />
                <Text style={styles.dateTimeLabel}>Starts</Text>
              </View>
            </View>
            
            <View style={styles.dateTimeContent}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => openDatePicker('start')}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.dateButtonText}>
                  {formatDateForDisplay(eventData.startDate || dateTimeHelpers.getTodayString())}
                </Text>
              </TouchableOpacity>
              
              {!isAllDay && (
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => openTimePicker('start')}
                >
                  <Ionicons name="time-outline" size={16} color={colors.white} />
                  <Text style={styles.timeButtonText}>
                    {eventData.startTime ? formatTimeForDisplay(eventData.startTime) : 
                     formatTimeForDisplay(getCurrentTimeDefaults().startTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* End Date/Time */}
          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeHeader}>
              <View style={styles.dateTimeLabelContainer}>
                <Ionicons name="stop" size={16} color={colors.danger} />
                <Text style={styles.dateTimeLabel}>Ends</Text>
              </View>
            </View>
            
            <View style={styles.dateTimeContent}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => openDatePicker('end')}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.dateButtonText}>
                  {formatDateForDisplay(eventData.endDate || dateTimeHelpers.getTodayString())}
                </Text>
              </TouchableOpacity>
              
              {!isAllDay && (
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => openTimePicker('end')}
                >
                  <Ionicons name="time-outline" size={16} color={colors.white} />
                  <Text style={styles.timeButtonText}>
                    {eventData.endTime ? formatTimeForDisplay(eventData.endTime) : 
                     formatTimeForDisplay(getCurrentTimeDefaults().endTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ✅ RESTORED: Time Zone Dropdown */}
          <View style={styles.selectionCard}>
            <TouchableOpacity 
              style={styles.selectionRow}
              onPress={() => toggleDropdown('timezone')}
            >
              <View style={styles.selectionLabelContainer}>
                <Ionicons name="globe" size={16} color={colors.info} />
                <Text style={styles.selectionLabel}>Time Zone</Text>
              </View>
              <View style={styles.selectionValueContainer}>
                <Text style={styles.selectionValue}>
                  {eventData.timezone?.split('/').pop()?.replace('_', ' ') || 'New York'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Animated Timezone Dropdown */}
            <Animated.View style={[styles.dropdown, { height: timezoneDropdownHeight }]}>
              {showTimezoneDropdown && (
                <ScrollView 
                  style={styles.dropdownContent}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {commonTimezones.map((tz) => (
                    <TouchableOpacity
                      key={tz}
                      style={[
                        styles.dropdownOption,
                        eventData.timezone === tz && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        updateEventData('timezone', tz);
                        closeDropdown('timezone');
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        eventData.timezone === tz && styles.dropdownOptionTextSelected
                      ]}>
                        {tz.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Animated.View>
          </View>

          {/* ✅ RESTORED: Calendar Dropdown */}
          <View style={styles.selectionCard}>
            <TouchableOpacity 
              style={styles.selectionRow}
              onPress={() => toggleDropdown('calendar')}
            >
              <View style={styles.selectionLabelContainer}>
                <Ionicons name="folder-open" size={16} color={colors.purple} />
                <Text style={styles.selectionLabel}>Calendar</Text>
              </View>
              <View style={styles.selectionValueContainer}>
                <View style={[styles.calendarDot, { backgroundColor: getSelectedCalendarColor() }]} />
                <Text style={styles.selectionValue}>
                  {eventData.calendar || 'Default Calendar'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Animated Calendar Dropdown */}
            <Animated.View style={[styles.dropdown, { height: calendarDropdownHeight }]}>
              {showCalendarDropdown && (
                <ScrollView 
                  style={styles.dropdownContent}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {/* Available Calendars */}
                  {availableCalendars.map((calendar) => (
                    <TouchableOpacity
                      key={calendar.name}
                      style={[
                        styles.calendarDropdownOption,
                        eventData.calendar === calendar.name && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        updateEventData('calendar', calendar.name);
                        updateEventData('hexcode', calendar.hexcode);
                        closeDropdown('calendar');
                      }}
                    >
                      <View style={styles.calendarOptionContent}>
                        <View style={[styles.calendarDot, { backgroundColor: calendar.hexcode }]} />
                        <Text style={[
                          styles.dropdownOptionText,
                          eventData.calendar === calendar.name && styles.dropdownOptionTextSelected
                        ]}>
                          {calendar.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Add Calendar Section */}
                  {!showAddCalendarInput ? (
                    <TouchableOpacity
                      style={styles.addCalendarButton}
                      onPress={() => setShowAddCalendarInput(true)}
                    >
                      <Ionicons name="add-circle" size={20} color={colors.success} />
                      <Text style={styles.addCalendarText}>Add New Calendar</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.addCalendarForm}>
                      <TextInput
                        style={styles.addCalendarInput}
                        value={newCalendarName}
                        onChangeText={setNewCalendarName}
                        placeholder="Calendar name"
                        placeholderTextColor={colors.textMuted}
                        returnKeyType="done"
                        onSubmitEditing={handleAddCalendar}
                        autoFocus
                      />
                      <View style={styles.addCalendarActions}>
                        <TouchableOpacity
                          style={styles.addCalendarCancelButton}
                          onPress={() => {
                            setShowAddCalendarInput(false);
                            setNewCalendarName('');
                          }}
                        >
                          <Text style={styles.addCalendarCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.addCalendarSaveButton}
                          onPress={handleAddCalendar}
                        >
                          <Text style={styles.addCalendarSaveText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              )}
            </Animated.View>
          </View>

          {/* Invitees Section */}
          <View style={styles.inviteesCard}>
            <View style={styles.inviteesHeader}>
              <View style={styles.inviteesLabelContainer}>
                <Ionicons name="mail" size={16} color={colors.info} />
                <Text style={styles.inviteesLabel}>Invitees</Text>
              </View>
              <View style={styles.inviteeCountBadge}>
                <Text style={styles.inviteeCountText}>
                  {eventData.invitees?.length || 0}
                </Text>
              </View>
            </View>

            <View style={styles.addInviteeContainer}>
              <TextInput
                ref={inviteeInputRef}
                style={styles.inviteeInput}
                value={newInvitee}
                onChangeText={setNewInvitee}
                onFocus={handleInviteeFocus}
                placeholder="Enter email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={addInvitee}
              />
              <TouchableOpacity 
                style={styles.addInviteeButton}
                onPress={addInvitee}
              >
                <Ionicons name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            {eventData.invitees && eventData.invitees.length > 0 && (
              <View style={styles.inviteesList}>
                {eventData.invitees.map((invitee, index) => (
                  <View key={index} style={styles.inviteeItem}>
                    <View style={styles.inviteeInfo}>
                      <View style={[styles.inviteeAvatar, { backgroundColor: `${colors.primary}${Math.floor(Math.random() * 9)}0` }]}>
                        <Text style={styles.inviteeAvatarText}>
                          {invitee.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.inviteeEmail}>{invitee}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeInviteeButton}
                      onPress={() => removeInvitee(invitee)}
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <View style={styles.descriptionLabelContainer}>
              <Ionicons name="document-text" size={16} color={colors.warning} />
              <Text style={styles.descriptionLabel}>Description</Text>
            </View>
            <TextInput
              ref={descriptionInputRef}
              style={styles.descriptionInput}
              value={eventData.description || ''}
              onChangeText={(text) => updateEventData('description', text)}
              onFocus={handleDescriptionFocus}
              placeholder="Add event description, agenda, or additional details..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ✅ ENHANCED: Smooth Animated Modal for iOS Pickers */}
      <Modal
        visible={showDatePicker || showTimePicker} // ✅ No platform check!
        transparent={true}
        animationType="none"
        onRequestClose={cancelPickerSelection}
      >
        <Animated.View 
          style={[
            styles.pickerModalOverlay,
            { opacity: modalOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={cancelPickerSelection}
          />
          
          <Animated.View 
            style={[
              styles.pickerModalContainer,
              { transform: [{ translateY: modalTranslateY }] }
            ]}
          >
            {/* Universal Header */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity 
                style={styles.pickerCancelButton}
                onPress={cancelPickerSelection}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <Text style={styles.pickerTitle}>
                {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              
              <TouchableOpacity 
                style={styles.pickerDoneButton}
                onPress={confirmPickerSelection}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            {/* ✅ UNIVERSAL: Platform-Adaptive Picker */}
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempPickerValue}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} // ✅ Only platform check needed
                onChange={handlePickerChange}
                style={styles.dateTimePicker}
                textColor={colors.text}
                accentColor={colors.primary} // ✅ Universal accent color
                minuteInterval={5} // ✅ Universal minute interval
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
    paddingTop: 8,
  },
  
  // ✅ UPDATED: Green checkmark button instead of save button
  checkmarkButtonContainer: {
    backgroundColor: colors.success, // Green background
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  inputCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInput: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    paddingVertical: 0,
    minHeight: 24,
  },
  locationInput: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
    minHeight: 20,
  },

  toggleCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  toggleWrapper: {
    padding: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.success,
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },

  dateTimeCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dateTimeHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  dateTimeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTimeContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: 6,
  },
  dateButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    minWidth: 110,
  },
  timeButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },

  // ✅ Enhanced selection cards with dropdown functionality
  selectionCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  selectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectionValue: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  calendarDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },

  // ✅ Dropdown styles
  dropdown: {
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  dropdownContent: {
    flex: 1,
  },
  dropdownScrollContent: {
    paddingVertical: 4,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  calendarDropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
  },
  calendarOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.successLight,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  addCalendarText: {
    fontSize: 15,
    color: colors.success,
    fontWeight: '700',
  },
  addCalendarForm: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.offWhite,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  addCalendarInput: {
    fontSize: 15,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
    fontWeight: '500',
  },
  addCalendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  addCalendarCancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.lightGrey,
    borderRadius: 6,
    alignItems: 'center',
  },
  addCalendarCancelText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  addCalendarSaveButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.success,
    borderRadius: 6,
    alignItems: 'center',
  },
  addCalendarSaveText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },

  inviteesCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  inviteesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  inviteesLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inviteesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteeCountBadge: {
    backgroundColor: colors.info,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  inviteeCountText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
  },
  addInviteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  inviteeInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.offWhite,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontWeight: '500',
  },
  addInviteeButton: {
    backgroundColor: colors.info,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  inviteesList: {
    backgroundColor: colors.background,
    paddingTop: 4,
    paddingBottom: 8,
  },
  inviteeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.cardBackground,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  inviteeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  inviteeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  inviteeAvatarText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  inviteeEmail: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  removeInviteeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },

  descriptionCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 100,
  },
  descriptionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionInput: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    minHeight: 60,
    textAlignVertical: 'top',
    fontWeight: '500',
  },

  // ✅ ENHANCED: Smooth modal animation styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    width: '100%',
  },
  // ✅ UNIVERSAL: Platform-adaptive but unified styling
  pickerModalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Only for safe area
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    minHeight: 300, // ✅ Consistent height for both platforms
  },

  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // ✅ Consistent header height
    minHeight: 60,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  pickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pickerCancelText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  pickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerDoneText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220, // ✅ Consistent container height
  },
  dateTimePicker: {
    width: '100%',
    height: 200, // ✅ Fixed height for both platforms
    backgroundColor: colors.background,
  },
});