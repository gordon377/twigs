import { useMemo } from 'react';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEventsContext } from '@/contexts/EventsContext';
import { colors } from '@/styles/styles';

export const useEvents = () => {
  const { 
    events,
    calendars, // ✅ NEW: Access to calendars
    addEvent, 
    updateEvent, 
    deleteEvent,
    addCalendar, // ✅ NEW: Calendar CRUD
    updateCalendar,
    deleteCalendar,
    getEventsInRange, 
    getEventsForDate,
    isLoadingEvents // ✅ Updated from isLoading
  } = useEventsContext();

  // Pre-compute events lookup table
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

  const datesWithEvents = useMemo(() => {
    return Object.keys(eventsLookup);
  }, [eventsLookup]);

  // ✅ Enhanced time display with timezone support
  const formatTimeDisplay = useMemo(() => {
    return (event: CalendarEvent, showTimezone: boolean = false): string => {
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
      
      // ✅ Add timezone info if requested and timezone is different from user's
      if (showTimezone && event.timezone !== dateTimeHelpers.getUserTimezone()) {
        const tzAbbr = event.timezone.split('/').pop() || event.timezone;
        timeStr += ` (${tzAbbr})`;
      }
      
      return timeStr;
    };
  }, []);

  // ✅ Enhanced date range with timezone support
  const formatDateRange = useMemo(() => {
    return (event: CalendarEvent, showTimezone: boolean = false): string => {
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
      
      // Multi-day event: "Jul 26 - Wednesday, July 29, 2025"
      const startStr = startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        ...(showTimezone && { timeZone: event.timezone })
      });
      const endStr = endDate.toLocaleDateString('en-US', formatOptions);
      
      return `${startStr} - ${endStr}`;
    };
  }, []);


  // ✅ Get events for date considering timezone
  const getEventsForDateInTimezone = useMemo(() => {
    return (date: string, timezone?: string): CalendarEvent[] => {
      const targetTimezone = timezone || dateTimeHelpers.getUserTimezone();
      
      return events.filter(event => {
        // For now, simple date matching
        // Could be enhanced to handle timezone conversions
        return date >= event.startDate && date <= event.endDate;
      });
    };
  }, [events]);

  // ✅ NEW: Calendar utilities
  const getCalendarById = (id: string) => calendars.find(cal => cal.id === id);
  const getEventsByCalendar = (calendarId: string) => events.filter(event => event.calendarId === calendarId);

  return {
    // Data and CRUD operations from context
    events,
    calendars, // ✅ NEW
    addEvent,
    updateEvent,
    deleteEvent,
    addCalendar, // ✅ NEW
    updateCalendar, // ✅ NEW
    deleteCalendar, // ✅ NEW
    getEventsInRange,
    isLoadingEvents,
    
    // Calendar utilities
    getCalendarById,
    getEventsByCalendar,
    
    // Computed values for UI
    getEventsForDate: (date: string) => eventsLookup[date] || [],
    getEventsForDateInTimezone,
    hasEventsOnDate: (date: string) => !!eventsLookup[date],
    datesWithEvents,
    formatTimeDisplay,
    formatDateRange,

    
    // Helper functions
    isMultiDayEvent: (event: CalendarEvent) => event.endDate !== event.startDate,
    
    // ✅ Timezone utilities
    getUserTimezone: dateTimeHelpers.getUserTimezone,
    isValidTimezone: dateTimeHelpers.isValidTimezone,
    commonTimezones: dateTimeHelpers.commonTimezones,
    
    // Date/time utilities
    dateTimeHelpers,
  };
};


// ✅ Helper function to create CalendarEvent objects
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
    calendarId: rawEventData.calendarId || '', // Add calendarId property
  };
};