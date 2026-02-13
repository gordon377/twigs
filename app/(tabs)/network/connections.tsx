import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Share, RefreshControl } from 'react-native';
import { getConnections, acceptConnectionRequest, rejectConnectionRequest, removeConnection, searchProfiles } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ConnectionSmallProfile from '@/components/ConnectionSmallProfile';
import { useProfile } from '@/contexts/ProfileContext';

type ConnectionWithProfile = {
  userId: string;
  connectionId: string;
  followerId: string;
  followedId: string;
  status: string;
  type: 'incoming' | 'outgoing' | 'connected';
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  loading: boolean;
};

export default function ConnectionsScreen() {
  const [incomingRequests, setIncomingRequests] = useState<ConnectionWithProfile[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionWithProfile[]>([]);
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]); // You see updates from
  const [theySeeUpdates, setTheySeeUpdates] = useState<ConnectionWithProfile[]>([]); // They see your updates
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { profileData } = useProfile();

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await searchProfiles({ user_id: userId });
      if (response?.success && response.data?.profiles?.length > 0) {
        const profile = response.data.profiles[0];
        return {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.profile_link,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const loadConnections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getConnections();
      console.log('Connections result:', result);

      if (result?.success && result.data?.data) {
        const connectionsData = Array.isArray(result.data.data) ? result.data.data : [];

        // Get current user ID from profile context
        const currentUserId = profileData?.user_id || profileData?.data?.user_id || profileData?.id;
        console.log('Current user ID:', currentUserId);

        if (!currentUserId) {
          console.warn('Could not determine current user ID');
        }

        // Partition connections by type
        const incoming: ConnectionWithProfile[] = [];
        const outgoing: ConnectionWithProfile[] = [];
        const youSeeUpdates: ConnectionWithProfile[] = []; // You follow them
        const theySeeUpdates: ConnectionWithProfile[] = []; // They follow you

        for (const conn of connectionsData) {
          const followedUserId = conn.followed?.id;
          const followerUserId = conn.follower?.id;
          const followedData = conn.followed;
          const followerData = conn.follower;
          const connectionId = conn.connection_id;

          if (!connectionId) {
            console.warn('Connection missing connection_id:', conn);
            continue;
          }

          let userId: string | undefined;
          let userData: any;
          let type: 'incoming' | 'outgoing' | 'connected';

          if (conn.status === 'pending') {
            // Determine direction based on current user
            if (currentUserId === followerUserId) {
              // Current user is the follower = OUTGOING request
              type = 'outgoing';
              userId = followedUserId;
              userData = followedData;
            } else if (currentUserId === followedUserId) {
              // Current user is the followed = INCOMING request
              type = 'incoming';
              userId = followerUserId;
              userData = followerData;
            } else {
              // Can't determine, skip this connection
              console.warn('Could not determine direction for connection:', conn);
              continue;
            }
          } else if (conn.status === 'accepted') {
            type = 'connected';
            // Determine direction for accepted connections
            if (currentUserId === followerUserId) {
              // Current user follows them = "You see updates from"
              userId = followedUserId;
              userData = followedData;
            } else {
              // They follow current user = "They see your updates"
              userId = followerUserId;
              userData = followerData;
            }
          } else {
            continue; // Skip unknown statuses
          }

          if (userId && userData) {
            const connectionObj: ConnectionWithProfile = {
              userId,
              connectionId,
              followerId: followerUserId!,
              followedId: followedUserId!,
              status: conn.status,
              type,
              username: userData.username,
              displayName: userData.displayName,
              avatarUrl: userData.profile_link,
              loading: false, // We already have the user data
            };

            if (type === 'incoming') {
              incoming.push(connectionObj);
            } else if (type === 'outgoing') {
              outgoing.push(connectionObj);
            } else {
              // Split accepted connections by direction
              if (currentUserId === followerUserId) {
                youSeeUpdates.push(connectionObj);
              } else {
                theySeeUpdates.push(connectionObj);
              }
            }
          }
        }

        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
        setConnections(youSeeUpdates);
        setTheySeeUpdates(theySeeUpdates);

        // No need to fetch profiles separately since we already have the data
        // from the follower/followed objects in the API response
      } else {
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setConnections([]);
        setTheySeeUpdates([]);
      }
    } catch (err: any) {
      console.error('Error loading connections:', err);
      setError('Failed to load connections.');
      Alert.alert('Error', 'Failed to load connections.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConnections();
    setRefreshing(false);
  }, []);

  const handleAccept = async (userId: string) => {
    console.log('handleAccept called for userId:', userId);
    try {
      const result = await acceptConnectionRequest(userId);
      console.log('Accept result:', result);
      if (result.success) {
        Alert.alert('Success', 'Connection request accepted!');
        await loadConnections();
      } else {
        console.error('Accept failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to accept connection request');
      }
    } catch (error) {
      console.error('Exception in handleAccept:', error);
      Alert.alert('Error', 'Failed to accept connection request');
    }
  };

  const handleReject = async (userId: string) => {
    console.log('handleReject called for userId:', userId);
    try {
      const result = await rejectConnectionRequest(userId);
      console.log('Reject result:', result);
      if (result.success) {
        Alert.alert('Success', 'Connection request rejected');
        await loadConnections();
      } else {
        console.error('Reject failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to reject connection request');
      }
    } catch (error) {
      console.error('Exception in handleReject:', error);
      Alert.alert('Error', 'Failed to reject connection request');
    }
  };

  const handleRemove = async (followerId: string, followedId: string) => {
    console.log('handleRemove called for followerId:', followerId, 'followedId:', followedId);
    Alert.alert(
      'Remove Connection',
      'Are you sure you want to remove this connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeConnection(followerId, followedId);
              console.log('Remove result:', result);
              if (result.success) {
                Alert.alert('Success', 'Connection removed');
                await loadConnections();
              } else {
                console.error('Remove failed:', result.error);
                Alert.alert('Error', result.error || 'Failed to remove connection');
              }
            } catch (error) {
              console.error('Exception in handleRemove:', error);
              Alert.alert('Error', 'Failed to remove connection');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Join me on Twigs! Connect and discover new events together.',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invitation.');
    }
  };

  const totalConnections = incomingRequests.length + outgoingRequests.length + connections.length + theySeeUpdates.length;
  const showEmptyState = !isLoading && totalConnections === 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#25292e" />
        </TouchableOpacity>
        <Text style={styles.title}>Connections</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={24} color="#585ABF" />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#585ABF" />
          <Text style={styles.loadingText}>Loading connections...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : showEmptyState ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" style={styles.emptyIcon} />
          <Text style={styles.emptyStateTitle}>No Connections Yet</Text>
          <Text style={styles.emptyStateText}>
            Start making connections by discovering new people and events.
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Ionicons name="compass" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.discoverButtonText}>Go to Discover</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#585ABF']} />
          }
        >
          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="mail" size={18} color="#585ABF" /> Requests to See Your Updates ({incomingRequests.length})
              </Text>
              {incomingRequests.map((conn, idx) => (
                <ConnectionSmallProfile
                  key={`incoming-${conn.userId}-${idx}`}
                  username={conn.username}
                  displayName={conn.displayName}
                  avatarUrl={conn.avatarUrl}
                  type="incoming"
                  onAccept={() => handleAccept(conn.userId)}
                  onReject={() => handleReject(conn.userId)}
                />
              ))}
            </View>
          )}

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="paper-plane" size={18} color="#585ABF" /> Requests to See Updates ({outgoingRequests.length})
              </Text>
              {outgoingRequests.map((conn, idx) => (
                <ConnectionSmallProfile
                  key={`outgoing-${conn.userId}-${idx}`}
                  username={conn.username}
                  displayName={conn.displayName}
                  avatarUrl={conn.avatarUrl}
                  type="outgoing"
                />
              ))}
            </View>
          )}

          {/* You See Updates From */}
          {connections.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="eye-outline" size={18} color="#585ABF" /> You See Updates From ({connections.length})
              </Text>
              {connections.map((conn, idx) => (
                <ConnectionSmallProfile
                  key={`you-see-${conn.userId}-${idx}`}
                  username={conn.username}
                  displayName={conn.displayName}
                  avatarUrl={conn.avatarUrl}
                  type="connected"
                  onRemove={() => handleRemove(conn.followerId, conn.followedId)}
                />
              ))}
            </View>
          )}

          {/* They See Your Updates */}
          {theySeeUpdates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="eye" size={18} color="#585ABF" /> They See Your Updates ({theySeeUpdates.length})
              </Text>
              {theySeeUpdates.map((conn, idx) => (
                <ConnectionSmallProfile
                  key={`they-see-${conn.userId}-${idx}`}
                  username={conn.username}
                  displayName={conn.displayName}
                  avatarUrl={conn.avatarUrl}
                  type="connected"
                  onRemove={() => handleRemove(conn.followerId, conn.followedId)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#25292e',
    textAlign: 'left',
  },
  shareButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 12,
    paddingLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#585ABF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  discoverButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
