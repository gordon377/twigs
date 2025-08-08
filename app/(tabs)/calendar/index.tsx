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
  TouchableOpacity,
  GestureResponderEvent,
  PanResponderGestureState
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { colors, commonStyles } from '@/styles/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarHeader } from '@/components/Drawer';
import { EventsList, SingleDateCalendar } from '@/components/Calendar';
import { AllEventsScreen } from '@/components/EventForm/AllEventsScreen';
import { DotIndicator } from '@/components/DotIndicator';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

// ✅ Move helper functions outside component to prevent recreation
const getDimensions = () => Dimensions.get('window');

function monthIncrement(today: any, increment: number) {
  const next = new Date(today);
  next.setMonth(next.getMonth() + increment);
  return toDateId(next);
}

// ✅ Move constants outside component
const VELOCITY_THRESHOLD = 1.5;
const ANIMATION_DURATION = 300;

export default function CalendarScreen() {
  const today = toDateId(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const { hasEventsOnDate, isLoadingEvents } = useEvents();
  
  // ✅ Memoize screen dimensions
  const [screenDimensions, setScreenDimensions] = useState(getDimensions());
  
  // ✅ Memoize responsive heights - only recalculate when dimensions change
  const responsiveHeights = useMemo(() => {
    const { height } = screenDimensions;
    return {
      minHeight: height * 0.08,
      maxHeight: height * 0.75,
      defaultHeight: height * 0.25,
    };
  }, [screenDimensions]);

  const { minHeight, maxHeight, defaultHeight } = responsiveHeights;
  
  // ✅ Stable callback references
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handlePageChange = useCallback((event: any) => {
    const newPage = event.nativeEvent.position;
    setCurrentPage(newPage);
  }, []);

  // ✅ Debounced hasEvents calculation
  const hasEvents = useMemo(() => {
    return hasEventsOnDate(selectedDate);
  }, [selectedDate, hasEventsOnDate]);

  // Animation refs
  const eventsListHeight = useRef(new Animated.Value(defaultHeight)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const currentHeightRef = useRef(defaultHeight);
  const isGesturingRef = useRef(false); // ✅ ADDED: Track gesture state

  // ✅ FIXED: Prevent animation conflicts during gestures
  useEffect(() => {
    if (currentPage !== 0 || isGesturingRef.current) return; // ✅ Skip if gesturing
    
    const animationTimer = setTimeout(() => {
      const targetHeight = hasEvents ? defaultHeight : minHeight;
      
      // ✅ Only animate if height actually needs to change AND not gesturing
      if (Math.abs(currentHeightRef.current - targetHeight) > 1) {
        currentHeightRef.current = targetHeight;
        
        Animated.timing(eventsListHeight, {
          toValue: targetHeight,
          duration: 200,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }).start();
      }
    }, 50);

    return () => clearTimeout(animationTimer);
  }, [hasEvents, defaultHeight, minHeight, currentPage, eventsListHeight]);

  // ✅ FIXED: Better PanResponder to prevent micro jumps
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      if (currentPage !== 0) return false;
      
      const touchY = evt.nativeEvent.locationY;
      return touchY < 50;
    },
    
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      if (currentPage !== 0) return false;
      
      const { dx, dy } = gestureState;
      return Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx); // ✅ Increased threshold
    },
    
    onPanResponderGrant: () => {
      isGesturingRef.current = true; // ✅ ADDED: Mark as gesturing
      eventsListHeight.stopAnimation(); // ✅ ADDED: Stop any ongoing animations
      eventsListHeight.setOffset(currentHeightRef.current);
      eventsListHeight.setValue(0);
      panY.setValue(0); // ✅ ADDED: Reset panY
    },
    
    onPanResponderMove: (_, gestureState) => {
      if (currentPage !== 0) return;
      
      const newHeight = currentHeightRef.current - gestureState.dy;
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      
      // ✅ FIXED: Use eventsListHeight directly instead of panY
      eventsListHeight.setValue(clampedHeight - currentHeightRef.current);
    },
    
    onPanResponderRelease: (_, gestureState) => {
      if (currentPage !== 0) return;
      
      eventsListHeight.flattenOffset();
      panY.setValue(0); // ✅ ADDED: Reset panY
      
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
      
      // ✅ FIXED: Smoother animation after gesture
      Animated.timing(eventsListHeight, {
        toValue: finalHeight,
        duration: 250, // ✅ Slightly longer for smoother transition
        useNativeDriver: false,
        easing: Easing.out(Easing.quad), // ✅ Gentler easing
      }).start(() => {
        isGesturingRef.current = false; // ✅ ADDED: Mark gesture as complete
      });
    },
    
    onPanResponderTerminate: () => {
      panY.setValue(0);
      isGesturingRef.current = false; // ✅ ADDED: Reset gesture state
    },
    
    onPanResponderTerminationRequest: () => false,
    
    onShouldBlockNativeResponder: () => true,
  }), [currentPage, minHeight, maxHeight, eventsListHeight, panY]);

  // ✅ Memoize configuration objects
  const rightActions = useMemo(() => [
    {
      icon: <Ionicons name="options-outline" size={24} color="#070c1f" />,
      onPress: () => setShowOptionsDropdown(true),
    },
    {
      icon: <Ionicons name="search" size={24} color="#070c1f" />,
      onPress: () => { /* handle search */ },
    },
    {
      icon: <Ionicons name="add-sharp" size={24} color="#070c1f" />,
      onPress: () => {
        router.push(`/(tabs)/calendar/createEvent?selectedDate=${selectedDate}`);
      },
    },
  ], [selectedDate]);

  const optionsMenuItems = useMemo(() => [
    {
      id: '1',
      title: 'Back to Today',
      icon: 'today-outline',
      onPress: () => {
        setShowOptionsDropdown(false);
        if (pagerRef.current) {
          pagerRef.current.setPage(0);
        }
        setCurrentPage(0);
        setSelectedDate(today);
      }
    },
    {
      id: '2',
      title: 'Calendars',
      icon: 'ellipse-outline',
      onPress: () => {
        setShowOptionsDropdown(false);
        router.push(`/(tabs)/calendar/manageCalendars`);
      }
    },
    {
      id: '3',
      title: 'All Events',
      icon: 'list-outline',
      onPress: () => {
        setShowOptionsDropdown(false);
        if (pagerRef.current) {
          pagerRef.current.setPage(1);
        }
        setCurrentPage(1);
      }
    }
  ], [today]);

  const pages = useMemo(() => [
    { key: '0', title: 'Calendar', component: 'calendar' },
    { key: '1', title: 'All Events', component: 'events' },
  ], []);

  // ✅ Memoize CalendarPage - THIS IS CRITICAL
  const CalendarPage = useMemo(() => (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <SingleDateCalendar 
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
              height: eventsListHeight, // ✅ SIMPLIFIED: Use eventsListHeight directly
              overflow: 'hidden',
              marginBottom: 0,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>
          
          <View style={{ 
            flex: 1, 
            minHeight: 100, 
            paddingBottom: 0
          }}>
            <EventsList date={selectedDate} />
          </View>
        </Animated.View>
      </View>
    </View>
  ), [today, selectedDate, handleDateChange, eventsListHeight, panResponder.panHandlers]); // ✅ REMOVED: panY dependency

  // ✅ Memoize AllEventsScreen
  const AllEventsPage = useMemo(() => (
    <AllEventsScreen />
  ), []);

  // ✅ Handle dimension changes efficiently
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);

  // ✅ Loading state with memoized components
  if (isLoadingEvents) {
    return (
      <SafeAreaView style={styles.screen}>
        <CalendarHeader title="" rightActions={rightActions} />
        <View style={styles.loadingContainer}>
          <Text>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <CalendarHeader
        title=""
        rightActions={rightActions}
      />
      
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={currentPage}
        onPageSelected={handlePageChange}
        scrollEnabled={true}
        overdrag={false}
        pageMargin={-250}
        orientation="horizontal"
        offscreenPageLimit={0}
      >
        <View key="0" style={{ flex: 1 }}>
          {CalendarPage}
        </View>
        <View key="1" style={{ flex: 1 }}>
          {AllEventsPage}
        </View>
      </PagerView>

      <View style={styles.dotIndicatorContainer}>
        <DotIndicator currentPage={currentPage} totalPages={pages.length} />
      </View>

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
                <Ionicons name={item.icon as any} size={20} color={colors.text} />
                <Text style={styles.dropdownText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ✅ Styles remain unchanged but moved to bottom
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
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
});