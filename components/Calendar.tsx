import React, { memo, useMemo, useCallback, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/styles';
import { useEvents } from '@/hooks/useEvents';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { Calendar } from 'react-native-calendars';

const router = useRouter();

export const dateHelpers = {
  formatDate: (dateString: string): string => {
    return dateTimeHelpers.formatDateForDisplay(dateString);
  },
}

// --- Enhanced Event List ---
const EventItem = React.memo<{
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

  const badgeText = useMemo(() => {
    return isStartDate ? 'START' : isEndDate ? 'END' : 'ONGOING';
  }, [isStartDate, isEndDate]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.eventItem}>
      <View style={styles.eventItemContent}>
        <View style={styles.eventHeader}>
          {item.hexcode && (
            <View style={[styles.colorIndicator, { backgroundColor: item.hexcode }]} />
          )}
          <View style={styles.eventTitleContainer}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {isMultiDay && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{badgeText}</Text>
              </View>
            )}
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.eventTime}>{formatTimeDisplay(item)}</Text>
          </View>
        </View>
        
        {item.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.eventLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
        
        {isMultiDay && (
          <View style={styles.dateRangeContainer}>
            <Ionicons name="calendar-outline" size={14} color={colors.success} />
            <Text style={styles.eventRange}>{formatDateRange(item)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const EventsList = React.memo<{ date: string }>(({ date }) => {
  const { 
    getEventsForDate, 
    isMultiDayEvent, 
    formatDateRange,
    formatTimeDisplay
  } = useEvents();
  const router = useRouter();

  const events = useMemo(() => getEventsForDate(date), [date, getEventsForDate]);
  
  const formattedDate = useMemo(() => {
    return dateTimeHelpers.formatDateForDisplay(date);
  }, [date]);

  const handleEventPress = useCallback((event: CalendarEvent) => {
    router.push(`/(tabs)/calendar/eventDetails?eventId=${event.id}`);
  }, [router]);

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

  const keyExtractor = useCallback((item: CalendarEvent) => item.id, []);

  return (
    <View style={styles.eventsListContainer}>
      <View style={styles.dateHeader}>
        <View style={styles.dateHeaderContent}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.dateHeaderText}>{formattedDate}</Text>
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>{events.length}</Text>
          </View>
        </View>
      </View>
      
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No events today</Text>
          <Text style={styles.emptySubtitle}>Tap the + button to create an event</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={keyExtractor}
          renderItem={renderEventItem}
          getItemLayout={(_, index) => ({ length: 100, offset: 100 * index, index })}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          updateCellsBatchingPeriod={50}
          extraData={date}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.eventsFlatList}
          contentContainerStyle={styles.flatListContent}
          ItemSeparatorComponent={() => <View style={styles.eventSeparator} />}
        />
      )}
    </View>
  );
});

// --- Enhanced Calendar Picker ---
type SingleDateCalendarProps = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onDoubleTapDay?: (date: string) => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PAGE_RANGE = 3; // Number of months to render on either side of the current month

export const SingleDateCalendar = forwardRef<any, SingleDateCalendarProps>((
  { selectedDate, setSelectedDate, onDoubleTapDay },
  ref
) => {
  const { getEventsForDate } = useEvents();
  const pagerRef = useRef<PagerView>(null);
  const calendarOpacity = useRef(new Animated.Value(1)).current;
  const [transitioning, setTransitioning] = useState(false);

  // Key to force PagerView remount (for backToToday)
  const [pagerKey, setPagerKey] = useState(0);

  // Track last handled page position to avoid duplicate onPageSelected events
  const lastPagePositionRef = useRef<number | null>(null);

  // Track the base month index at the time PagerView is rendered
  const baseMonthIndexRef = useRef<number>(0);

  // Helper to fade calendar
  const fadeCalendar = (toValue: number, callback?: () => void) => {
    Animated.timing(calendarOpacity, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => callback && callback());
  };

  // Get month index helpers
  const getMonthIndex = (dateStr: string) => {
    const [year, month] = dateStr.split('-').map(Number);
    return (year - 2000) * 12 + (month - 1);
  };
  const getMonthString = (index: number) => {
    const year = 2000 + Math.floor(index / 12);
    const month = (index % 12) + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  // Derive currentMonthIndex from selectedDate (single source of truth)
  const currentMonthIndex = useMemo(() => getMonthIndex(selectedDate), [selectedDate]);

  // --- Flickerless Infinite Pager Logic ---
  // Virtual month index for rendering pages
  const [virtualMonthIndex, setVirtualMonthIndex] = useState(currentMonthIndex);

  // Keep baseMonthIndexRef and virtualMonthIndex in sync with selectedDate
  useEffect(() => {
    baseMonthIndexRef.current = currentMonthIndex;
    setVirtualMonthIndex(currentMonthIndex);
  }, [currentMonthIndex]);

  // Expose a method to parent (index.tsx in calendar folder)
  useImperativeHandle(ref, () => ({
    backToToday: () => {
      fadeCalendar(0, () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        setSelectedDate(todayStr);
        setPagerKey(prev => prev + 1); // Force PagerView to remount
        lastPagePositionRef.current = null; // Reset on remount
        setTimeout(() => {
          fadeCalendar(1);
        }, 0);
      });
    }
  }));

  // Event dots
  const marks = useMemo(() => {
    const marks: Record<string, any> = {};
    const monthsToRender = [];
    for (let i = -PAGE_RANGE; i <= PAGE_RANGE; i++) {
      monthsToRender.push(virtualMonthIndex + i)
    }
    monthsToRender.forEach(monthIndex => {
      const year = 2000 + Math.floor(monthIndex / 12);
      const month = (monthIndex % 12) + 1;
      const firstDay = new Date(Date.UTC(year, month - 1, 1));
      const lastDay = new Date(Date.UTC(year, month, 0));
      for (
        let d = new Date(firstDay);
        d <= lastDay;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const dateStr = d.toISOString().slice(0, 10);
        const events = getEventsForDate(dateStr);
        if (events.length > 0) {
          marks[dateStr] = { 
            marked: true, 
            dotColor: events[0]?.hexcode || colors.primary,
          };
        }
      }
    });
    marks[selectedDate] = { 
      ...(marks[selectedDate] || {}), 
      selected: true, 
      selectedColor: colors.primary,
      selectedTextColor: colors.white,
    };
    return marks;
  }, [getEventsForDate, selectedDate, virtualMonthIndex]);

  // Double tap logic
  const lastTapRef = useRef<number>(0);
  const onDayPress = useCallback(
    (day: { dateString: string }) => {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current < 300) {
        setSelectedDate(day.dateString);
        onDoubleTapDay?.(day.dateString);
        lastTapRef.current = 0;
      } else {
        setSelectedDate(day.dateString);
        lastTapRef.current = now;
      }
    },
    [setSelectedDate, onDoubleTapDay]
  );

  // PagerView page change handler (user swipes)
  const skipNextPageSelectedRef = useRef(false);
  const pendingMonthRef = useRef<string | null>(null);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      if (skipNextPageSelectedRef.current) {
        skipNextPageSelectedRef.current = false;
        return;
      }
      const position = e.nativeEvent.position;
      if (lastPagePositionRef.current === position) {
        return;
      }
      lastPagePositionRef.current = position;

      const pageOffset = position - PAGE_RANGE;
      if (pageOffset === 0) {
        setTransitioning(false);
        return;
      }
      setTransitioning(true); // <--- Disable swiping during recenter

      setVirtualMonthIndex(prev => prev + pageOffset);

      const newMonthIndex = baseMonthIndexRef.current + pageOffset;
      const newMonthStr = getMonthString(newMonthIndex);
      const newDate = `${newMonthStr}-01`;

      if (selectedDate !== newDate) {
        pendingMonthRef.current = newDate;
        skipNextPageSelectedRef.current = true;
        pagerRef.current?.setPageWithoutAnimation(PAGE_RANGE);
        lastPagePositionRef.current = PAGE_RANGE;
      }
      // Don't setTransitioning(false) here!
    },
    [selectedDate]
  );

  const handlePageScrollStateChanged = useCallback((e: { nativeEvent: { pageScrollState: string } }) => {
    if (e.nativeEvent.pageScrollState === 'idle' && pendingMonthRef.current) {
      setSelectedDate(pendingMonthRef.current);
      pendingMonthRef.current = null;
      setTransitioning(false); // <--- Re-enable swiping after recenter
    }
  }, [setSelectedDate]);

  // Pager pages: always render 3 pages based on virtualMonthIndex
  const monthPages = useMemo(() => {
    const pages = [];
    for (let i = -PAGE_RANGE; i <= PAGE_RANGE; i++) {
      const monthIndex = virtualMonthIndex + i;
      pages.push(
        <View key={monthIndex} style={styles.calendarPage}>
          <Calendar
            current={getMonthString(monthIndex) + '-01'}
            onDayPress={onDayPress}
            markedDates={marks}
            hideArrows={true}
            hideExtraDays={false}
            disableMonthChange={true}
            theme={calendarTheme}
            style={styles.calendar}
          />
        </View>
      );
    }
    return pages;
  }, [virtualMonthIndex, marks, onDayPress]);

  return (
    <View style={{ height: SCREEN_HEIGHT * 0.45, flex: 1 }}>
      <View style={styles.calendarContainer}>
        <Animated.View style={{ opacity: calendarOpacity, height: SCREEN_HEIGHT * 0.45, flex: 1 }}>
          <PagerView
            key={pagerKey}
            ref={pagerRef}
            style={styles.pagerView}
            orientation="vertical"
            initialPage={PAGE_RANGE}
            onPageSelected={handlePageSelected}
            onPageScrollStateChanged={handlePageScrollStateChanged}
            overdrag={false}
            scrollEnabled={!transitioning} // <--- This disables swiping while transitioning
          >
            {monthPages}
          </PagerView>
        </Animated.View>
      </View>
      <EventsList date={selectedDate} />
    </View>
  );
});

const styles = StyleSheet.create({
  // Calendar Container
  calendarContainer: {
    flex: 1,
    minHeight: SCREEN_HEIGHT * 0.45,
  },
  calendarPage: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
    minHeight: SCREEN_HEIGHT * 0.45,
  },
  
  // Calendar Styling
  calendar: {
    borderRadius: 20,
    margin: 0,
    marginBottom: 0,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: colors.white,
    padding: 8,
  },

  // Events List Container
  eventsListContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },

  // Date Header
  dateHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.white,
  },
  dateHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateHeaderText: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  eventCountBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  eventCountText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Event Items
  eventsFlatList: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexGrow: 1,
  },
  eventSeparator: {
    height: 12,
  },
  eventItem: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  eventItemContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  eventTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  eventTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    backgroundColor: colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  eventTime: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventLocation: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventRange: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

// Calendar theme configuration (separate from styles)
const calendarTheme = {
  todayTextColor: colors.success,
  dotColor: colors.primary,
  arrowColor: colors.primary,
  textSectionTitleColor: colors.textSecondary,
  monthTextColor: colors.text,
  dayTextColor: colors.text,
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.white,
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 14,
  textDayFontWeight: '500' as const,
  textMonthFontWeight: '600' as const,
  textDayHeaderFontWeight: '600' as const,
  'stylesheet.calendar.header': {
    dayHeader: {
      color: colors.textSecondary,
      fontWeight: '600' as const,
      fontSize: 14,
      paddingVertical: 8,
      textAlign: 'center',
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  'stylesheet.day.basic': {
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      minWidth: 36,
      minHeight: 36,
    },
    text: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.text,
      textAlign: 'center',
      alignSelf: 'center',
    },
    selectedDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.white,
      alignSelf: 'center',
      marginTop: 2,
    },
  },
};