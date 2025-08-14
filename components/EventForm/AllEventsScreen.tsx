import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/styles';
import { useEvents } from '@/hooks/useEvents';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

interface AllEventsScreenProps {
  onEventPress?: (event: CalendarEvent) => void;
}

// ✅ FIX 1: Export as default function for lazy loading
const AllEventsScreen: React.FC<AllEventsScreenProps> = ({ onEventPress }) => {
  const { events, isLoadingEvents, formatTimeDisplay } = useEvents();
  const scrollViewRef = useRef<ScrollView>(null);

  // ✅ FIX 2: Group events by date using ISO date extraction
  const groupedEvents = React.useMemo(() => {
    const groups: { [date: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      // ✅ FIXED: Extract date from ISO string instead of using non-existent startTime
      const dateStr = dateTimeHelpers.extractDateFromISO(event.startDate);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(event);
    });

    // ✅ Sort dates in chronological order
    const sortedDates = Object.keys(groups).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    return sortedDates.map(date => ({
      date,
      events: groups[date].sort((a, b) => {
        // ✅ FIXED: Sort by full ISO timestamp instead of time-only strings
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      })
    }));
  }, [events]);

  // ✅ Find the closest date to today for auto-scrolling
  const findClosestDateIndex = React.useMemo(() => {
    if (groupedEvents.length === 0) return 0;
    
    const todayString = dateTimeHelpers.getTodayStringInTimezone();
    const today = new Date(todayString + 'T00:00:00');
    
    let closestIndex = 0;
    let closestDiff = Infinity;
    
    groupedEvents.forEach((group, index) => {
      const eventDate = new Date(group.date + 'T00:00:00');
      const diff = Math.abs(eventDate.getTime() - today.getTime());
      
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }, [groupedEvents]);

  // ✅ Auto-scroll to today's events when component loads
  useEffect(() => {
    if (groupedEvents.length > 0 && scrollViewRef.current) {
      const scrollTimer = setTimeout(() => {
        if (scrollViewRef.current) {
          let scrollY = 0;
          
          for (let i = 0; i < findClosestDateIndex; i++) {
            scrollY += 100; // Date header height
            scrollY += groupedEvents[i].events.length * 80; // Event items height
          }
          
          scrollViewRef.current.scrollTo({
            y: Math.max(0, scrollY - 50),
            animated: true,
          });
        }
      }, 300);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [groupedEvents, findClosestDateIndex]);

  // ✅ Format date helper
  const formatDate = (dateString: string) => {
    const todayString = dateTimeHelpers.getTodayStringInTimezone();
    
    const todayDate = dateTimeHelpers.parseDate(todayString);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowString = dateTimeHelpers.formatDateForStorage(tomorrowDate);
    
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayString = dateTimeHelpers.formatDateForStorage(yesterdayDate);

    if (dateString === todayString) {
      return 'Today';
    } else if (dateString === tomorrowString) {
      return 'Tomorrow';
    } else if (dateString === yesterdayString) {
      return 'Yesterday';
    } else {
      return dateTimeHelpers.formatDateForDisplay(dateString);
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    if (onEventPress) {
      onEventPress(event);
    } else {
      router.push(`/(tabs)/calendar/eventDetails?eventId=${event.id}`);
    }
  };

  const handleCreateEvent = () => {
    router.push('/(tabs)/calendar/createEvent');
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
        
        <TouchableOpacity 
          style={styles.createButtonEmpty}
          onPress={handleCreateEvent}
          activeOpacity={0.8}
        >
          <View style={styles.createIconEmpty}>
            <Ionicons name="add" size={24} color={colors.white} />
          </View>
          <Text style={styles.createTextEmpty}>Create your first event</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {groupedEvents.map(({ date, events }, index) => (
        <View 
          key={date} 
          style={[
            styles.dateGroup,
            date === dateTimeHelpers.getTodayStringInTimezone() && styles.todaySection
          ]}
        >
          <Text style={[
            styles.dateHeader,
            date === dateTimeHelpers.getTodayStringInTimezone() && styles.todayHeader
          ]}>
            {formatDate(date)}
          </Text>
          
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
                    {/* ✅ FIXED: Use formatTimeDisplay from useEvents hook */}
                    <Text style={styles.eventTime}>
                      {formatTimeDisplay(event)}
                    </Text>
                    
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
      
      <View style={styles.bottomPrompt}>
        <Text style={styles.endText}>That's all your events!</Text>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateEvent}
          activeOpacity={0.8}
        >
          <View style={styles.createIcon}>
            <Ionicons name="add" size={20} color={colors.white} />
          </View>
          <Text style={styles.createText}>Create new event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ✅ FIX 1: Export as default for lazy loading
export default AllEventsScreen;

// ✅ Also export as named export for backward compatibility
export { AllEventsScreen };

// ✅ Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 16,
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
    marginBottom: 32,
  },
  dateGroup: {
    marginBottom: 24,
  },
  todaySection: {
    backgroundColor: colors.lightGreen + '10',
    marginHorizontal: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  todayHeader: {
    color: colors.darkGreen,
    fontWeight: '700',
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
  bottomPrompt: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 60,
  },
  endText: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  createIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  createButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
    marginTop: 24,
  },
  createIconEmpty: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTextEmpty: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});