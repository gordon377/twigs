import { useMemo, useCallback } from 'react';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEventsContext } from '@/contexts/EventsContext';
import { colors } from '@/styles/styles';

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
  } = useEventsContext();

  // ✅ SIMPLIFIED: Just compute lookup table
  const eventsLookup = useMemo(() => {
    const lookup: Record<string, CalendarEvent[]> = {};
    
    events.forEach(event => {
      const startDate = dateTimeHelpers.parseDate(event.startDate);
      const endDate = dateTimeHelpers.parseDate(event.endDate);
      
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

  // ✅ SIMPLIFIED: Direct functions without excessive memoization
  const getEventsForDate = (date: string): CalendarEvent[] => {
    const events = eventsLookup[date] || [];
    console.log(`📅 getEventsForDate(${date}): ${events.length} events`);
    return events;
  };

  const hasEventsOnDate = (date: string): boolean => {
    return !!eventsLookup[date]?.length;
  };

  // ✅ Simple functions for formatting
  const formatTimeDisplay = (event: CalendarEvent, showTimezone: boolean = false): string => {
    const isMultiDay = event.endDate !== event.startDate;

    if (event.startTime === null && event.endTime === null) {
      return isMultiDay ? 'All-day (multi-day)' : 'All-day';
    }
    
    let timeStr = '';
    if (
      event.startTime !== null &&
      event.startTime !== undefined &&
      event.endTime !== null &&
      event.endTime !== undefined
    ) {
      const startDisplay = showTimezone ? 
        dateTimeHelpers.formatTimeForDisplayInTimezone(event.startTime, event.timezone) :
        dateTimeHelpers.formatTimeForDisplay(event.startTime);
      const endDisplay = showTimezone ?
        dateTimeHelpers.formatTimeForDisplayInTimezone(event.endTime, event.timezone) :
        dateTimeHelpers.formatTimeForDisplay(event.endTime);
      timeStr = `${startDisplay} - ${endDisplay}`;
    } else if (event.startTime !== null && event.startTime !== undefined) {
      timeStr = showTimezone ?
        dateTimeHelpers.formatTimeForDisplayInTimezone(event.startTime, event.timezone) :
        dateTimeHelpers.formatTimeForDisplay(event.startTime);
    } else if (event.endTime !== null && event.endTime !== undefined) {
      const endDisplay = showTimezone ?
        dateTimeHelpers.formatTimeForDisplayInTimezone(event.endTime, event.timezone) :
        dateTimeHelpers.formatTimeForDisplay(event.endTime);
      timeStr = `Ends ${endDisplay}`;
    } else {
      timeStr = 'Time not specified';
    }
    
    if (showTimezone && event.timezone !== dateTimeHelpers.getUserTimezone()) {
      const tzAbbr = event.timezone.split('/').pop() || event.timezone;
      timeStr += ` (${tzAbbr})`;
    }
    
    return timeStr;
  };

  const formatDateRange = (event: CalendarEvent, showTimezone: boolean = false): string => {
    const startDate = dateTimeHelpers.parseDate(event.startDate);
    const endDate = dateTimeHelpers.parseDate(event.endDate);
    
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
    return event.endDate !== event.startDate;
  };

  // ✅ Memoize derived data
  const datesWithEvents = useMemo(() => {
    return Object.keys(eventsLookup);
  }, [eventsLookup]);

  // ✅ Simple calendar utilities
  const getCalendarById = (id: string) => {
    return calendars.find(cal => cal.id === id);
  };

  const getEventsByCalendar = (calendarId: string) => {
    return events.filter(event => event.calendarId === calendarId);
  };

  return {
    // Data and CRUD operations from context
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
    
    // Helper functions
    getRemoteCalendarId,
    getLocalCalendarId,
    getCalendarByName,
    syncCalendarMapping,
    syncEventsWithAPI,
    
    // Calendar utilities
    getCalendarById,
    getEventsByCalendar,
    
    // ✅ Simplified UI functions
    getEventsForDate,
    hasEventsOnDate,
    datesWithEvents,
    formatTimeDisplay,
    formatDateRange,
    isMultiDayEvent,
    
    // Timezone utilities
    getUserTimezone: dateTimeHelpers.getUserTimezone,
    isValidTimezone: dateTimeHelpers.isValidTimezone,
    commonTimezones: dateTimeHelpers.commonTimezones,
    
    // Date/time utilities
    dateTimeHelpers,
  };
};

// ✅ Keep helper function unchanged
export const createCalendarEventObject = (rawEventData: any): CalendarEvent => {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: rawEventData.title || '',
    startDate: rawEventData.startDate || dateTimeHelpers.getTodayStringInTimezone(),
    endDate: rawEventData.endDate || dateTimeHelpers.getTodayStringInTimezone(),
    startTime: rawEventData.startTime || null,
    endTime: rawEventData.endTime || null,
    description: rawEventData.description || '',
    location: rawEventData.location || '',
    hexcode: rawEventData.hexcode || colors.primary,
    timezone: rawEventData.timezone || dateTimeHelpers.getUserTimezone(),
    calendar: rawEventData.calendar || 'Default Calendar',
    invitees: rawEventData.invitees || [],
    calendarId: rawEventData.calendarId || '',
  };
};