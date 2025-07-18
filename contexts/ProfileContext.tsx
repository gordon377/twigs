import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileData {
  // Add your profile data structure here
  [key: string]: any;
}

interface ProfileContextType {
  profileData: ProfileData | null;
  setProfileData: (data: ProfileData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ProfileContext.Provider value={{ 
      profileData, 
      setProfileData, 
      isLoading, 
      setIsLoading 
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
} 