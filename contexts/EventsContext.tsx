import React, { createContext, ReactNode, useState, useEffect, useCallback, useContext } from 'react';
import * as SQLite from 'expo-sqlite';
import { Calendar, CalendarEvent, dateTimeHelpers } from '@/types/events';
import { DatabaseConfig } from '@/app/config/database';
import { 
  createCalendar as createCalendarAPI, 
  getCalendars as getCalendarsAPI, 
  updateCalendar as updateCalendarAPI, 
  deleteCalendar as deleteCalendarAPI 
} from '@/utils/api';

const db = SQLite.openDatabaseSync('events.db');

// ✅ UPDATED: Context interface with all required functions
interface EventsContextType {
  events: CalendarEvent[];
  calendars: Calendar[];
  isLoadingEvents: boolean;
  addEvent: (event: CalendarEvent) => Promise<boolean>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  addCalendar: (calendar: Omit<Calendar, 'id'>) => Promise<Calendar | null>;
  updateCalendar: (calendarId: string, updates: Partial<Calendar>) => Promise<boolean>;
  deleteCalendar: (calendarId: string) => Promise<boolean>;
  getEventsInRange: (startDate: string, endDate: string) => Promise<CalendarEvent[]>;
  getEventsForDate: (date: string) => CalendarEvent[];
  getUserTimezone: () => string;
  commonTimezones: { name: string; tz: string }[];
  getRemoteCalendarId: (localCalendarId: string) => number | null;
  getLocalCalendarId: (remoteCalendarId: number) => string | null;
  getCalendarByName: (name: string) => Calendar | null;
  syncCalendarMapping: (localId: string, remoteId: number) => Promise<void>;
  syncEventsWithAPI: (apiEvents: any[], startDate: string, endDate: string) => Promise<void>;
  recreateDatabase: () => Promise<void>;
  syncCalendarsWithAPI: () => Promise<void>;
  initializeCalendarsFromAPI: () => Promise<void>;
  getDatabaseInfo: () => Promise<any>;
  forceReset: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // ✅ SIMPLIFIED: No version tracking needed
  const shouldResetDatabase = useCallback(async (): Promise<{ 
    shouldReset: boolean; 
    reason: string; 
  }> => {
    try {
      // Force reset if configured in code (immediate testing)
      if (DatabaseConfig.FORCE_RESET) {
        return { shouldReset: true, reason: 'Force reset enabled in code' };
      }

      // Environment-based reset (production/staging control)
      if (DatabaseConfig.RESET_ON_START) {
        return { shouldReset: true, reason: 'RESET_ON_START environment flag' };
      }

      // Development-only reset (safe for production)
      if (DatabaseConfig.RESET_IN_DEV) {
        return { shouldReset: true, reason: 'Development reset flag' };
      }

      return { shouldReset: false, reason: 'No reset needed' };
    } catch (error) {
      console.error('Error checking database reset conditions:', error);
      return { shouldReset: false, reason: 'Error checking reset conditions' };
    }
  }, []);

  // ✅ Simplified initialization
  const initializeDatabase = useCallback(async () => {
    try {
      console.log('🔧 Initializing database...');
      setIsLoadingEvents(true);
      
      const resetCheck = await shouldResetDatabase();
      
      if (resetCheck.shouldReset) {
        console.log(`🔄 Resetting database: ${resetCheck.reason}`);
        await recreateDatabase();
        console.log('✅ Database reset complete');
      } else {
        console.log(`✅ Using existing database: ${resetCheck.reason}`);
        await safeInitializeDatabase();
        await loadCalendarsFromDB();
        await loadEventsFromDB();
      }
      
      console.log('✅ Database initialization complete');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      setIsLoadingEvents(false);
    }
  }, [shouldResetDatabase]);

  // ✅ ENHANCED: Recreation with better logging
  const recreateDatabase = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Starting database recreation...');
      setIsLoadingEvents(true);
      
      // Drop existing tables
      await db.execAsync('DROP TABLE IF EXISTS events;');
      await db.execAsync('DROP TABLE IF EXISTS calendars;');
      console.log('🗑️ Dropped existing tables');
      
      // Recreate tables with new schema
      await safeInitializeDatabase();
      console.log('🏗️ Recreated database schema');
      
      // Reload data
      await loadCalendarsFromDB();
      await loadEventsFromDB();
      
      console.log('✅ Database recreation completed');
    } catch (error) {
      console.error('❌ Failed to recreate database:', error);
      setIsLoadingEvents(false);
      throw error;
    }
  }, []);

  // ✅ UPDATED: Database initialization for ISO format
  const safeInitializeDatabase = useCallback(async () => {
    try {
      console.log('🔧 Initializing database schema...');
      
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS calendars (
          id TEXT PRIMARY KEY,
          remoteId INTEGER,
          name TEXT NOT NULL,
          hexcode TEXT NOT NULL,
          is_private BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // ✅ UPDATED: Events table stores only ISO strings
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          startDate TEXT NOT NULL,  -- ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
          endDate TEXT NOT NULL,    -- ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
          description TEXT,
          timezone TEXT NOT NULL,   -- IANA timezone format
          location TEXT,
          invitees TEXT,           -- JSON string array
          calendarId TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (calendarId) REFERENCES calendars (id)
        );
      `);

      // Create indexes
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(startDate, endDate);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_calendar ON events(calendarId);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(startDate);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_calendars_name ON calendars(name);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_calendars_remote ON calendars(remoteId);`);

      console.log('✅ Database schema initialized');

      // ✅ REMOVED: Default calendar creation - now handled in initializeCalendarsFromAPI after login
      // The calendar initialization should happen after successful login when API calendars are fetched
      
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
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
        is_private: Boolean(row.is_private), // ✅ Convert back to boolean
      }));
      setCalendars(dbCalendars);
      console.log('✅ Calendars loaded:', dbCalendars.length);
    } catch (error) {
      console.error('❌ Failed to load calendars:', error);
    }
  }, []);

  // ✅ UPDATED: Load events with ISO format validation
  const loadEventsFromDB = useCallback(async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT e.*, c.name as calendar, c.hexcode
        FROM events e
        JOIN calendars c ON e.calendarId = c.id
        ORDER BY e.startDate ASC
      `) as any[];
      
      const dbEvents = result.map((row: any) => {
        // ✅ Validate ISO format during load
        const startDate = dateTimeHelpers.isValidISOString(row.startDate) 
          ? row.startDate 
          : dateTimeHelpers.getCurrentISOString();
        const endDate = dateTimeHelpers.isValidISOString(row.endDate) 
          ? row.endDate 
          : dateTimeHelpers.suggestEndISOTime(startDate);

        return {
          id: row.id,
          title: row.title,
          startDate,
          endDate,
          description: row.description,
          timezone: row.timezone || dateTimeHelpers.getUserTimezone(),
          location: row.location,
          invitees: row.invitees ? JSON.parse(row.invitees) : [],
          calendarId: row.calendarId,
          calendar: row.calendar,
          hexcode: row.hexcode,
        };
      });
      
      setEvents(dbEvents);
      console.log('✅ Events loaded:', dbEvents.length);
    } catch (error) {
      console.error('❌ Failed to load events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // ✅ FIXED: Handle API response format correctly
  const syncCalendarsWithAPI = useCallback(async () => {
    try {
      console.log('🔄 Starting calendar sync...');
      
      const apiResponse = await getCalendarsAPI();
      if (!apiResponse.success) {
        console.error('Failed to fetch calendars from API:', apiResponse.error);
        return;
      }

      // ✅ FIXED: Handle the nested array structure from API
      let apiCalendars = apiResponse.data;
      
      // If data is nested in a "data" property and it's an array, use that
      if (apiCalendars.data && Array.isArray(apiCalendars.data)) {
        apiCalendars = apiCalendars.data;
      }
      // If the main data is already an array, use it directly
      else if (Array.isArray(apiCalendars)) {
        // Keep as is
      }
      // If it's a single object, wrap it in an array
      else if (typeof apiCalendars === 'object') {
        apiCalendars = [apiCalendars];
      }
      // If no data, set empty array
      else {
        apiCalendars = [];
      }

      console.log('📥 API calendars received:', apiCalendars.length);

      // Build a set of remote IDs from the API response
      const remoteIds = new Set(apiCalendars.map((cal: any) => cal.id));

      await db.withTransactionAsync(async () => {
        // Remove any local calendars not present in the API response
        await db.runAsync(
          `DELETE FROM calendars WHERE remoteId IS NOT NULL AND remoteId NOT IN (${[...remoteIds].map(() => '?').join(',')})`,
          Array.from(remoteIds) as string[]
        );

        // Add or update calendars from the API response
        for (const apiCalendar of apiCalendars) {
          try {
            if (!apiCalendar.name || !apiCalendar.id) {
              console.warn('Skipping calendar with missing required fields:', apiCalendar);
              continue;
            }

            const existing = await db.getAllAsync(
              'SELECT * FROM calendars WHERE remoteId = ?',
              [apiCalendar.id]
            ) as any[];

            if (existing.length > 0) {
              await db.runAsync(
                'UPDATE calendars SET name = ?, hexcode = ?, is_private = ? WHERE remoteId = ?',
                [
                  apiCalendar.name,
                  apiCalendar.hexcode || '#007AFF',
                  apiCalendar.is_private ? 1 : 0,
                  apiCalendar.id
                ]
              );
              console.log(`✅ Updated calendar: ${apiCalendar.name}`);
            } else {
              const localId = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              await db.runAsync(
                'INSERT INTO calendars (id, remoteId, name, hexcode, is_private) VALUES (?, ?, ?, ?, ?)',
                [
                  localId,
                  apiCalendar.id,
                  apiCalendar.name,
                  apiCalendar.hexcode || '#007AFF',
                  apiCalendar.is_private ? 1 : 0
                ]
              );
              console.log(`✅ Added calendar: ${apiCalendar.name}`);
            }
          } catch (calendarError) {
            console.error('Failed to sync calendar:', apiCalendar.name, calendarError);
          }
        }
      });

      await loadCalendarsFromDB();
      console.log('✅ Calendar sync completed');
    } catch (error) {
      console.error('❌ Calendar sync failed:', error);
      throw error;
    }
  }, [loadCalendarsFromDB]);

  // ✅ NEW: Initialize calendars on login
  const initializeCalendarsFromAPI = useCallback(async () => {
    try {
      console.log('🔧 Initializing calendars from API...');
      
      await syncCalendarsWithAPI();
      
      const currentCalendars = await db.getAllAsync('SELECT COUNT(*) as count FROM calendars') as { count: number }[];
      
      if (currentCalendars[0].count === 0) {
        console.log('📝 No calendars found, creating default calendar...');
        
        const defaultCalendarData = {
          name: 'Default',
          hexcode: '#007AFF',
          is_private: false
        };

        const createResponse = await createCalendarAPI(defaultCalendarData);
        
        if (createResponse.success) {
          // ✅ FIXED: Correctly access the API response data
          const apiResponseData = createResponse.data.data; // Array of calendars
          const createdCalendar = Array.isArray(apiResponseData) ? apiResponseData[0] : apiResponseData;
          
          console.log('✅ Default calendar created:', createdCalendar);
          
          // ✅ FIXED: Ensure all required fields are present and not null
          const localId = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await db.runAsync(
            'INSERT INTO calendars (id, remoteId, name, hexcode, is_private) VALUES (?, ?, ?, ?, ?)',
            [
              localId, 
              createdCalendar.id, 
              createdCalendar.name || 'Default',  // ✅ Fallback name
              createdCalendar.hexcode || '#007AFF', // ✅ Fallback color
              createdCalendar.is_private ? 1 : 0    // ✅ Convert boolean to integer
            ]
          );
          
          await loadCalendarsFromDB();
          console.log('✅ Default calendar stored locally');
        } else {
          console.log('⚠️ API calendar creation failed, creating local fallback');
          await db.runAsync(
            'INSERT INTO calendars (id, remoteId, name, hexcode, is_private) VALUES (?, ?, ?, ?, ?)',
            ['default-local', null, 'Default', '#007AFF', 0]
          );
          await loadCalendarsFromDB();
        }
      }
      
      console.log('✅ Calendar initialization completed');
    } catch (error) {
      console.error('❌ Calendar initialization failed:', error);
      
      // ✅ ENHANCED: Better fallback with detailed logging
      try {
        const fallbackCheck = await db.getAllAsync('SELECT COUNT(*) as count FROM calendars') as { count: number }[];
        if (fallbackCheck[0].count === 0) {
          console.log('🆘 Creating emergency fallback calendar');
          await db.runAsync(
            'INSERT INTO calendars (id, remoteId, name, hexcode, is_private) VALUES (?, ?, ?, ?, ?)',
            ['fallback-local', null, 'Default', '#007AFF', 0]
          );
          await loadCalendarsFromDB();
          console.log('✅ Emergency fallback calendar created');
        }
      } catch (fallbackError) {
        console.error('❌ Failed to create fallback calendar:', fallbackError);
      }
    }
  }, [syncCalendarsWithAPI, loadCalendarsFromDB]);

  // ✅ FIXED: Enhanced validation for addEvent
  const addEvent = useCallback(async (event: CalendarEvent): Promise<boolean> => {
    const calendar = calendars.find(cal => cal.id === event.calendarId);
    
    if (!calendar) {
      console.error('Calendar not found:', event.calendarId);
      return false;
    }

    // ✅ FIXED: Validate individual ISO strings properly
    if (!event.startDate || !event.endDate) {
      console.error('Missing start or end date:', { start: event.startDate, end: event.endDate });
      return false;
    }
    
    // ✅ FIXED: Validate each date string individually, not as an object
    if (!dateTimeHelpers.isValidISOString(event.startDate)) {
      console.error('Invalid start date ISO format:', event.startDate);
      return false;
    }
    
    if (!dateTimeHelpers.isValidISOString(event.endDate)) {
      console.error('Invalid end date ISO format:', event.endDate);
      return false;
    }

    console.log('✅ Adding event to database:', {
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      calendarId: event.calendarId
    });

    try {
      await db.runAsync(
        `INSERT INTO events (id, title, startDate, endDate, description, timezone, location, invitees, calendarId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.title,
          event.startDate,  // ISO 8601 format
          event.endDate,    // ISO 8601 format
          event.description || null,
          event.timezone || dateTimeHelpers.getUserTimezone(),
          event.location || null,
          event.invitees ? JSON.stringify(event.invitees) : null,
          event.calendarId,
        ]
      );
      
      console.log('✅ Event successfully inserted into database');
      await loadEventsFromDB();
      console.log('✅ Events reloaded from database');
      return true;
    } catch (error) {
      console.error('❌ Failed to add event to database:', error);
      return false;
    }
  }, [calendars, loadEventsFromDB]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>): Promise<boolean> => {
    try {
      const setParts = [];
      const values = [];

      if (updates.title !== undefined) {
        setParts.push('title = ?');
        values.push(updates.title);
      }
      if (updates.startDate !== undefined) {
        if (!dateTimeHelpers.isValidISOString(updates.startDate)) {
          console.error('Invalid start date ISO format:', updates.startDate);
          return false;
        }
        setParts.push('startDate = ?');
        values.push(updates.startDate);
      }
      if (updates.endDate !== undefined) {
        if (!dateTimeHelpers.isValidISOString(updates.endDate)) {
          console.error('Invalid end date ISO format:', updates.endDate);
          return false;
        }
        setParts.push('endDate = ?');
        values.push(updates.endDate);
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
      if (updates.timezone !== undefined) {
        setParts.push('timezone = ?');
        values.push(updates.timezone);
      }
      if (updates.invitees !== undefined) {
        setParts.push('invitees = ?');
        values.push(JSON.stringify(updates.invitees));
      }

      if (setParts.length === 0) {
        // Nothing to update
        return false;
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

  // Calendar CRUD (unchanged)
  const addCalendar = useCallback(async (calendar: Omit<Calendar, 'id'>): Promise<Calendar | null> => {
    try {
      console.log('📝 Creating calendar locally:', calendar.name);
      const localId = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db.runAsync(
        'INSERT INTO calendars (id, remoteId, name, hexcode) VALUES (?, ?, ?, ?)',
        [localId, null, calendar.name, calendar.hexcode]
      );
      await loadCalendarsFromDB();
      const newCalendar: Calendar = {
        id: localId,
        remoteId: undefined,
        name: calendar.name,
        hexcode: calendar.hexcode
      };
      console.log('✅ Calendar created locally:', newCalendar.name);
      return newCalendar;
    } catch (error) {
      console.error('Failed to add calendar locally:', error);
      return null;
    }
  }, []);

  const updateCalendar = useCallback(async (calendarId: string, updates: Partial<Calendar>): Promise<boolean> => {
    try {
      console.log('📝 Updating calendar locally:', calendarId);
      
      const currentCalendar = calendars.find(cal => cal.id === calendarId);
      if (!currentCalendar?.remoteId) {
        console.error('Cannot update calendar: no remote ID found');
        return false;
      }
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
      
      values.push(calendarId);
      
      await db.runAsync(
        `UPDATE calendars SET ${setParts.join(', ')} WHERE id = ?`,
        values
      );
      
      await loadCalendarsFromDB();
      console.log('✅ Calendar updated locally');
      return true;
      
    } catch (error) {
      console.error('Failed to update calendar:', error);
      return false;
    }
  }, [calendars]);

  const deleteCalendar = useCallback(async (calendarId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting calendar:', calendarId);
      
      const eventsCount = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM events WHERE calendarId = ?',
        [calendarId]
      ) as { count: number }[];
      
      if (eventsCount[0].count > 0) {
        console.error('Cannot delete calendar with existing events');
        return false;
      }

      const currentCalendar = calendars.find(cal => cal.id === calendarId);
      if (!currentCalendar?.remoteId) {
        console.error('Cannot delete calendar: no remote ID found');
        return false;
      }

      try{
        await db.runAsync('DELETE FROM calendars WHERE id = ?', [calendarId]);
        await loadCalendarsFromDB();
        console.log('✅ Calendar deleted successfully');
        return true;
      } catch (dbError) {
        console.error('Failed to delete calendar locally:', dbError);
        return false;
      }
    } catch (error) {
      console.error('Failed to delete calendar locally:', error);
      return false;
    }
  }, [calendars]);

  // ✅ UPDATED: Utility functions for ISO format
  const getEventsInRange = useCallback(async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    try {
      // Convert YYYY-MM-DD to ISO range for comparison
      const startISO = `${startDate}T00:00:00Z`;
      const endISO = `${endDate}T23:59:59Z`;
      
      const result = await db.getAllAsync(`
        SELECT e.*, c.name as calendar, c.hexcode
        FROM events e
        JOIN calendars c ON e.calendarId = c.id
        WHERE e.startDate >= ? AND e.endDate <= ?
        ORDER BY e.startDate ASC
      `, [startISO, endISO]) as any[];
      
      return result.map((row: any) => ({
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
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
    // Convert YYYY-MM-DD to date range
    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkDate = new Date(startOfDay);
      
      // Event overlaps with the target date
      return eventStart <= new Date(endOfDay) && eventEnd >= checkDate;
    });
  }, [events]);

  // ✅ UPDATED: Sync events with API for ISO format
  const syncEventsWithAPI = useCallback(async (apiEvents: any[], startDate: string, endDate: string) => {
    try {
      console.log('🔄 Starting events sync for date range:', startDate, 'to', endDate);
      console.log('📥 API events received:', apiEvents.length);
      
      await db.withTransactionAsync(async () => {
        // Convert date range to ISO for deletion
        const startISO = `${startDate}T00:00:00Z`;
        const endISO = `${endDate}T23:59:59Z`;
        
        // Step 1: Delete all local events in the date range
        await db.runAsync(`
          DELETE FROM events 
          WHERE (startDate >= ? AND startDate <= ?) 
             OR (endDate >= ? AND endDate <= ?)
             OR (startDate <= ? AND endDate >= ?)
        `, [startISO, endISO, startISO, endISO, startISO, endISO]);
        
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
          try {
            // ✅ NEW: Handle different API response formats
            let eventStartDate: string;
            let eventEndDate: string;
            
            // Check if API already returns ISO format
            if (dateTimeHelpers.isValidISOString(apiEvent.startDate)) {
              eventStartDate = apiEvent.startDate;
              eventEndDate = apiEvent.endDate;
            } else {
              // ✅ Convert old format to ISO if needed
              eventStartDate = apiEvent.startTime 
                ? dateTimeHelpers.createISOString(apiEvent.startDate, apiEvent.startTime, apiEvent.timeZone)
                : `${apiEvent.startDate}T00:00:00Z`;
              
              eventEndDate = apiEvent.endTime 
                ? dateTimeHelpers.createISOString(apiEvent.endDate, apiEvent.endTime, apiEvent.timeZone)
                : `${apiEvent.endDate}T23:59:00Z`;
            }

            // Validate the converted/received ISO dates
            if (!dateTimeHelpers.isValidISOString(eventStartDate) || 
                !dateTimeHelpers.isValidISOString(eventEndDate)) {
              console.warn('Skipping event with invalid date format:', apiEvent.id);
              continue;
            }

            let localCalendarId = calendarMappings.get(apiEvent.calendar_id);
            
            if (!localCalendarId) {
              const existingCalendar = calendarsResult.find(cal => 
                cal.name.toLowerCase() === (apiEvent.calendar || 'Default').toLowerCase()
              );
              
              if (existingCalendar) {
                localCalendarId = existingCalendar.id;
                await db.runAsync(
                  'UPDATE calendars SET remoteId = ? WHERE id = ?',
                  [apiEvent.calendar_id, existingCalendar.id]
                );
                calendarMappings.set(apiEvent.calendar_id, localCalendarId);
              } else {
                localCalendarId = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                await db.runAsync(
                  'INSERT INTO calendars (id, remoteId, name, hexcode) VALUES (?, ?, ?, ?)',
                  [localCalendarId, apiEvent.calendar_id, apiEvent.calendar || 'Default', apiEvent.hexcode || '#007AFF']
                );
                calendarMappings.set(apiEvent.calendar_id, localCalendarId);
              }
            }
            
            // ✅ Insert event with proper ISO format
            await db.runAsync(`
              INSERT INTO events (
                id, title, startDate, endDate, description, timezone, location, invitees, calendarId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              apiEvent.id.toString(),
              apiEvent.name || apiEvent.title || 'Untitled Event',
              eventStartDate,  // ISO format
              eventEndDate,    // ISO format
              apiEvent.description || '',
              apiEvent.timeZone || dateTimeHelpers.getUserTimezone(),
              apiEvent.location || '',
              JSON.stringify(apiEvent.invitees || []),
              localCalendarId,
            ]);
            
            successCount++;
          } catch (eventError) {
            console.error('Failed to sync individual event:', apiEvent.id, eventError);
          }
        }
        
        console.log('✅ Sync completed:', successCount, 'events synced');
      });
      
      await loadEventsFromDB();
      await loadCalendarsFromDB();
      
    } catch (error) {
      console.error('❌ Sync operation failed:', error);
      throw error;
    }
  }, [loadEventsFromDB, loadCalendarsFromDB]);

  // Initialize database
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  // Fix: contexts/EventsContext.tsx - Add missing utility functions
  const getRemoteCalendarId = useCallback((localCalendarId: string): number | null => {
    const calendar = calendars.find(cal => cal.id === localCalendarId);
    return calendar?.remoteId || null;
  }, [calendars]);

  const getLocalCalendarId = useCallback((remoteCalendarId: number): string | null => {
    const calendar = calendars.find(cal => cal.remoteId === remoteCalendarId);
    return calendar?.id || null;
  }, [calendars]);

  const getCalendarByName = useCallback((name: string): Calendar | null => {
    return calendars.find(cal => cal.name.toLowerCase() === name.toLowerCase()) || null;
  }, [calendars]);

  const syncCalendarMapping = useCallback(async (localId: string, remoteId: number): Promise<void> => {
    try {
      await db.runAsync(
        'UPDATE calendars SET remoteId = ? WHERE id = ?',
        [remoteId, localId]
      );
      await loadCalendarsFromDB();
    } catch (error) {
      console.error('Failed to sync calendar mapping:', error);
    }
  }, [loadCalendarsFromDB]);

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
    commonTimezones: dateTimeHelpers.commonTimezones.map((tz: string) => ({ name: tz, tz })),
    getRemoteCalendarId,
    getLocalCalendarId,
    getCalendarByName,
    syncCalendarMapping,
    syncEventsWithAPI,
    recreateDatabase,
    syncCalendarsWithAPI,
    initializeCalendarsFromAPI,
    getDatabaseInfo: async () => {
      const eventCount = events.length;
      const calendarCount = calendars.length;
      return {
        version: DatabaseConfig.DB_VERSION,
        currentVersion: DatabaseConfig.DB_VERSION,
        eventCount,
        calendarCount,
        config: DatabaseConfig
      };
    },
    forceReset: async () => {
      await recreateDatabase();
    },
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
