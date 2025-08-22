import { timeZonesNames, getTimeZones, TimeZone } from '@vvo/tzdb';
import { zonedTimeToUtc } from 'date-fns-tz';

export type Calendar = {
  id: string;
  remoteId?: number;
  name: string;
  hexcode: string;
  is_private?: boolean;
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

// Minimal tzdb integration
export const getAllTimezones = () => timeZonesNames;
export const findTimeZone = (name: string): TimeZone | undefined =>
  getTimeZones().find((z) => z.name === name);

export const dateTimeHelpers = {
  isValidISOString: (isoString: string): boolean => {
    if (!isoString || typeof isoString !== 'string') return false;
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return false;
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
      return isoPattern.test(isoString);
    } catch {
      return false;
    }
  },

  createISOString: (
    dateString: string,
    timeString: string | null,
    timezone: string = 'UTC'
  ): string => {
    try {
      const localDateTime = timeString
        ? `${dateString}T${timeString}`
        : `${dateString}T00:00:00`;
      const utcDate = zonedTimeToUtc(localDateTime, timezone);
      return utcDate.toISOString();
    } catch {
      return `${dateString}T00:00:00Z`;
    }
  },

  createAllDayEventISO: (dateString: string): { start: string; end: string } => ({
    start: `${dateString}T00:00:00Z`,
    end: `${dateString}T23:59:59Z`
  }),

  extractDateFromISO: (isoString: string): string => {
    try {
      return isoString.split('T')[0];
    } catch {
      return '2024-01-01';
    }
  },

  extractTimeFromISO: (isoString: string): string | null => {
    try {
      const timePart = isoString.split('T')[1];
      if (!timePart) return null;
      const timeWithoutZ = timePart.replace('Z', '');
      return timeWithoutZ.substring(0, 8); // HH:MM:SS
    } catch {
      return null;
    }
  },

  isAllDayEvent: (startISO: string, endISO: string): boolean => {
    try {
      const startTime = dateTimeHelpers.extractTimeFromISO(startISO);
      const endTime = dateTimeHelpers.extractTimeFromISO(endISO);
      const startDate = dateTimeHelpers.extractDateFromISO(startISO);
      const endDate = dateTimeHelpers.extractDateFromISO(endISO);
      return startDate === endDate && startTime === '00:00:00' && endTime === '23:59:59';
    } catch {
      return false;
    }
  },

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
    } catch {
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
    } catch {
      return dateTimeHelpers.extractTimeFromISO(isoString) || '';
    }
  },

  isValidTimezone: (timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  },

  getUserTimezone: (): string => Intl.DateTimeFormat().resolvedOptions().timeZone,

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
    } catch {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  },

  getCurrentISOString: (): string => new Date().toISOString(),

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
    } catch {
      return { startDate: startISO, endDate: endISO, corrected: false };
    }
  },

  suggestEndISOTime: (startISO: string): string => {
    try {
      const startDate = new Date(startISO);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      return endDate.toISOString();
    } catch {
      return startISO;
    }
  },

  createTimezoneAwareISO: (
    dateString: string,
    timeString: string,
    timezone: string = 'UTC'
  ): string => {
    try {
      const tz = findTimeZone(timezone);
      const [year, month, day] = dateString.split('-').map(Number);
      const [hour, minute, second] = timeString.split(':').map(Number);
      const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
      const offsetMinutes = tz ? tz.currentTimeOffsetInMinutes : 0;
      const utcDate = new Date(localDate.getTime() - offsetMinutes * 60000);
      return utcDate.toISOString();
    } catch {
      return `${dateString}T${timeString}Z`;
    }
  },

  parseDate: (dateString: string): Date => {
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    } catch {
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
    } catch {
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
    } catch {
      return timeString;
    }
  },

  formatDateRange: (event: CalendarEvent, showTimezone: boolean = false): string => {
    const startDateStr = dateTimeHelpers.extractDateFromISO(event.startDate);
    const endDateStr = dateTimeHelpers.extractDateFromISO(event.endDate);
    const startDate = dateTimeHelpers.parseDate(startDateStr);
    const endDate = dateTimeHelpers.parseDate(endDateStr);
    const formatOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(showTimezone && { timeZone: event.timezone })
    };
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

  commonTimezones: [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London',
    'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland', 'UTC'
  ] as const,
};
