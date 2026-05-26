import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { socketService } from '../services/socket';
import type { SocketEvent } from '../services/socket';
import { SocketEventTypes } from '../services/socketEvents';
import { AuthContext } from './AuthContext';
import FriendSocketListener from '../components/FriendSocketListener';
import PrivacyBlockedToast from '../components/PrivacyBlockedToast';

interface SocketContextType {
  isConnected: boolean;
  subscribe: (eventType: string, handler: (event: SocketEvent) => void) => () => void;
  subscribeConversationRoom: (conversationId: string) => () => void;
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

    // Event-driven connection tracking (replaces CPU-wasting setInterval polling)
    const unsubConnect = socketService.on('__CONNECTED__', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
    });
    const unsubDisconnect = socketService.on('__DISCONNECTED__', () => {
      setIsConnected(false);
    });

    // Subscribe to socket events for testing
    const unsubscribeNotification = socketService.on('NOTIFICATION', (event) => {
      console.log('🔔 Notification received via socket:', event);
    });


    const unsubscribeAll = socketService.on('*', (event) => {
      console.log('📡 Socket event received:', event.type, event);
    });

    // ── Privacy: listen for blocked messages ──
    const unsubscribeBlocked = socketService.on(SocketEventTypes.MESSAGE_BLOCKED, (event) => {
      console.warn('🚫 Message blocked by privacy settings:', event);
      const reason = (event as any).payload?.reason || event.data?.reason;
      const msg = reason === 'PRIVACY_FRIENDS_ONLY'
        ? 'Không thể gửi tin nhắn: người nhận chỉ chấp nhận tin nhắn từ bạn bè.'
        : 'Tin nhắn bị chặn do cài đặt quyền riêng tư.';
      // Show native notification-style alert (works everywhere without toast library)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('privacy-blocked', { detail: { message: msg, reason } }));
      }
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubscribeNotification();
      unsubscribeAll();
      unsubscribeBlocked();
      socketService.disconnect();
      console.log('🔌 Socket disconnected');
    };
  }, [isAuthenticated]);

  // ⚡ CRITICAL: Stable references prevent consumer effects from re-subscribing on every render.
  // Without useCallback, every SocketProvider render creates new function references,
  // causing ALL useEffect([..., subscribe]) in consumers (useMessages, ChatBoxContext, etc.)
  // to unsubscribe→resubscribe, creating a race condition that misses socket events.
  const subscribe = useCallback((eventType: string, handler: (event: SocketEvent) => void) => {
    return socketService.on(eventType, handler);
  }, []);

  const subscribeConversationRoom = useCallback((conversationId: string) => {
    return socketService.subscribeConversationRoom(conversationId);
  }, []);

  const send = useCallback((destination: string, body: unknown) => {
    socketService.send(destination, body);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const contextValue = useMemo(() => ({
    isConnected, subscribe, subscribeConversationRoom, send,
  }), [isConnected, subscribe, subscribeConversationRoom, send]);

  return (
    <SocketContext.Provider value={contextValue}>
      <FriendSocketListener />
      <PrivacyBlockedToast />
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

