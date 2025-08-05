import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View, Animated, Easing, PanResponder, Modal, TouchableOpacity } from 'react-native';
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';
import { colors, commonStyles } from '@/styles/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarHeader } from '@/components/Drawer';
import { EventsList, SingleDateCalendar } from '@/components/Calendar';
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

  // Dropdown menu options
  const optionsMenuItems = [
    {
      id: '1',
      title: 'Back to Today',
      icon: 'today-outline',
      onPress: () => {
        setShowOptionsDropdown(false);
          //FIGURE THIS OUT
        Animated.timing(new Animated.Value(0), {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setSelectedDate(today); // Set date after animation completes
        });
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
      title: 'Misc',
      icon: 'chevron-forward-outline',
      onPress: () => {
        setSelectedDate(monthIncrement(selectedDate, 1));
        setShowOptionsDropdown(false);
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

  // Animation for events list height
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

  // Animate when hasEvents changes
  useEffect(() => {
    const duration = 300;
    
    if (hasEvents) {
      currentHeightRef.current = defaultHeight;
      Animated.timing(eventsListHeight, {
        toValue: defaultHeight,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      currentHeightRef.current = minHeight;
      Animated.timing(eventsListHeight, {
        toValue: minHeight,
        duration,
        useNativeDriver: false,
      }).start();
    }
  }, [hasEvents, defaultHeight, minHeight]);

  // ✅ CLEAN: Native PanResponder with fast swipe functionality
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to vertical gestures
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Real-time pan feedback
      panY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy: translationY, vy: velocityY } = gestureState;
      
      // Get current height and calculate target
      let currentHeight = currentHeightRef.current;
      let startHeight = currentHeight - translationY;
      let targetHeight = startHeight;
      
      // Low threshold for fast swipe detection
      const swipeThreshold = 0.5;
      
      if (Math.abs(velocityY) > swipeThreshold) {
        // Fast swipe: snap to min or max based on direction
        if (velocityY > 0) {
          // Swiping down = close to minimum
          targetHeight = minHeight;
        } else {
          // Swiping up = open to maximum  
          targetHeight = maxHeight;
        }
        
        eventsListHeight.setValue(startHeight);
        currentHeightRef.current = targetHeight;
        
        // Fast spring animation for snappy feel
        Animated.spring(eventsListHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 200,
          friction: 12,
          velocity: velocityY * -0.01,
        }).start();
      } else {
        // Slow gesture: physics-based momentum
        const deceleration = 0.998;
        const momentumDistance = (velocityY * velocityY) / (2 * (1 - deceleration) * 1000);
        
        const momentumHeight = startHeight - (velocityY > 0 ? momentumDistance : -momentumDistance);
        
        // Boundary clamping (no smart snapping)
        targetHeight = Math.max(minHeight, Math.min(maxHeight, momentumHeight));
        
        eventsListHeight.setValue(startHeight);
        currentHeightRef.current = targetHeight;
        
        // Duration calculation based on momentum and screen size
        const baseDuration = screenDimensions.height * 0.3;
        const duration = Math.min(800, Math.max(200, baseDuration));
        
        Animated.timing(eventsListHeight, {
          toValue: targetHeight,
          duration: duration,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }).start();
      }
      
      // Reset pan value
      panY.setValue(0);
    },
    onPanResponderTerminate: () => {
      // Reset to safe state if gesture is interrupted
      panY.setValue(0);
    },
  });

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
      
      <View style={{ flex: 1 }}>
        {/* Calendar takes remaining space */}
        <View style={{ flex: 1 }}>
          <SingleDateCalendar 
            today={today}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </View>
        
        {/* Events list with gesture handling */}
        <Animated.View 
          style={[
            styles.eventsListContainer,
            {
              height: Animated.add(eventsListHeight, Animated.multiply(panY, -1)),
              overflow: 'hidden',
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>
          
          {/* EventsList with proper flex container */}
          <View style={{ flex: 1, minHeight: 100 }}>
            <EventsList date={selectedDate} />
          </View>
        </Animated.View>
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
});