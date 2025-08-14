import { useMemo, useCallback, useRef } from 'react';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEventsContext } from '@/contexts/EventsContext';
import { colors } from '@/styles/styles';

// ✅ CONSTANTS: Limit cache sizes to prevent memory issues
const MAX_CACHE_SIZE = 100; // Limit cached date lookups
const MAX_LOOKUP_DATES = 365; // Don't cache more than a year of dates

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

  // ✅ SMART: Limited cache for frequently accessed dates
  const dateCache = useRef(new Map<string, CalendarEvent[]>());
  
  // ✅ OPTIMIZED: Memory-conscious events lookup
  const eventsLookup = useMemo(() => {
    console.log('🔄 Rebuilding events lookup table...');
    const lookup: Record<string, CalendarEvent[]> = {};
    
    // ✅ Get date range to limit memory usage
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const sixMonthsAhead = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    
    let processedDates = 0;
    
    events.forEach(event => {
      // Extract date from ISO format
      const startDateStr = dateTimeHelpers.extractDateFromISO(event.startDate);
      const endDateStr = dateTimeHelpers.extractDateFromISO(event.endDate);
      
      const startDate = dateTimeHelpers.parseDate(startDateStr);
      const endDate = dateTimeHelpers.parseDate(endDateStr);
      
      // ✅ OPTIMIZATION: Only cache events within reasonable range
      const clampedStartDate = startDate < sixMonthsAgo ? sixMonthsAgo : startDate;
      const clampedEndDate = endDate > sixMonthsAhead ? sixMonthsAhead : endDate;
      
      // Add event to all dates in its range
      for (let d = new Date(clampedStartDate); d <= clampedEndDate && processedDates < MAX_LOOKUP_DATES; d.setDate(d.getDate() + 1)) {
        const dateStr = dateTimeHelpers.formatDateForStorage(d);
        
        if (!lookup[dateStr]) {
          lookup[dateStr] = [];
          processedDates++;
        }
        lookup[dateStr].push(event);
      }
    });
    
    // ✅ Clear old cache when lookup changes
    dateCache.current.clear();
    
    console.log('✅ Events lookup table built:', Object.keys(lookup).length, 'dates (limited for memory)');
    return lookup;
  }, [events]); // ✅ Only rebuild when events array changes

  // ✅ SMART: Cached lookup with LRU-style memory management
  const getEventsForDate = useCallback((date: string): CalendarEvent[] => {
    // Check memory-conscious cache first
    if (dateCache.current.has(date)) {
      return dateCache.current.get(date)!;
    }
    
    // Get from lookup table
    const events = eventsLookup[date] || [];
    
    // ✅ Cache with size limit (LRU-style)
    if (dateCache.current.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = dateCache.current.keys().next().value;
      if (firstKey) {
        dateCache.current.delete(firstKey);
      }
    }
    
    dateCache.current.set(date, events);
    return events;
  }, [eventsLookup]);

  // ✅ LIGHTWEIGHT: Only cache boolean results
  const hasEventsOnDate = useCallback((date: string): boolean => {
    return !!eventsLookup[date]?.length;
  }, [eventsLookup]);

  // ✅ OPTIMIZATION: Memoize only expensive utility functions
  const isMultiDayEvent = useCallback((event: CalendarEvent): boolean => {
    return dateTimeHelpers.extractDateFromISO(event.startDate) !== 
           dateTimeHelpers.extractDateFromISO(event.endDate);
  }, []); // ✅ Pure function - no memory impact

  // ✅ CONDITIONAL: Only memoize if formatting is expensive
  const formatTimeDisplay = useCallback((event: CalendarEvent, showTimezone: boolean = false): string => {
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
  }, []);

  const formatDateRange = useCallback((event: CalendarEvent, showTimezone: boolean = false): string => {
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
  }, []);

  // ✅ SMART: Only memoize summary data, not full arrays
  const eventsStats = useMemo(() => ({
    totalEvents: events.length,
    datesWithEvents: Object.keys(eventsLookup).length,
    cacheSize: dateCache.current.size,
  }), [events.length, eventsLookup]);

  // ✅ AVOID: Don't memoize large arrays that change frequently
  // const allEvents = useMemo(() => events, [events]); // ❌ Unnecessary

  // ✅ LIGHTWEIGHT: Simple derived functions without memoization
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
    // ✅ Optimized functions
    getEventsForDate,
    hasEventsOnDate,
    eventsStats, // ✅ Summary instead of raw data
    formatTimeDisplay,
    formatDateRange,
    isMultiDayEvent,
    getUserTimezone: dateTimeHelpers.getUserTimezone,
    isValidTimezone: dateTimeHelpers.isValidTimezone,
    commonTimezones: dateTimeHelpers.commonTimezones,
    dateTimeHelpers,
  };
};

// ✅ UNCHANGED: This function is fine as-is
export const createCalendarEventObject = (rawEventData: any): CalendarEvent => {
  const todayDate = dateTimeHelpers.getTodayStringInTimezone();
  const defaultStartISO = dateTimeHelpers.createISOString(todayDate, '12:00:00');
  const defaultEndISO = dateTimeHelpers.createISOString(todayDate, '13:00:00');

  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: rawEventData.title || '',
    startDate: rawEventData.startDate || defaultStartISO,
    endDate: rawEventData.endDate || defaultEndISO,
    description: rawEventData.description || '',
    location: rawEventData.location || '',
    hexcode: rawEventData.hexcode || colors.primary,
    timezone: rawEventData.timezone || dateTimeHelpers.getUserTimezone(),
    calendar: rawEventData.calendar || 'Default Calendar',
    invitees: rawEventData.invitees || [],
    calendarId: rawEventData.calendarId || '',
  };
};