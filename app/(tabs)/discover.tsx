import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchProfiles } from '@/utils/api';
import SmallProfile from '@/components/SmallProfile';

type Profile = {
  username?: string;
  displayName?: string;
};

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);

  // Debounce logic
  const debounceTimeout = useRef<number | null>(null);

  const handleSearch = (query: string) => {
    setSearch(query);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }
      try {
        const response = await searchProfiles({ username: query });
        if (response?.success && Array.isArray(response.data?.profiles)) {
          setResults(
            response.data.profiles.map((profile: any) => ({
              username: profile.username,
              displayName: profile.displayName,
            }))
          );
        } else {
          setResults([]);
        }
      } catch (error) {
        setResults([]);
      }
    }, 400); // 400ms debounce
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Ionicons name="compass" size={28} color="#222" style={styles.compassIcon} />
          <Text style={styles.title}>Discover</Text>
        </View>
        <Text style={styles.subtitle}>Find new events, people, and communities.</Text>
      </View>          
      <View>
        {results.length > 0 ? (
          results.map((profile, idx) => (
            <SmallProfile key={idx} username={profile.username} displayName={profile.displayName} />
          ))
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>No results found.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  searchBarContainer: {
    marginBottom: 20,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    color: '#222',
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compassIcon: {
    marginRight: 8,
  },
  title: {
    color: '#222',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 16,
    fontStyle: 'italic',
  },
});