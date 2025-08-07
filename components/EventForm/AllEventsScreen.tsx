import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/styles';
import { useEvents } from '@/hooks/useEvents';
import { CalendarEvent } from '@/types/events';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

interface AllEventsScreenProps {
  onEventPress?: (event: CalendarEvent) => void;
}

export const AllEventsScreen: React.FC<AllEventsScreenProps> = ({ onEventPress }) => {
  const { events, isLoadingEvents } = useEvents();

  // Group events by date
  const groupedEvents = React.useMemo(() => {
    const groups: { [date: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const date = event.startDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedDates.map(date => ({
      date,
      events: groups[date].sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return -1;
        if (!b.startTime) return 1;
        return a.startTime.localeCompare(b.startTime);
      })
    }));
  }, [events]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    if (onEventPress) {
      onEventPress(event);
    } else {
      router.push(`/(tabs)/calendar/eventDetails?eventId=${event.id}`);
    }
  };

  if (isLoadingEvents) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  if (groupedEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color={colors.grey} />
        <Text style={styles.emptyTitle}>No Events</Text>
        <Text style={styles.emptySubtitle}>Your events will appear here</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {groupedEvents.map(({ date, events }) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>{formatDate(date)}</Text>
          
          {events.map(event => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventItem}
              onPress={() => handleEventPress(event)}
              activeOpacity={0.7}
            >
              <View style={styles.eventContent}>
                <View style={[styles.eventColor, { backgroundColor: event.hexcode }]} />
                
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  
                  <View style={styles.eventMeta}>
                    {event.startTime ? (
                      <Text style={styles.eventTime}>
                        {event.startTime.slice(0, 5)} - {event.endTime?.slice(0, 5)}
                      </Text>
                    ) : (
                      <Text style={styles.eventTime}>All day</Text>
                    )}
                    
                    {event.location && (
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={12} color={colors.grey} />
                        <Text style={styles.eventLocation} numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={16} color={colors.grey} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      
      {/* Bottom padding */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  eventItem: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  eventColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventTime: {
    fontSize: 14,
    color: colors.grey,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  eventLocation: {
    fontSize: 12,
    color: colors.grey,
    flex: 1,
  },
});