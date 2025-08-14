import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
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
import { DotIndicator } from '@/components/DotIndicator';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AllEventsScreen } from '@/components/EventForm/AllEventsScreen';
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

// ✅ OPTIMIZATION 1: Consolidated UI State
interface UIState {
  showOptionsDropdown: boolean;
  showSearchModal: boolean;
  currentPage: number;
  isNavigatingToToday: boolean;
}

export default function CalendarScreen() {
  // ✅ FIXED: Create today value inside the component
  const today = useMemo(() => createTodayValue(), []);

  // ✅ OPTIMIZED: Consolidated state management
  const [selectedDate, setSelectedDate] = useState(today);
  const [screenDimensions, setScreenDimensions] = useState(getDimensions());
  const [uiState, setUIState] = useState<UIState>({
    showOptionsDropdown: false,
    showSearchModal: false,
    currentPage: 0,
    isNavigatingToToday: false,
  });
  
  // ✅ Refs
  const pagerRef = useRef<PagerView>(null);
  const eventsListHeight = useRef(new Animated.Value(0)).current;
  const currentHeightRef = useRef(0);
  const isGesturingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const calendarRef = useRef<any>(null);
  const heightAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Hooks
  const { hasEventsOnDate, isLoadingEvents, initializeCalendarsFromAPI } = useEvents();

  // ✅ OPTIMIZED: Batch state updates
  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // ✅ Destructure UI state for easier access
  const { showOptionsDropdown, showSearchModal, currentPage, isNavigatingToToday } = uiState;

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

  // ✅ Debounced height animation
  const debouncedHeightAnimation = useCallback((targetHeight: number) => {
    if (heightAnimationTimeoutRef.current) {
      clearTimeout(heightAnimationTimeoutRef.current);
    }
    
    heightAnimationTimeoutRef.current = setTimeout(() => {
      if (Math.abs(currentHeightRef.current - targetHeight) > 5) {
        currentHeightRef.current = targetHeight;
        
        Animated.spring(eventsListHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
          velocity: 0,
        }).start();
      }
    }, 100); // Debounce rapid height changes
  }, [eventsListHeight]);

  // ✅ Smart height animation
  useEffect(() => {
    if (!isInitializedRef.current || currentPage !== 0 || isGesturingRef.current) return;
    
    const targetHeight = hasEvents ? defaultHeight : minHeight;
    debouncedHeightAnimation(targetHeight);
  }, [hasEvents, defaultHeight, minHeight, currentPage, debouncedHeightAnimation]);

  // ✅ Optimized callbacks
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handlePageChange = useCallback((event: any) => {
    updateUIState({ currentPage: event.nativeEvent.position });
  }, [updateUIState]);

  const navigateToToday = useCallback(async () => {
    if (isNavigatingToToday) return; // Only prevent multiple simultaneous navigations
    
    console.log('🏠 Starting "Back to Today" - Always available');
    
    // ✅ OPTIMIZED: Batch state updates
    updateUIState({ 
      isNavigatingToToday: true, 
      showOptionsDropdown: false 
    });
    
    try {
      // ✅ Step 1: Ensure we're on the calendar page
      if (currentPage !== 0) {
        updateUIState({ currentPage: 0 });
        pagerRef.current?.setPage(0);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // ✅ Step 2: Pre-calculate height for coordination
      const hasEventsToday = hasEventsOnDate(today);
      const targetHeight = hasEventsToday ? defaultHeight : minHeight;
      console.log('📏 Coordinating height for today:', targetHeight);

      // ✅ Step 3: Start BOTH animations in perfect coordination
      const calendarPromise = calendarRef.current?.scrollToToday() || Promise.resolve();
      
      const heightPromise = new Promise<void>((resolve) => {
        // ✅ Start height animation with same timing as calendar transition
        eventsListHeight.stopAnimation();
        currentHeightRef.current = targetHeight;
        
        // ✅ Delay height animation to match calendar fade-out
        setTimeout(() => {
          Animated.spring(eventsListHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
            tension: 100, // Match calendar transition speed
            friction: 10,
            velocity: 0,
          }).start(() => {
            console.log('✅ Height animation completed');
            resolve();
          });
        }, 200); // Start during calendar fade-out
      });

      // ✅ Wait for both animations to complete
      await Promise.all([calendarPromise, heightPromise]);
      
      console.log('✅ Back to Today completed');

    } catch (error) {
      console.error('❌ Error during Back to Today:', error);
      // ✅ Fallback: ensure state is consistent
      setSelectedDate(today);
    } finally {
      setTimeout(() => {
        updateUIState({ isNavigatingToToday: false });
      }, 100);
    }
  }, [
    today, 
    hasEventsOnDate, 
    defaultHeight, 
    minHeight, 
    eventsListHeight, 
    isNavigatingToToday, 
    currentPage,
    updateUIState
  ]);

  const navigateToCalendars = useCallback(() => {
    updateUIState({ showOptionsDropdown: false });
    router.push('/(tabs)/calendar/manageCalendars');
  }, [updateUIState]);

  const navigateToAllEvents = useCallback(() => {
    updateUIState({ 
      showOptionsDropdown: false, 
      currentPage: 1 
    });
    pagerRef.current?.setPage(1);
  }, [updateUIState]);

  const navigateToCreateEvent = useCallback(() => {
    router.push(`/(tabs)/calendar/createEvent?selectedDate=${selectedDate}`);
  }, [selectedDate]);

  // ✅ OPTIMIZED: Search functions with batched updates
  const handleSearch = useCallback(() => {
    updateUIState({ showSearchModal: true });
  }, [updateUIState]);

  const handleCloseSearch = useCallback(() => {
    updateUIState({ showSearchModal: false });
  }, [updateUIState]);

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
      onPress: () => updateUIState({ showOptionsDropdown: true }),
    },
    {
      icon: <Ionicons name="search" size={24} color="#070c1f" />,
      onPress: handleSearch,
    },
    {
      icon: <Ionicons name="add-sharp" size={24} color="#070c1f" />,
      onPress: navigateToCreateEvent,
    },
  ], [navigateToCreateEvent, handleSearch, updateUIState]);

  // ✅ Updated options menu - no longer shows different state when on today
  const optionsMenuItems = useMemo(() => [
    {
      id: '1',
      title: isNavigatingToToday ? 'Navigating to Today...' : 'Back to Today',
      icon: isNavigatingToToday ? 'hourglass-outline' as const : 'today-outline' as const,
      onPress: navigateToToday,
      disabled: isNavigatingToToday, // Only disable during navigation, not when on today
      style: isNavigatingToToday ? { opacity: 0.6 } : {},
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
        updateUIState({ showOptionsDropdown: false });
        handleSearch();
      },
    }
  ], [navigateToToday, navigateToCalendars, navigateToAllEvents, handleSearch, isNavigatingToToday, updateUIState]);

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
    <Suspense fallback={
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    }>
      <AllEventsScreen />
    </Suspense>
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

      {/* ✅ Enhanced Options Modal */}
      <Modal
        visible={showOptionsDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => updateUIState({ showOptionsDropdown: false })}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => updateUIState({ showOptionsDropdown: false })}
        >
          <View style={styles.dropdownContainer}>
            {optionsMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dropdownItem,
                  item.disabled && styles.dropdownItemDisabled,
                  item.style
                ]}
                onPress={item.disabled ? undefined : item.onPress}
                disabled={item.disabled}
              >
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={item.disabled ? colors.textMuted : colors.text} 
                />
                <Text style={[
                  styles.dropdownText,
                  item.disabled && styles.dropdownTextDisabled
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ✅ ADD: Search Modal */}
      {showSearchModal && (
        <Suspense fallback={null}>
          <EventSearch
            visible={showSearchModal}
            onClose={handleCloseSearch}
          />
        </Suspense>
      )}
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
  dropdownItemDisabled: {
    opacity: 0.6,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  dropdownTextDisabled: {
    color: colors.textMuted,
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