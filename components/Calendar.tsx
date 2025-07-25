import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/styles';
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';

const router = useRouter();

// Example event type
type Event = {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  invitees?: string[]; // Add invitees to the Event type
};

// Example: Replace this with your real event fetching/filtering logic
const mockEvents: Record<string, Event[]> = {
  '2025-07-25': [
    { id: '1', title: 'UX Party 🎉', startTime: 'All-day', location: 'Design Studio A' },
    { id: '2', title: 'UI Party 🍻', startTime: '2:00 PM', endTime: '5:00 PM', location: 'Conference Room B' },
    { id: '3', title: 'Birthday!', startTime: '6:00 PM', endTime: '11:00 PM', location: 'Party Hall' },
    { id: '4', title: 'Meeting', startTime: '9:00 AM', location: 'Office' },
  ],
  // Add more dates/events as needed
};

export function EventsList({ date }: { date: string }) {
  const navigation = useNavigation();
  const events = mockEvents[date] || [];

  const handlePress = (event: Event) => {
    router.push(`/(tabs)/calendar/eventDetails?eventId=${event.id}`);
  };

  const formatTimeDisplay = (startTime?: string, endTime?: string) => {
    if (!startTime) return '';
    if (startTime === 'All-day') return 'All-day';
    if (endTime) return `${startTime} - ${endTime}`;
    return startTime;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      {events.length === 0 ? (
        <Text style={{ color: colors.text }}>No events for this date.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handlePress(item)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.offWhite,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{item.title}</Text>
                {item.location && (
                  <Text style={{ color: colors.grey, fontSize: 12, marginTop: 2 }}>
                    📍 {item.location}
                  </Text>
                )}
              </View>
              <Text style={{ color: colors.grey, fontSize: 12 }}>
                {formatTimeDisplay(item.startTime, item.endTime)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// Single date calendar component
export function SingleDateCalendar({ 
  today,
  selectedDate,
  setSelectedDate,
}: { 
  today: string
  selectedDate: string
  setSelectedDate: (date: string) => void
}) {
  return (
    <View style={styles.cal}>
      <Calendar.List
        theme={customThemeLight}
        calendarInitialMonthId={today}
        horizontal={false}
        calendarActiveDateRanges={[
          { startId: selectedDate, endId: selectedDate },
        ]}
        onCalendarDayPress={setSelectedDate}
      />
    </View>
  );
}

const customThemeLight: CalendarTheme = {
  rowMonth: {
    content: {
      textAlign: "left",
      color: colors.black, // Use your app's primary color for month labels
      fontWeight: "700",
      fontSize: 18,
      letterSpacing: 1,
      paddingInline: 15,
    },
  },
  rowWeek: {
    container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.offWhite, // Use your divider color
      borderStyle: "solid",
    },
  },
  itemWeekName: { 
    content: { 
      color: colors.black, // Accent color for weekday names
      fontWeight: "600",
      fontSize: 15,
      letterSpacing: 0.5,
    } 
  },
  itemDayContainer: {
    activeDayFiller: {
      backgroundColor: colors.darkGreen, // Highlight for selected range
    },
  },
  itemDay: {
    idle: ({ isPressed, isWeekend }) => ({
      container: {
        backgroundColor: "transparent",
        borderRadius: 20,
      },
      content: {
        color: isWeekend && !isPressed ? colors.grey : colors.black,
        fontWeight: "500",
        fontSize: 16,
      },
    }),
    today: ({ isPressed }) => ({
      container: {
        borderColor: colors.midGreen,
        borderWidth: 2,
        borderRadius: 50,
        backgroundColor: isPressed ? colors.darkGreen : "transparent",
      },
      content: {
        color: isPressed ? colors.white : colors.darkBrown,
        fontWeight: "bold",
      },
    }),
    active: ({ isEndOfRange, isStartOfRange }) => ({
      container: {
        backgroundColor: colors.darkGreen,
        borderTopLeftRadius: isStartOfRange ? 20 : 0,
        borderBottomLeftRadius: isStartOfRange ? 20 : 0,
        borderTopRightRadius: isEndOfRange ? 20 : 0,
        borderBottomRightRadius: isEndOfRange ? 20 : 0,
      },
      content: {
        color: colors.white,
        fontWeight: "bold",
      },
    }),
  },
};

const styles = StyleSheet.create({
  cal: {
    flex: 1,
    backgroundColor: colors.background,
  },
});