import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import fontAwesome from '@expo/vector-icons/FontAwesome';
import { settingStyles } from '@/styles/styles';

export const DrawerHeader = ({ title, onBack } : {title: string; onBack: () => void }) => (
    <View style={settingStyles.drawerHeader}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#070c1f" />
      </TouchableOpacity>
      <Text style={settingStyles.drawerTitle}>{title}</Text>
      <View style={{ width: 24 }} /> {/* Spacer for alignment */}
    </View>
  );

export const CalendarHeader = ({
  leftAction,
  rightActions = [],
}: {
  leftAction?: { icon: React.ReactNode; onPress: () => void };
  rightActions?: { icon: React.ReactNode; onPress: () => void }[];
}) => (
  <View
    style={[
      settingStyles.drawerHeader,
      {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        height: 56,
        position: 'relative',
      },
    ]}
  >
    {/* Left Icon */}
    {leftAction && (
      <TouchableOpacity
        onPress={leftAction.onPress}
        style={{ paddingHorizontal: 4, height: 56, justifyContent: 'center', zIndex: 1 }}
      >
        {leftAction.icon}
      </TouchableOpacity>
    )}
    {/* Right Icons */}
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, zIndex: 1 }}>
      {rightActions.map((action, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={action.onPress}
          style={{
            marginLeft: idx === 0 ? 0 : 4,
            paddingHorizontal: 4,
            height: 56,
            justifyContent: 'center',
          }}
        >
          {action.icon}
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

