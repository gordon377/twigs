import React, { memo, useMemo, useCallback, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, Animated, PanResponder, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/styles';
import { useEvents } from '@/hooks/useEvents';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { Calendar } from 'react-native-calendars';

const router = useRouter();

// ✅ Memoize dateHelpers at module level
export const dateHelpers = {
  formatDate: (dateString: string): string => {
    return dateTimeHelpers.formatDateForDisplay(dateString);
  },
};

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

export const SingleDateCalendar: React.FC<SingleDateCalendarProps> = ({
  selectedDate,
  setSelectedDate,
  onDoubleTapDay,
}) => {
  const { getEventsForDate } = useEvents();
  const pagerRef = useRef<PagerView>(null);
  const isUpdatingRef = useRef(false);
  const lastPagePositionRef = useRef(1);

  const getMonthIndex = (dateStr: string) => {
    const [year, month] = dateStr.split('-').map(Number);
    return (year - 2000) * 12 + (month - 1);
  };

  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => getMonthIndex(selectedDate));

  const getMonthString = (index: number) => {
    const year = 2000 + Math.floor(index / 12);
    const month = (index % 12) + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  // Enhanced marks with better visual indicators
  const marks = useMemo(() => {
    const marks: Record<string, any> = {};
    for (let i = 0; i < 365; i++) {
      const date = new Date(Date.UTC(2000, 0, 1));
      date.setUTCDate(date.getUTCDate() + i - 180);
      const dateStr = date.toISOString().slice(0, 10);
      const events = getEventsForDate(dateStr);
      if (events.length > 0) {
        marks[dateStr] = { 
          marked: true, 
          dotColor: events[0]?.hexcode || colors.primary,
          dots: events.slice(0, 3).map((event, index) => ({
            key: index,
            color: event.hexcode || colors.primary,
            selectedDotColor: colors.white,
          }))
        };
      }
    }
    marks[selectedDate] = { 
      ...(marks[selectedDate] || {}), 
      selected: true, 
      selectedColor: colors.primary,
      selectedTextColor: colors.white,
    };
    return marks;
  }, [getEventsForDate, selectedDate]);

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

  const monthPages = useMemo(() => {
    return [
      <View key="prev" style={styles.calendarPage}>
        <Calendar
          current={getMonthString(currentMonthIndex - 1) + '-01'}
          onDayPress={onDayPress}
          markedDates={marks}
          hideArrows={true}
          hideExtraDays={false}
          disableMonthChange={true}
          theme={calendarTheme}
          style={styles.calendar}
        />
      </View>,
      <View key="current" style={styles.calendarPage}>
        <Calendar
          current={getMonthString(currentMonthIndex) + '-01'}
          onDayPress={onDayPress}
          markedDates={marks}
          hideArrows={true}
          hideExtraDays={false}
          disableMonthChange={true}
          theme={calendarTheme}
          style={styles.calendar}
        />
      </View>,
      <View key="next" style={styles.calendarPage}>
        <Calendar
          current={getMonthString(currentMonthIndex + 1) + '-01'}
          onDayPress={onDayPress}
          markedDates={marks}
          hideArrows={true}
          hideExtraDays={false}
          disableMonthChange={true}
          theme={calendarTheme}
          style={styles.calendar}
        />
      </View>
    ];
  }, [currentMonthIndex, marks, onDayPress]);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const newIndex = currentMonthIndex - 1 + e.nativeEvent.position;
      if (newIndex !== currentMonthIndex) {
        setCurrentMonthIndex(newIndex);
      }
    },
    [currentMonthIndex]
  );

  useEffect(() => {
    lastPagePositionRef.current = 1;
  }, []);

  return (
    <View style={styles.calendarContainer}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        orientation="vertical"
        initialPage={1}
        onPageSelected={handlePageSelected}
      >
        {monthPages}
      </PagerView>
      <EventsList date={selectedDate} />
    </View>
  );
};

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
    margin: 16,
    marginBottom: 8,
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
    },
  },
  'stylesheet.day.basic': {
    base: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
    },
    text: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.text,
    },
  },
};