import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  RefreshControl,
  StyleSheet 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import { useEvents } from '@/hooks/useEvents';
import { Calendar } from '@/types/events';
import { 
  createCalendar as createCalendarAPI, 
  updateCalendar as updateCalendarAPI, 
  deleteCalendar as deleteCalendarAPI 
} from '@/utils/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function ManageCalendarsScreen() {
  const router = useRouter();
  const { 
    calendars, 
    addCalendar, 
    updateCalendar, 
    deleteCalendar,
    syncCalendarsWithAPI,
    getRemoteCalendarId 
  } = useEvents();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncCalendarsWithAPI();
    } catch (error) {
      console.error('Failed to sync calendars:', error);
      Alert.alert('Error', 'Failed to sync calendars from server');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCalendar = () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    Alert.prompt(
      'Create Calendar',
      'Enter calendar name:',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsCreating(false) },
        {
          text: 'Create',
          onPress: async (name) => {
            if (!name?.trim()) {
              Alert.alert('Error', 'Calendar name is required');
              setIsCreating(false);
              return;
            }

            try {
              // Generate random color
              const colors_list = [
                '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
                '#FF2D92', '#00C7BE', '#32ADE6', '#5856D6', '#FF6B35'
              ];
              const randomColor = colors_list[Math.floor(Math.random() * colors_list.length)];

              // ✅ FIXED: Create API data separately
              const apiCalendarData = {
                name: name.trim(),
                hexcode: randomColor,
                is_private: false // ✅ This is for API only
              };

              // Create on server first
              const apiResponse = await createCalendarAPI(apiCalendarData);
              
              if (apiResponse.success) {
                // After successful API creation, sync calendars from server to avoid duplicates
                await syncCalendarsWithAPI();
                Alert.alert('Success', 'Calendar created and synced!');
              } else {
                Alert.alert('Error', apiResponse.error || 'Failed to create calendar');
              }
            } catch (error) {
              console.error('Failed to create calendar:', error);
              Alert.alert('Error', 'Failed to create calendar. Please try again.');
            } finally {
              setIsCreating(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleEditCalendar = (calendar: Calendar) => {
    Alert.prompt(
      'Edit Calendar',
      'Enter new calendar name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newName) => {
            if (!newName?.trim()) {
              Alert.alert('Error', 'Calendar name is required');
              return;
            }

            try {
              const remoteId = getRemoteCalendarId(calendar.id);
              
              if (remoteId) {
                // ✅ FIXED: Use single object parameter
                const apiResponse = await updateCalendarAPI({
                  calendarId: remoteId,
                  name: newName.trim(),
                  hexcode: calendar.hexcode,
                  is_private: calendar.is_private || false
                });

                if (!apiResponse.success) {
                  Alert.alert('Error', apiResponse.error || 'Failed to update calendar on server');
                  return;
                }
              }

              // After successful API update, sync calendars from server
              await syncCalendarsWithAPI();
              Alert.alert('Success', 'Calendar updated and synced!');
            } catch (error) {
              console.error('Failed to update calendar:', error);
              Alert.alert('Error', 'Failed to update calendar. Please try again.');
            }
          }
        }
      ],
      'plain-text',
      calendar.name
    );
  };

  const handleDeleteCalendar = (calendar: Calendar) => {
    // Prevent deleting the first calendar in the list
    if (calendars.length > 0 && calendars[0].id === calendar.id) {
      Alert.alert('Not Allowed', 'The first calendar cannot be deleted for safety reasons.');
      return;
    }
    Alert.alert(
      'Delete Calendar',
      `Are you sure you want to delete "${calendar.name}"? This will also delete all events in this calendar.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const remoteId = getRemoteCalendarId(calendar.id);
              
              if (remoteId) {
                // ✅ FIXED: Use single object parameter
                const apiResponse = await deleteCalendarAPI({
                  calendarId: remoteId
                });
                
                if (!apiResponse.success) {
                  Alert.alert('Error', apiResponse.error || 'Failed to delete calendar from server');
                  return;
                }
              }

              // After successful API delete, sync calendars from server
              await syncCalendarsWithAPI();
              Alert.alert('Success', 'Calendar deleted and synced!');
            } catch (error) {
              console.error('Failed to delete calendar:', error);
              Alert.alert('Error', 'Failed to delete calendar. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleColorChange = (calendar: Calendar) => {
    const colorOptions = [
      { name: 'Blue', value: '#007AFF' },
      { name: 'Green', value: '#34C759' },
      { name: 'Orange', value: '#FF9500' },
      { name: 'Red', value: '#FF3B30' },
      { name: 'Purple', value: '#AF52DE' },
      { name: 'Pink', value: '#FF2D92' },
      { name: 'Teal', value: '#00C7BE' },
      { name: 'Cyan', value: '#32ADE6' },
      { name: 'Indigo', value: '#5856D6' },
      { name: 'Orange Red', value: '#FF6B35' }
    ];

    Alert.alert(
      'Choose Color',
      'Select a color for this calendar:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...colorOptions.map(color => ({
          text: color.name,
          onPress: async () => {
            try {
              const remoteId = getRemoteCalendarId(calendar.id);
              if (remoteId) {
                const apiResponse = await updateCalendarAPI({
                  calendarId: remoteId,
                  name: calendar.name,
                  hexcode: color.value,
                  is_private: calendar.is_private || false
                });
                if (!apiResponse.success) {
                  Alert.alert('Error', apiResponse.error || 'Failed to update calendar color on server');
                  return;
                }
              }
              await syncCalendarsWithAPI();
              Alert.alert('Success', 'Calendar color updated and synced!');
            } catch (error) {
              console.error('Failed to update calendar color:', error);
              Alert.alert('Error', 'Failed to update calendar color. Please try again.');
            }
          }
        }))
      ]
    );
  };

  const handlePrivacyToggle = (calendar: Calendar) => {
    Alert.alert(
      'Calendar Privacy',
      `Make "${calendar.name}" ${calendar.is_private ? 'public' : 'private'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: calendar.is_private ? 'Make Public' : 'Make Private',
          onPress: async () => {
            try {
              const remoteId = getRemoteCalendarId(calendar.id);
              const newPrivacyState = !calendar.is_private;
              if (remoteId) {
                const apiResponse = await updateCalendarAPI({
                  calendarId: remoteId,
                  name: calendar.name,
                  hexcode: calendar.hexcode,
                  is_private: newPrivacyState
                });
                if (!apiResponse.success) {
                  Alert.alert('Error', apiResponse.error || 'Failed to update calendar privacy on server');
                  return;
                }
              }
              await syncCalendarsWithAPI();
              Alert.alert('Success', `Calendar privacy updated and synced!`);
            } catch (error) {
              console.error('Failed to update calendar privacy:', error);
              Alert.alert('Error', 'Failed to update calendar privacy. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHeader
        title="Manage Calendars"
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back()
        }}
        rightActions={[
          {
            icon: isCreating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="add" size={24} color={colors.primary} />
            ),
            onPress: handleCreateCalendar
          }
        ]}
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Pull to sync calendars"
            titleColor={colors.textMuted}
          />
        }
      >
        {/* Info Header */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoTitle}>Calendar Management</Text>
          </View>
          <Text style={styles.infoText}>
            Manage your calendars, change colors, privacy settings, and organize your events. 
            Changes sync automatically with the server.
          </Text>
        </View>

        {/* Calendar List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Calendars ({calendars.length})</Text>
          
          {calendars.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Calendars</Text>
              <Text style={styles.emptyText}>
                Create your first calendar to start organizing events
              </Text>
              <TouchableOpacity 
                style={styles.createButton} 
                onPress={handleCreateCalendar}
                disabled={isCreating}
              >
                <Ionicons name="add" size={20} color={colors.white} />
                <Text style={styles.createButtonText}>Create Calendar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            calendars.map((calendar) => (
              <View key={calendar.id} style={styles.calendarCard}>
                <View style={styles.calendarInfo}>
                  <TouchableOpacity 
                    style={[styles.colorDot, { backgroundColor: calendar.hexcode }]}
                    onPress={() => handleColorChange(calendar)}
                  >
                    <Ionicons name="color-palette" size={12} color={colors.white} />
                  </TouchableOpacity>
                  
                  <View style={styles.calendarDetails}>
                    <View style={styles.calendarHeader}>
                      <Text style={styles.calendarName}>{calendar.name}</Text>
                      {calendar.is_private && (
                        <View style={styles.privateBadge}>
                          <Ionicons name="lock-closed" size={12} color={colors.warning} />
                          <Text style={styles.privateBadgeText}>Private</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.calendarMeta}>
                      {calendar.remoteId ? `Synced` : 'Local only'}
                    </Text>
                  </View>
                </View>

                <View style={styles.calendarActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handlePrivacyToggle(calendar)}
                  >
                    <Ionicons 
                      name={calendar.is_private ? "lock-closed" : "lock-open"} 
                      size={16} 
                      color={calendar.is_private ? colors.warning : colors.success} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditCalendar(calendar)}
                  >
                    <Ionicons name="pencil" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteCalendar(calendar)}
                  >
                    <Ionicons name="trash" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <View style={styles.actionCardContent}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={styles.actionCardText}>Sync with Server</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleCreateCalendar}
            disabled={isCreating}
          >
            <View style={styles.actionCardContent}>
              <Ionicons name="add-circle" size={20} color={colors.success} />
              <Text style={styles.actionCardText}>Create New Calendar</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: colors.infoLight,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.info,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  calendarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarDetails: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  privateBadgeText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.lightGrey,
  },
  actionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});