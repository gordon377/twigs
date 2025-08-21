import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/styles/styles';

interface DotIndicatorProps {
  currentPage: number;
  totalPages: number;
}

export const DotIndicator: React.FC<DotIndicatorProps> = ({ currentPage, totalPages }) => {
  // ✅ Don't render if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      {
        // ✅ Dynamic width based on number of pages
        paddingHorizontal: Math.max(16, totalPages * 8 + 16), // More padding for more pages
      }
    ]}>
      {Array.from({ length: totalPages }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentPage ? colors.primary : colors.lightGrey,
              opacity: index === currentPage ? 1 : 0.6,
              transform: [{ scale: index === currentPage ? 1.3 : 1 }], // ✅ Increased scale
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12, // ✅ Increased from 8 to 12
    gap: 12, // ✅ Increased from 8 to 12
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // ✅ Slightly more opaque
    borderRadius: 20, // ✅ Increased border radius
    marginHorizontal: 50, // ✅ Reduced to allow for wider container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // ✅ Increased shadow
    shadowOpacity: 0.12, // ✅ Slightly stronger shadow
    shadowRadius: 4, // ✅ Larger shadow radius
    elevation: 4, // ✅ Increased elevation
    minWidth: 80, // ✅ Ensure minimum width
  },
  dot: {
    width: 12, // ✅ Increased from 8 to 12
    height: 12, // ✅ Increased from 8 to 12
    borderRadius: 6, // ✅ Adjusted for larger size
  },
});