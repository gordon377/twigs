import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/styles';
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';
import { useEvents } from '@/hooks/useEvents';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';

const router = useRouter();

export const dateHelpers = {
  // Format a single date for display
  formatDate: (dateString: string): string => {
    return dateTimeHelpers.formatDateForDisplay(dateString);
  },
};

export function EventsList({ date }: { date: string }) {
  const { 
    getEventsForDate, 
    isMultiDayEvent, 
    formatDateRange,
    formatTimeDisplay
  } = useEvents();
  
  const events = getEventsForDate(date);

  const handlePress = (event: CalendarEvent) => {
    router.push(`/(tabs)/calendar/eventDetails?eventId=${event.id}`);
  };

  const renderEventItem = ({ item }: { item: CalendarEvent }) => {
    const isMultiDay = isMultiDayEvent(item);
    const isStartDate = item.startDate === date;
    const isEndDate = item.endDate === date;
    
    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingVertical: 12,
          paddingHorizontal: 8,
          marginVertical: 2,
          borderBottomWidth: 1,
          borderBottomColor: colors.offWhite,
          backgroundColor: isMultiDay ? colors.lightGreen + '20' : colors.background,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: item.hexcode || colors.darkGreen,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Color indicator */}
            {item.hexcode && (
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: item.hexcode,
                marginRight: 8,
              }} />
            )}
            
            <Text style={{ color: colors.text, fontWeight: '600' }}>
              {item.title}
            </Text>
            
            {isMultiDay && (
              <Text style={{ 
                color: colors.darkGreen, 
                fontSize: 10, 
                marginLeft: 6,
                backgroundColor: colors.lightGreen,
                paddingHorizontal: 4,
                paddingVertical: 1,
                borderRadius: 3
              }}>
                {isStartDate ? 'START' : isEndDate ? 'END' : 'ONGOING'}
              </Text>
            )}
          </View>
          
          {item.location && (
            <Text style={{ color: colors.grey, fontSize: 12, marginTop: 2 }}>
              📍 {item.location}
            </Text>
          )}
          
          {isMultiDay && (
            <Text style={{ color: colors.darkGreen, fontSize: 11, marginTop: 2 }}>
              {formatDateRange(item)}
            </Text>
          )}
        </View>
        
        <Text style={{ color: colors.grey, fontSize: 12, minWidth: 80, textAlign: 'right' }}>
          {formatTimeDisplay(item)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Date header */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.offWhite 
      }}>
        <Text style={{ 
          color: colors.text, 
          fontSize: 18, 
          fontWeight: '700',
          textAlign: 'left' 
        }}>
          {dateHelpers.formatDate(date)}
        </Text>
      </View>

      {events.length === 0 ? (
        <View style={{ 
          paddingVertical: 20, 
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center' 
        }}>
          <Text style={{ color: colors.grey, fontSize: 16 }}>
            No events for this date.
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexGrow: 1,
          }}
          renderItem={renderEventItem}
        />
      )}
    </View>
  );
}

export function SingleDateCalendar({ 
  today,
  selectedDate,
  setSelectedDate,
}: { 
  today: string
  selectedDate: string
  setSelectedDate: (date: string) => void
}) {
  const { datesWithEvents } = useEvents();
  
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
        calendarFormatLocale="en"
        getCalendarDayFormat={(date, locale) => {
          return date.getDate().toString();
        }}
      />
    </View>
  );
}

const customThemeLight: CalendarTheme = {
  rowMonth: {
    content: {
      textAlign: "left",
      color: colors.black,
      fontWeight: "700",
      fontSize: 15,
      letterSpacing: 1,
      paddingInline: 15,
    },
  },
  rowWeek: {
    container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.offWhite,
      borderStyle: "solid",
    },
  },
  itemWeekName: { 
    content: { 
      color: colors.black,
      fontWeight: "600",
      fontSize: 15,
      letterSpacing: 0.5,
    } 
  },
  itemDayContainer: {
    activeDayFiller: {
      backgroundColor: colors.darkGreen,
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