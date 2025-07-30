import { Share, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

// Types
export interface ShareData {
  userId: string;
  action: 'connect' | 'event' | 'profile';
  eventId?: string;
  userName?: string;
}

// Deep Link Generation - Simplified for development builds
export const generateDeepLink = (data: ShareData): string => {
  const { userId, action, eventId } = data;
  
  // For development builds, always use your custom scheme
  return `twigsApp://${action}?userId=${userId}${eventId ? `&eventId=${eventId}` : ''}`;
};

// QR Code Data (same as deep link)
export const generateQRData = (data: ShareData): string => {
  return generateDeepLink(data);
};

// Sharing Functions
export const shareConnection = async (data: ShareData) => {
  try {
    const link = generateDeepLink(data);
    const message = getShareMessage(data.action, link, data.userName);
    
    await Share.share({
      message,
      title: 'Connect on Twigs',
    });
  } catch (error) {
    console.error('Error sharing:', error);
    Alert.alert('Error', 'Failed to share. Please try again.');
  }
};

// Deep Link Handling
export const handleDeepLink = (url: string) => {
  try {
    const { queryParams } = Linking.parse(url);
    const params = queryParams as any;
    
    console.log('Deep link received:', { url, params });
    
    switch (params.action) {
      case 'connect':
        if (params.userId) {
          router.push(`/connect?userId=${params.userId}`);
        }
        break;
      case 'event':
        if (params.eventId) {
          router.push(`/calendar/event/${params.eventId}`);
        }
        break;
      case 'profile':
        if (params.userId) {
          router.push(`/profile/user/${params.userId}`);
        }
        break;
      default:
        console.log('Unknown deep link action:', params.action);
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
};

// Setup Deep Link Listener
export const setupSharing = () => {
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLink(event.url);
  });

  // Handle app opened with deep link when closed
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('Initial URL:', url);
      handleDeepLink(url);
    }
  });

  return () => subscription?.remove();
};

// Helper Functions
const getShareMessage = (action: string, link: string, userName?: string): string => {
  const baseMessage = userName ? `Connect with ${userName} on Twigs!` : 'Connect with me on Twigs!';
  
  return `${baseMessage}

If you don't have the app yet:
📱 iOS: Download from App Store
🤖 Android: Download from Google Play

Then scan this QR code or tap this link: ${link}`;
};

export const copyLink = async (data: ShareData) => {
  try {
    const link = generateDeepLink(data);
    // await Clipboard.setStringAsync(link); // Install expo-clipboard
    Alert.alert('Link Copied', 'The connection link has been copied to your clipboard.');
  } catch (error) {
    Alert.alert('Error', 'Failed to copy link. Please try again.');
  }
};