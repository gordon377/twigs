import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Animated, Easing, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchProfiles } from '@/utils/api';
import SmallProfile from '@/components/SmallProfile';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

type Profile = {
  username?: string;
  displayName?: string;
  bio?: string;
};

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Debounce logic
  const debounceTimeout = useRef<number | null>(null);

  const handleSearch = (query: string) => {
    setSearch(query);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    setIsLoading(true);
    debounceTimeout.current = setTimeout(async () => {
      if (query.trim().length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      try {
        let searchParams;
        if (query.startsWith('@')) {
          searchParams = { username: query.slice(1) };
        } else {
          searchParams = { display_name: query };
        }
        const response = await searchProfiles(searchParams);
        if (response?.success && Array.isArray(response.data?.profiles)) {
          setResults(
            response.data.profiles.map((profile: any) => ({
              username: profile.username,
              displayName: profile.displayName,
              bio: profile.bio,
            }))
          );
        } else {
          setResults([]);
        }
      } catch (error) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce
  };

  // Animate overlay fade in/out when focus changes
  useEffect(() => {
    Animated.timing(overlayAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFocused, overlayAnim]);

  // Overlay opacity animation
  const overlayOpacity = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* If not focused, show header and main content. If focused, show overlay with search bar inside */}
      {!isFocused && (
        <>
          <View style={styles.header}>
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBarWrapper}>
                <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchBar}
                  placeholder="Search..."
                  placeholderTextColor="#888"
                  value={search}
                  onChangeText={handleSearch}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            </View>
          </View>
          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="compass" size={28} color="#222" style={styles.compassIcon} />
              <Text style={styles.title}>Discover</Text>
            </View>
            <Text style={styles.subtitle}>Find new events, people, and communities.</Text>
          </View>
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>More features coming soon...</Text>
          </View>
        </>
      )}

      {isFocused && (
        <Animated.View
          pointerEvents="auto"
          style={[styles.overlay, { opacity: overlayOpacity }]}
        >
          {/* Search bar inside overlay */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBarWrapper}>
              <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchBar}
                placeholder="Search..."
                placeholderTextColor="#888"
                value={search}
                onChangeText={handleSearch}
                autoFocus
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
            <Text style={styles.searchHint}>
              Searches must be exact. Use @ to search by username handle or without it to search by display name.
            </Text>
          </View>
          {/* Search results below search bar */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : results.length > 0 ? (
            results.map((profile, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/discover/searchProfile',
                    params: {
                      username: profile.username,
                      displayName: profile.displayName,
                      bio: profile.bio,
                    },
                  });
                }}
              >
                <SmallProfile username={profile.username} displayName={profile.displayName} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No results found.</Text>
            </View>
          )}

          {/* BigProfile modal (no longer used, navigation instead) */}
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 0,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingBottom: 0,
    zIndex: 20,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 99,
    paddingHorizontal: 20,
    paddingTop: 60,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 16,
    fontStyle: 'italic',
  },
  comingSoonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    color: '#bbb',
    fontSize: 15,
    fontStyle: 'italic',
  },
  searchHint: {
    color: '#aaa',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
});