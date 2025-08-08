import React, { createContext, ReactNode, useState, useEffect, useCallback, useContext } from 'react';
import * as SQLite from 'expo-sqlite';
import { Calendar, CalendarEvent, dateTimeHelpers } from '@/types/events';

// Open database
const db = SQLite.openDatabaseSync('events.db');

// ✅ UPDATED: Context interface
interface EventsContextType {
  events: CalendarEvent[];
  calendars: Calendar[];
  isLoadingEvents: boolean;
  addEvent: (event: CalendarEvent) => Promise<boolean>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  addCalendar: (calendar: Omit<Calendar, 'id'>) => Promise<boolean>;
  updateCalendar: (calendarId: string, updates: Partial<Calendar>) => Promise<boolean>;
  deleteCalendar: (calendarId: string) => Promise<boolean>;
  getEventsInRange: (startDate: string, endDate: string) => Promise<CalendarEvent[]>;
  getEventsForDate: (date: string) => CalendarEvent[];
  getUserTimezone: () => string;
  commonTimezones: { name: string; tz: string }[];
  // ✅ Helper functions
  getRemoteCalendarId: (localCalendarId: string) => number | null;
  getLocalCalendarId: (remoteCalendarId: number) => string | null;
  getCalendarByName: (name: string) => Calendar | null;
  syncCalendarMapping: (localId: string, remoteId: number) => Promise<void>;
  syncEventsWithAPI: (apiEvents: any[], startDate: string, endDate: string) => Promise<void>; // ✅ Added syncEventsWithAPI
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // ✅ KEEP: This production-ready initialization
  const safeInitializeDatabase = useCallback(async () => {
    try {
      // Create tables if they don't exist
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS calendars (
          id TEXT PRIMARY KEY,
          remoteId INTEGER,
          name TEXT NOT NULL,
          hexcode TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          startTime TEXT,
          endTime TEXT,
          description TEXT,
          timezone TEXT NOT NULL,
          location TEXT,
          invitees TEXT,
          calendarId TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (calendarId) REFERENCES calendars (id)
        );
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

      // Insert default calendar if none exist
      const existingCalendars = await db.getAllAsync('SELECT COUNT(*) as count FROM calendars') as { count: number }[];
      if (existingCalendars[0].count === 0) {
        await db.runAsync(
          'INSERT INTO calendars (id, remoteId, name, hexcode) VALUES (?, ?, ?, ?)',
          ['1', 54, 'Default', '#007AFF']
        );
      }

    } catch (error) {
      console.error('❌ Failed to safely initialize database:', error);
      throw error;
    }
  }, []);

  // ✅ Load calendars from DB
  const loadCalendarsFromDB = useCallback(async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM calendars ORDER BY name ASC') as any[];
      const dbCalendars = result.map((row: any) => ({
        id: row.id,
        remoteId: row.remoteId,
        name: row.name,
        hexcode: row.hexcode,
      }));
      setCalendars(dbCalendars);
      console.log('✅ Calendars loaded:', dbCalendars);
    } catch (error) {
      console.error('❌ Failed to load calendars:', error);
    }
  }, []);

  // ✅ Load events from DB
  const loadEventsFromDB = useCallback(async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT e.*, c.name as calendar, c.hexcode
        FROM events e
        JOIN calendars c ON e.calendarId = c.id
        ORDER BY e.startDate ASC, e.startTime ASC
      `) as any[];
      
      const dbEvents = result.map((row: any) => ({
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        startTime: row.startTime,
        endTime: row.endTime,
        description: row.description,
        timezone: row.timezone,
        location: row.location,
        invitees: row.invitees ? JSON.parse(row.invitees) : [],
        calendarId: row.calendarId,
        calendar: row.calendar,
        hexcode: row.hexcode,
      }));
      
      setEvents(dbEvents);
      console.log('✅ Events loaded:', dbEvents.length);
    } catch (error) {
      console.error('❌ Failed to load events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // ✅ Helper function to get calendars directly from DB
  const getCalendarsFromDB = useCallback(async (): Promise<Calendar[]> => {
    try {
      const result = await db.getAllAsync('SELECT * FROM calendars ORDER BY name ASC') as any[];
      return result.map((row: any) => ({
        id: row.id,
        remoteId: row.remoteId,
        name: row.name,
        hexcode: row.hexcode,
      }));
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
    }
  }, []);

  // ✅ ID Mapping Helper Functions
  const getRemoteCalendarId = useCallback((localCalendarId: string): number | null => {
    const calendar = calendars.find(cal => cal.id === localCalendarId);
    return calendar?.remoteId || null;
  }, [calendars]);

  const getLocalCalendarId = useCallback((remoteCalendarId: number): string | null => {
    const calendar = calendars.find(cal => cal.remoteId === remoteCalendarId);
    return calendar?.id || null;
  }, [calendars]);

  const getCalendarByName = useCallback((name: string): Calendar | null => {
    return calendars.find(cal => cal.name === name) || null;
  }, [calendars]);

  const syncCalendarMapping = useCallback(async (localId: string, remoteId: number) => {
    try {
      await db.runAsync(
        'UPDATE calendars SET remoteId = ? WHERE id = ?',
        [remoteId, localId]
      );
      await loadCalendarsFromDB(); // Refresh calendars
      console.log(`✅ Synced calendar mapping: ${localId} <-> ${remoteId}`);
    } catch (error) {
      console.error('❌ Failed to sync calendar mapping:', error);
    }
  }, [loadCalendarsFromDB]);

  // ✅ Event CRUD Operations
  const addEvent = useCallback(async (event: CalendarEvent): Promise<boolean> => {
    // Get fresh calendars directly from DB instead of relying on state
    let currentCalendars = calendars;
    
    if (currentCalendars.length === 0) {
      console.log('Calendars not loaded yet, loading...');
      currentCalendars = await getCalendarsFromDB();
    }

    const calendar = currentCalendars.find(cal => cal.id === event.calendarId);
    
    if (!calendar) {
      console.error('Calendar not found:', event.calendarId);
      console.log('Available calendars:', currentCalendars.map(c => ({ id: c.id, name: c.name })));
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
      
      // Reload events from DB to get proper calendar data
      await loadEventsFromDB();
      
      console.log('✅ Event added successfully');
      return true;
    } catch (error) {
      console.error('Failed to add event:', error);
      return false;
    }
  }, [calendars, getCalendarsFromDB, loadEventsFromDB]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>): Promise<boolean> => {
    try {
      const setParts = [];
      const values = [];
      
      if (updates.title !== undefined) {
        setParts.push('title = ?');
        values.push(updates.title);
      }
      if (updates.startDate !== undefined) {
        setParts.push('startDate = ?');
        values.push(updates.startDate);
      }
      if (updates.endDate !== undefined) {
        setParts.push('endDate = ?');
        values.push(updates.endDate);
      }
      if (updates.startTime !== undefined) {
        setParts.push('startTime = ?');
        values.push(updates.startTime);
      }
      if (updates.endTime !== undefined) {
        setParts.push('endTime = ?');
        values.push(updates.endTime);
      }
      if (updates.description !== undefined) {
        setParts.push('description = ?');
        values.push(updates.description);
      }
      if (updates.location !== undefined) {
        setParts.push('location = ?');
        values.push(updates.location);
      }
      if (updates.calendarId !== undefined) {
        setParts.push('calendarId = ?');
        values.push(updates.calendarId);
      }
      
      values.push(eventId);
      
      await db.runAsync(
        `UPDATE events SET ${setParts.join(', ')} WHERE id = ?`,
        values
      );
      
      await loadEventsFromDB();
      return true;
    } catch (error) {
      console.error('Failed to update event:', error);
      return false;
    }
  }, [loadEventsFromDB]);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      await db.runAsync('DELETE FROM events WHERE id = ?', [eventId]);
      await loadEventsFromDB();
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }, [loadEventsFromDB]);

  // ✅ Calendar CRUD Operations
  const addCalendar = useCallback(async (calendar: Omit<Calendar, 'id'>): Promise<boolean> => {
    try {
      const id = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db.runAsync(
        'INSERT INTO calendars (id, remoteId, name, hexcode) VALUES (?, ?, ?, ?)',
        [id, calendar.remoteId || null, calendar.name, calendar.hexcode]
      );
      await loadCalendarsFromDB();
      return true;
    } catch (error) {
      console.error('Failed to add calendar:', error);
      return false;
    }
  }, [loadCalendarsFromDB]);

  const updateCalendar = useCallback(async (calendarId: string, updates: Partial<Calendar>): Promise<boolean> => {
    try {
      const setParts = [];
      const values = [];
      
      if (updates.name !== undefined) {
        setParts.push('name = ?');
        values.push(updates.name);
      }
      if (updates.hexcode !== undefined) {
        setParts.push('hexcode = ?');
        values.push(updates.hexcode);
      }
      if (updates.remoteId !== undefined) {
        setParts.push('remoteId = ?');
        values.push(updates.remoteId);
      }
      
      values.push(calendarId);
      
      await db.runAsync(
        `UPDATE calendars SET ${setParts.join(', ')} WHERE id = ?`,
        values
      );
      
      await loadCalendarsFromDB();
      return true;
    } catch (error) {
      console.error('Failed to update calendar:', error);
      return false;
    }
  }, [loadCalendarsFromDB]);

  const deleteCalendar = useCallback(async (calendarId: string): Promise<boolean> => {
    try {
      // Check if there are events using this calendar
      const eventsCount = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM events WHERE calendarId = ?',
        [calendarId]
      ) as { count: number }[];
      
      if (eventsCount[0].count > 0) {
        console.error('Cannot delete calendar with existing events');
        return false;
      }
      
      await db.runAsync('DELETE FROM calendars WHERE id = ?', [calendarId]);
      await loadCalendarsFromDB();
      return true;
    } catch (error) {
      console.error('Failed to delete calendar:', error);
      return false;
    }
  }, [loadCalendarsFromDB]);

  // ✅ Utility Functions
  const getEventsInRange = useCallback(async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    try {
      const result = await db.getAllAsync(`
        SELECT e.*, c.name as calendar, c.hexcode
        FROM events e
        JOIN calendars c ON e.calendarId = c.id
        WHERE e.startDate >= ? AND e.endDate <= ?
        ORDER BY e.startDate ASC, e.startTime ASC
      `, [startDate, endDate]) as any[];
      
      return result.map((row: any) => ({
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        startTime: row.startTime,
        endTime: row.endTime,
        description: row.description,
        timezone: row.timezone,
        location: row.location,
        invitees: row.invitees ? JSON.parse(row.invitees) : [],
        calendarId: row.calendarId,
        calendar: row.calendar,
        hexcode: row.hexcode,
      }));
    } catch (error) {
      console.error('Failed to get events in range:', error);
      return [];
    }
  }, []);

  const getEventsForDate = useCallback((date: string): CalendarEvent[] => {
    return events.filter(event => 
      event.startDate <= date && event.endDate >= date
    );
  }, [events]);

  // Clear and Recreates Database (for development/testing purposes)
  const clearAndRecreateDatabase = useCallback(async () => {
    try {
      console.log('🗑️ Clearing all database data and recreating...');
      
      // Drop existing tables
      await db.execAsync('DROP TABLE IF EXISTS events');
      await db.execAsync('DROP TABLE IF EXISTS calendars');
      
      console.log('✅ Dropped existing tables');
      
      // Recreate tables with proper schema
      await db.execAsync(`
        CREATE TABLE calendars (
          id TEXT PRIMARY KEY,
          remoteId INTEGER,
          name TEXT NOT NULL,
          hexcode TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.execAsync(`
        CREATE TABLE events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          startTime TEXT,
          endTime TEXT,
          description TEXT,
          timezone TEXT NOT NULL,
          location TEXT,
          invitees TEXT,
          calendarId TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (calendarId) REFERENCES calendars (id)
        );
      `);

      // Create indexes
      await db.execAsync(`
        CREATE INDEX idx_events_date ON events(startDate, endDate);
      `);
      await db.execAsync(`
        CREATE INDEX idx_events_calendar ON events(calendarId);
      `);
      await db.execAsync(`
        CREATE INDEX idx_calendars_name ON calendars(name);
      `);

      // Insert default calendar with proper remoteId
      await db.runAsync(
        'INSERT INTO calendars (id, remoteId, name, hexcode) VALUES (?, ?, ?, ?)',
        ['1', 54, 'Default', '#007AFF']
      );

      console.log('✅ Database recreated with proper schema and default calendar');
      console.log('✅ Default calendar: Local ID "1" <-> Remote ID 54');
      
    } catch (error) {
      console.error('❌ Failed to clear and recreate database:', error);
      throw error;
    }
  }, []);

  // ✅ TEMPORARY: For current development cycle
  useEffect(() => {
    const initialize = async () => {
      try {
        // ✅ TEMP: One-time reset to fix remoteId schema
        const needsSchemaFix = false; // Dev Toggle for schema fix/db reset
        
        if (needsSchemaFix && __DEV__) {
          console.log('🔄 One-time development schema fix...');
          await clearAndRecreateDatabase();
        } else {
          await safeInitializeDatabase();
        }
        
        await loadCalendarsFromDB();
        await loadEventsFromDB();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsLoadingEvents(false);
      }
    };
    
    initialize();
  }, [safeInitializeDatabase, clearAndRecreateDatabase, loadCalendarsFromDB, loadEventsFromDB]);

  // ✅ Sync events with API
  const syncEventsWithAPI = useCallback(async (apiEvents: any[], startDate: string, endDate: string) => {
    try {
      console.log('🔄 Starting events sync for date range:', startDate, 'to', endDate);
      
      // ✅ CRITICAL: Wrap everything in a transaction
      await db.withTransactionAsync(async () => {
        // Step 1: Delete all local events in the date range
        await db.runAsync(`
          DELETE FROM events 
          WHERE (startDate >= ? AND startDate <= ?) 
             OR (endDate >= ? AND endDate <= ?)
             OR (startDate <= ? AND endDate >= ?)
        `, [startDate, endDate, startDate, endDate, startDate, endDate]);
        
        // Step 2: Get calendar mappings
        const calendarsResult = await db.getAllAsync('SELECT * FROM calendars') as any[];
        const calendarMappings = new Map();
        
        calendarsResult.forEach((cal: any) => {
          if (cal.remoteId) {
            calendarMappings.set(cal.remoteId, cal.id);
          }
        });
        
        // Step 3: Process and insert API events
        let successCount = 0;
        
        for (const apiEvent of apiEvents) {
          let localCalendarId = calendarMappings.get(apiEvent.calendar_id);
          
          if (!localCalendarId) {
            // Handle missing calendar mapping
            const existingCalendar = calendarsResult.find(cal => 
              cal.name.toLowerCase() === (apiEvent.calendar || 'Default').toLowerCase()
            );
            
            if (existingCalendar) {
              localCalendarId = existingCalendar.id;
              await db.runAsync(
                'UPDATE calendars SET remoteId = ? WHERE id = ?',
                [apiEvent.calendar_id, existingCalendar.id]
              );
              calendarMappings.set(apiEvent.calendar_id, localCalendarId); // Update mapping
            } else {
              // Create new calendar
              localCalendarId = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              await db.runAsync(
                'INSERT INTO calendars (id, remoteId, name, hexcode) VALUES (?, ?, ?, ?)',
                [localCalendarId, apiEvent.calendar_id, apiEvent.calendar || 'Default', apiEvent.hexcode || '#007AFF']
              );
              calendarMappings.set(apiEvent.calendar_id, localCalendarId); // Update mapping
            }
          }
          
          // Insert event
          await db.runAsync(`
            INSERT INTO events (
              id, title, startDate, endDate, startTime, endTime, 
              description, timezone, location, invitees, calendarId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            apiEvent.id.toString(),
            apiEvent.name || apiEvent.title || 'Untitled Event',
            apiEvent.startDate,
            apiEvent.endDate,
            apiEvent.startTime || null,
            apiEvent.endTime || null,
            apiEvent.description || '',
            apiEvent.timeZone || dateTimeHelpers.getUserTimezone(),
            apiEvent.location || '',
            JSON.stringify(apiEvent.invitees || []),
            localCalendarId,
          ]);
          
          successCount++;
        }
        
        console.log('✅ Sync completed:', successCount, 'events synced');
      }); // ✅ End of transaction - all or nothing!
      
      // ✅ Only refresh UI if transaction succeeds
      await loadEventsFromDB();
      await loadCalendarsFromDB();
      
    } catch (error) {
      console.error('❌ Sync operation failed:', error);
      throw error;
    }
  }, [loadEventsFromDB, loadCalendarsFromDB]);

  // ✅ Context value
  const contextValue: EventsContextType = {
    events,
    calendars,
    isLoadingEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    getEventsInRange,
    getEventsForDate,
    getUserTimezone: dateTimeHelpers.getUserTimezone,
    commonTimezones: dateTimeHelpers.commonTimezones.map((tz: string) => ({ name: tz, tz })), // ✅ FIXED: Map to correct format
    getRemoteCalendarId,
    getLocalCalendarId,
    getCalendarByName,
    syncCalendarMapping,
    syncEventsWithAPI, // Add this
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
