import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ConnectionSmallProfileProps = {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  type: 'connected' | 'incoming' | 'outgoing';
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onRemove?: () => Promise<void>;
};

const ConnectionSmallProfile: React.FC<ConnectionSmallProfileProps> = ({
  username,
  displayName,
  avatarUrl,
  type,
  onAccept,
  onReject,
  onRemove,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action?: () => Promise<void>) => {
    if (!action) return;
    setLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person-circle" size={40} color="#888" style={styles.icon} />
        )}
        <View style={styles.textSection}>
          <Text style={styles.displayName}>{displayName || 'Unknown User'}</Text>
          {username && <Text style={styles.username}>@{username}</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#585ABF" />
      ) : (
        <View style={styles.actionSection}>
          {type === 'incoming' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAction(onAccept)}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleAction(onReject)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          {type === 'outgoing' && (
            <Text style={styles.pendingText}>Pending</Text>
          )}
          {type === 'connected' && onRemove && (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleAction(onRemove)}
            >
              <Ionicons name="person-remove" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  displayName: {
    fontWeight: 'bold',
    color: '#25292e',
    fontSize: 16,
  },
  username: {
    color: '#585ABF',
    fontSize: 14,
    marginTop: 2,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
  },
  pendingText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default ConnectionSmallProfile;
