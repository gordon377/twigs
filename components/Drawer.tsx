import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingStyles } from '@/styles/styles';

export const DrawerHeader = ({ title, onBack } : {title: string; onBack: () => void }) => (
    <View style={settingStyles.drawerHeader}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={settingStyles.drawerTitle}>{title}</Text>
      <View style={{ width: 24 }} /> {/* Spacer for alignment */}
    </View>
  );