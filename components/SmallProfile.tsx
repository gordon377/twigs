import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SmallProfileProps = {
  username?: string;
  displayName?: string;
};

const SmallProfile: React.FC<SmallProfileProps> = ({ username, displayName }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="person-circle" size={32} color="#888" style={styles.icon} />
      <View>
        <Text style={styles.username}>{username || 'Unknown'}</Text>
        {displayName && <Text style={styles.displayName}>{displayName}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
  },
  displayName: {
    color: '#555',
    fontSize: 14,
  },
});

export default SmallProfile;
