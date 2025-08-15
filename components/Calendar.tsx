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

// --- Event List ---
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
      <View style={{ flex: 1, marginRight: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.hexcode && <View style={[styles.colorDot, { backgroundColor: item.hexcode }]} />}
          <Text style={styles.eventTitle}>{item.title}</Text>
          {isMultiDay && (
            <Text style={styles.badge}>{badgeText}</Text>
          )}
        </View>
        {item.location && (
          <Text style={styles.eventLocation}>📍 {item.location}</Text>
        )}
        {isMultiDay && (
          <Text style={styles.eventRange}>{formatDateRange(item)}</Text>
        )}
      </View>
      <Text style={styles.eventTime}>{formatTimeDisplay(item)}</Text>
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
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>{formattedDate}</Text>
      </View>
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events for this date.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={keyExtractor}
          renderItem={renderEventItem}
          getItemLayout={(_, index) => ({ length: 80, offset: 80 * index, index })}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
          updateCellsBatchingPeriod={50}
          extraData={date}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={styles.flatListContent}
        />
      )}
    </View>
  );
});

// --- Calendar Picker ---
type SingleDateCalendarProps = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onDoubleTapDay?: (date: string) => void; // <-- Add this
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const SingleDateCalendar: React.FC<SingleDateCalendarProps> = ({
  selectedDate,
  setSelectedDate,
  onDoubleTapDay,
}) => {
  const { getEventsForDate } = useEvents();
  const pagerRef = useRef<PagerView>(null);

  // Always use string math for month index
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

  // Mark dates with events
  const marks = useMemo(() => {
    const marks: Record<string, any> = {};
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i - 180);
      const dateStr = date.toISOString().slice(0, 10);
      if (getEventsForDate(dateStr).length > 0) {
        marks[dateStr] = { marked: true, dotColor: colors.primary };
      }
    }
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: colors.primary };
    return marks;
  }, [getEventsForDate, selectedDate]);

  // Double-tap logic for day cells only
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

  // Only render previous, current, and next month for performance
  const monthPages = useMemo(() => {
    const pages = [];
    for (let i = currentMonthIndex - 1; i <= currentMonthIndex + 1; i++) {
      const monthStr = getMonthString(i);
      pages.push(
        <View key={monthStr} style={{ flex: 1 }}>
          <Calendar
            current={monthStr + '-01'}
            onDayPress={onDayPress}
            markedDates={marks}
            hideArrows={true}
            hideExtraDays={false}
            disableMonthChange={true}
            theme={{
              todayTextColor: colors.success,
              dotColor: colors.primary,
              arrowColor: colors.primary,
              textSectionTitleColor: colors.text,
              monthTextColor: colors.text,
              dayTextColor: colors.text,
            }}
            style={styles.calendar}
          />
        </View>
      );
    }
    return pages;
  }, [currentMonthIndex, marks, onDayPress]);

  // Handle vertical swipe to change month
  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const newIndex = currentMonthIndex - 1 + e.nativeEvent.position;
      if (newIndex !== currentMonthIndex) {
        setCurrentMonthIndex(newIndex);

        // Always set selectedDate to first of new month in string format
        const newMonthStr = getMonthString(newIndex);
        // Only update if selectedDate is not already in this month
        if (!selectedDate.startsWith(newMonthStr)) {
          setSelectedDate(`${newMonthStr}-01`);
        }
      }
    },
    [currentMonthIndex, setSelectedDate, selectedDate]
  );

  // Only update pager if selectedDate's month is different from currentMonthIndex
  useEffect(() => {
    const newIndex = getMonthIndex(selectedDate);
    const selectedMonth = selectedDate.slice(0, 7);
    const currentMonth = getMonthString(currentMonthIndex);

    // Only update if the month is truly different and the index is not already correct
    if (selectedMonth !== currentMonth && newIndex !== currentMonthIndex && pagerRef.current) {
      pagerRef.current.setPageWithoutAnimation(1); // Always keep current month in the middle
      setCurrentMonthIndex(newIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <View style={{ flex: 1, minHeight: SCREEN_HEIGHT * 0.45 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1, minHeight: SCREEN_HEIGHT * 0.45 }}
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
  calendar: {
    borderRadius: 16,
    margin: 8,
    elevation: 2,
    backgroundColor: colors.background,
  },
  dateHeaderText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.darkGreen,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  eventTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  badge: {
    color: colors.darkGreen,
    fontSize: 10,
    marginLeft: 6,
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  eventLocation: {
    color: colors.grey,
    fontSize: 12,
    marginTop: 2,
  },
  eventRange: {
    color: colors.darkGreen,
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  container: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  eventColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTime: {
    fontSize: 13,
    color: colors.grey,
  },
  emptyText: {
    color: colors.grey,
    fontStyle: 'italic',
    marginTop: 12,
  },
});