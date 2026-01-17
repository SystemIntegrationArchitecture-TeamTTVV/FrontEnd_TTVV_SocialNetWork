import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { socketService } from '../services/socket';
import type { SocketEvent } from '../services/socket';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  subscribe: (eventType: string, handler: (event: SocketEvent) => void) => () => void;
  send: (destination: string, body: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if not authenticated
      socketService.disconnect();
      setIsConnected(false);
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

  const send = (destination: string, body: any) => {
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

