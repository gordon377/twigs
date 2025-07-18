import { Gesture } from 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';


/**
 * Hook: Swipe right (calls a callback)
 * Usage: const swipeRight = useSwipeRight(() => { ... });
 */
export function useSwipeRight(threshold: number = 100) {
  return Gesture.Pan()
    .activeOffsetX([10, 10])
    .onEnd((event) => {
      if (event.translationX > threshold) {
        alert("placeholder")
      }
    });
}

/**
 * Gesture: Long press (calls a callback)
 * Usage: <GestureDetector gesture={longPress(() => { ... })}>
 */
export function longPress(onLongPress: () => void, minDurationMs: number = 500) {
  return Gesture.LongPress()
    .minDuration(minDurationMs)
    .onStart(() => {
      onLongPress();
    });
}

/**
 * Gesture: Double tap (calls a callback)
 * Usage: <GestureDetector gesture={doubleTap(() => { ... })}>
 */
export function doubleTap(onDoubleTap: () => void, maxDelayMs: number = 300) {
  return Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(maxDelayMs)
    .onStart(() => {
      onDoubleTap();
    });
}

// Example usage in a screen/component:
// import { GestureDetector } from 'react-native-gesture-handler';
// import { useSwipeLeftToGoBack, longPress } from '@/components/Gestures';
//
// const swipeLeft = useSwipeLeftToGoBack();
// const longPressGesture = longPress(() => alert('Long pressed!'));
//
// <GestureDetector gesture={swipeLeft}>
//   <YourComponent />
// </GestureDetector>
//
// <GestureDetector gesture={longPressGesture}>
//   <YourComponent />
// </GestureDetector> 