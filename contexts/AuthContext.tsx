// Update: contexts/AuthContext.tsx - Robust splash screen control
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { updateProfile, logOut as apiLogOut } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { router } from 'expo-router';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Prevent splash screen from hiding at module level
SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('Splash screen already controlled');
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [splashReady, setSplashReady] = useState(false); // ✅ Track splash screen state
  const { setProfileData, setIsLoading: setProfileLoading } = useProfile();

  const hideSplashScreen = async () => {
    try {
      console.log('🫥 Hiding splash screen...');
      await SplashScreen.hideAsync();
      console.log('✅ Splash screen hidden successfully');
    } catch (error) {
      console.log('❌ Error hiding splash screen:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      if (accessToken && refreshToken) {
        console.log('✅ Tokens found, attempting auto-login...');
        
        try {
          await updateProfile(setProfileData, setProfileLoading);
          setIsAuthenticated(true);
          console.log('✅ Auto-login successful');
          
          // ✅ Navigate after state update
          setTimeout(() => {
            router.replace('/(tabs)/profile');
          }, 100);
        } catch (error) {
          console.log('❌ Token validation failed:', error);
          
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          
          setIsAuthenticated(false);
          setTimeout(() => {
            router.replace('/');
          }, 100);
        }
      } else {
        console.log('❌ No tokens found');
        setIsAuthenticated(false);
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setIsAuthenticated(false);
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } finally {
      console.log('🏁 Auth check completed');
      setIsLoading(false);
      setSplashReady(true); // ✅ Mark splash as ready to hide
    }
  };

  // ✅ Hide splash screen when both auth is done AND UI is ready
  useEffect(() => {
    SplashScreen.setOptions({
      duration: 800,           // ✅ Fade duration in milliseconds
      fade: true,              // ✅ Enable/disable fade transition
      // Platform-specific options may be available
    });
    if (!isLoading && splashReady) {
      console.log('🎯 Both auth and splash are ready, hiding splash screen');
      
      // ✅ Wait for UI to render, then hide splash screen
      const hideTimer = setTimeout(() => {
        // ✅ Use requestAnimationFrame to ensure UI is rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            hideSplashScreen();
          });
        });
      }, 500); // ✅ Minimum display time for splash screen

      return () => clearTimeout(hideTimer);
    }
  }, [isLoading, splashReady]);

  const logout = async () => {
    try {
      await apiLogOut(() => {}, { replace: () => {} });
      setIsAuthenticated(false);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setIsAuthenticated(false);
      router.replace('/');
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect running');
    
    const initializeAuth = async () => {
      console.log('🔧 initializeAuth starting');
      
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        // ✅ Fallback: mark as ready even if auth fails
        setIsLoading(false);
        setSplashReady(true);
      }
    };

    initializeAuth();
  }, []); // ✅ Empty dependency array

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    checkAuthStatus,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}