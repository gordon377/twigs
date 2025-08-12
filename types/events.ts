// Fix: types/events.ts - Clean up duplicate functions
export type Calendar = {
  id: string;
  remoteId?: number;
  name: string;
  hexcode: string;
  is_private?: boolean; // ✅ ADD: Missing is_private property
};

export type CalendarEvent = {
  id: string;
  title: string;
  startDate: string; // ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
  endDate: string;   // ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
  description?: string;
  hexcode: string;
  timezone: string;
  location?: string;
  calendar: string;
  invitees?: string[];
  calendarId: string;
};

// ✅ FIXED: Remove all duplicate functions
export const dateTimeHelpers = {
  // ✅ Enhanced validation for ISO 8601 (including +00:00 format from backend)
  isValidISOString: (isoString: string): boolean => {
    if (!isoString || typeof isoString !== 'string') {
      console.error('ISO validation failed: not a string:', typeof isoString, isoString);
      return false;
    }
    
    try {
      const date = new Date(isoString);
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        console.error('ISO validation failed: invalid date:', isoString);
        return false;
      }
      
      // Check for proper ISO format patterns
      // Accepts: YYYY-MM-DDTHH:MM:SSZ or YYYY-MM-DDTHH:MM:SS+00:00 or similar
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
      const isValidFormat = isoPattern.test(isoString);
      
      if (!isValidFormat) {
        console.error('ISO validation failed: invalid format:', isoString);
      }
      
      return isValidFormat;
    } catch (error) {
      console.error('ISO validation error:', error, 'for string:', isoString);
      return false;
    }
  },

  // ✅ Create ISO from components
  createISOString: (
    dateString: string, // YYYY-MM-DD
    timeString: string | null, // HH:MM:SS or null for all-day
    timezone: string = 'UTC'
  ): string => {
    try {
      if (!timeString) {
        return `${dateString}T00:00:00Z`;
      }
      const localDateTime = new Date(`${dateString}T${timeString}`);
      return localDateTime.toISOString();
    } catch (error) {
      console.error('Error creating ISO string:', error);
      return `${dateString}T00:00:00Z`;
    }
  },

  // ✅ All-day event helper
  createAllDayEventISO: (dateString: string): { start: string; end: string } => {
    return {
      start: `${dateString}T00:00:00Z`,
      end: `${dateString}T23:59:59Z`
    };
  },

  // ✅ Extract components from ISO
  extractDateFromISO: (isoString: string): string => {
    try {
      return isoString.split('T')[0];
    } catch (error) {
      console.error('Error extracting date from ISO:', error);
      return '2024-01-01';
    }
  },

  extractTimeFromISO: (isoString: string): string | null => {
    try {
      const timePart = isoString.split('T')[1];
      if (!timePart) return null;
      const timeWithoutZ = timePart.replace('Z', '');
      return timeWithoutZ.substring(0, 8); // HH:MM:SS
    } catch (error) {
      console.error('Error extracting time from ISO:', error);
      return null;
    }
  },

  // ✅ All-day detection
  isAllDayEvent: (startISO: string, endISO: string): boolean => {
    try {
      const startTime = dateTimeHelpers.extractTimeFromISO(startISO);
      const endTime = dateTimeHelpers.extractTimeFromISO(endISO);
      const startDate = dateTimeHelpers.extractDateFromISO(startISO);
      const endDate = dateTimeHelpers.extractDateFromISO(endISO);
      
      return startDate === endDate && 
             startTime === '00:00:00' && 
             endTime === '23:59:59';
    } catch (error) {
      return false;
    }
  },

  // ✅ Display formatting
  formatISOForDisplay: (isoString: string, timezone?: string): string => {
    try {
      const date = new Date(isoString);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...(timezone && { timeZone: timezone })
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return isoString;
    }
  },

  formatISOTimeForDisplay: (isoString: string, timezone?: string): string => {
    try {
      const date = new Date(isoString);
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        ...(timezone && { timeZone: timezone })
      };
      return date.toLocaleTimeString('en-US', options);
    } catch (error) {
      return dateTimeHelpers.extractTimeFromISO(isoString) || '';
    }
  },

  // ✅ Timezone helpers
  isValidTimezone: (timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  },

  getUserTimezone: (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  getTodayStringInTimezone: (timezone?: string): string => {
    try {
      const now = new Date();
      if (!timezone) {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(now);
    } catch (error) {
      console.error('Invalid timezone, using local date:', error);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  },

  getCurrentISOString: (): string => {
    return new Date().toISOString();
  },

  // ✅ Auto-correction for ISO format
  autoCorrectDateTime: (
    startISO: string,
    endISO: string,
    shouldCorrect: boolean = true
  ): { 
    startDate: string; 
    endDate: string;
    corrected: boolean;
    reason?: string;
  } => {
    if (!shouldCorrect) {
      return { startDate: startISO, endDate: endISO, corrected: false };
    }

    let correctedStartDate = startISO;
    let correctedEndDate = endISO;
    let reason = '';

    try {
      const startDate = new Date(startISO);
      const endDate = new Date(endISO);

      if (endDate < startDate) {
        correctedStartDate = endISO;
        correctedEndDate = startISO;
        reason = 'End date was before start date - dates were swapped';
      }

      if (correctedStartDate === correctedEndDate) {
        const newEnd = new Date(correctedStartDate);
        newEnd.setHours(newEnd.getHours() + 1);
        correctedEndDate = newEnd.toISOString();
        reason = 'End time was same as start time - added 1 hour';
      }

      const hasChanges = (correctedStartDate !== startISO || correctedEndDate !== endISO);

      return {
        startDate: correctedStartDate,
        endDate: correctedEndDate,
        corrected: hasChanges,
        reason: hasChanges ? reason : undefined
      };
    } catch (error) {
      return { startDate: startISO, endDate: endISO, corrected: false };
    }
  },

  suggestEndISOTime: (startISO: string): string => {
    try {
      const startDate = new Date(startISO);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      return endDate.toISOString();
    } catch (error) {
      return startISO;
    }
  },

  // ✅ Missing timezone-aware ISO creation
  createTimezoneAwareISO: (
    dateString: string, // YYYY-MM-DD
    timeString: string, // HH:MM:SS
    timezone: string = 'UTC'
  ): string => {
    try {
      // Create a date object in the specified timezone
      const dateTime = new Date(`${dateString}T${timeString}`);
      
      // For simplicity, convert to UTC (more complex timezone handling would need a library)
      return dateTime.toISOString();
    } catch (error) {
      console.error('Error creating timezone-aware ISO string:', error);
      return `${dateString}T${timeString}Z`;
    }
  },

  // ✅ Legacy helpers for backward compatibility
  parseDate: (dateString: string): Date => {
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date();
    }
  },

  formatDateForStorage: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatTimeForStorage: (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  formatDateForDisplay: (dateString: string): string => {
    try {
      const date = dateTimeHelpers.parseDate(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  },

  formatTimeForDisplay: (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  },

  // ✅ ADD: Format date range for search display
  formatDateRange: (event: CalendarEvent, showTimezone: boolean = false): string => {
    const startDateStr = dateTimeHelpers.extractDateFromISO(event.startDate);
    const endDateStr = dateTimeHelpers.extractDateFromISO(event.endDate);
    
    const startDate = dateTimeHelpers.parseDate(startDateStr);
    const endDate = dateTimeHelpers.parseDate(endDateStr);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
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
  },

  // Keep existing common timezones
  commonTimezones: [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London',
    'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland', 'UTC'
  ] as const,
};
