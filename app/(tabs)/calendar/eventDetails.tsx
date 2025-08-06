import React, { useState, useRef } from 'react'; // ✅ Add useRef import
import { 
  View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, 
  Platform, Modal, Share, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import { CalendarEvent } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import { updateEvent as updateEventAPI, deleteEvent as deleteEventAPI } from '@/utils/api'; // Rename the import
import Ionicons from '@expo/vector-icons/Ionicons';
import { EventForm } from '@/components/EventForm/EventForm';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { 
    events, 
    deleteEvent: deleteEventLocal, 
    updateEvent: updateEventLocal, // Rename to avoid conflict
    getRemoteCalendarId,
    getLocalCalendarId,
    getCalendarByName 
  } = useEvents();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventFormRef = useRef<any>(null); // ✅ Replace setEventFormRef with useRef

  // Find the event
  const event = events.find(e => e.id === eventId);
  
  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <CalendarHeader
          title="Event Not Found"
          leftAction={{
            icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
            onPress: () => router.back()
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textMuted} />
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper functions
  // ✅ Fix the date formatting functions
  const formatEventDate = () => {
    if (!event.startDate) return 'No date';
    
    try {
      // Create date from the stored date string (YYYY-MM-DD format)
      const [year, month, day] = event.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day); // month is 0-indexed
      
      // Check if it's a multi-day event
      if (event.endDate && event.endDate !== event.startDate) {
        const [endYear, endMonth, endDay] = event.endDate.split('-').map(Number);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        
        // Format for date range
        const startFormatted = startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const endFormatted = endDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        return `${startFormatted} - ${endFormatted}`;
      }
      
      // Single day event
      return startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return event.startDate; // Fallback to raw date
    }
  };

  const formatEventTime = () => {
    if (!event.startTime || !event.endTime) return 'All day';
    
    try {
      // Create date objects for time formatting
      const today = new Date();
      const [startHour, startMinute] = event.startTime.split(':').map(Number);
      const [endHour, endMinute] = event.endTime.split(':').map(Number);
      
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, startMinute);
      const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHour, endMinute);
      
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return `${startTime.toLocaleTimeString('en-US', timeOptions)} - ${endTime.toLocaleTimeString('en-US', timeOptions)}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return `${event.startTime} - ${event.endTime}`; // Fallback to raw times
    }
  };

  const isMultiDay = event.startDate !== event.endDate;

  // Action handlers
  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const apiResponse = await deleteEventAPI(event.id);
              const success = await deleteEventLocal(event.id);
              if (success && apiResponse.success) {
                router.back();
              } 
              else if (!apiResponse.success) {
                Alert.alert('Error', `Failed to delete event: ${apiResponse.error || 'Unknown error'}`);
              } 
              else if (!success) {
                Alert.alert('Error', 'Failed to delete event locally');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  // ✅ Fix the share function date formatting
  const handleShare = async () => {
    try {
      const isAllDay = !event.startTime || !event.endTime;
      const duration = isAllDay ? 'All day event' : formatEventTime();
      
      const shareContent = `🎉 You're invited to: ${event.title}

📅 When: ${formatEventDate()}
⏰ Time: ${duration}${
        event.timezone && !isAllDay ? `\n🌍 Timezone: ${event.timezone.split('/').pop()?.replace('_', ' ')}` : ''
      }${
        event.location ? `\n📍 Where: ${event.location}` : ''
      }${
        event.description ? `\n\n📋 What to expect:\n${event.description}` : ''
      }

📱 Organized via Twigs Calendar`;

      await Share.share({
        message: shareContent,
        title: `Calendar Event - ${event.title}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLocationPress = () => {
    if (event.location) {
      const url = Platform.select({
        ios: `maps://maps.apple.com/?q=${encodeURIComponent(event.location)}`,
        android: `geo:0,0?q=${encodeURIComponent(event.location)}`,
      });
      
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://maps.google.com/maps?q=${encodeURIComponent(event.location!)}`);
        });
      }
    }
  };

  const handleUpdate = async (updatedEventData: Partial<CalendarEvent>) => {
    setIsUpdating(true);
    try {
      if (!updatedEventData.calendarId) {
        Alert.alert('Error', 'No calendar selected for this event');
        setIsUpdating(false);
        return;
      }

      // Get remote calendar ID for API call
      const remoteCalendarId = getRemoteCalendarId(updatedEventData.calendarId);
      
      if (!remoteCalendarId) {
        Alert.alert('Error', 'Calendar mapping not found');
        setIsUpdating(false);
        return;
      }

      // Prepare API data
      // ✅ Combine ID and data into single object
      const apiEventData = {
        id: event.id,           // Include the ID in the data
        ...updatedEventData,
        calendarId: remoteCalendarId.toString(),
      };

      // ✅ Use the API function that returns an object
      const apiResponse = await updateEventAPI(apiEventData);
      
      if (apiResponse.success) { // ✅ Now this works
        const apiResponseData = apiResponse.data.data[0];
        
        // Map remote calendar ID back to local ID
        const localCalendarId = getLocalCalendarId(apiResponseData.calendar_id) || 
                               getCalendarByName(apiResponseData.calendar)?.id ||
                               updatedEventData.calendarId;

        const updatedEventObject: CalendarEvent = {
          ...event,
          id: apiResponseData.id.toString(),
          title: apiResponseData.name,
          startDate: apiResponseData.startDate,
          endDate: apiResponseData.endDate,
          startTime: apiResponseData.startTime,
          endTime: apiResponseData.endTime,
          description: apiResponseData.description,
          hexcode: apiResponseData.hexcode || colors.primary,
          timezone: apiResponseData.timeZone,
          location: apiResponseData.location,
          calendar: apiResponseData.calendar,
          invitees: apiResponseData.invitees || [],
          calendarId: localCalendarId,
        };
        
        // ✅ Use the local hook function that returns boolean
        const localUpdateResult = await updateEventLocal(event.id, updatedEventObject);
        
        if (localUpdateResult) { // ✅ This is a boolean
          setShowEditModal(false);
          Alert.alert('Success', 'Event updated successfully!');
        } else {
          Alert.alert('Error', 'Event updated but failed to save locally');
        }
      } else {
        Alert.alert('Error', `Failed to update event: ${apiResponse.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Exception during event update:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ Update the header update function
  const handleHeaderUpdate = () => {
    if (eventFormRef.current?.handleSubmit) {
      eventFormRef.current.handleSubmit();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHeader
        title=""
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back()
        }}
        rightActions={[
          {
            icon: <Ionicons name="share-outline" size={24} color={colors.text} />,
            onPress: handleShare
          },
          {
            icon: <Ionicons name="pencil" size={24} color={colors.text} />,
            onPress: handleEdit
          },
          {
            icon: <Ionicons name="trash-outline" size={24} color={colors.danger} />,
            onPress: handleDelete
          }
        ]}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Header */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <View style={[styles.calendarDot, { backgroundColor: event.hexcode }]} />
            <Text style={styles.eventTitle}>{event.title}</Text>
          </View>
          <Text style={styles.calendarName}>{event.calendar}</Text>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.infoLabel}>Date & Time</Text>
          </View>
          
          <View style={styles.infoContent}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatEventDate()}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatEventTime()}</Text>
            </View>

            {event.timezone && (
              <View style={styles.infoRow}>
                <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  {event.timezone.split('/').pop()?.replace('_', ' ')}
                </Text>
              </View>
            )}

            {isMultiDay && (
              <View style={styles.multiDayBadge}>
                <Text style={styles.multiDayText}>Multi-day event</Text>
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        {event.location && (
          <TouchableOpacity 
            style={styles.infoCard} 
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            <View style={styles.infoHeader}>
              <Ionicons name="location" size={20} color={colors.success} />
              <Text style={styles.infoLabel}>Location</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            
            <View style={styles.infoContent}>
              <Text style={styles.locationText}>{event.location}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Description */}
        {event.description && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="document-text" size={20} color={colors.warning} />
              <Text style={styles.infoLabel}>Description</Text>
            </View>
            
            <View style={styles.infoContent}>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={handleEdit}
          >
            <Ionicons name="pencil" size={20} color={colors.white} />
            <Text style={styles.editButtonText}>Edit Event</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Ionicons 
              name={isDeleting ? "hourglass" : "trash"} 
              size={20} 
              color={colors.white} 
            />
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal - Fixed ref usage */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <CalendarHeader
            title="Edit Event"
            leftAction={{
              icon: <Ionicons name="close" size={24} color={colors.textMuted} />,
              onPress: () => setShowEditModal(false)
            }}
            rightActions={[
              {
                icon: isUpdating ? (
                  <Ionicons name="hourglass" size={24} color={colors.textMuted} />
                ) : (
                  <Ionicons name="checkmark" size={24} color={colors.success} />
                ),
                onPress: handleHeaderUpdate
              }
            ]}
          />
          
          <EventForm
            ref={eventFormRef} // ✅ Use useRef instead of setState
            initialData={event}
            onSubmit={handleUpdate}
            submitButtonText="Update Event"
            isLoading={isUpdating}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Header section
  headerSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  calendarDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    lineHeight: 34,
  },
  calendarName: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 36,
  },

  // Info cards
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  infoContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },

  // Multi-day badge
  multiDayBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  multiDayText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Location & Description
  locationText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 22,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontWeight: '400',
  },

  // Action buttons
  actionButtons: {
    gap: 12,
    paddingBottom: 32,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});