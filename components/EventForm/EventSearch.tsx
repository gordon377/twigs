import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/styles';
import { CalendarEvent, dateTimeHelpers } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

interface EventSearchProps {
  visible: boolean;
  onClose: () => void;
}

// ✅ Fuzzy search helper functions
const normalizeString = (str: string): string => {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Simple fuzzy matching - count common characters in order
  let matches = 0;
  let i = 0, j = 0;
  
  while (i < s1.length && j < s2.length) {
    if (s1[i] === s2[j]) {
      matches++;
      i++;
      j++;
    } else {
      i++;
    }
  }
  
  return matches / Math.max(s1.length, s2.length);
};

const containsPartial = (haystack: string, needle: string): boolean => {
  const normalizedHaystack = normalizeString(haystack);
  const normalizedNeedle = normalizeString(needle);
  
  if (normalizedNeedle.length === 0) return false;
  
  // Check for exact substring match
  if (normalizedHaystack.includes(normalizedNeedle)) return true;
  
  // Check for partial word matches
  const haystackWords = normalizedHaystack.split(' ');
  const needleWords = normalizedNeedle.split(' ');
  
  return needleWords.some(needleWord => 
    haystackWords.some(haystackWord => 
      haystackWord.includes(needleWord) || needleWord.includes(haystackWord)
    )
  );
};

interface SearchResult extends CalendarEvent {
  searchScore: number;
  matchedFields: string[];
  highlightedTitle?: string;
}

export default function EventSearch({ visible, onClose }: EventSearchProps) {
  const { events, calendars } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // ✅ Comprehensive search function
  const searchEvents = useMemo(() => {
    return (query: string): SearchResult[] => {
      if (!query.trim()) return [];
      
      const normalizedQuery = normalizeString(query);
      const results: SearchResult[] = [];
      
      events.forEach(event => {
        const calendar = calendars.find(cal => cal.id === event.calendarId);
        const searchableFields = {
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          calendar: event.calendar || calendar?.name || '',
          // ✅ Format dates for searching
          startDate: dateTimeHelpers.formatISOForDisplay(event.startDate, event.timezone),
          endDate: dateTimeHelpers.formatISOForDisplay(event.endDate, event.timezone),
          startTime: dateTimeHelpers.formatISOTimeForDisplay(event.startDate, event.timezone),
          endTime: dateTimeHelpers.formatISOTimeForDisplay(event.endDate, event.timezone),
          timezone: event.timezone?.split('/').pop()?.replace('_', ' ') || '',
          // ✅ Include invitees in search
          invitees: event.invitees?.join(' ') || '',
          // ✅ Add derived information
          dateRange: dateTimeHelpers.formatDateRange ? 
            dateTimeHelpers.formatDateRange(event) : 
            `${dateTimeHelpers.extractDateFromISO(event.startDate)} to ${dateTimeHelpers.extractDateFromISO(event.endDate)}`,
          isAllDay: dateTimeHelpers.isAllDayEvent(event.startDate, event.endDate) ? 'all day' : '',
        };
        
        let maxScore = 0;
        const matchedFields: string[] = [];
        
        // ✅ Search each field with different weightings
        Object.entries(searchableFields).forEach(([fieldName, fieldValue]) => {
          if (!fieldValue) return;
          
          // Weight important fields higher
          const fieldWeight = {
            title: 1.0,
            description: 0.8,
            location: 0.9,
            calendar: 0.7,
            startDate: 0.6,
            endDate: 0.6,
            invitees: 0.5,
            timezone: 0.3,
            dateRange: 0.4,
            isAllDay: 0.3,
            startTime: 0.5,
            endTime: 0.5,
          }[fieldName] || 0.5;
          
          // Check for partial/fuzzy matches
          const partialMatch = containsPartial(fieldValue, normalizedQuery);
          const similarity = calculateSimilarity(fieldValue, normalizedQuery);
          
          let fieldScore = 0;
          
          if (partialMatch) {
            fieldScore = Math.max(0.7, similarity) * fieldWeight;
          } else if (similarity > 0.3) {
            fieldScore = similarity * fieldWeight * 0.6; // Lower score for fuzzy-only matches
          }
          
          if (fieldScore > 0.2) {
            maxScore = Math.max(maxScore, fieldScore);
            if (!matchedFields.includes(fieldName)) {
              matchedFields.push(fieldName);
            }
          }
        });
        
        // ✅ Include results with reasonable confidence
        if (maxScore > 0.2 && matchedFields.length > 0) {
          // ✅ Create highlighted title
          const highlightedTitle = highlightSearchTerm(event.title || 'Untitled Event', normalizedQuery);
          
          results.push({
            ...event,
            searchScore: maxScore,
            matchedFields,
            highlightedTitle,
          });
        }
      });
      
      // ✅ Sort by relevance score
      return results.sort((a, b) => b.searchScore - a.searchScore).slice(0, 50); // Limit results
    };
  }, [events, calendars]);

  // ✅ Simple highlighting function
  const highlightSearchTerm = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;
    
    const normalizedText = text.toLowerCase();
    const normalizedSearch = searchTerm.toLowerCase();
    
    let highlighted = text;
    
    // Find and highlight exact matches
    const regex = new RegExp(`(${normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlighted = text.replace(regex, '**$1**'); // Use ** for highlighting marker
    
    return highlighted;
  };

  // ✅ Debounced search
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = searchEvents(searchQuery);
          setSearchResults(results);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchEvents, visible]);

  const handleEventPress = (event: SearchResult) => {
    setSelectedEventId(event.id);
    onClose();
    // Navigate to event details
    router.push(`/(tabs)/calendar/eventDetails?eventId=${event.id}`);
  };

  const formatMatchedFields = (fields: string[]): string => {
    const fieldLabels: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      location: 'Location',
      calendar: 'Calendar',
      startDate: 'Start Date',
      endDate: 'End Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      timezone: 'Timezone',
      invitees: 'Invitees',
      dateRange: 'Date Range',
      isAllDay: 'All Day',
    };
    
    return fields.map(field => fieldLabels[field] || field).join(', ');
  };

  const renderSearchResult = (result: SearchResult) => {
    const isAllDay = dateTimeHelpers.isAllDayEvent(result.startDate, result.endDate);
    const timeDisplay = isAllDay ? 'All day' : 
      `${dateTimeHelpers.formatISOTimeForDisplay(result.startDate)} - ${dateTimeHelpers.formatISOTimeForDisplay(result.endDate)}`;
    
    return (
      <TouchableOpacity
        key={result.id}
        style={styles.resultItem}
        onPress={() => handleEventPress(result)}
        activeOpacity={0.7}
      >
        <View style={styles.resultHeader}>
          <View style={[styles.calendarDot, { backgroundColor: result.hexcode }]} />
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle} numberOfLines={2}>
              {result.highlightedTitle?.includes('**') ? 
                result.highlightedTitle.replace(/\*\*/g, '') : 
                result.title}
            </Text>
            <Text style={styles.resultCalendar}>{result.calendar}</Text>
          </View>
          <View style={styles.resultScore}>
            <Text style={styles.scoreText}>
              {Math.round(result.searchScore * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.resultDetails}>
          <View style={styles.resultDetailRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.resultDetailText}>
              {dateTimeHelpers.formatDateForDisplay(dateTimeHelpers.extractDateFromISO(result.startDate))}
            </Text>
          </View>
          
          <View style={styles.resultDetailRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.resultDetailText}>{timeDisplay}</Text>
          </View>
          
          {result.location && (
            <View style={styles.resultDetailRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.resultDetailText} numberOfLines={1}>{result.location}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.matchedFieldsContainer}>
          <Text style={styles.matchedFieldsText}>
            Found in: {formatMatchedFields(result.matchedFields)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Events</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, dates, locations, descriptions..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        <ScrollView style={styles.resultsContainer} keyboardShouldPersistTaps="handled">
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Searching events...</Text>
            </View>
          ) : searchQuery.trim() === '' ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Search Your Events</Text>
              <Text style={styles.emptyText}>
                Search through titles, descriptions, locations, dates, and more.
                Try searching for event names, places, or even time periods.
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptyText}>
                No events match your search "{searchQuery}".
                Try different keywords or check your spelling.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </Text>
                <Text style={styles.searchTip}>
                  Results sorted by relevance
                </Text>
              </View>
              
              {searchResults.map(renderSearchResult)}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  searchTip: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  resultItem: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  calendarDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    marginTop: 2,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  resultCalendar: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  resultScore: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  resultDetails: {
    gap: 8,
    marginBottom: 12,
  },
  resultDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultDetailText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  matchedFieldsContainer: {
    backgroundColor: colors.lightGrey,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchedFieldsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});