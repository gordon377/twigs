import React, { useState, useEffect, useRef } from 'react';
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
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';
import { colors, commonStyles } from '@/styles/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarHeader } from '@/components/Drawer';
import { EventsList, SingleDateCalendar } from '@/components/Calendar';
import { AllEventsScreen } from '@/components/EventForm/AllEventsScreen';
import { DotIndicator } from '@/components/DotIndicator';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

// Get screen dimensions and listen for changes
const getDimensions = () => Dimensions.get('window');

function monthIncrement(today: any, increment: number) {
  const next = new Date(today);
  next.setMonth(next.getMonth() + increment);
  return toDateId(next);
}

export default function CalendarScreen() {
  const today = toDateId(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  // ✅ Simplify to just the two pages we actually use
  const pages = [
    { key: '0', title: 'Calendar', component: 'calendar' },
    { key: '1', title: 'All Events', component: 'events' },
  ];

  // ✅ Calculate total pages dynamically
  const totalPages = pages.length;

  // Update dropdown menu options to use dynamic pages
  const optionsMenuItems = [
    {
      id: '1',
      title: 'Back to Today',
      icon: 'today-outline',
      onPress: () => {
        setShowOptionsDropdown(false);
        if (pagerRef.current) {
          pagerRef.current.setPage(0); // ✅ Go to calendar page
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
          pagerRef.current.setPage(1); // ✅ Go to all events page
        }
        setCurrentPage(1);
      }
    }
  ];
  
  const { getEventsForDate, hasEventsOnDate, isLoadingEvents } = useEvents();
  
  // Responsive dimensions state
  const [screenDimensions, setScreenDimensions] = useState(getDimensions());
  
  const hasEvents = hasEventsOnDate(selectedDate);
  
  // Calculate responsive heights based on current screen dimensions
  const getResponsiveHeight = (percentage: number) => screenDimensions.height * percentage;
  
  const minHeight = getResponsiveHeight(0.08);
  const maxHeight = getResponsiveHeight(0.75);
  const defaultHeight = getResponsiveHeight(0.25);

  // Animation for events list height (only for calendar page)
  const eventsListHeight = useRef(new Animated.Value(defaultHeight)).current;
  
  // Pan gesture values
  const panY = useRef(new Animated.Value(0)).current;
  
  // Track current height for calculations
  const currentHeightRef = useRef(defaultHeight);

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
      
      const newMinHeight = window.height * 0.12;
      const newMaxHeight = window.height * 0.85;
      const newDefaultHeight = window.height * 0.35;
      
      const currentRatio = currentHeightRef.current / screenDimensions.height;
      const newHeight = window.height * currentRatio;
      const clampedHeight = Math.max(newMinHeight, Math.min(newMaxHeight, newHeight));
      
      currentHeightRef.current = clampedHeight;
      eventsListHeight.setValue(clampedHeight);
    });

    return () => subscription?.remove();
  }, [screenDimensions.height]);

  // Animate when hasEvents changes (only for calendar page)
  useEffect(() => {
    if (currentPage !== 0) return; // ✅ Calendar is now page 0
    
    // ✅ Only animate for automatic transitions (hasEvents changes)
    const duration = 200; // ✅ Reduced duration for quicker feel
    
    if (hasEvents) {
      currentHeightRef.current = defaultHeight;
      Animated.timing(eventsListHeight, {
        toValue: defaultHeight,
        duration,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic), // ✅ Smoother easing
      }).start();
    } else {
      currentHeightRef.current = minHeight;
      Animated.timing(eventsListHeight, {
        toValue: minHeight,
        duration,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic), // ✅ Smoother easing
      }).start();
    }
  }, [hasEvents, defaultHeight, minHeight, currentPage]);

  // ✅ Even more strict PanResponder for vertical gestures only
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      // Only respond on calendar page
      return currentPage === 0;
    },
    onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      // Only respond on calendar page
      if (currentPage !== 0) return false;
      
      const { dx, dy } = gestureState;
      
      // ✅ Even stricter vertical detection to avoid horizontal conflicts
      const minVerticalMovement = 15; // ✅ Increased from 8 to 15
      const maxHorizontalMovement = 5; // ✅ Maximum allowed horizontal drift
      const verticalToHorizontalRatio = 3; // ✅ Must be 3:1 vertical to horizontal ratio
      
      const hasVerticalMovement = Math.abs(dy) >= minVerticalMovement;
      const hasMinimalHorizontalMovement = Math.abs(dx) <= maxHorizontalMovement;
      const isStronglyVertical = Math.abs(dy) >= Math.abs(dx) * verticalToHorizontalRatio;
      
      return hasVerticalMovement && hasMinimalHorizontalMovement && isStronglyVertical;
    },
    onPanResponderGrant: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      return true;
    },
    onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      const { dx, dy } = gestureState;
      
      // ✅ Only update if gesture remains strongly vertical
      if (Math.abs(dy) >= Math.abs(dx) * 3) {
        panY.setValue(-gestureState.dy);
      }
    },
    onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      const { dy: translationY, vy: velocityY, dx } = gestureState;
      
      // ✅ Ignore if gesture became too horizontal
      if (Math.abs(dx) > Math.abs(translationY) * 0.5) {
        panY.setValue(0);
        return;
      }
      
      // Calculate where the user dragged to
      const currentHeight = currentHeightRef.current;
      const targetHeight = currentHeight - translationY;
      
      // ✅ Clamp to bounds
      let finalHeight = Math.max(minHeight, Math.min(maxHeight, targetHeight));
      
      // ✅ Only animate for quick swipes (high velocity)
      const velocityThreshold = 1.5;
      
      if (Math.abs(velocityY) > velocityThreshold) {
        // ✅ Quick swipe - animate to min/max
        if (velocityY > 0) {
          finalHeight = minHeight;
        } else {
          finalHeight = maxHeight;
        }
        
        // ✅ FIXED: Calculate the intermediate height including panY offset
        const currentDisplayHeight = currentHeight - translationY;
        
        // Update the ref to final target
        currentHeightRef.current = finalHeight;
        
        // ✅ FIXED: Set eventsListHeight to current display position first
        eventsListHeight.setValue(currentDisplayHeight);
        
        // ✅ FIXED: Reset panY to 0 BEFORE starting animation
        panY.setValue(0);
        
        // ✅ FIXED: Use timing animation for smoother, more predictable movement
        Animated.timing(eventsListHeight, {
          toValue: finalHeight,
          duration: 300, // ✅ Fixed duration for consistent feel
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic), // ✅ Smooth easing
        }).start();
      } else {
        // ✅ Slow drag - just set the position without animation
        currentHeightRef.current = finalHeight;
        
        // Reset panY and set height directly (no animation)
        panY.setValue(0);
        eventsListHeight.setValue(finalHeight);
      }
    },
    onPanResponderTerminate: () => {
      panY.setValue(0);
    },
    // ✅ Keep these to prevent conflicts
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });

  // ✅ Handle page change
  const handlePageChange = (event: any) => {
    const newPage = event.nativeEvent.position;
    console.log('📄 Page changed to:', newPage);
    setCurrentPage(newPage);
  };

  // Example right actions for the header
  const rightActions = [
    {
      icon: <Ionicons name="options-outline" size={24} color="#070c1f" />,
      onPress: () => { setShowOptionsDropdown(true); },
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
  ];

  // Show loading state if events are still loading
  if (isLoadingEvents) {
    return (
      <SafeAreaView style={styles.screen}>
        <CalendarHeader
          title=""
          rightActions={rightActions}
        />
        <View style={styles.loadingContainer}>
          <Text>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Render Calendar Page
  const CalendarPage = () => (
    <View style={{ flex: 1 }}>
      {/* Calendar takes remaining space */}
      <View style={{ flex: 1 }}>
        <SingleDateCalendar 
          today={today}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </View>
      
      {/* Events list with gesture handling - ✅ Isolated gesture area */}
      <View style={styles.eventsGestureContainer}>
        <Animated.View 
          style={[
            styles.eventsListContainer,
            {
              height: Animated.add(eventsListHeight, panY),
              overflow: 'hidden',
              marginBottom: 60,
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>
          
          {/* EventsList with proper flex container */}
          <View style={{ flex: 1, minHeight: 100, paddingBottom: 16 }}>
            <EventsList date={selectedDate} />
          </View>
        </Animated.View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <CalendarHeader
        title=""
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color="#070c1f" />,
          onPress: () => {/* handle back navigation */}
        }}
        rightActions={rightActions}
      />
      
      {/* ✅ PagerView with significantly reduced sensitivity */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={currentPage}
        onPageSelected={(event) => setCurrentPage(event.nativeEvent.position)}
        scrollEnabled={true}
        overdrag={false}
        pageMargin={-250}  // ✅ NEGATIVE margin makes swiping much harder
        orientation="horizontal"
        offscreenPageLimit={0}  // ✅ Reduced from 1 to 0 - less pre-loading
      >
        {/* ✅ Render pages dynamically */}
        {pages.map((page, index) => (
          <View key={page.key} style={{ flex: 1 }}>
            {page.component === 'calendar' ? <CalendarPage /> : <AllEventsScreen />}
          </View>
        ))}
      </PagerView>

      {/* ✅ Dynamic Dot Indicator */}
      <View style={styles.dotIndicatorContainer}>
        <DotIndicator currentPage={currentPage} totalPages={totalPages} />
      </View>

      {/* Options Dropdown Modal */}
      <Modal
        visible={showOptionsDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsDropdown(false)}
      >
        <TouchableOpacity 
          style={commonStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsDropdown(false)}
        >
          <View style={commonStyles.dropdownContainer}>
            <View style={commonStyles.dropdownMenu}>
              {optionsMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    commonStyles.dropdownItem,
                    index === optionsMenuItems.length - 1 && commonStyles.dropdownItemLast
                  ]}
                  onPress={item.onPress}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={colors.text} 
                    style={commonStyles.dropdownIcon}
                  />
                  <Text style={commonStyles.dropdownText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.darkGreen,
    margin: 8,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  // ✅ Updated: More compact dot indicator positioning
  dotIndicatorContainer: {
    position: 'absolute',
    bottom: 16, // ✅ Reduced from 30 to 16
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    alignItems: 'center', // ✅ Center the indicator
  },
  eventsListContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 2,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: colors.offWhite,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.grey,
    borderRadius: 2,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  // ✅ Add gesture container to isolate events list
  eventsGestureContainer: {
    position: 'relative',
    zIndex: 10, // Higher than PagerView
  },
});