import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { authApi } from "../apis/auth";
import { API_CONFIG } from "../apis/config";
import { SocketDestinations } from "./socketEvents";

export interface SocketEvent {
  eventId?: string;
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
  private recentEventKeys: Map<string, number> = new Map();
  private dedupeWindowMs = 2 * 60 * 1000;
  private roomSubscriptions: Map<string, { subscription: any; refCount: number }> =
    new Map();

  connect(): void {
    if (this.client?.connected) {
      console.log("ℹ️ Socket already connected");
      return;
    }

    const token = authApi.getToken();
    if (!token) {
      console.warn("⚠️ No token available, cannot connect socket");
      return;
    }

    // SockJS must use http(s). When the site is served over HTTPS (Vercel),
    // using http:// here will throw: "An insecure SockJS connection..."
    const base =
      API_CONFIG.BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const socketUrl = new URL("/api/social/ws", base).toString();
    console.log(`🔌 Connecting to WebSocket via Gateway at ${socketUrl}...`);
    const socket = new SockJS(socketUrl);
    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("✅ Socket connected successfully to WebSocket server");
        console.log("📡 Subscribing to channels...");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribeToChannels();
        this.resubscribeRooms();
      },
      onDisconnect: () => {
        console.log("❌ Socket disconnected from WebSocket server");
        this.isConnected = false;
        this.subscriptions.clear();
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        this.isConnected = false;
        this.reconnectAttempts++;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            console.log(
              `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
            );
            this.connect();
          }, 5000);
        } else {
          console.error("Max reconnect attempts reached");
        }
      },
      onWebSocketError: (error) => {
        console.error("WebSocket error:", error);
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
    // IMPORTANT: Spring WebSocket uses username (principal name) for /user/{username}/queue/notifications
    // NOT userId! The principal name is set from JWT token's username field
    const username = user.username || user.id; // Fallback to id if username not available
    const notificationPath = SocketDestinations.userNotifications(username);
    console.log(
      `🔔 Subscribing to notifications at: ${notificationPath} (user.id=${user.id}, username=${username})`,
    );

    const notificationSub = this.client.subscribe(
      notificationPath,
      (message: StompMessage) => {
        try {
          const event: SocketEvent = JSON.parse(message.body);
          if (!this.shouldProcessEvent(event)) {
            return;
          }
          console.log("📨 Received notification via socket:", event);
          console.log("📨 Event details:", {
            type: event.type,
            userId: event.userId,
            data: event.data,
            timestamp: event.timestamp,
          });
          // Emit both as NOTIFICATION (for notification handlers) and as the actual event type (e.g., MESSAGE_RECEIVED)
          this.handleEvent("NOTIFICATION", event);
          this.handleEvent(event.type, event); // Emit with actual event type (MESSAGE_RECEIVED, JOIN_REQUEST_CREATED, etc.)
          this.handleEvent("*", event); // Wildcard handler
        } catch (error) {
          console.error(
            "❌ Error parsing notification message:",
            error,
            message.body,
          );
        }
      },
    );
    this.subscriptions.set("notifications", notificationSub);
    console.log(`✅ Subscribed to notifications: ${notificationPath}`);

    // Subscribe to WebRTC signaling events
    const webrtcPath = SocketDestinations.userWebrtc(username);
    console.log(`📞 Subscribing to WebRTC at: ${webrtcPath}`);

    const webrtcSub = this.client.subscribe(
      webrtcPath,
      (message: StompMessage) => {
        try {
          const event: SocketEvent = JSON.parse(message.body);
          if (!this.shouldProcessEvent(event)) {
            return;
          }
          console.log(
            "📞 Received WebRTC event via socket:",
            event.type,
            event,
          );
          this.handleEvent(event.type, event);
          this.handleEvent("*", event); // Wildcard handler
        } catch (error) {
          console.error(
            "❌ Error parsing WebRTC message:",
            error,
            message.body,
          );
        }
      },
    );
    this.subscriptions.set("webrtc", webrtcSub);
    console.log(`✅ Subscribed to WebRTC: ${webrtcPath}`);

    // Subscribe to public events (posts, reactions, etc.)
    const publicSub = this.client.subscribe(
      SocketDestinations.TOPIC_PUBLIC,
      (message: StompMessage) => {
        const event: SocketEvent = JSON.parse(message.body);
        if (!this.shouldProcessEvent(event)) {
          return;
        }
        console.log("📢 Received public event via socket:", event.type, event);
        this.handleEvent(event.type, event);
        this.handleEvent("*", event); // Wildcard handler
      },
    );
    this.subscriptions.set("public", publicSub);
    console.log("✅ Subscribed to public events: /topic/public");
  }

  private handleEvent(type: string, event: SocketEvent): void {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
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
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.roomSubscriptions.forEach((entry) => entry.subscription.unsubscribe());
      this.roomSubscriptions.clear();
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
      console.warn("Socket not connected, cannot send message");
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

  subscribeConversationRoom(conversationId: string): () => void {
    if (!conversationId) {
      return () => undefined;
    }

    const existing = this.roomSubscriptions.get(conversationId);
    if (existing) {
      existing.refCount += 1;
      return () => this.unsubscribeConversationRoom(conversationId);
    }

    const subscription = this.createRoomSubscription(conversationId);
    this.roomSubscriptions.set(conversationId, { subscription, refCount: 1 });
    return () => this.unsubscribeConversationRoom(conversationId);
  }

  private unsubscribeConversationRoom(conversationId: string): void {
    const existing = this.roomSubscriptions.get(conversationId);
    if (!existing) {
      return;
    }

    existing.refCount -= 1;
    if (existing.refCount <= 0) {
      try {
        existing.subscription.unsubscribe();
      } catch {
        // ignore unsubscribe errors
      }
      this.roomSubscriptions.delete(conversationId);
    }
  }

  private createRoomSubscription(conversationId: string): any {
    if (!this.client?.connected) {
      return { unsubscribe: () => undefined };
    }

    const roomPath = SocketDestinations.roomDestination(conversationId);
    return this.client.subscribe(roomPath, (message: StompMessage) => {
      try {
        const event: SocketEvent = JSON.parse(message.body);
        if (!this.shouldProcessEvent(event)) {
          return;
        }
        this.handleEvent(event.type, event);
        this.handleEvent("*", event);
      } catch (error) {
        console.error("❌ Error parsing room message:", error, message.body);
      }
    });
  }

  private resubscribeRooms(): void {
    if (!this.client?.connected) {
      return;
    }

    const roomIds = Array.from(this.roomSubscriptions.keys());
    for (const roomId of roomIds) {
      const state = this.roomSubscriptions.get(roomId);
      if (!state) {
        continue;
      }
      state.subscription = this.createRoomSubscription(roomId);
    }
  }

  private buildEventDedupeKey(event: SocketEvent): string {
    if (event.eventId) {
      return event.eventId;
    }
    const data = event.data as Record<string, any> | undefined;
    const messageId = typeof data?.id === "string" ? data.id : "";
    const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
    const eventDataMessageId = typeof data?.messageId === "string" ? data.messageId : "";
    const ts = event.timestamp || "";
    return `${event.type}:${event.userId || ""}:${conversationId}:${messageId}:${eventDataMessageId}:${ts}`;
  }

  private cleanupOldEventKeys(now: number) {
    for (const [key, seenAt] of this.recentEventKeys.entries()) {
      if (now - seenAt > this.dedupeWindowMs) {
        this.recentEventKeys.delete(key);
      }
    }
  }

  private shouldProcessEvent(event: SocketEvent): boolean {
    const key = this.buildEventDedupeKey(event);
    const now = Date.now();
    this.cleanupOldEventKeys(now);
    if (this.recentEventKeys.has(key)) {
      return false;
    }
    this.recentEventKeys.set(key, now);
    return true;
  }
}

export const socketService = new SocketService();
