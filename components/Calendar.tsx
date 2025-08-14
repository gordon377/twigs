import React, { memo, useMemo, useCallback, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, Animated, PanResponder, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/styles';
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';
import { useEvents } from '@/hooks/useEvents';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';

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

// ✅ Enhanced EventsList with FlatList performance optimizations
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

  // ✅ ADD: Performance optimizations for FlatList
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 80, // Approximate item height
    offset: 80 * index,
    index,
  }), []);

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
          // ✅ PERFORMANCE OPTIMIZATIONS
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          updateCellsBatchingPeriod={50}
          // ✅ Reduce re-renders
          extraData={date}
          // ✅ Memory optimization
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexGrow: 1,
          }}
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

// ✅ OPTIMIZED: Smart calendar component with controlled re-rendering for Back to Today
const SingleDateCalendarInner = forwardRef<any, SingleDateCalendarProps>(
  ({ today, selectedDate, setSelectedDate }, ref) => {
    const calendarRef = useRef<any>(null);
    const [forceRenderKey, setForceRenderKey] = useState(0); // ✅ Force re-render key
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // ✅ Animation values for smooth transitions
    const transitionOpacity = useRef(new Animated.Value(1)).current;
    const transitionScale = useRef(new Animated.Value(1)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      scrollToToday: () => {
        console.log('📅 Back to Today - Always execute smooth transition');
        
        return new Promise<void>((resolve) => {
          // ✅ REMOVED: Skip check - always allow Back to Today functionality
          // This ensures the user can always trigger the smooth animation and visual feedback
          
          setIsTransitioning(true);
          
          // ✅ Step 1: Smooth fade out with backdrop
          Animated.parallel([
            Animated.timing(transitionOpacity, {
              toValue: 0.4,
              duration: 200,
              useNativeDriver: true,
              easing: Easing.out(Easing.quad),
            }),
            Animated.timing(transitionScale, {
              toValue: 0.96,
              duration: 200,
              useNativeDriver: true,
              easing: Easing.out(Easing.quad),
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0.3,
              duration: 200,
              useNativeDriver: true,
              easing: Easing.out(Easing.quad),
            })
          ]).start(() => {
            // ✅ Step 2: Always force re-render during transition (regardless of current date)
            setSelectedDate(today);
            setForceRenderKey(prev => prev + 1); // Force calendar recreation to ensure today is visible
            
            // ✅ Step 3: Brief pause to allow re-render
            setTimeout(() => {
              // ✅ Step 4: Smooth fade back in
              Animated.parallel([
                Animated.timing(transitionOpacity, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(transitionScale, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(backdropOpacity, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.cubic),
                })
              ]).start(() => {
                setIsTransitioning(false);
                console.log('✅ Back to Today transition completed');
                resolve();
              });
            }, 80); // Optimal pause for re-render
          });
        });
      },

      scrollToDate: (date: string) => {
        return new Promise<void>((resolve) => {
          // ✅ NORMAL NAVIGATION: No forced re-render, just update state
          console.log('📅 Normal date navigation (smooth)');
          
          if (selectedDate === date) {
            resolve();
            return;
          }

          // ✅ For close dates, use smooth transition without re-render
          const daysDiff = Math.abs(
            new Date(date).getTime() - new Date(selectedDate).getTime()
          ) / (1000 * 60 * 60 * 24);

          if (daysDiff <= 7) {
            // Within a week - smooth state update
            setSelectedDate(date);
            resolve();
          } else {
            // Far jump - use light transition
            setIsTransitioning(true);
            
            Animated.timing(transitionOpacity, {
              toValue: 0.7,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setSelectedDate(date);
              
              setTimeout(() => {
                Animated.timing(transitionOpacity, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                }).start(() => {
                  setIsTransitioning(false);
                  resolve();
                });
              }, 50);
            });
          }
        });
      }
    }));

    // ✅ SMART KEY: Changes when forceRenderKey changes (Back to Today)
    const initialMonthId = useMemo(() => {
      return selectedDate || today;
    }, [selectedDate, today, forceRenderKey]); // ✅ forceRenderKey triggers recalculation

    const calendarTheme = useMemo(() => customThemeLight, []);

    // ✅ OPTIMIZED: Only update if date actually changed
    const handleDateSelect = useCallback((date: string) => {
      console.log('📅 Date selected by user:', date);
      if (date !== selectedDate) {
        setSelectedDate(date);
      }
    }, [selectedDate, setSelectedDate]);

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
      <View style={styles.cal}>
        {/* ✅ Backdrop for smooth transition */}
        <Animated.View 
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.background,
              opacity: backdropOpacity,
              zIndex: 1,
            }
          ]}
          pointerEvents={isTransitioning ? 'auto' : 'none'}
        />
        
        {/* ✅ Calendar with transition animations */}
        <Animated.View 
          style={[
            StyleSheet.absoluteFillObject,
            { 
              opacity: transitionOpacity,
              transform: [{ scale: transitionScale }],
              zIndex: 0,
            }
          ]}
        >
          <Calendar.List
            // ✅ CRITICAL: Key changes when forceRenderKey changes (Back to Today)
            key={`calendar-optimized-${forceRenderKey}-${initialMonthId.slice(0, 7)}`}
            ref={calendarRef}
            theme={calendarTheme}
            calendarInitialMonthId={initialMonthId} // ✅ This resets calendar position
            horizontal={false}
            calendarActiveDateRanges={activeDateRanges}
            onCalendarDayPress={handleDateSelect}
            calendarFormatLocale="en"
            getCalendarDayFormat={getCalendarDayFormat}
          />
        </Animated.View>
        
        {/* ✅ Transition indicator */}
        {isTransitioning && (
          <Animated.View 
            style={[
              StyleSheet.absoluteFillObject,
              {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                opacity: backdropOpacity,
                zIndex: 2,
              }
            ]}
            pointerEvents="none"
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}>
              <Ionicons name="today" size={24} color={colors.white} />
            </View>
          </Animated.View>
        )}
      </View>
    );
  }
);

// ✅ PRECISE MEMO: Only re-render when props actually change
export const SingleDateCalendar = React.memo(
  SingleDateCalendarInner,
  (prevProps, nextProps) => {
    // ✅ Only re-render if props actually changed
    const propsChanged = (
      prevProps.today !== nextProps.today ||
      prevProps.selectedDate !== nextProps.selectedDate ||
      prevProps.setSelectedDate !== nextProps.setSelectedDate
    );
    
    return !propsChanged; // Return true to SKIP re-render
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