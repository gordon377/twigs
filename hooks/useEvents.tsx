import { useMemo } from 'react';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEventsContext } from '@/contexts/EventsContext';
import { colors } from '@/styles/styles'; // ✅ FIXED: Import colors

export const useEvents = () => {
  const { 
    events,
    calendars,
    addEvent, 
    updateEvent, 
    deleteEvent,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    getEventsInRange, 
    isLoadingEvents,
    getRemoteCalendarId,
    getLocalCalendarId,
    getCalendarByName,
    syncCalendarMapping,
    syncEventsWithAPI,
    syncCalendarsWithAPI,
    initializeCalendarsFromAPI,
  } = useEventsContext();

  // ✅ UPDATED: Events lookup using ISO dates
  const eventsLookup = useMemo(() => {
    const lookup: Record<string, CalendarEvent[]> = {};
    
    events.forEach(event => {
      // ✅ Extract date from ISO format
      const startDateStr = dateTimeHelpers.extractDateFromISO(event.startDate);
      const endDateStr = dateTimeHelpers.extractDateFromISO(event.endDate);
      
      const startDate = dateTimeHelpers.parseDate(startDateStr);
      const endDate = dateTimeHelpers.parseDate(endDateStr);
      
      // Add event to all dates in its range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = dateTimeHelpers.formatDateForStorage(d);
        
        if (!lookup[dateStr]) {
          lookup[dateStr] = [];
        }
        lookup[dateStr].push(event);
      }
    });
    
    return lookup;
  }, [events]);

  const getEventsForDate = (date: string): CalendarEvent[] => {
    return eventsLookup[date] || [];
  };

  const hasEventsOnDate = (date: string): boolean => {
    return !!eventsLookup[date]?.length;
  };

  // ✅ UPDATED: Format time using ISO dates
  const formatTimeDisplay = (event: CalendarEvent, showTimezone: boolean = false): string => {
    const isAllDay = dateTimeHelpers.isAllDayEvent(event.startDate, event.endDate);
    const isMultiDay = dateTimeHelpers.extractDateFromISO(event.startDate) !== 
                       dateTimeHelpers.extractDateFromISO(event.endDate);

    if (isAllDay) {
      return isMultiDay ? 'All-day (multi-day)' : 'All-day';
    }
    
    const startTime = dateTimeHelpers.formatISOTimeForDisplay(event.startDate, showTimezone ? event.timezone : undefined);
    const endTime = dateTimeHelpers.formatISOTimeForDisplay(event.endDate, showTimezone ? event.timezone : undefined);
    
    let timeStr = `${startTime} - ${endTime}`;
    
    if (showTimezone && event.timezone !== dateTimeHelpers.getUserTimezone()) {
      const tzAbbr = event.timezone.split('/').pop() || event.timezone;
      timeStr += ` (${tzAbbr})`;
    }
    
    return timeStr;
  };

  const formatDateRange = (event: CalendarEvent, showTimezone: boolean = false): string => {
    const startDateStr = dateTimeHelpers.extractDateFromISO(event.startDate);
    const endDateStr = dateTimeHelpers.extractDateFromISO(event.endDate);
    
    const startDate = dateTimeHelpers.parseDate(startDateStr);
    const endDate = dateTimeHelpers.parseDate(endDateStr);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    if (showTimezone) {
      formatOptions.timeZone = event.timezone;
    }
    
    if (endDate.getTime() === startDate.getTime()) {
      return startDate.toLocaleDateString('en-US', formatOptions);
    }
    
    const startStr = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      ...(showTimezone && { timeZone: event.timezone })
    });
    const endStr = endDate.toLocaleDateString('en-US', formatOptions);
    
    return `${startStr} - ${endStr}`;
  };

  const isMultiDayEvent = (event: CalendarEvent): boolean => {
    return dateTimeHelpers.extractDateFromISO(event.startDate) !== 
           dateTimeHelpers.extractDateFromISO(event.endDate);
  };

  const datesWithEvents = useMemo(() => {
    return Object.keys(eventsLookup);
  }, [eventsLookup]);

  const getCalendarById = (id: string) => {
    return calendars.find(cal => cal.id === id);
  };

  const getEventsByCalendar = (calendarId: string) => {
    return events.filter(event => event.calendarId === calendarId);
  };

  return {
    events,
    calendars,
    addEvent,
    updateEvent,
    deleteEvent,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    getEventsInRange,
    isLoadingEvents,
    getRemoteCalendarId,
    getLocalCalendarId,
    getCalendarByName,
    syncCalendarMapping,
    syncEventsWithAPI,
    syncCalendarsWithAPI,
    initializeCalendarsFromAPI,
    getCalendarById,
    getEventsByCalendar,
    getEventsForDate,
    hasEventsOnDate,
    datesWithEvents,
    formatTimeDisplay,
    formatDateRange,
    isMultiDayEvent,
    getUserTimezone: dateTimeHelpers.getUserTimezone,
    isValidTimezone: dateTimeHelpers.isValidTimezone,
    commonTimezones: dateTimeHelpers.commonTimezones,
    dateTimeHelpers,
  };
};

// ✅ FIXED: Remove startTime/endTime from helper function
export const createCalendarEventObject = (rawEventData: any): CalendarEvent => {
  const todayDate = dateTimeHelpers.getTodayStringInTimezone();
  const defaultStartISO = dateTimeHelpers.createISOString(todayDate, '12:00:00');
  const defaultEndISO = dateTimeHelpers.createISOString(todayDate, '13:00:00');

  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: rawEventData.title || '',
    startDate: rawEventData.startDate || defaultStartISO, // ✅ ISO format
    endDate: rawEventData.endDate || defaultEndISO,       // ✅ ISO format
    description: rawEventData.description || '',
    location: rawEventData.location || '',
    hexcode: rawEventData.hexcode || colors.primary,      // ✅ Now colors is imported
    timezone: rawEventData.timezone || dateTimeHelpers.getUserTimezone(),
    calendar: rawEventData.calendar || 'Default Calendar',
    invitees: rawEventData.invitees || [],
    calendarId: rawEventData.calendarId || '',
  };
};