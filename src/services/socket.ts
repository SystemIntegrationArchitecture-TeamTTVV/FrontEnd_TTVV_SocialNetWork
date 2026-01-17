import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { authApi } from '../apis/auth';

export interface SocketEvent {
  type: string;
  userId: string;
  data: any;
  timestamp: string;
}

type EventHandler = (event: SocketEvent) => void;

// Message type from STOMP
interface StompMessage {
  body: string;
  headers: Record<string, string>;
  command: string;
  isBinaryBody?: boolean;
}

class SocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.client?.connected) {
      console.log('ℹ️ Socket already connected');
      return;
    }

    const token = authApi.getToken();
    if (!token) {
      console.warn('⚠️ No token available, cannot connect socket');
      return;
    }

    console.log('🔌 Connecting to WebSocket at http://localhost:8081/ws...');
    const socket = new SockJS('http://localhost:8081/ws');
    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('✅ Socket connected successfully to WebSocket server');
        console.log('📡 Subscribing to channels...');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribeToChannels();
      },
      onDisconnect: () => {
        console.log('❌ Socket disconnected from WebSocket server');
        this.isConnected = false;
        this.subscriptions.clear();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, 5000);
        } else {
          console.error('Max reconnect attempts reached');
        }
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
      },
    });

    // Add authentication header if needed
    this.client.configure({
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.client.activate();
  }

  private subscribeToChannels(): void {
    if (!this.client?.connected) {
      return;
    }

    const user = authApi.getCurrentUser();
    if (!user) {
      return;
    }

    // Subscribe to user-specific notifications
    const notificationSub = this.client.subscribe(
      `/user/${user.id}/queue/notifications`,
      (message: StompMessage) => {
        const event: SocketEvent = JSON.parse(message.body);
        console.log('📨 Received notification via socket:', event);
        this.handleEvent('NOTIFICATION', event);
        this.handleEvent('*', event); // Wildcard handler
      }
    );
    this.subscriptions.set('notifications', notificationSub);
    console.log(`✅ Subscribed to notifications: /user/${user.id}/queue/notifications`);

    // Subscribe to public events (posts, reactions, etc.)
    const publicSub = this.client.subscribe(
      '/topic/public',
      (message: StompMessage) => {
        const event: SocketEvent = JSON.parse(message.body);
        console.log('📢 Received public event via socket:', event.type, event);
        this.handleEvent(event.type, event);
        this.handleEvent('*', event); // Wildcard handler
      }
    );
    this.subscriptions.set('public', publicSub);
    console.log('✅ Subscribed to public events: /topic/public');
  }

  private handleEvent(type: string, event: SocketEvent): void {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
    }
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  send(destination: string, body: any): void {
    if (!this.client?.connected) {
      console.warn('Socket not connected, cannot send message');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.client?.connected === true;
  }
}

export const socketService = new SocketService();

// Re-export SocketEvent type for easier imports
export type { SocketEvent };

