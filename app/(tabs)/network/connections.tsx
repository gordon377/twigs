import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, FlatList, Alert, TouchableOpacity } from 'react-native';
import { getConnections } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ConnectionsScreen() {
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getConnections();
        if (result && result.data) {
          setConnections(result.data);
        } else {
          setConnections([]);
        }
      } catch (err: any) {
        setError('Failed to load connections.');
        Alert.alert('Error', 'Failed to load connections.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConnections();
  }, []);

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
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#585ABF" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : connections.length === 0 ? (
        <Text style={styles.text}>No connections found.</Text>
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item, idx) => item.id?.toString() || item.username || idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.connectionItem}>
              <Text style={styles.connectionName}>
                {item.displayName || item.username || 'Unknown User'}
              </Text>
              {/* Add more fields as needed */}
            </View>
          )}
        />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#25292e',
    textAlign: 'left',
  },
  text: {
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
  connectionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  connectionName: {
    fontSize: 18,
    color: '#25292e',
  },
});