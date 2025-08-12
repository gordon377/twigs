import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Dimensions, 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  Easing, 
  PanResponder, 
  Modal, 
  TouchableOpacity
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { colors } from '@/styles/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarHeader } from '@/components/Drawer';
import { EventsList, SingleDateCalendar } from '@/components/Calendar';
import { AllEventsScreen } from '@/components/EventForm/AllEventsScreen';
import { DotIndicator } from '@/components/DotIndicator';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import EventSearch from '@/components/EventForm/EventSearch';

// ✅ Constants
const VELOCITY_THRESHOLD = 1.5;
const ANIMATION_DURATION = 250;
const GESTURE_THRESHOLD = 8;

// ✅ Helper functions
const getDimensions = () => Dimensions.get('window');

// ✅ FIXED: Create today value as a regular function (not hook)
const createTodayValue = (): string => {
  try {
    // Method 1: Try flash-calendar's toDateId
    const todayFromFlash = toDateId(new Date());
    console.log('📅 Today from flash-calendar:', todayFromFlash);
    
    // Validate the format with more robust regex
    if (todayFromFlash && /^\d{4}-\d{2}-\d{2}$/.test(todayFromFlash)) {
      const parts = todayFromFlash.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      
      // Validate ranges
      if (year >= 1900 && year <= 2100 && 
          month >= 1 && month <= 12 && 
          day >= 1 && day <= 31) {
        console.log('✅ Valid today from flash-calendar:', todayFromFlash);
        return todayFromFlash;
      }
    }
    
    console.warn('⚠️ Invalid today from flash-calendar, creating fallback');
    
    // Method 2: Create manually with validation
    const now = new Date();
    
    // Validate the current date
    if (isNaN(now.getTime())) {
      throw new Error('System date is invalid');
    }
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fallbackToday = `${year}-${month}-${day}`;
    
    console.log('✅ Fallback today created:', fallbackToday);
    return fallbackToday;
    
  } catch (error) {
    console.error('❌ Error creating today date:', error);
    
    // Emergency fallback - use a fixed known good date
    const emergencyDate = '2025-08-11';
    console.log('🆘 Using emergency fallback date:', emergencyDate);
    return emergencyDate;
  }
};

export default function CalendarScreen() {
  // ✅ FIXED: Create today value inside the component
  const today = useMemo(() => createTodayValue(), []);

  // ✅ State management
  const [selectedDate, setSelectedDate] = useState(today);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [screenDimensions, setScreenDimensions] = useState(getDimensions());
  const [isNavigatingToToday, setIsNavigatingToToday] = useState(false);
  
  // ✅ Refs
  const pagerRef = useRef<PagerView>(null);
  const eventsListHeight = useRef(new Animated.Value(0)).current;
  const currentHeightRef = useRef(0);
  const isGesturingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const calendarRef = useRef<any>(null);

  // ✅ Hooks
  const { hasEventsOnDate, isLoadingEvents, initializeCalendarsFromAPI } = useEvents();

  // ✅ Initialize calendars
  useEffect(() => {
    const initializeCalendars = async () => {
      try {
        if (initializeCalendarsFromAPI) {
          await initializeCalendarsFromAPI();
        }
      } catch (error) {
        console.error('Failed to initialize calendars:', error);
      }
    };
    initializeCalendars();
  }, [initializeCalendarsFromAPI]);

  // ✅ Memoized calculations
  const responsiveHeights = useMemo(() => {
    const { height } = screenDimensions;
    return {
      minHeight: height * 0.08,
      maxHeight: height * 0.75,
      defaultHeight: height * 0.25,
    };
  }, [screenDimensions]);

  const { minHeight, maxHeight, defaultHeight } = responsiveHeights;

  const hasEvents = useMemo(() => {
    return hasEventsOnDate(selectedDate);
  }, [selectedDate, hasEventsOnDate]);

  // ✅ Initialize height once
  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialHeight = hasEvents ? defaultHeight : minHeight;
      currentHeightRef.current = initialHeight;
      eventsListHeight.setValue(initialHeight);
      isInitializedRef.current = true;
    }
  }, [hasEvents, defaultHeight, minHeight, eventsListHeight]);

  // ✅ Smart height animation
  useEffect(() => {
    if (!isInitializedRef.current || currentPage !== 0 || isGesturingRef.current) return;
    
    const targetHeight = hasEvents ? defaultHeight : minHeight;
    
    if (Math.abs(currentHeightRef.current - targetHeight) > 5) {
      currentHeightRef.current = targetHeight;
      
      // ✅ Use spring animation for more natural feel
      Animated.spring(eventsListHeight, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 80,   // Slightly less stiff than navigate
        friction: 10,  // More damping for gentler auto-adjustments
        velocity: 0,
      }).start();
    }
  }, [hasEvents, defaultHeight, minHeight, currentPage]);

  // ✅ Optimized callbacks
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handlePageChange = useCallback((event: any) => {
    setCurrentPage(event.nativeEvent.position);
  }, []);

  const navigateToToday = useCallback(async () => {
    if (isNavigatingToToday) return;
    
    console.log('🏠 Starting seamless navigation to today:', today);
    
    setIsNavigatingToToday(true);
    setShowOptionsDropdown(false);
    
    try {
      // ✅ Step 1: Ensure we're on the calendar page
      if (currentPage !== 0) {
        setCurrentPage(0);
        pagerRef.current?.setPage(0);
        // Wait for page transition to complete
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // ✅ Step 2: Start calendar transition (will be invisible during re-render)
      let calendarTransitionCompleted = false;
      const calendarPromise = new Promise<void>(async (resolve) => {
        try {
          if (calendarRef.current?.scrollToToday) {
            console.log('📅 Starting seamless calendar transition...');
            await calendarRef.current.scrollToToday();
            calendarTransitionCompleted = true;
            console.log('✅ Seamless calendar transition completed');
          } else {
            console.log('⚠️ scrollToToday method not available');
            setSelectedDate(today);
            calendarTransitionCompleted = true;
          }
          resolve();
        } catch (error) {
          console.error('❌ Error during calendar transition:', error);
          setSelectedDate(today);
          calendarTransitionCompleted = true;
          resolve();
        }
      });

      // ✅ Step 3: Coordinate height animation with calendar transition
      const heightPromise = new Promise<void>((resolve) => {
        // Wait a bit for calendar transition to start
        setTimeout(() => {
          try {
            const hasEventsToday = hasEventsOnDate(today);
            const targetHeight = hasEventsToday ? defaultHeight : minHeight;
            
            console.log('📏 Coordinating height animation:', targetHeight, 'hasEvents:', hasEventsToday);
            
            eventsListHeight.stopAnimation();
            currentHeightRef.current = targetHeight;
            
            // ✅ Use spring animation that complements the calendar transition
            Animated.spring(eventsListHeight, {
              toValue: targetHeight,
              useNativeDriver: false,
              tension: 90,
              friction: 9,
              velocity: 0,
            }).start(() => {
              console.log('✅ Height animation completed');
              resolve();
            });
            
          } catch (error) {
            console.error('❌ Error during height animation:', error);
            resolve();
          }
        }, 100); // Start slightly after calendar transition begins
      });

      // ✅ Wait for both animations to complete
      await Promise.all([calendarPromise, heightPromise]);
      
      console.log('✅ All seamless animations completed');

    } catch (error) {
      console.error('❌ Error during seamless navigation:', error);
    } finally {
      // ✅ Clear loading state after everything is complete
      setTimeout(() => {
        setIsNavigatingToToday(false);
      }, 100); // Brief delay to ensure everything settles
    }
  }, [hasEventsOnDate, defaultHeight, minHeight, eventsListHeight, today, isNavigatingToToday, currentPage]);

  const navigateToCalendars = useCallback(() => {
    setShowOptionsDropdown(false);
    router.push('/(tabs)/calendar/manageCalendars');
  }, []);

  const navigateToAllEvents = useCallback(() => {
    setShowOptionsDropdown(false);
    setCurrentPage(1);
    pagerRef.current?.setPage(1);
  }, []);

  const navigateToCreateEvent = useCallback(() => {
    router.push(`/(tabs)/calendar/createEvent?selectedDate=${selectedDate}`);
  }, [selectedDate]);

  // ✅ NEW: Search function
  const handleSearch = useCallback(() => {
    setShowSearchModal(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setShowSearchModal(false);
  }, []);

  // ✅ Optimized PanResponder
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      if (currentPage !== 0) return false;
      return evt.nativeEvent.locationY < 50;
    },
    
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      if (currentPage !== 0) return false;
      const { dx, dy } = gestureState;
      return Math.abs(dy) > GESTURE_THRESHOLD && Math.abs(dy) > Math.abs(dx);
    },
    
    onPanResponderGrant: () => {
      isGesturingRef.current = true;
      eventsListHeight.stopAnimation();
      eventsListHeight.setOffset(currentHeightRef.current);
      eventsListHeight.setValue(0);
    },
    
    onPanResponderMove: (_, gestureState) => {
      if (currentPage !== 0) return;
      const newHeight = currentHeightRef.current - gestureState.dy;
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      eventsListHeight.setValue(clampedHeight - currentHeightRef.current);
    },
    
    onPanResponderRelease: (_, gestureState) => {
      if (currentPage !== 0) return;
      
      eventsListHeight.flattenOffset();
      const velocityY = gestureState.vy;
      const newHeight = currentHeightRef.current - gestureState.dy;
      
      let finalHeight: number;
      if (Math.abs(velocityY) > VELOCITY_THRESHOLD) {
        finalHeight = velocityY > 0 ? minHeight : maxHeight;
      } else {
        const midPoint = (minHeight + maxHeight) / 2;
        finalHeight = newHeight < midPoint ? minHeight : maxHeight;
      }
      
      finalHeight = Math.max(minHeight, Math.min(maxHeight, finalHeight));
      currentHeightRef.current = finalHeight;
      
      Animated.timing(eventsListHeight, {
        toValue: finalHeight,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
        easing: Easing.out(Easing.quad),
      }).start(() => {
        isGesturingRef.current = false;
      });
    },
    
    onPanResponderTerminate: () => {
      isGesturingRef.current = false;
    },
  }), [currentPage, minHeight, maxHeight, eventsListHeight]);

  // ✅ UPDATED: Memoized configurations with search
  const rightActions = useMemo(() => [
    {
      icon: <Ionicons name="options-outline" size={24} color="#070c1f" />,
      onPress: () => setShowOptionsDropdown(true),
    },
    {
      icon: <Ionicons name="search" size={24} color="#070c1f" />,
      onPress: handleSearch,
    },
    {
      icon: <Ionicons name="add-sharp" size={24} color="#070c1f" />,
      onPress: navigateToCreateEvent,
    },
  ], [navigateToCreateEvent, handleSearch]);

  const optionsMenuItems = useMemo(() => [
    {
      id: '1',
      title: isNavigatingToToday ? 'Navigating...' : 'Back to Today',
      icon: isNavigatingToToday ? 'hourglass-outline' as const : 'today-outline' as const,
      onPress: navigateToToday,
      disabled: isNavigatingToToday,
    },
    {
      id: '2',
      title: 'Calendars',
      icon: 'ellipse-outline' as const,
      onPress: navigateToCalendars,
    },
    {
      id: '3',
      title: 'All Events',
      icon: 'list-outline' as const,
      onPress: navigateToAllEvents,
    },
    {
      id: '4',
      title: 'Search Events',
      icon: 'search-outline' as const,
      onPress: () => {
        setShowOptionsDropdown(false);
        handleSearch();
      },
    }
  ], [navigateToToday, navigateToCalendars, navigateToAllEvents, handleSearch, isNavigatingToToday]);

  // ✅ Handle dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // ✅ SIMPLIFIED: CalendarPage without problematic animations
  const CalendarPage = useMemo(() => (
    <View style={styles.pageContainer}>
      <View style={styles.calendarContainer}>
        <SingleDateCalendar 
          ref={calendarRef}
          today={today}
          selectedDate={selectedDate}
          setSelectedDate={handleDateChange}
        />
      </View>
      
      <View style={styles.eventsGestureContainer}>
        <Animated.View 
          style={[
            styles.eventsListContainer,
            { 
              height: eventsListHeight,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>
          
          <View style={styles.eventsContent}>
            <EventsList date={selectedDate} />
          </View>
        </Animated.View>
      </View>
    </View>
  ), [selectedDate, handleDateChange, eventsListHeight, panResponder.panHandlers, today]);

  const AllEventsPage = useMemo(() => (
    <AllEventsScreen />
  ), []);

  // ✅ Early return for loading
  if (isLoadingEvents) {
    return (
      <SafeAreaView style={styles.screen}>
        <CalendarHeader title="" rightActions={rightActions} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <CalendarHeader title="" rightActions={rightActions} />
      
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageChange}
        scrollEnabled={true}
        overdrag={false}
        pageMargin={-250}
        orientation="horizontal"
        offscreenPageLimit={1}
      >
        <View key="0" style={styles.pageContainer}>
          {CalendarPage}
        </View>
        <View key="1" style={styles.pageContainer}>
          {AllEventsPage}
        </View>
      </PagerView>

      <View style={styles.dotIndicatorContainer}>
        <DotIndicator currentPage={currentPage} totalPages={2} />
      </View>

      {/* ✅ Options Modal */}
      <Modal
        visible={showOptionsDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            {optionsMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.dropdownItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={20} color={colors.text} />
                <Text style={styles.dropdownText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ✅ ADD: Search Modal */}
      <EventSearch
        visible={showSearchModal}
        onClose={handleCloseSearch}
      />
    </SafeAreaView>
  );
}

// ✅ Optimized styles
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
  },
  eventsGestureContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  eventsListContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.grey,
    borderRadius: 2,
  },
  eventsContent: {
    flex: 1,
    minHeight: 100,
  },
  dotIndicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  dropdownContainer: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});