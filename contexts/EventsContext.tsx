import React, { createContext, ReactNode, useState, useEffect, useCallback, useContext } from 'react';
import * as SQLite from 'expo-sqlite';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';

// Open database
const db = SQLite.openDatabaseSync('events.db');

// Initialize database with calendars table
const initDatabase = async () => {
  // Create calendars table first
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS calendars (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      hexcode TEXT NOT NULL CHECK(hexcode GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ✅ UPDATED: Events table with foreign key to calendars
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      startDate TEXT NOT NULL CHECK(startDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      endDate TEXT NOT NULL CHECK(endDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      startTime TEXT CHECK(startTime IS NULL OR startTime GLOB '[0-9][0-9]:[0-9][0-9]:[0-9][0-9]'),
      endTime TEXT CHECK(endTime IS NULL OR endTime GLOB '[0-9][0-9]:[0-9][0-9]:[0-9][0-9]'),
      description TEXT,
      timezone TEXT NOT NULL,
      location TEXT,
      invitees TEXT,
      calendarId TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK(startDate <= endDate),
      CHECK(startTime IS NULL OR endTime IS NULL OR startTime <= endTime),
      FOREIGN KEY (calendarId) REFERENCES calendars(id) ON DELETE CASCADE
    );
  `);

  // Insert default calendar if none exists
  await db.runAsync(`
    INSERT OR IGNORE INTO calendars (id, name, hexcode) 
    VALUES ('1', 'Default', '#007AFF')
  `);

  // Create indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(startDate, endDate);
  `);
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_events_calendar ON events(calendarId);
  `);
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_calendars_name ON calendars(name);
  `);
};

// ✅ NEW: Calendar type
export type Calendar = {
  id: string;
  name: string;
  hexcode: string;
};

// ✅ UPDATED: Context interface
interface EventsContextType {
  events: CalendarEvent[];
  calendars: Calendar[];
  setEvents: (events: CalendarEvent[]) => void;
  setCalendars: (calendars: Calendar[]) => void;
  addEvent: (event: CalendarEvent) => Promise<boolean>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  addCalendar: (calendar: Omit<Calendar, 'id'>) => Promise<Calendar | null>;
  updateCalendar: (id: string, updates: Partial<Calendar>) => Promise<boolean>;
  deleteCalendar: (id: string) => Promise<boolean>;
  getEventsInRange: (startDate: string, endDate: string) => Promise<CalendarEvent[]>;
  getEventsForDate: (date: string) => CalendarEvent[];
  isLoadingEvents: boolean;
  setIsLoadingEvents: (loading: boolean) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true); // ✅ Renamed state

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        await loadCalendarsFromDB();
        await loadEventsFromDB();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsLoadingEvents(false); // ✅ Updated function call
      }
    };
    
    initialize();
  }, []);

  // ✅ NEW: Load calendars from database
  const loadCalendarsFromDB = async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM calendars ORDER BY name ASC') as any[];
      
      const dbCalendars: Calendar[] = result.map((row: any) => ({
        id: row.id,
        name: row.name,
        hexcode: row.hexcode,
      }));
      
      setCalendars(dbCalendars);
    } catch (error) {
      console.error('Failed to load calendars:', error);
    }
  };

  // ✅ UPDATED: Load events with calendar info
  const loadEventsFromDB = async () => {
    setIsLoadingEvents(true); // ✅ Updated function call
    try {
      const result = await db.getAllAsync(`
        SELECT e.*, c.name as calendarName, c.hexcode 
        FROM events e 
        JOIN calendars c ON e.calendarId = c.id 
        ORDER BY e.startDate ASC, e.startTime ASC
      `) as any[];
      
      const dbEvents: CalendarEvent[] = result.map((row: any) => ({
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        startTime: row.startTime,
        endTime: row.endTime,
        description: row.description || undefined,
        hexcode: row.hexcode, // From calendar
        timezone: row.timezone,
        location: row.location || undefined,
        calendar: row.calendarName, // From calendar
        invitees: row.invitees ? JSON.parse(row.invitees) : undefined,
        calendarId: row.calendarId,
      }));
      
      setEvents(dbEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoadingEvents(false); // ✅ Updated function call
    }
  };

  // ✅ NEW: Calendar CRUD operations
  const addCalendar = useCallback(async (calendar: Omit<Calendar, 'id'>): Promise<Calendar | null> => {
    const newId = `calendar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await db.runAsync(
        'INSERT INTO calendars (id, name, hexcode) VALUES (?, ?, ?)',
        [newId, calendar.name, calendar.hexcode]
      );
      
      const newCalendar: Calendar = { id: newId, ...calendar };
      setCalendars(prev => [...prev, newCalendar].sort((a, b) => a.name.localeCompare(b.name)));
      
      return newCalendar;
    } catch (error) {
      console.error('Failed to add calendar:', error);
      return null;
    }
  }, []);

  const updateCalendar = useCallback(async (id: string, updates: Partial<Calendar>): Promise<boolean> => {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) return true;

    try {
      await db.runAsync(
        `UPDATE calendars SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...updateValues, id]
      );
      
      setCalendars(prev => prev.map(cal => 
        cal.id === id ? { ...cal, ...updates } : cal
      ).sort((a, b) => a.name.localeCompare(b.name)));
      
      // ✅ Also update events that use this calendar
      await loadEventsFromDB();
      
      return true;
    } catch (error) {
      console.error('Failed to update calendar:', error);
      return false;
    }
  }, []);

  const deleteCalendar = useCallback(async (id: string): Promise<boolean> => {
    if (id === 'default') {
      console.error('Cannot delete default calendar');
      return false;
    }

    try {
      // Events will be automatically deleted due to CASCADE
      await db.runAsync('DELETE FROM calendars WHERE id = ?', [id]);
      
      setCalendars(prev => prev.filter(cal => cal.id !== id));
      
      // Reload events to reflect changes
      await loadEventsFromDB();
      
      return true;
    } catch (error) {
      console.error('Failed to delete calendar:', error);
      return false;
    }
  }, []);

  // Validate event data before database operations
  const validateEvent = (event: Partial<CalendarEvent>): string[] => {
    const errors: string[] = [];

    if (event.startDate && !dateTimeHelpers.isValidDate(event.startDate)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }

    if (event.endDate && !dateTimeHelpers.isValidDate(event.endDate)) {
      errors.push('End date must be in YYYY-MM-DD format');
    }

    if (event.startTime && !dateTimeHelpers.isValidTime(event.startTime)) {
      errors.push('Start time must be in HH:MM:SS format');
    }

    if (event.endTime && !dateTimeHelpers.isValidTime(event.endTime)) {
      errors.push('End time must be in HH:MM:SS format');
    }

    // ✅ Validate timezone
    if (event.timezone && !dateTimeHelpers.isValidTimezone(event.timezone)) {
      errors.push('Invalid IANA timezone format');
    }

    if (event.startDate && event.endDate && event.startDate > event.endDate) {
      errors.push('End date must be after start date');
    }

    if (event.startDate === event.endDate && event.startTime && event.endTime && event.startTime > event.endTime) {
      errors.push('End time must be after start time on the same day');
    }

    if (event.hexcode && !/^#[0-9A-Fa-f]{6}$/.test(event.hexcode)) {
      errors.push('Hexcode must be in #RRGGBB format');
    }

    return errors;
  };

  // ✅ UPDATED: Add event with calendar validation
  const addEvent = useCallback(async (event: CalendarEvent): Promise<boolean> => {
    // Validate that calendar exists
    const calendar = calendars.find(cal => cal.id === event.calendarId);
    if (!calendar) {
      console.error('Calendar not found:', event.calendarId);
      return false;
    }

    // Validate event data
    const validationErrors = validateEvent(event);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return false;
    }

    try {
      await db.runAsync(
        `INSERT INTO events (id, title, startDate, endDate, startTime, endTime, 
         description, timezone, location, invitees, calendarId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.title,
          event.startDate,
          event.endDate,
          event.startTime,
          event.endTime,
          event.description || null,
          event.timezone,
          event.location || null,
          event.invitees ? JSON.stringify(event.invitees) : null,
          event.calendarId,
        ]
      );
      
      // ✅ Event object includes calendar data
      const eventWithCalendar: CalendarEvent = {
        ...event,
        calendar: calendar.name,
        hexcode: calendar.hexcode,
      };
      
      setEvents(prev => [...prev, eventWithCalendar].sort((a, b) => {
        if (a.startDate !== b.startDate) {
          return a.startDate.localeCompare(b.startDate);
        }
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to add event:', error);
      return false;
    }
  }, [calendars]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>): Promise<boolean> => {
    // Validate updates
    const validationErrors = validateEvent(updates);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return false;
    }

    // Build parameters properly
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') { // Don't update ID
        updateFields.push(`${key} = ?`);
        
        if (key === 'invitees' && value) {
          updateValues.push(JSON.stringify(value));
        } else if (key === 'calendarId') {
          updateValues.push(value || null); // ✅ Handle calendarId properly
        } else {
          updateValues.push(value || null);
        }
      }
    });

    if (updateFields.length === 0) {
      console.log('No fields to update');
      return true;
    }

    try {
      await db.runAsync(
        `UPDATE events SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...updateValues, id]
      );
      
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ).sort((a, b) => {
        if (a.startDate !== b.startDate) {
          return a.startDate.localeCompare(b.startDate);
        }
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to update event:', error);
      return false;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    try {
      await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
      setEvents(prev => prev.filter(event => event.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }, []);

  const getEventsInRange = useCallback(async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    if (!dateTimeHelpers.isValidDate(startDate) || !dateTimeHelpers.isValidDate(endDate)) {
      console.error('Invalid date format for range query');
      return [];
    }

    try {
      const result = await db.getAllAsync(
        `SELECT * FROM events 
         WHERE (startDate <= ? AND endDate >= ?) 
         OR (startDate >= ? AND startDate <= ?)
         ORDER BY startDate ASC, startTime ASC`,
        [endDate, startDate, startDate, endDate]
      ) as any[];

      const rangeEvents: CalendarEvent[] = result.map((row: any) => ({
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        startTime: row.startTime,
        endTime: row.endTime,
        description: row.description || undefined,
        hexcode: row.hexcode || undefined,
        timezone: row.timezone || undefined,
        location: row.location || undefined,
        calendar: row.calendar || undefined,
        invitees: row.invitees ? JSON.parse(row.invitees) : undefined,
        calendarId: row.calendarId || undefined, // Added calendarId property
      }));
      
      return rangeEvents;
    } catch (error) {
      console.error('Failed to get events in range:', error);
      return [];
    }
  }, []);

  const getEventsForDate = useCallback((date: string): CalendarEvent[] => {
    if (!dateTimeHelpers.isValidDate(date)) {
      console.error('Invalid date format');
      return [];
    }

    return events.filter(event => 
      date >= event.startDate && date <= event.endDate
    );
  }, [events]);

  const contextValue: EventsContextType = {
    events,
    calendars,
    setEvents,
    setCalendars,
    addEvent,
    updateEvent,
    deleteEvent,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    getEventsInRange,
    getEventsForDate,
    isLoadingEvents, // ✅ Updated property name
    setIsLoadingEvents, // ✅ Updated function name
  };

  return (
    <EventsContext.Provider value={contextValue}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within EventsProvider');
  }
  return context;
}
