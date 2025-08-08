// Create: contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { updateProfile } from '@/utils/api';
import { useProfile } from '@/contexts/ProfileContext';
import { router } from 'expo-router';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setProfileData, setIsLoading: setProfileLoading } = useProfile();

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Checking authentication status...');
      
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      if (accessToken && refreshToken) {
        console.log('✅ Tokens found, attempting auto-login...');
        
        try {
          await updateProfile(setProfileData, setProfileLoading);
          setIsAuthenticated(true);
          console.log('✅ Auto-login successful');
          
          // ✅ FIXED: Use replace to clear stack
          router.replace('/(tabs)/profile');
        } catch (error) {
          console.log('❌ Token validation failed:', error);
          
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          
          setIsAuthenticated(false);
          // ✅ FIXED: Use replace
          router.replace('/');
        }
      } else {
        console.log('❌ No tokens found');
        setIsAuthenticated(false);
        // ✅ FIXED: Use replace
        router.replace('/');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setIsAuthenticated(false);
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setIsAuthenticated(false);
      // ✅ FIXED: Use replace to prevent going back
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check auth status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

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