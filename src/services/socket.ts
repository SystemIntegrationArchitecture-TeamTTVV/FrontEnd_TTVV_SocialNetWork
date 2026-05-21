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
  private roomSubscriptions: Map<string, { subscription: any | null; refCount: number }> =
    new Map();

  connect(): void {
    if (this.client?.active) {
      console.log("ℹ️ Socket already connected or connecting");
      return;
    }

    const token = authApi.getToken();
    if (!token) {
      console.warn("⚠️ No token available, cannot connect socket");
      return;
    }

    // Cleanup previous client to avoid SockJS instance leak
    if (this.client) {
      try { this.client.deactivate(); } catch { /* ignore */ }
      this.client = null;
    }

    // Connect directly to SocialService for WebSocket (bypasses Gateway auth issues)
    const base = API_CONFIG.COMMON_SERVICE_URL || "http://localhost:8081";
    const socketUrl = new URL("/ws", base);
    socketUrl.searchParams.set("token", token);
    console.log(`🔌 Connecting to WebSocket directly at ${socketUrl.toString()}...`);
    this.client = new Client({
      // IMPORTANT: return a NEW SockJS instance for each (re)connect attempt.
      // Reusing a single instance can make reconnect unstable after disconnect/HMR.
      webSocketFactory: () => new SockJS(socketUrl.toString()),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("✅ Socket connected successfully to WebSocket server");
        console.log("📡 Subscribing to channels...");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.recentEventKeys.clear();
        this.subscribeToChannels();
        this.resubscribeRooms();
        // Emit internal connection event for event-driven tracking
        this.handleEvent("__CONNECTED__", { type: "__CONNECTED__", userId: "", data: null, timestamp: "" });
      },
      onDisconnect: () => {
        console.log("❌ Socket disconnected from WebSocket server");
        this.isConnected = false;
        this.subscriptions.clear();
        this.recentEventKeys.clear();
        // Emit internal disconnection event
        this.handleEvent("__DISCONNECTED__", { type: "__DISCONNECTED__", userId: "", data: null, timestamp: "" });
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        this.isConnected = false;
        // STOMP client handles reconnection automatically via reconnectDelay.
        // Do NOT manually reconnect here — avoids double reconnect storms.
        console.warn("STOMP error occurred, auto-reconnect will handle recovery");
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

    const handleUserEvent = (message: StompMessage, channelLabel: string) => {
      try {
        const event: SocketEvent = JSON.parse(message.body);
        if (!this.shouldProcessEvent(event)) {
          return;
        }
        console.log(`📨 Received ${channelLabel} via socket:`, event);
        console.log("📨 Event details:", {
          type: event.type,
          userId: event.userId,
          data: event.data,
          timestamp: event.timestamp,
        });
        // Emit both as NOTIFICATION (for notification handlers) and as the actual event type (e.g., MESSAGE_RECEIVED)
        this.handleEvent("NOTIFICATION", event);
        this.handleEvent(event.type, event);
        this.handleEvent("*", event);
      } catch (error) {
        console.error(
          `❌ Error parsing ${channelLabel} message:`,
          error,
          message.body,
        );
      }
    };

    const notificationSub = this.client.subscribe(
      notificationPath,
      (message: StompMessage) => handleUserEvent(message, "notification"),
    );
    this.subscriptions.set("notifications", notificationSub);
    console.log(`✅ Subscribed to notifications: ${notificationPath}`);

    // Fallback destination style used by Spring's user-destination resolver in many setups.
    // Keep both subscriptions; duplicates are filtered by eventId-based dedupe.
    const fallbackNotificationPath = "/user/queue/notifications";
    const notificationFallbackSub = this.client.subscribe(
      fallbackNotificationPath,
      (message: StompMessage) => handleUserEvent(message, "notification(fallback)"),
    );
    this.subscriptions.set("notifications-fallback", notificationFallbackSub);
    console.log(`✅ Subscribed to fallback notifications: ${fallbackNotificationPath}`);

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

    const fallbackWebrtcPath = "/user/queue/webrtc";
    const webrtcFallbackSub = this.client.subscribe(
      fallbackWebrtcPath,
      (message: StompMessage) => {
        try {
          const event: SocketEvent = JSON.parse(message.body);
          if (!this.shouldProcessEvent(event)) {
            return;
          }
          console.log(
            "📞 Received WebRTC event via fallback socket:",
            event.type,
            event,
          );
          this.handleEvent(event.type, event);
          this.handleEvent("*", event);
        } catch (error) {
          console.error(
            "❌ Error parsing fallback WebRTC message:",
            error,
            message.body,
          );
        }
      },
    );
    this.subscriptions.set("webrtc-fallback", webrtcFallbackSub);
    console.log(`✅ Subscribed to fallback WebRTC: ${fallbackWebrtcPath}`);

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

    console.log(`📤 Sending STOMP message to ${destination}:`, body);

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
      // If room was added while disconnected, attach real STOMP subscription now.
      if (!existing.subscription && this.client?.connected) {
        existing.subscription = this.createRoomSubscription(conversationId);
      }
      existing.refCount += 1;
      console.log(`🏠 Room ${conversationId}: refCount++ → ${existing.refCount}`);
      return () => this.unsubscribeConversationRoom(conversationId);
    }

    console.log(`🏠 Subscribing to room: ${conversationId}, client connected: ${this.client?.connected}`);
    if (!this.client?.connected) {
      // Keep pending room intent; it will be attached in onConnect/resubscribeRooms.
      this.roomSubscriptions.set(conversationId, { subscription: null, refCount: 1 });
      if (!this.client?.active) {
        this.connect();
      }
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
        existing.subscription?.unsubscribe();
      } catch {
        // ignore unsubscribe errors
      }
      this.roomSubscriptions.delete(conversationId);
    }
  }

  private createRoomSubscription(conversationId: string): any {
    if (!this.client?.connected) {
      console.warn(`⚠️ Cannot subscribe to room ${conversationId}: client not connected`);
      return { unsubscribe: () => undefined };
    }

    const roomPath = SocketDestinations.roomDestination(conversationId);
    console.log(`🏠 STOMP subscribing to: ${roomPath}`);
    return this.client.subscribe(roomPath, (message: StompMessage) => {
      try {
        const event: SocketEvent = JSON.parse(message.body);
        console.log(`🏠 Room ${conversationId} received:`, event.type);
        if (!this.shouldProcessEvent(event)) {
          console.log(`🏠 Room ${conversationId}: event deduped`);
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

    // WebRTC signaling events: dedupe by callId + sender to prevent double-processing
    // from primary + fallback channels. Do NOT use timestamp (it may differ per channel).
    const webrtcTypes = ["CALL_OFFER", "CALL_ANSWER", "CALL_END", "CALL_REJECT",
      "ICE_CANDIDATE", "CALL_ICE_CANDIDATE", "CALL_USER_JOINED", "CALL_USER_LEFT"];
    if (webrtcTypes.includes(event.type)) {
      const callId = typeof data?.callId === "string" ? data.callId : "";
      const roomId = typeof data?.roomId === "string" ? data.roomId : "";
      const senderId = typeof data?.senderId === "string" ? data.senderId
        : typeof data?.callerId === "string" ? data.callerId : "";
      // For ICE candidates, include the candidate's sdpMLineIndex to differentiate
      const candidate = data?.candidate || data?.iceCandidate;
      const iceSuffix = candidate
        ? `:${candidate.sdpMLineIndex ?? ""}:${(candidate.candidate || "").slice(0, 60)}`
        : "";
      return `${event.type}:${callId}:${roomId}:${senderId}${iceSuffix}`;
    }
    // Livestream status events: viewer count updates happen frequently with the same
    // streamId but different values. Use the actual value in the key to avoid dropping updates.
    const liveStatusTypes = ["LIVE_VIEWER_COUNT", "LIVE_CHAT"];
    if (liveStatusTypes.includes(event.type)) {
      const streamId = typeof data?.streamId === "string" ? data.streamId : "";
      const viewerCount = data?.viewerCount != null ? String(data.viewerCount) : "";
      const content = typeof data?.content === "string" ? data.content.slice(0, 40) : "";
      const userId = typeof data?.userId === "string" ? data.userId : "";
      const ts = event.timestamp || String(Date.now());
      return `${event.type}:${streamId}:${viewerCount}:${userId}:${content}:${ts}`;
    }

    // Livestream events that should never be deduped (each occurrence is unique)
    const liveNoDedupe = ["LIVE_ENDED", "LIVE_GIFT_RECEIVED", "LIVE_VIEWER_APPROVED", "LIVE_KICKED"];
    if (liveNoDedupe.includes(event.type)) {
      return `${event.type}:${Date.now()}:${Math.random()}`;
    }

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
