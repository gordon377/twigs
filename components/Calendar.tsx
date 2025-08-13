import React, { memo, useMemo, useCallback, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, Animated, PanResponder, Easing } from 'react-native';
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
type SingleDateCalendarProps = {
  today: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

// ✅ ULTRA-SIMPLE: Minimal implementation that avoids Date issues
const SingleDateCalendarInner = forwardRef<any, SingleDateCalendarProps>(
  ({ today, selectedDate, setSelectedDate }, ref) => {
    const calendarRef = useRef<any>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const transitionOpacity = useRef(new Animated.Value(1)).current;
    const transitionScale = useRef(new Animated.Value(1)).current;

    useImperativeHandle(ref, () => ({
      scrollToToday: () => {
        console.log('📅 Efficient scroll to today:', today);
        
        return new Promise<void>((resolve) => {
          // ✅ Try to use flash-calendar's native scrolling first
          if (calendarRef.current?.scrollToDate) {
            try {
              calendarRef.current.scrollToDate(today);
              // ✅ Update selected date through prop callback
              setSelectedDate(today);
              resolve();
              return;
            } catch (error) {
              console.log('Native scroll failed, using smooth transition');
            }
          }
          
          // ✅ Fallback: smooth visual transition without full re-render
          setIsTransitioning(true);
          
          Animated.timing(transitionOpacity, {
            toValue: 0.3, // ✅ Don't go fully invisible
            duration: 150, // ✅ Shorter duration
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }).start(() => {
            // ✅ Update state during transition (no key change)
            setSelectedDate(today);
            
            // ✅ Quick fade back in
            Animated.timing(transitionOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.out(Easing.quad),
            }).start(() => {
              setIsTransitioning(false);
              resolve();
            });
          });
        });
      },

      scrollToDate: (date: string) => {
        return new Promise<void>((resolve) => {
          // ✅ Try native scroll first
          if (calendarRef.current?.scrollToDate) {
            try {
              calendarRef.current.scrollToDate(date);
              setSelectedDate(date);
              resolve();
              return;
            } catch (error) {
              console.log('Native scroll failed');
            }
          }
          
          // ✅ Fallback with minimal animation
          setSelectedDate(date);
          resolve();
        });
      }
    }));

    // ✅ STABLE: Remove key-based re-rendering
    const initialMonthId = useMemo(() => {
      return selectedDate || today;
    }, [selectedDate, today]); // ✅ Remove calendarKey dependency

    const calendarTheme = useMemo(() => customThemeLight, []);

    const handleDateSelect = useCallback((date: string) => {
      console.log('📅 Date selected:', date);
      setSelectedDate(date);
    }, [setSelectedDate]);

    const activeDateRanges = useMemo(() => [
      { startId: selectedDate, endId: selectedDate },
    ], [selectedDate]);

    const getCalendarDayFormat = useCallback((date: Date, locale: string) => {
      try {
        if (date && typeof date.getDate === 'function') {
          return date.getDate().toString();
        }
        return '?';
      } catch (error) {
        return '?';
      }
    }, []);

    return (
      <Animated.View 
        style={[
          styles.cal, 
          { 
            opacity: transitionOpacity,
            transform: [{ scale: transitionScale }]
          }
        ]}
      >
        <Calendar.List
          // ✅ STABLE KEY: Only changes when absolutely necessary
          key={`calendar-stable-${initialMonthId.slice(0, 7)}`} // Only month-year
          ref={calendarRef}
          theme={calendarTheme}
          calendarInitialMonthId={initialMonthId}
          horizontal={false}
          calendarActiveDateRanges={activeDateRanges}
          onCalendarDayPress={handleDateSelect}
          calendarFormatLocale="en"
          getCalendarDayFormat={getCalendarDayFormat}
        />
      </Animated.View>
    );
  }
);

export const SingleDateCalendar = React.memo(
  SingleDateCalendarInner,
  (
    prevProps: SingleDateCalendarProps,
    nextProps: SingleDateCalendarProps
  ) => {
    // ✅ Custom comparison function
    return (
      prevProps.today === nextProps.today &&
      prevProps.selectedDate === nextProps.selectedDate &&
      prevProps.setSelectedDate === nextProps.setSelectedDate
    );
  }
);

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
  pageContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendarContainer: {
    flex: 1,
  },
  eventsGestureContainer: {
    // Styles for the gesture container
  },
  eventsListContainer: {
    // Styles for the animated events list container
  },
  dragHandle: {
    // Styles for the drag handle
  },
  dragIndicator: {
    // Styles for the drag indicator
  },
  eventsContent: {
    // Styles for the events content
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.darkGreen,
    borderRadius: 4,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});