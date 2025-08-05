import { StyleSheet, Dimensions, PixelRatio } from 'react-native';

export const colors = {
  background: '#f8f9fa',
  white: '#ffffff',
  offWhite: '#f1f3f4',
  grey: '#6c757d',
  lightGrey: '#e9ecef',
  darkGrey: '#495057',
  black: '#212529',
  offBlack: '#343a40',

  // Enhanced color palette
  primary: '#2563eb',      // Bright blue
  primaryLight: '#dbeafe', // Light blue
  primaryDark: '#1d4ed8',  // Dark blue

  success: '#059669',      // Green
  successLight: '#d1fae5', // Light green
  successDark: '#047857',  // Dark green

  warning: '#d97706',      // Orange
  warningLight: '#fef3c7', // Light orange

  danger: '#dc2626',       // Red
  dangerLight: '#fee2e2',  // Light red

  info: '#0891b2',         // Cyan
  infoLight: '#cffafe',    // Light cyan

  purple: '#7c3aed',       // Purple
  purpleLight: '#ede9fe', // Light purple

  // Legacy colors (updated)
  lightBrown: '#f3e8d8',
  darkBrown: '#8b4513',
  darkGreen: '#059669',    // Updated to success
  midGreen: '#10b981',     // Updated
  lightGreen: '#d1fae5',   // Updated to successLight
  red: '#dc2626',          // Updated to danger

  // UI colors
  divider: '#e5e7eb',
  inactive: '#9ca3af',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',

  // Card colors
  cardBackground: '#ffffff',
  cardBorder: '#e5e7eb',
  cardShadow: '#00000010',
};

// Fixed size constants for consistency
const SIZES = {
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  // Font sizes
  font: {
    sm: 12,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  // Component heights
  input: 48,
  button: 48,
  header: 56,
  touchTarget: 44,
};

// Common styles with fixed, appropriate sizes
export const commonStyles = StyleSheet.create({
  textInput: {
    width: '75%', // 75% of parent width
    height: SIZES.input,
    marginHorizontal: SIZES.spacing.xl,
    marginVertical: SIZES.spacing.md,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.offWhite,
    borderRadius: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    fontSize: SIZES.font.md,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: SIZES.spacing.xxl,
  },
  button: {
    width: '100%',
    backgroundColor: colors.black,
    borderRadius: SIZES.spacing.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: SIZES.spacing.sm,
    minHeight: SIZES.button,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: SIZES.font.md,
  },
  title: {
    fontSize: SIZES.font.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  subtitle: {
    fontSize: SIZES.font.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  // Drawer-specific styles
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    height: SIZES.header,
  },
  drawerTitle: {
    fontSize: SIZES.font.xl,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  calendarTitle: {
    fontSize: SIZES.font.xl,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.sm,
    height: SIZES.header,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerButton: {
    paddingHorizontal: SIZES.spacing.xs,
    height: SIZES.header,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: SIZES.touchTarget,
  },
  headerButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SIZES.header,
  },
  
  
  // ✅ Dropdown Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  dropdownContainer: {
    marginTop: 60, // Adjust based on your header height
    marginRight: 16,
  },
  dropdownMenu: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    minWidth: 200,
    maxWidth: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  dropdownItemLast: {
    borderBottomWidth: 0, // Remove border from last item
  },
  dropdownIcon: {
    marginRight: 12,
    width: 20, // Fixed width for alignment
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
});

// Responsive breakpoints
export const breakpoints = {
  small: 375,
  medium: 768,
  large: 1024,
};

// Helper function to get responsive styles based on screen size
export const getResponsiveStyle = (screenWidth: number) => {
  if (screenWidth >= breakpoints.large) {
    return 'large';
  } else if (screenWidth >= breakpoints.medium) {
    return 'medium';
  } else {
    return 'small';
  }
};

// Export sizes for use in other components if needed
export { SIZES };

// Export as default for backward compatibility
export default commonStyles;

