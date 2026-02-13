import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, Animated, Easing, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
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
  profile_link?: string;
  email?: string;
  user_id?: string;
};

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const blurTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((query: string) => {
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
              profile_link: profile.profile_link,
              email: profile.email,
              user_id: profile.id,
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
    }, 400);
  }, []);

  // Animate overlay fade in/out when focus changes
  useEffect(() => {
    Animated.timing(overlayAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isFocused, overlayAnim]);

  // Memoize overlay opacity to prevent recalculation
  const overlayOpacity = useMemo(
    () =>
      overlayAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    [overlayAnim]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    setIsFocused(true);
  }, []);

  // Handle blur with delay to allow taps to complete
  const handleBlur = useCallback(() => {
    blurTimeout.current = setTimeout(() => {
      setIsFocused(false);
    }, 200);
  }, []);

  // Memoize navigation handler
  const handleProfilePress = useCallback(
    (profile: Profile) => {
      // Cancel blur to keep results visible during navigation
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current);
        blurTimeout.current = null;
      }
      router.push({
        pathname: '/(tabs)/discover/searchProfile',
        params: {
          username: profile.username,
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.profile_link,
          email: profile.email,
          userId: profile.user_id,
        },
      });
    },
    [router]
  );

  // Render item for FlatList
  const renderProfileItem = useCallback(
    ({ item }: { item: Profile }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          console.log('Profile pressed:', item.username);
          handleProfilePress(item);
        }}
        style={styles.profileTouchable}
      >
        <SmallProfile username={item.username} displayName={item.displayName} />
      </TouchableOpacity>
    ),
    [handleProfilePress]
  );

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: Profile, index: number) => item.user_id || `profile-${index}`, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Search bar - always rendered in same position */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={handleSearch}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </View>
          {isFocused && (
            <Text style={styles.searchHint}>
              Searches must be exact. Use @ to search by username handle or without it to search by display name.
            </Text>
          )}
        </View>

        {/* Content area - switches between default view and results */}
        {!isFocused ? (
          <>
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
        ) : (
          <View style={styles.resultsContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : results.length > 0 ? (
              <FlatList
                data={results}
                renderItem={renderProfileItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={10}
                keyboardShouldPersistTaps="handled"
              />
            ) : search.trim().length > 0 ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No results found.</Text>
              </View>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchBarContainer: {
    marginBottom: 20,
    marginTop: 10,
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
  searchHint: {
    color: '#aaa',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
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
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  profileTouchable: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 16,
    fontStyle: 'italic',
  },
});