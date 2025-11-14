import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getConnections } from '@/utils/api';

// Explicitly define the connection data structure
export interface ConnectionData {
  uuid: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  username: string;
  bio: string;
  avatarImage: string; // URL or base64 string
}

interface ConnectionsContextType {
  connections: ConnectionData[];
  setConnections: (data: ConnectionData[]) => void;
  isLoadingConnections: boolean; // ✅ Renamed for clarity
  setIsLoadingConnections: (loading: boolean) => void; // ✅ Specific name
  refreshConnections: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false); // ✅ Renamed state
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch connections on mount
  useEffect(() => {
    refreshConnections();
  }, []);

  // ✅ Refresh connections function - fetches latest from cloud
  const refreshConnections = async () => {
    try {
      setError(null);
      const connectionsData = await getConnections();
      if (connectionsData && Array.isArray(connectionsData)) {
        // Map/validate each connection to ensure it matches ConnectionData
        const formattedConnections = connectionsData.map((conn: any) => ({
          uuid: conn.uuid,
          email: conn.email,
          phoneNumber: conn.phoneNumber,
          displayName: conn.displayName,
          username: conn.username,
          bio: conn.bio,
          avatarImage: conn.avatarImage,
        }));
        setConnections(formattedConnections);
      }
    } catch (err: any) {
      console.error('Error fetching connections:', err);
      setError(err.message || 'Failed to fetch connections');
    }
  };

  return (
    <ConnectionsContext.Provider value={{
      connections,
      setConnections,
      isLoadingConnections,
      setIsLoadingConnections,
      refreshConnections,
      error,
      setError,
    }}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (context === undefined) {
    throw new Error('useConnections must be used within a ConnectionsProvider');
  }
  return context;
}

// ✅ Export types for use in components
export type { ConnectionsContextType };