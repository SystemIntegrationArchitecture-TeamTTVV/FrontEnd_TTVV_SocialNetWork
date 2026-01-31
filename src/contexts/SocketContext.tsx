import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { socketService } from '../services/socket';
import type { SocketEvent } from '../services/socket';
import { AuthContext } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  subscribe: (eventType: string, handler: (event: SocketEvent) => void) => () => void;
  send: (destination: string, body: unknown) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  // Get auth context directly - AuthProvider should always wrap SocketProvider
  // If AuthContext is undefined, treat as not authenticated
  const authContextValue = useContext(AuthContext);
  const isAuthenticated = authContextValue?.isAuthenticated ?? false;
  
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if not authenticated
      socketService.disconnect();
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setIsConnected(false), 0);
      return;
    }

    // Connect when authenticated
    console.log('🔌 Attempting to connect socket...');
    socketService.connect();

    // Listen to connection state
    const checkConnection = setInterval(() => {
      const connected = socketService.isSocketConnected();
      setIsConnected(connected);
      if (connected) {
        console.log('✅ Socket connected successfully');
      }
    }, 1000);

    // Subscribe to socket events for testing
    const unsubscribeNotification = socketService.on('NOTIFICATION', (event) => {
      console.log('🔔 Notification received via socket:', event);
    });

    const unsubscribeAll = socketService.on('*', (event) => {
      console.log('📡 Socket event received:', event.type, event);
    });

    return () => {
      clearInterval(checkConnection);
      unsubscribeNotification();
      unsubscribeAll();
      socketService.disconnect();
      console.log('🔌 Socket disconnected');
    };
  }, [isAuthenticated]);

  const subscribe = (eventType: string, handler: (event: SocketEvent) => void) => {
    return socketService.on(eventType, handler);
  };

  const send = (destination: string, body: unknown) => {
    socketService.send(destination, body);
  };

  return (
    <SocketContext.Provider value={{ isConnected, subscribe, send }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

