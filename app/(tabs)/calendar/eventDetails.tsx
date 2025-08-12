import React, { useState, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, 
  Platform, Modal, Share, Linking,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import { updateEvent as updateEventAPI, deleteEvent as deleteEventAPI, getEvents } from '@/utils/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EventForm } from '@/components/EventForm/EventForm';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { 
    events, 
    deleteEvent: deleteEventLocal, 
    updateEvent: updateEventLocal,
    getRemoteCalendarId,
    getLocalCalendarId,
    getCalendarByName 
  } = useEvents();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventFormRef = useRef<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  const event = events.find(e => e.id === eventId);

  const handleRefresh = async () => {
    if (isRefreshing || !event) return;
    
    setIsRefreshing(true);
    setRefreshMessage('Syncing events...');

    try {
      // ✅ FIXED: Extract dates from ISO format
      const startDate = dateTimeHelpers.extractDateFromISO(event.startDate);
      const endDate = dateTimeHelpers.extractDateFromISO(event.endDate);

      console.log('🔄 Refreshing events for date range:', startDate, 'to', endDate);

      const result = await getEvents(startDate, endDate);

      if (result.success) {
        setRefreshMessage('✅ Events synced successfully!');
        setTimeout(() => setRefreshMessage(''), 1500);
      } else {
        setRefreshMessage('❌ Sync failed');
        setTimeout(() => setRefreshMessage(''), 2000);
        console.error('Failed to sync events:', result.error);
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      setRefreshMessage('❌ Network error');
      setTimeout(() => setRefreshMessage(''), 2000);
    } finally {
      setIsRefreshing(false);
    }
  };
  
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

  // ✅ FIXED: Helper functions using ISO format
  const formatEventDate = () => {
    if (!event.startDate) return 'No date';
    
    try {
      const startDateStr = dateTimeHelpers.extractDateFromISO(event.startDate);
      const endDateStr = dateTimeHelpers.extractDateFromISO(event.endDate);
      
      if (startDateStr !== endDateStr) {
        const startFormatted = dateTimeHelpers.formatDateForDisplay(startDateStr);
        const endFormatted = dateTimeHelpers.formatDateForDisplay(endDateStr);
        return `${startFormatted} - ${endFormatted}`;
      }
      
      return dateTimeHelpers.formatDateForDisplay(startDateStr);
    } catch (error) {
      console.error('Error formatting date:', error);
      return event.startDate;
    }
  };

  const formatEventTime = () => {
    // ✅ FIXED: Use ISO format and all-day detection
    const isAllDay = dateTimeHelpers.isAllDayEvent(event.startDate, event.endDate);
    
    if (isAllDay) {
      return 'All day';
    }
    
    try {
      const startTime = dateTimeHelpers.formatISOTimeForDisplay(event.startDate);
      const endTime = dateTimeHelpers.formatISOTimeForDisplay(event.endDate);
      return `${startTime} - ${endTime}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Time not available';
    }
  };

  const isMultiDay = dateTimeHelpers.extractDateFromISO(event.startDate) !== 
                    dateTimeHelpers.extractDateFromISO(event.endDate);

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

  const handleShare = async () => {
    try {
      const isAllDay = dateTimeHelpers.isAllDayEvent(event.startDate, event.endDate);
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

      const remoteCalendarId = getRemoteCalendarId(updatedEventData.calendarId);
      
      if (!remoteCalendarId) {
        Alert.alert('Error', 'Calendar mapping not found');
        setIsUpdating(false);
        return;
      }

      const apiEventData = {
        id: event.id,
        ...updatedEventData,
        calendarId: remoteCalendarId.toString(),
      };

      const apiResponse = await updateEventAPI(apiEventData);
      
      if (apiResponse.success) {
        const apiResponseData = apiResponse.data.data[0];
        
        const localCalendarId = getLocalCalendarId(apiResponseData.calendar_id) || 
                               getCalendarByName(apiResponseData.calendar)?.id ||
                               updatedEventData.calendarId;

        // ✅ FIXED: Use ISO format from API response
        const updatedEventObject: CalendarEvent = {
          ...event,
          id: apiResponseData.id.toString(),
          title: apiResponseData.name,
          startDate: apiResponseData.startDate, // ✅ Already ISO from API
          endDate: apiResponseData.endDate,     // ✅ Already ISO from API
          description: apiResponseData.description,
          hexcode: apiResponseData.hexcode || colors.primary,
          timezone: apiResponseData.timeZone,
          location: apiResponseData.location,
          calendar: apiResponseData.calendar,
          invitees: apiResponseData.invitees || [],
          calendarId: localCalendarId,
        };
        
        const localUpdateResult = await updateEventLocal(event.id, updatedEventObject);
        
        if (localUpdateResult) {
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

      {(isRefreshing || refreshMessage) && (
        <View style={styles.refreshIndicator}>
          {isRefreshing ? (
            <View style={styles.refreshContent}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.refreshText}>Syncing events...</Text>
            </View>
          ) : (
            <Text style={[
              styles.refreshText, 
              { color: refreshMessage.includes('✅') ? colors.success : colors.danger }
            ]}>
              {refreshMessage}
            </Text>
          )}
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Pull to sync events"
            titleColor={colors.textMuted}
          />
        }
      >
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

      {/* Edit Modal */}
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
            ref={eventFormRef}
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
  refreshIndicator: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  refreshContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
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