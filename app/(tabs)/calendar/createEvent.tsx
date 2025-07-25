import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import { Calendar, toDateId } from '@marceloterreiro/flash-calendar';

type EventData = {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  eventType: 'Event' | 'Reminder';
  invitees: string[]; // Add invitees array
};

export default function CreateEventScreen() {
  const { selectedDate } = useLocalSearchParams();
  
  // Combined form state
  const [eventData, setEventData] = useState<EventData>({
    title: '',
    location: '',
    startDate: selectedDate as string || '',
    endDate: selectedDate as string || '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    eventType: 'Event',
    invitees: [], // Initialize empty invitees array
  });

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(toDateId(new Date()));
  
  // Animation state
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Add state for invitee input
  const [currentInvitee, setCurrentInvitee] = useState('');

  const updateEventData = (field: keyof EventData, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const addInvitee = () => {
    if (currentInvitee.trim() && !eventData.invitees.includes(currentInvitee.trim())) {
      updateEventData('invitees', [...eventData.invitees, currentInvitee.trim()]);
      setCurrentInvitee('');
    }
  };

  const removeInvitee = (email: string) => {
    updateEventData('invitees', eventData.invitees.filter(invitee => invitee !== email));
  };

  const handleDateSelect = (selectedDate: string) => {
    if (datePickerType === 'start') {
      updateEventData('startDate', selectedDate);
      // Auto-update end date to match start date if it's empty or before start date
      if (!eventData.endDate || eventData.endDate < selectedDate) {
        updateEventData('endDate', selectedDate);
      }
    } else {
      updateEventData('endDate', selectedDate);
    }
    setShowDatePicker(false);
  };

  const openDatePicker = (type: 'start' | 'end') => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const navigateMonth = (direction: 'next' | 'prev') => {
    if (isAnimating) return; // Prevent multiple animations

    setIsAnimating(true);
    
    // Start animation
    const toValue = direction === 'next' ? -300 : 300;
    
    Animated.timing(slideAnim, {
      toValue: toValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Update month after slide out
      const currentDate = new Date(currentMonth);
      if (direction === 'next') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
      }
      setCurrentMonth(toDateId(currentDate));
      
      // Reset position to opposite side
      slideAnim.setValue(-toValue);
      
      // Slide in from opposite side
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const getMonthYear = (monthId: string) => {
    const date = new Date(monthId);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleSave = () => {
    if (!eventData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    // TODO: Save event to your data store
    console.log('Saving event:', eventData);

    Alert.alert('Success', `${eventData.eventType} created successfully!`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  // Right actions with Add button
  const rightActions = [
    {
      icon: <Ionicons name="checkmark-sharp" size={24} color="#070c1f" />,
      onPress: handleSave,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <CalendarHeader
        leftAction={{
          icon: <Ionicons name="close-sharp" size={24} color="#070c1f" />,
          onPress: () => router.back()
        }}
        rightActions={rightActions}
      />
      
      <ScrollView style={{ flex: 1, padding: 16, backgroundColor: colors.white }}>
        {/* Event/Reminder Toggle */}
        <View style={styles.typeToggleContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, eventData.eventType === 'Event' && styles.typeButtonActive]}
            onPress={() => updateEventData('eventType', 'Event')}
          >
            <Text style={[styles.typeButtonText, eventData.eventType === 'Event' && styles.typeButtonTextActive]}>
              Event
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, eventData.eventType === 'Reminder' && styles.typeButtonActive]}
            onPress={() => updateEventData('eventType', 'Reminder')}
          >
            <Text style={[styles.typeButtonText, eventData.eventType === 'Reminder' && styles.typeButtonTextActive]}>
              Reminder
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.titleInput]}
            value={eventData.title}
            onChangeText={(value) => updateEventData('title', value)}
            placeholder="Title"
            placeholderTextColor={colors.grey}
          />
        </View>

        {/* Location */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={eventData.location}
            onChangeText={(value) => updateEventData('location', value)}
            placeholder="Location or Video Call"
            placeholderTextColor={colors.grey}
          />
        </View>

        {/* Invitees - Only show for Events */}
        {eventData.eventType === 'Event' && (
          <View style={styles.inputContainer}>
            <View style={styles.inviteesHeader}>
              <Text style={styles.inviteesLabel}>Invitees</Text>
              <Text style={styles.inviteesCount}>
                {eventData.invitees.length} {eventData.invitees.length === 1 ? 'person' : 'people'}
              </Text>
            </View>
            
            {/* Add Invitee Input */}
            <View style={styles.addInviteeContainer}>
              <TextInput
                style={styles.inviteeInput}
                value={currentInvitee}
                onChangeText={setCurrentInvitee}
                placeholder="Add email address"
                placeholderTextColor={colors.grey}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={addInvitee}
              />
              <TouchableOpacity 
                onPress={addInvitee}
                style={[styles.addButton, !currentInvitee.trim() && styles.addButtonDisabled]}
                disabled={!currentInvitee.trim()}
              >
                <Ionicons name="add" size={20} color={currentInvitee.trim() ? colors.darkGreen : colors.grey} />
              </TouchableOpacity>
            </View>

            {/* Invitees List */}
            {eventData.invitees.length > 0 && (
              <View style={styles.inviteesList}>
                {eventData.invitees.map((email, index) => (
                  <View key={index} style={styles.inviteeItem}>
                    <View style={styles.inviteeInfo}>
                      <View style={styles.inviteeAvatar}>
                        <Text style={styles.inviteeAvatarText}>{email.charAt(0)}</Text>
                      </View>
                      <Text style={styles.inviteeName}>{email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeInvitee(email)}>
                      <Ionicons name="trash" size={20} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* All Day Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>All-day</Text>
          <TouchableOpacity
            style={[styles.toggle, eventData.isAllDay && styles.toggleActive]}
            onPress={() => updateEventData('isAllDay', !eventData.isAllDay)}
          >
            <View style={[styles.toggleKnob, eventData.isAllDay && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>

        {/* Start Date/Time */}
        <View style={styles.dateTimeRow}>
          <Text style={styles.dateTimeLabel}>Starts</Text>
          <View style={styles.dateTimeInputs}>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('start')}
            >
              <Text style={styles.dateText}>
                {eventData.startDate || 'Select Date'}
              </Text>
            </TouchableOpacity>
            {!eventData.isAllDay && (
              <TouchableOpacity style={styles.timeInput}>
                <Text style={styles.timeText}>
                  {eventData.startTime || '2:00 PM'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* End Date/Time */}
        <View style={styles.dateTimeRow}>
          <Text style={styles.dateTimeLabel}>Ends</Text>
          <View style={styles.dateTimeInputs}>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('end')}
            >
              <Text style={styles.dateText}>
                {eventData.endDate || 'Select Date'}
              </Text>
            </TouchableOpacity>
            {!eventData.isAllDay && (
              <TouchableOpacity style={styles.timeInput}>
                <Text style={styles.timeText}>
                  {eventData.endTime || '3:00 PM'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Month Navigation Header */}
            <View style={styles.monthNavigationHeader}>
              <TouchableOpacity 
                onPress={() => navigateMonth('prev')}
                style={[styles.navButton, isAnimating && styles.navButtonDisabled]}
                disabled={isAnimating}
              >
                <Ionicons name="chevron-back" size={24} color={isAnimating ? colors.grey : colors.darkGreen} />
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>
                {getMonthYear(currentMonth)}
              </Text>
              
              <TouchableOpacity 
                onPress={() => navigateMonth('next')}
                style={[styles.navButton, isAnimating && styles.navButtonDisabled]}
                disabled={isAnimating}
              >
                <Ionicons name="chevron-forward" size={24} color={isAnimating ? colors.grey : colors.darkGreen} />
              </TouchableOpacity>
            </View>

            {/* Animated Calendar Container */}
            <View style={styles.calendarWrapper}>
              <Animated.View 
                style={[
                  styles.calendarContainer,
                  {
                    transform: [{ translateX: slideAnim }]
                  }
                ]}
              >
                <Calendar
                  theme={{
                    rowMonth: {
                      container: {
                        display: 'none', // Hide the month title in the calendar
                      },
                    },
                    rowWeek: {
                      container: {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.offWhite,
                        paddingBottom: 8,
                        marginBottom: 8,
                      },
                    },
                    itemWeekName: { 
                      content: {
                        color: colors.grey,
                        fontWeight: '500',
                        fontSize: 12,
                      }
                    },
                    itemDay: {
                      idle: ({ isPressed, isWeekend }) => ({
                        container: {
                          backgroundColor: isPressed ? colors.darkGreen : "transparent",
                          borderRadius: isPressed ? 20 : 0,
                          width: 40,
                          height: 40,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                        content: {
                          color: isPressed ? colors.white : (isWeekend ? colors.grey : colors.text),
                          fontWeight: isPressed ? '600' : '400',
                        },
                      }),
                      today: ({ isPressed }) => ({
                        container: {
                          backgroundColor: isPressed ? colors.darkGreen : colors.white,
                          borderColor: colors.darkGreen,
                          borderWidth: 2,
                          borderRadius: 20,
                          width: 40,
                          height: 40,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                        content: {
                          color: isPressed ? colors.white : colors.darkGreen,
                          fontWeight: '600',
                        },
                      }),
                    },
                  }}
                  calendarMonthId={currentMonth}
                  onCalendarDayPress={handleDateSelect}
                />
              </Animated.View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  typeToggleContainer: {
    flexDirection: 'row' as const,
    marginBottom: 24,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 14,
    color: colors.grey, // Changed from colors.text to colors.grey for inactive state
    fontWeight: '500' as const,
  },
  typeButtonTextActive: {
    fontSize: 14,
    color: colors.text, // Active state remains colors.text
    fontWeight: '600' as const,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
    backgroundColor: colors.white,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.text,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.offWhite,
    justifyContent: 'center' as const,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.darkGreen,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  dateTimeRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
    backgroundColor: colors.white,
  },
  dateTimeLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dateTimeInputs: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  dateInput: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
  },
  timeInput: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center' as const,
  },
  timeText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center' as const,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  monthNavigationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.offWhite,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  calendarWrapper: {
    overflow: 'hidden' as const,
    height: 300,
  },
  calendarContainer: {
    width: '100%' as `${number}%`,
  },
  modalActions: {
    marginTop: 20,
    alignItems: 'center' as const,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  inviteesHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  inviteesLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500' as const,
  },
  inviteesCount: {
    fontSize: 14,
    color: colors.grey,
    fontWeight: '400' as const,
  },
  addInviteeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  inviteeInput: {
    flex: 1,
    backgroundColor: colors.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkGreen,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  addButtonDisabled: {
    backgroundColor: colors.grey,
  },
  inviteesList: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 12,
  },
  inviteeItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inviteeInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  inviteeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkGreen,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 8,
  },
  inviteeAvatarText: {
    color: colors.white,
    fontWeight: '500' as const,
    fontSize: 14,
  },
  inviteeName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500' as const,
  },
};