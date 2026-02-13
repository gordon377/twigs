import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';
import { colors, SIZES } from '@/styles/styles';

export function HomeHeader() {
  const { profileData, profilePicture } = useProfile();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const getInitials = () => {
    if (profileData?.displayName) {
      return profileData.displayName.charAt(0).toUpperCase();
    }
    if (profileData?.data?.displayName) {
      return profileData.data.displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleProfilePress = () => {
    console.log('Profile pressed - TODO: Navigate to profile');
  };

  const handleAboutUs = () => {
    setMenuVisible(false);
    router.push('/home/about');
  };

  const handleChangelog = () => {
    setMenuVisible(false);
    router.push('/home/changelog');
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleMenuPress}
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={28} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Twigs</Text>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
          accessibilityLabel="View profile"
        >
          {profilePicture ? (
            <Image
              source={{ uri: URL.createObjectURL(profilePicture) }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.initials}>{getInitials()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleAboutUs}>
              <Ionicons name="information-circle-outline" size={22} color={colors.text} />
              <Text style={styles.menuItemText}>About Us</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleChangelog}>
              <Ionicons name="list-outline" size={22} color={colors.text} />
              <Text style={styles.menuItemText}>Changelog</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    height: 64,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  profileButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  initials: {
    color: colors.white,
    fontSize: SIZES.font.md,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    marginTop: 64 + 8, // Header height + small gap
    marginLeft: SIZES.spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
  },
  menuItemText: {
    fontSize: SIZES.font.md,
    fontWeight: '600',
    color: colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: SIZES.spacing.md,
  },
});
