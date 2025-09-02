import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type BigProfileProps = {
  username?: string;
  displayName?: string;
  bio?: string;
  email?: string;
  avatarUrl?: string;
  onClose?: () => void;
};

const BigProfile: React.FC<BigProfileProps> = ({ username, displayName, bio, email, avatarUrl, onClose }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#585ABF" />
        </TouchableOpacity>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={96} color="#888" />
          )}
        </View>
        {/* Display Name */}
        <Text style={styles.displayName}>{displayName || 'Unknown User'}</Text>
        {/* Username */}
        {username && <Text style={styles.username}>@{username}</Text>}
        {/* Email */}
        {email && <Text style={styles.email}>{email}</Text>}
        {/* Bio */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Bio</Text>
          <Text style={styles.infoText}>{bio || 'No bio provided.'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  avatarWrapper: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
  },
  displayName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    color: '#585ABF',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    color: '#888',
    fontSize: 15,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#25292e',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  infoText: {
    color: '#25292e',
    fontSize: 15,
  },
});

export default BigProfile;
