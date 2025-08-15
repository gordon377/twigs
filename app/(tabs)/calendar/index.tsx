import React, { useState, useRef, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Button,
  Platform,
  ActivityIndicator,
  InteractionManager,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { colors } from '@/styles/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarHeader } from '@/components/Drawer';
import { EventsList, SingleDateCalendar } from '@/components/Calendar';
import { DotIndicator } from '@/components/DotIndicator';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { BigCalendarView } from '@/components/BigCalendarView';

// Lazy load heavy components
const AllEventsScreenLazy = lazy(() => import('@/components/EventForm/AllEventsScreen'));
const EventSearchLazy = lazy(() => import('@/components/EventForm/EventSearch'));

const VELOCITY_THRESHOLD = Platform.OS === 'ios' ? 1.2 : 1.5;
const ANIMATION_DURATION = 250;
const GESTURE_THRESHOLD = 6;
const THROTTLE_INTERVAL = 16;
const MOMENTUM_THRESHOLD = 0.8;
const GESTURE_DEBUG = __DEV__ && false;

const getDimensions = () => Dimensions.get('window');

const createTodayValue = (): string => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '2025-08-11';
  }
};

interface UIState {
  showOptionsDropdown: boolean;
  showSearchModal: boolean;
  currentPage: number;
  isNavigatingToToday: boolean;
  isSearchLoaded: boolean;
  isAllEventsLoaded: boolean;
}

const LazyLoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

export default function CalendarScreen() {
  const today = useMemo(() => createTodayValue(), []);
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
  const [showBigCalendar, setShowBigCalendar] = useState(false);
  const [bigCalendarMode, setBigCalendarMode] = useState<'day' | 'week' | '3days' | 'month'>('day');
  const zoomAnim = useRef(new Animated.Value(0)).current;

  const pagerRef = useRef<PagerView>(null);
  const eventsListHeight = useRef(new Animated.Value(0)).current;
  const currentHeightRef = useRef(0);
  const isGesturingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const calendarRef = useRef<any>(null);
  const heightAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calendarHeightRef = useRef(0);

  const lastMoveTime = useRef(0);
  const gestureStartTime = useRef(0);
  const velocityTracker = useRef<number[]>([]);
  const isAnimatingRef = useRef(false);

  const { hasEventsOnDate, isLoadingEvents, initializeCalendarsFromAPI } = useEvents();

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  const {
    showOptionsDropdown,
    showSearchModal,
    currentPage,
    isNavigatingToToday,
    isSearchLoaded,
    isAllEventsLoaded
  } = uiState;

  const preloadAllEventsScreen = useCallback(() => {
    if (!isAllEventsLoaded) {
      updateUIState({ isAllEventsLoaded: true });
      import('@/components/EventForm/AllEventsScreen');
    }
  }, [isAllEventsLoaded, updateUIState]);

  const preloadSearchModal = useCallback(() => {
    if (!isSearchLoaded) {
      updateUIState({ isSearchLoaded: true });
      import('@/components/EventForm/EventSearch');
    }
  }, [isSearchLoaded, updateUIState]);

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

  useEffect(() => {
    const preloadTimer = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (!isSearchLoaded) {
          preloadSearchModal();
        }
      }, 2000);

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

  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialHeight = hasEvents ? defaultHeight : minHeight;
      currentHeightRef.current = initialHeight;
      eventsListHeight.setValue(initialHeight);
      isInitializedRef.current = true;
    }
  }, [hasEvents, defaultHeight, minHeight, eventsListHeight]);

  const debouncedHeightAnimation = useCallback((targetHeight: number, velocity: number = 0) => {
    if (heightAnimationTimeoutRef.current) {
      clearTimeout(heightAnimationTimeoutRef.current);
    }

    if (velocity > 0) {
      if (Math.abs(currentHeightRef.current - targetHeight) > 5) {
        currentHeightRef.current = targetHeight;
        isAnimatingRef.current = true;

        Animated.spring(eventsListHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: Math.min(120, 80 + velocity * 20),
          friction: Math.max(8, 12 - velocity * 2),
          velocity: velocity * 100,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      }
      return;
    }

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

  useEffect(() => {
    if (!isInitializedRef.current || currentPage !== 0 || isGesturingRef.current || isNavigatingToToday || isAnimatingRef.current) return;

    const targetHeight = hasEvents ? defaultHeight : minHeight;
    debouncedHeightAnimation(targetHeight);
  }, [hasEvents, defaultHeight, minHeight, currentPage, debouncedHeightAnimation, isNavigatingToToday]);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const openBigCalendar = useCallback((date: string) => {
    setSelectedDate(date);
    setShowBigCalendar(true);
    Animated.timing(zoomAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [zoomAnim]);

  const closeBigCalendar = useCallback(() => {
    Animated.timing(zoomAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }).start(() => setShowBigCalendar(false));
  }, [zoomAnim]);

  const lastTapRef = useRef<number>(0);

  const handleDatePress = useCallback((date: string) => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      setSelectedDate(date);
      setShowBigCalendar(true);
      zoomAnim.setValue(0);
      Animated.timing(zoomAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
      lastTapRef.current = 0;
    } else {
      setSelectedDate(date);
      lastTapRef.current = now;
    }
  }, [zoomAnim]);

  const handlePageChange = useCallback((event: any) => {
    const newPage = event.nativeEvent.position;
    updateUIState({ currentPage: newPage });

    if (newPage === 1 && !isAllEventsLoaded) {
      preloadAllEventsScreen();
    }
  }, [updateUIState, preloadAllEventsScreen, isAllEventsLoaded]);

  const navigateToToday = useCallback(async () => {
    if (isNavigatingToToday || isGesturingRef.current) return;

    updateUIState({
      isNavigatingToToday: true,
      showOptionsDropdown: false
    });

    try {
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
            resolve();
          });
        }, 200);
      });

      await Promise.all([calendarPromise, heightPromise]);

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

    if (!isAllEventsLoaded) {
      preloadAllEventsScreen();
    }
  }, [updateUIState, preloadAllEventsScreen, isAllEventsLoaded]);

  const navigateToCreateEvent = useCallback(() => {
    router.push(`/(tabs)/calendar/createEvent?selectedDate=${selectedDate}`);
  }, [selectedDate]);

  const handleSearch = useCallback(() => {
    updateUIState({ showSearchModal: true });

    if (!isSearchLoaded) {
      preloadSearchModal();
    }
  }, [updateUIState, preloadSearchModal, isSearchLoaded]);

  const handleCloseSearch = useCallback(() => {
    updateUIState({ showSearchModal: false });
  }, [updateUIState]);

  const panResponder = useMemo(() => {
    const midPoint = (minHeight + maxHeight) / 2;

    return PanResponder.create({
      onStartShouldSetPanResponder: (evt: GestureResponderEvent) => {
        if (currentPage !== 0) return false;
        return evt.nativeEvent.locationY < 50;
      },

      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (currentPage !== 0) return false;
        const { dx, dy } = gestureState;
        const isVerticalGesture = Math.abs(dy) > Math.abs(dx);
        const meetsThreshold = Math.abs(dy) > GESTURE_THRESHOLD;
        return isVerticalGesture && meetsThreshold;
      },

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (GESTURE_DEBUG) console.log('🎯 Gesture started');
        isGesturingRef.current = true;
        gestureStartTime.current = Date.now();
        velocityTracker.current = [];
        lastMoveTime.current = Date.now();
        eventsListHeight.stopAnimation();
        eventsListHeight.setOffset(currentHeightRef.current);
        eventsListHeight.setValue(0);
      },

      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (currentPage !== 0) return;
        const now = Date.now();
        if (now - lastMoveTime.current < THROTTLE_INTERVAL) {
          return;
        }
        lastMoveTime.current = now;
        const deltaY = gestureState.dy;
        const newHeight = currentHeightRef.current - deltaY;
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        if (Math.abs(clampedHeight - currentHeightRef.current + deltaY) > 1) {
          eventsListHeight.setValue(clampedHeight - currentHeightRef.current);
        }
        const velocity = gestureState.vy;
        velocityTracker.current.push(velocity);
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

      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (currentPage !== 0) return;
        const gestureDuration = Date.now() - gestureStartTime.current;
        if (GESTURE_DEBUG) {
          console.log('🏁 Gesture ended:', {
            duration: gestureDuration,
            finalVelocity: gestureState.vy.toFixed(2),
            displacement: gestureState.dy.toFixed(1)
          });
        }
        eventsListHeight.flattenOffset();
        const avgVelocity = velocityTracker.current.length > 0
          ? velocityTracker.current.reduce((sum, v) => sum + v, 0) / velocityTracker.current.length
          : gestureState.vy;
        const absVelocity = Math.abs(avgVelocity);
        const newHeight = currentHeightRef.current - gestureState.dy;
        let finalHeight: number;
        if (absVelocity > VELOCITY_THRESHOLD) {
          finalHeight = avgVelocity > 0 ? minHeight : maxHeight;
        } else if (gestureDuration < 200 && Math.abs(gestureState.dy) > 20) {
          finalHeight = gestureState.dy > 0 ? minHeight : maxHeight;
        } else if (absVelocity > MOMENTUM_THRESHOLD) {
          const momentumHeight = avgVelocity > 0 ? minHeight : maxHeight;
          const positionHeight = newHeight < midPoint ? minHeight : maxHeight;
          finalHeight = absVelocity > 1.0 ? momentumHeight : positionHeight;
        } else {
          finalHeight = newHeight < midPoint ? minHeight : maxHeight;
        }
        finalHeight = Math.max(minHeight, Math.min(maxHeight, finalHeight));
        currentHeightRef.current = finalHeight;
        InteractionManager.runAfterInteractions(() => {
          const animationVelocity = Math.min(absVelocity, 3);
          if (absVelocity > VELOCITY_THRESHOLD) {
            Animated.spring(eventsListHeight, {
              toValue: finalHeight,
              useNativeDriver: false,
              tension: 120,
              friction: 8,
              velocity: avgVelocity * 50,
            }).start(() => {
              isGesturingRef.current = false;
              isAnimatingRef.current = false;
            });
          } else {
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
        velocityTracker.current = [];
      },

      onPanResponderTerminate: (evt: GestureResponderEvent) => {
        if (GESTURE_DEBUG) console.log('❌ Gesture terminated');
        isGesturingRef.current = false;
        isAnimatingRef.current = false;
        velocityTracker.current = [];
        eventsListHeight.flattenOffset();
      },

      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,
    });
  }, [currentPage, minHeight, maxHeight, eventsListHeight]);

  const rightActions = useMemo(() => [
    {
      icon: <Ionicons name="options-outline" size={24} color={colors.text} />,
      onPress: () => setUIState(prev => ({ ...prev, showOptionsDropdown: true })),
    },
    {
      icon: <Ionicons name="search" size={24} color={colors.text} />,
      onPress: () => setUIState(prev => ({ ...prev, showSearchModal: true })),
    },
    {
      icon: <Ionicons name="add-sharp" size={24} color={colors.text} />,
      onPress: () => router.push(`/(tabs)/calendar/createEvent?selectedDate=${selectedDate}`),
    },
  ], [selectedDate]);

  // Options menu items
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

  // Handle dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Enhanced memory cleanup
  useEffect(() => {
    return () => {
      // Clean up timeouts
      if (heightAnimationTimeoutRef.current) {
        clearTimeout(heightAnimationTimeoutRef.current);
      }

      // Stop animations and clear state
      eventsListHeight.stopAnimation();
      eventsListHeight.removeAllListeners();

      // Clear gesture tracking
      velocityTracker.current = [];
      isGesturingRef.current = false;
      isAnimatingRef.current = false;
    };
  }, [eventsListHeight]);

  // CalendarPage with double tap logic
  const CalendarPage = useMemo(() => (
    <View style={styles.pageContainer}>
      <View style={styles.calendarContainer}>
        <SingleDateCalendar
          selectedDate={selectedDate}
          setSelectedDate={handleDatePress}
        />
      </View>
      <View style={styles.eventsGestureContainer}>
        <Animated.View
          style={[
            styles.eventsListContainer,
            { height: 200 }
          ]}
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
  ), [selectedDate, handleDatePress]);

  const AllEventsPage = useMemo(() => (
    <Suspense fallback={<LazyLoadingIndicator />}>
      {uiState.isAllEventsLoaded ? (
        <AllEventsScreenLazy />
      ) : (
        <LazyLoadingIndicator />
      )}
    </Suspense>
  ), [uiState.isAllEventsLoaded]);

  // Early return for loading
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

      {/* Big Calendar View Overlay */}
      {showBigCalendar && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 100,
              backgroundColor: colors.background,
              transform: [
                {
                  scale: zoomAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
              opacity: zoomAnim,
            },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.buttonRow}>
              <Button title="Day" onPress={() => setBigCalendarMode('day')} color={bigCalendarMode === 'day' ? colors.primary : colors.grey} />
              <Button title="Week" onPress={() => setBigCalendarMode('week')} color={bigCalendarMode === 'week' ? colors.primary : colors.grey} />
              <Button title="3 Days" onPress={() => setBigCalendarMode('3days')} color={bigCalendarMode === '3days' ? colors.primary : colors.grey} />
              <Button title="Month" onPress={() => setBigCalendarMode('month')} color={bigCalendarMode === 'month' ? colors.primary : colors.grey} />
              <Button title="Back" onPress={closeBigCalendar} color={colors.danger} />
            </View>
            <BigCalendarView date={selectedDate} mode={bigCalendarMode} />
          </SafeAreaView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// Styles
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
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: colors.background,
  },
  calendarContainer: {
    backgroundColor: colors.background,
    borderRadius: 20,
    margin: 16,
    marginBottom: 0,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  eventsGestureContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  eventsListContainer: {
    backgroundColor: colors.white,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 8,
  },
});

const toDateId = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;