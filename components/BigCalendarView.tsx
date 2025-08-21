import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar as BigCalendar } from 'react-native-big-calendar';
import { useEvents } from '@/hooks/useEvents';

export const BigCalendarView: React.FC<{ date: string; mode?: 'day' | 'week' | '3days' | 'month' }> = ({
  date,
  mode = 'day',
}) => {
  const { events } = useEvents();

  const calendarEvents = events.map(ev => ({
    title: ev.title,
    start: new Date(ev.startDate),
    end: new Date(ev.endDate),
    color: ev.hexcode,
    id: ev.id,
  }));

  return (
    <View style={styles.container}>
      <BigCalendar
        events={calendarEvents}
        height={600}
        mode={mode}
        date={new Date(date)}
        eventCellStyle={(event: any) => ({ backgroundColor: event.color })}
        // headerComponent not passed, so default header is used
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});