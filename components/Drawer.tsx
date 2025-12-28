import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors } from '@/styles/styles';

export const DrawerHeader = ({ title, onBack } : {title: string; onBack: () => void }) => (
  <View style={commonStyles.drawerHeader}>
    <TouchableOpacity 
      onPress={onBack}
      style={commonStyles.headerButton}
    >
      <Ionicons name="arrow-back" size={24} color={colors.offBlack} />
    </TouchableOpacity>
    <Text style={commonStyles.drawerTitle}>{title}</Text>
  </View>
);

export const CalendarHeader = ({
  title,
  leftAction,
  rightActions = [],
}: {
  title: string;
  leftAction?: { icon: React.ReactNode; onPress: () => void };
  rightActions?: { icon: React.ReactNode; onPress: () => void }[];
}) => (
  <View style={commonStyles.calendarHeader}>
    {/* Left Icon */}
    {leftAction ? (
      <TouchableOpacity
        onPress={leftAction.onPress}
        style={[commonStyles.headerButton, { zIndex: 1 }]}
      >
        {leftAction.icon}
      </TouchableOpacity>
    ) : (
      <View style={{ width: 44 }}>{/* Placeholder for alignment */}</View>
    )}
    {/* Title */}
    <Text style={commonStyles.calendarTitle}>{title}</Text>
    
    {/* Right Icons */}
    <View style={[commonStyles.headerButtonGroup, { zIndex: 1 }]}>
      {rightActions.map((action, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={action.onPress}
          style={[
            commonStyles.headerButton,
            {
              marginLeft: idx === 0 ? 0 : 8, // 8px spacing between buttons
            }
          ]}
        >
          {action.icon}
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

