import { useState } from 'react';
import { Calendar, CalendarTheme, toDateId, useDateRange } from '@marceloterreiro/flash-calendar';

export const CalendarListDateRange = () => {
  const {
    calendarActiveDateRanges,
    onCalendarDayPress,
    // Also available for your convenience:
    // dateRange, // { startId?: string, endId?: string }
    // isDateRangeValid, // boolean
    // onClearDateRange, // () => void
  } = useDateRange();
  return (
    <Calendar.List
      calendarActiveDateRanges={calendarActiveDateRanges}
      onCalendarDayPress={onCalendarDayPress}
    />
  );
};