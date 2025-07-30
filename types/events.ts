export type CalendarEvent = {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format  
  startTime: string | null; // HH:MM:SS format or null
  endTime: string | null;   // HH:MM:SS format or null
  description?: string;
  hexcode: string;         // Single color instead of category object
  timezone: string;        // IANA timezone format (required)
  location?: string;
  calendar: string;        // Required calendar name
  invitees?: string[];
  calendarId: string;
};

// Helper functions for date/time validation and formatting
export const dateTimeHelpers = {
  // Validate YYYY-MM-DD format
  isValidDate: (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString + 'T00:00:00');
    return date.toISOString().split('T')[0] === dateString;
  },

  // Validate HH:MM:SS format
  isValidTime: (timeString: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return regex.test(timeString);
  },

  // ✅ Validate IANA timezone format
  isValidTimezone: (timezone: string): boolean => {
    try {
      // Test if timezone is valid by trying to create a date with it
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  },

  // ✅ Get user's current timezone
  getUserTimezone: (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // ✅ Get current date in user's timezone
  getTodayStringInTimezone: (timezone?: string): string => {
    const tz = timezone || dateTimeHelpers.getUserTimezone();
    const date = new Date();
    
    try {
      // Create date in specific timezone
      const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: tz }));
      return dateInTz.toISOString().split('T')[0];
    } catch (error) {
      // Fallback to UTC if timezone is invalid
      return date.toISOString().split('T')[0];
    }
  },

  // Create date string in YYYY-MM-DD format
  formatDateForStorage: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  // Create time string in HH:MM:SS format
  formatTimeForStorage: (date: Date): string => {
    return date.toTimeString().split(' ')[0];
  },

  // Get current date in YYYY-MM-DD format (UTC)
  getTodayString: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  // Parse date string to Date object
  parseDate: (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  },

  // ✅ Parse date and time in specific timezone
  parseDateTimeInTimezone: (dateString: string, timeString: string | null, timezone: string): Date => {
    if (!timeString) {
      // All-day event: use start of day in timezone
      const dateTimeStr = `${dateString}T00:00:00`;
      return new Date(dateTimeStr);
    }
    
    try {
      const dateTimeStr = `${dateString}T${timeString}`;
      const date = new Date(dateTimeStr);
      
      // Convert to timezone if needed
      const offsetMs = date.getTimezoneOffset() * 60 * 1000;
      return new Date(date.getTime() + offsetMs);
    } catch (error) {
      console.error('Error parsing date/time in timezone:', error);
      return new Date(`${dateString}T${timeString}`);
    }
  },

  // Format time for display (HH:MM)
  formatTimeForDisplay: (timeString: string): string => {
    return timeString.substring(0, 5); // Remove seconds for display
  },

  // ✅ Format time for display in specific timezone
  formatTimeForDisplayInTimezone: (timeString: string, timezone: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      return date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return timeString.substring(0, 5); // Fallback to simple format
    }
  },

  // Format date for display
  formatDateForDisplay: (dateString: string): string => {
    if (!dateTimeHelpers.isValidDate(dateString)) {
      return 'Invalid Date';
    }
    const date = dateTimeHelpers.parseDate(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  },

  // ✅ Format date for display in specific timezone
  formatDateForDisplayInTimezone: (dateString: string, timezone: string): string => {
    if (!dateTimeHelpers.isValidDate(dateString)) {
      return 'Invalid Date';
    }
    
    try {
      const date = dateTimeHelpers.parseDate(dateString);
      return date.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      // Fallback to UTC display
      return dateTimeHelpers.formatDateForDisplay(dateString);
    }
  },

  // ✅ Common IANA timezones for dropdown/selection
  commonTimezones: [
    'America/New_York',      // Eastern Time
    'America/Chicago',       // Central Time
    'America/Denver',        // Mountain Time
    'America/Los_Angeles',   // Pacific Time
    'America/Phoenix',       // Arizona (no DST)
    'America/Anchorage',     // Alaska Time
    'Pacific/Honolulu',      // Hawaii Time
    'Europe/London',         // GMT/BST
    'Europe/Paris',          // CET/CEST
    'Europe/Berlin',         // CET/CEST
    'Europe/Rome',           // CET/CEST
    'Asia/Tokyo',            // JST
    'Asia/Shanghai',         // CST
    'Asia/Kolkata',          // IST
    'Asia/Dubai',            // GST
    'Australia/Sydney',      // AEDT/AEST
    'Pacific/Auckland',      // NZDT/NZST
    'UTC'                    // Coordinated Universal Time
  ] as const,
};
