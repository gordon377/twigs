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
  TouchableOpacity,
  InteractionManager,
  ActivityIndicator,
  Platform // ✅ Add Platform for OS-specific optimizations
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

// ✅ OPTIMIZATION 5: Lazy load heavy components
const AllEventsScreenLazy = lazy(() => import('@/components/EventForm/AllEventsScreen'));
const EventSearchLazy = lazy(() => import('@/components/EventForm/EventSearch'));

// ✅ OPTIMIZATION 6: Enhanced gesture constants
const VELOCITY_THRESHOLD = Platform.OS === 'ios' ? 1.2 : 1.5; // iOS is more sensitive
const ANIMATION_DURATION = 250;
const GESTURE_THRESHOLD = 6; // Reduced for better responsiveness
const THROTTLE_INTERVAL = 16; // 60fps throttling
const MOMENTUM_THRESHOLD = 0.8; // For momentum-based snapping

// ✅ FIX: Add gesture debug constant
const GESTURE_DEBUG = __DEV__ && false; // Set to true for debugging

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

// ✅ OPTIMIZATION: Consolidated UI State
interface UIState {
  showOptionsDropdown: boolean;
  showSearchModal: boolean;
  currentPage: number;
  isNavigatingToToday: boolean;
  isSearchLoaded: boolean;
  isAllEventsLoaded: boolean;
}

// ✅ OPTIMIZATION: Loading component for lazy loaded modules
const LazyLoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

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
    isSearchLoaded: false,
    isAllEventsLoaded: false,
  });
  
  // ✅ Refs
  const pagerRef = useRef<PagerView>(null);
  const eventsListHeight = useRef(new Animated.Value(0)).current;
  const currentHeightRef = useRef(0);
  const isGesturingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const calendarRef = useRef<any>(null);
  const heightAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ OPTIMIZATION 6: Add gesture performance refs
  const lastMoveTime = useRef(0);
  const gestureStartTime = useRef(0);
  const velocityTracker = useRef<number[]>([]);
  const isAnimatingRef = useRef(false);

  // ✅ Hooks
  const { hasEventsOnDate, isLoadingEvents, initializeCalendarsFromAPI } = useEvents();

  // ✅ OPTIMIZED: Batch state updates
  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // ✅ Destructure UI state for easier access
  const { 
    showOptionsDropdown, 
    showSearchModal, 
    currentPage, 
    isNavigatingToToday, 
    isSearchLoaded, 
    isAllEventsLoaded 
  } = uiState;

  // ✅ OPTIMIZATION: Lazy load modules when needed
  const preloadAllEventsScreen = useCallback(() => {
    if (!isAllEventsLoaded) {
      updateUIState({ isAllEventsLoaded: true });
      // Preload the component
      import('@/components/EventForm/AllEventsScreen');
    }
  }, [isAllEventsLoaded, updateUIState]);

  const preloadSearchModal = useCallback(() => {
    if (!isSearchLoaded) {
      updateUIState({ isSearchLoaded: true });
      // Preload the component
      import('@/components/EventForm/EventSearch');
    }
  }, [isSearchLoaded, updateUIState]);

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

  // ✅ OPTIMIZATION: Preload components after interactions
  useEffect(() => {
    const preloadTimer = InteractionManager.runAfterInteractions(() => {
      // Preload search after 2 seconds if not already loaded
      setTimeout(() => {
        if (!isSearchLoaded) {
          preloadSearchModal();
        }
      }, 2000);
      
      // Preload all events after 3 seconds if not already loaded
      setTimeout(() => {
        if (!isAllEventsLoaded) {
          preloadAllEventsScreen();
        }
      }, 3000);
    });

    return () => {
      if (preloadTimer && typeof preloadTimer.cancel === 'function') {
        preloadTimer.cancel();
      }
    };
  }, [preloadSearchModal, preloadAllEventsScreen, isSearchLoaded, isAllEventsLoaded]);

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

  // ✅ OPTIMIZATION 6: Enhanced debounced height animation with velocity
  const debouncedHeightAnimation = useCallback((targetHeight: number, velocity: number = 0) => {
    if (heightAnimationTimeoutRef.current) {
      clearTimeout(heightAnimationTimeoutRef.current);
    }
    
    // ✅ Immediate animation for user-driven gestures
    if (velocity > 0) {
      if (Math.abs(currentHeightRef.current - targetHeight) > 5) {
        currentHeightRef.current = targetHeight;
        isAnimatingRef.current = true;
        
        // ✅ Use velocity-based spring animation
        Animated.spring(eventsListHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: Math.min(120, 80 + velocity * 20), // Dynamic tension based on velocity
          friction: Math.max(8, 12 - velocity * 2),   // Dynamic friction
          velocity: velocity * 100, // Convert to animation velocity
        }).start(() => {
          isAnimatingRef.current = false;
        });
      }
      return;
    }
    
    // ✅ Debounced animation for programmatic changes
    heightAnimationTimeoutRef.current = setTimeout(() => {
      if (Math.abs(currentHeightRef.current - targetHeight) > 5) {
        currentHeightRef.current = targetHeight;
        isAnimatingRef.current = true;
        
        Animated.spring(eventsListHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
          velocity: 0,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      }
    }, 100);
  }, [eventsListHeight]);

  // ✅ Smart height animation
  useEffect(() => {
    if (!isInitializedRef.current || currentPage !== 0 || isGesturingRef.current || isNavigatingToToday || isAnimatingRef.current) return;
    
    const targetHeight = hasEvents ? defaultHeight : minHeight;
    debouncedHeightAnimation(targetHeight);
  }, [hasEvents, defaultHeight, minHeight, currentPage, debouncedHeightAnimation, isNavigatingToToday]);

  // ✅ Optimized callbacks
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handlePageChange = useCallback((event: any) => {
    const newPage = event.nativeEvent.position;
    updateUIState({ currentPage: newPage });
    
    // ✅ Preload components when navigating to them
    if (newPage === 1 && !isAllEventsLoaded) {
      preloadAllEventsScreen();
    }
  }, [updateUIState, preloadAllEventsScreen, isAllEventsLoaded]);

  // ✅ FIX: Single declaration of navigateToToday
  const navigateToToday = useCallback(async () => {
    if (isNavigatingToToday || isGesturingRef.current) return;
    
    console.log('🏠 Starting "Back to Today" - Always available');
    
    updateUIState({ 
      isNavigatingToToday: true, 
      showOptionsDropdown: false 
    });
    
    try {
      // ✅ Stop any ongoing gesture animations
      if (isAnimatingRef.current) {
        eventsListHeight.stopAnimation();
        isAnimatingRef.current = false;
      }
      
      if (currentPage !== 0) {
        updateUIState({ currentPage: 0 });
        pagerRef.current?.setPage(0);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      const hasEventsToday = hasEventsOnDate(today);
      const targetHeight = hasEventsToday ? defaultHeight : minHeight;
      console.log('📏 Coordinating height for today:', targetHeight);

      const calendarPromise = calendarRef.current?.scrollToToday() || Promise.resolve();
      
      const heightPromise = new Promise<void>((resolve) => {
        eventsListHeight.stopAnimation();
        currentHeightRef.current = targetHeight;
        
        setTimeout(() => {
          Animated.spring(eventsListHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
            tension: 100,
            friction: 10,
            velocity: 0,
          }).start(() => {
            console.log('✅ Height animation completed');
            resolve();
          });
        }, 200);
      });

      await Promise.all([calendarPromise, heightPromise]);
      
      console.log('✅ Back to Today completed');

    } catch (error) {
      console.error('❌ Error during Back to Today:', error);
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

  // ✅ FIX: Single declarations for navigation functions
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
    
    // ✅ Ensure component is loaded when navigating
    if (!isAllEventsLoaded) {
      preloadAllEventsScreen();
    }
  }, [updateUIState, preloadAllEventsScreen, isAllEventsLoaded]);

  const navigateToCreateEvent = useCallback(() => {
    router.push(`/(tabs)/calendar/createEvent?selectedDate=${selectedDate}`);
  }, [selectedDate]);

  // ✅ FIX: Single declarations for search functions
  const handleSearch = useCallback(() => {
    updateUIState({ showSearchModal: true });
    
    // ✅ Ensure search component is loaded
    if (!isSearchLoaded) {
      preloadSearchModal();
    }
  }, [updateUIState, preloadSearchModal, isSearchLoaded]);

  const handleCloseSearch = useCallback(() => {
    updateUIState({ showSearchModal: false });
  }, [updateUIState]);

  // ✅ FIX: Single declaration of panResponder with complete implementation
  const panResponder = useMemo(() => {
    const midPoint = (minHeight + maxHeight) / 2;
    
    return PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // ✅ Only handle gestures on calendar page
        if (currentPage !== 0) return false;
        
        // ✅ Only respond to gestures in the drag handle area (top 50px)
        return evt.nativeEvent.locationY < 50;
      },
      
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (currentPage !== 0) return false;
        
        const { dx, dy } = gestureState;
        const isVerticalGesture = Math.abs(dy) > Math.abs(dx);
        const meetsThreshold = Math.abs(dy) > GESTURE_THRESHOLD;
        
        // ✅ Only take control for clear vertical gestures
        return isVerticalGesture && meetsThreshold;
      },
      
      onPanResponderGrant: (evt) => {
        if (GESTURE_DEBUG) console.log('🎯 Gesture started');
        
        // ✅ Initialize gesture tracking
        isGesturingRef.current = true;
        gestureStartTime.current = Date.now();
        velocityTracker.current = [];
        lastMoveTime.current = Date.now();
        
        // ✅ Stop any ongoing animations
        eventsListHeight.stopAnimation();
        
        // ✅ Set up animated value for smooth tracking
        eventsListHeight.setOffset(currentHeightRef.current);
        eventsListHeight.setValue(0);
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (currentPage !== 0) return;
        
        const now = Date.now();
        
        // ✅ PERFORMANCE: Throttle move events to 60fps
        if (now - lastMoveTime.current < THROTTLE_INTERVAL) {
          return;
        }
        lastMoveTime.current = now;
        
        // ✅ Calculate new height with bounds checking
        const deltaY = gestureState.dy;
        const newHeight = currentHeightRef.current - deltaY;
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        
        // ✅ PERFORMANCE: Only update if meaningful change
        if (Math.abs(clampedHeight - currentHeightRef.current + deltaY) > 1) {
          eventsListHeight.setValue(clampedHeight - currentHeightRef.current);
        }
        
        // ✅ Track velocity for momentum calculation
        const velocity = gestureState.vy;
        velocityTracker.current.push(velocity);
        
        // ✅ Keep only recent velocity samples (last 100ms worth)
        if (velocityTracker.current.length > 6) {
          velocityTracker.current.shift();
        }
        
        if (GESTURE_DEBUG) {
          console.log('👆 Move:', {
            deltaY: deltaY.toFixed(1),
            newHeight: clampedHeight.toFixed(1),
            velocity: velocity.toFixed(2)
          });
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        if (currentPage !== 0) return;
        
        const gestureDuration = Date.now() - gestureStartTime.current;
        
        if (GESTURE_DEBUG) {
          console.log('🏁 Gesture ended:', {
            duration: gestureDuration,
            finalVelocity: gestureState.vy.toFixed(2),
            displacement: gestureState.dy.toFixed(1)
          });
        }
        
        // ✅ Flatten the offset to get the actual current value
        eventsListHeight.flattenOffset();
        
        // ✅ Calculate average velocity from recent samples
        const avgVelocity = velocityTracker.current.length > 0
          ? velocityTracker.current.reduce((sum, v) => sum + v, 0) / velocityTracker.current.length
          : gestureState.vy;
        
        const absVelocity = Math.abs(avgVelocity);
        const newHeight = currentHeightRef.current - gestureState.dy;
        
        // ✅ SMART: Multi-factor decision for final height
        let finalHeight: number;
        
        // Factor 1: High velocity - use momentum
        if (absVelocity > VELOCITY_THRESHOLD) {
          finalHeight = avgVelocity > 0 ? minHeight : maxHeight;
          if (GESTURE_DEBUG) console.log('📈 Velocity-based snap:', avgVelocity > 0 ? 'min' : 'max');
        }
        // Factor 2: Fast gesture (under 200ms) - use direction
        else if (gestureDuration < 200 && Math.abs(gestureState.dy) > 20) {
          finalHeight = gestureState.dy > 0 ? minHeight : maxHeight;
          if (GESTURE_DEBUG) console.log('⚡ Quick gesture snap:', gestureState.dy > 0 ? 'min' : 'max');
        }
        // Factor 3: Moderate velocity with momentum
        else if (absVelocity > MOMENTUM_THRESHOLD) {
          const momentumHeight = avgVelocity > 0 ? minHeight : maxHeight;
          const positionHeight = newHeight < midPoint ? minHeight : maxHeight;
          // Weight momentum more heavily for medium velocities
          finalHeight = absVelocity > 1.0 ? momentumHeight : positionHeight;
          if (GESTURE_DEBUG) console.log('🎯 Momentum-weighted snap:', finalHeight === maxHeight ? 'max' : 'min');
        }
        // Factor 4: Slow gesture - use position relative to midpoint
        else {
          finalHeight = newHeight < midPoint ? minHeight : maxHeight;
          if (GESTURE_DEBUG) console.log('📍 Position-based snap:', newHeight < midPoint ? 'min' : 'max');
        }
        
        // ✅ Ensure final height is within bounds
        finalHeight = Math.max(minHeight, Math.min(maxHeight, finalHeight));
        
        // ✅ Update current height reference
        currentHeightRef.current = finalHeight;
        
        // ✅ PERFORMANCE: Use InteractionManager for smooth animation
        InteractionManager.runAfterInteractions(() => {
          // ✅ Use velocity-aware animation
          const animationVelocity = Math.min(absVelocity, 3); // Cap velocity for animation
          
          if (absVelocity > VELOCITY_THRESHOLD) {
            // ✅ Fast spring animation for high velocity
            Animated.spring(eventsListHeight, {
              toValue: finalHeight,
              useNativeDriver: false,
              tension: 120,
              friction: 8,
              velocity: avgVelocity * 50, // Convert to animation velocity
            }).start(() => {
              isGesturingRef.current = false;
              isAnimatingRef.current = false;
            });
          } else {
            // ✅ Smooth timing animation for low velocity
            Animated.timing(eventsListHeight, {
              toValue: finalHeight,
              duration: Math.max(200, ANIMATION_DURATION - (absVelocity * 50)),
              useNativeDriver: false,
              easing: Easing.out(Easing.cubic),
            }).start(() => {
              isGesturingRef.current = false;
              isAnimatingRef.current = false;
            });
          }
        });
        
        // ✅ Clean up tracking data
        velocityTracker.current = [];
      },
      
      onPanResponderTerminate: () => {
        if (GESTURE_DEBUG) console.log('❌ Gesture terminated');
        
        // ✅ Clean up if gesture is interrupted
        isGesturingRef.current = false;
        isAnimatingRef.current = false;
        velocityTracker.current = [];
        eventsListHeight.flattenOffset();
      },
      
      // ✅ PERFORMANCE: Optimize touch handling
      onPanResponderTerminationRequest: () => false, // Don't let other components steal the gesture
      onShouldBlockNativeResponder: () => false,     // Don't block native scrolling in children
    });
  }, [currentPage, minHeight, maxHeight, eventsListHeight]);

  // ✅ FIX: Add missing rightActions configuration
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

  // ✅ FIX: Add missing optionsMenuItems configuration
  const optionsMenuItems = useMemo(() => [
    {
      id: '1',
      title: isNavigatingToToday ? 'Navigating to Today...' : 'Back to Today',
      icon: isNavigatingToToday ? 'hourglass-outline' as const : 'today-outline' as const,
      onPress: navigateToToday,
      disabled: isNavigatingToToday,
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

  // ✅ OPTIMIZATION 6: Enhanced memory cleanup
  useEffect(() => {
    return () => {
      // ✅ Clean up timeouts
      if (heightAnimationTimeoutRef.current) {
        clearTimeout(heightAnimationTimeoutRef.current);
      }
      
      // ✅ Stop animations and clear state
      eventsListHeight.stopAnimation();
      eventsListHeight.removeAllListeners();
      
      // ✅ Clear gesture tracking
      velocityTracker.current = [];
      isGesturingRef.current = false;
      isAnimatingRef.current = false;
    };
  }, [eventsListHeight]);

  // ✅ SIMPLIFIED: CalendarPage with optimized rendering
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

  // ✅ OPTIMIZED: Lazy loaded AllEventsPage
  const AllEventsPage = useMemo(() => (
    <Suspense fallback={<LazyLoadingIndicator />}>
      {isAllEventsLoaded ? (
        <AllEventsScreenLazy />
      ) : (
        <LazyLoadingIndicator />
      )}
    </Suspense>
  ), [isAllEventsLoaded]);

  // ✅ Early return for loading
  if (isLoadingEvents) {
    return (
      <SafeAreaView style={styles.screen}>
        <CalendarHeader title="" rightActions={rightActions} />
        <LazyLoadingIndicator />
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

      {/* ✅ OPTIMIZED: Lazy loaded Search Modal */}
      {showSearchModal && (
        <Suspense fallback={null}>
          {isSearchLoaded ? (
            <EventSearchLazy
              visible={showSearchModal}
              onClose={handleCloseSearch}
            />
          ) : (
            <Modal visible={showSearchModal} transparent>
              <View style={styles.modalOverlay}>
                <LazyLoadingIndicator />
              </View>
            </Modal>
          )}
        </Suspense>
      )}
    </SafeAreaView>
  );
}

// ✅ Enhanced styles with loading states
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 12,
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