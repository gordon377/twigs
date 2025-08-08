import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/styles';
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';
import { useEvents } from '@/hooks/useEvents';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';

const router = useRouter();

// ✅ Memoize dateHelpers at module level
export const dateHelpers = {
  formatDate: (dateString: string): string => {
    return dateTimeHelpers.formatDateForDisplay(dateString);
  },
};

// ✅ Extract event item component for better performance
const EventItem = memo<{
  item: CalendarEvent;
  date: string;
  onPress: (event: CalendarEvent) => void;
  isMultiDayEvent: (event: CalendarEvent) => boolean;
  formatDateRange: (event: CalendarEvent) => string;
  formatTimeDisplay: (event: CalendarEvent) => string;
}>(({ item, date, onPress, isMultiDayEvent, formatDateRange, formatTimeDisplay }) => {
  const isMultiDay = isMultiDayEvent(item);
  const isStartDate = item.startDate === date;
  const isEndDate = item.endDate === date;
  
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  // ✅ Memoize style objects
  const containerStyle = useMemo(() => ({
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
    backgroundColor: isMultiDay ? colors.lightGreen + '20' : colors.background,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: item.hexcode || colors.darkGreen,
  }), [isMultiDay, item.hexcode]);

  const colorDotStyle = useMemo(() => ({
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: item.hexcode,
    marginRight: 8,
  }), [item.hexcode]);

  const badgeText = useMemo(() => {
    return isStartDate ? 'START' : isEndDate ? 'END' : 'ONGOING';
  }, [isStartDate, isEndDate]);

  return (
    <TouchableOpacity onPress={handlePress} style={containerStyle}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.hexcode && <View style={colorDotStyle} />}
          
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
              {badgeText}
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
});

// ✅ Enhanced EventsList with better performance
export const EventsList = memo<{ date: string }>(({ date }) => {
  const { 
    getEventsForDate, 
    isMultiDayEvent, 
    formatDateRange,
    formatTimeDisplay
  } = useEvents();
  
  // ✅ Memoize events for current date
  const events = useMemo(() => {
    return getEventsForDate(date);
  }, [date, getEventsForDate]);

  // ✅ Memoize formatted date
  const formattedDate = useMemo(() => {
    return dateHelpers.formatDate(date);
  }, [date]);

  // ✅ Stable callback reference for event press
  const handleEventPress = useCallback((event: CalendarEvent) => {
    router.push(`/(tabs)/calendar/eventDetails?eventId=${event.id}`);
  }, []);

  // ✅ Memoize render item function with stable references
  const renderEventItem = useCallback(({ item }: { item: CalendarEvent }) => (
    <EventItem
      item={item}
      date={date}
      onPress={handleEventPress}
      isMultiDayEvent={isMultiDayEvent}
      formatDateRange={formatDateRange}
      formatTimeDisplay={formatTimeDisplay}
    />
  ), [date, handleEventPress, isMultiDayEvent, formatDateRange, formatTimeDisplay]);

  // ✅ Memoize key extractor
  const keyExtractor = useCallback((item: CalendarEvent) => item.id, []);

  // ✅ Memoize empty state component
  const EmptyState = useMemo(() => (
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
  ), []);

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
          {formattedDate}
        </Text>
      </View>

      {events.length === 0 ? EmptyState : (
        <FlatList
          data={events}
          keyExtractor={keyExtractor}
          renderItem={renderEventItem}
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexGrow: 1,
          }}
          // ✅ Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          getItemLayout={undefined} // Let FlatList calculate
        />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // ✅ Only rerender if date changed
  return prevProps.date === nextProps.date;
});

// ✅ Optimize SingleDateCalendar with better memoization
export const SingleDateCalendar = memo<{
  today: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}>(({ today, selectedDate, setSelectedDate }) => {
  const { datesWithEvents } = useEvents();
  
  // ✅ Memoize calendar theme at component level
  const calendarTheme = useMemo(() => customThemeLight, []);

  // ✅ Stable callback reference for date selection
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  // ✅ Memoize active date ranges
  const activeDateRanges = useMemo(() => [
    { startId: selectedDate, endId: selectedDate },
  ], [selectedDate]);

  // ✅ Memoize date formatter
  const getCalendarDayFormat = useCallback((date: Date, locale: string) => {
    return date.getDate().toString();
  }, []);

  return (
    <View style={styles.cal}>
      <Calendar.List
        theme={calendarTheme}
        calendarInitialMonthId={today}
        horizontal={false}
        calendarActiveDateRanges={activeDateRanges}
        onCalendarDayPress={handleDateSelect}
        calendarFormatLocale="en"
        getCalendarDayFormat={getCalendarDayFormat}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // ✅ Custom comparison function
  return (
    prevProps.today === nextProps.today &&
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.setSelectedDate === nextProps.setSelectedDate
  );
});

// ✅ Move theme to module level to prevent recreation
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