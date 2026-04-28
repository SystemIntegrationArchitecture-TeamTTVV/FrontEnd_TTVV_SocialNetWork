/**
 * Socket Event Types — phải đồng bộ với backend SocketEventTypes.java
 *
 * Khi thêm event mới:
 *  1. Thêm vào CommonService SocketEventTypes.java
 *  2. Mirror sang MessegeService SocketEventTypes.java
 *  3. Thêm vào đây
 */
export const SocketEventTypes = {
  // ── Message Events ──
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_DELETED: "MESSAGE_DELETED",
  MESSAGE_DELETED_FOR_ME: "MESSAGE_DELETED_FOR_ME",
  MESSAGE_SEEN: "MESSAGE_SEEN",
  MESSAGE_DELIVERED: "MESSAGE_DELIVERED",
  TYPING: "TYPING",
  MESSAGE_EDITED: "MESSAGE_EDITED",
  MESSAGE_PINNED: "MESSAGE_PINNED",
  MESSAGE_REACTED: "MESSAGE_REACTED",
  MESSAGE_BLOCKED: "MESSAGE_BLOCKED",

  // ── Conversation Events ──
  CONVERSATION_CLEARED: "CONVERSATION_CLEARED",
  CONVERSATION_RESTORED: "CONVERSATION_RESTORED",
  CONVERSATION_META_UPDATED: "CONVERSATION_META_UPDATED",

  // ── Group Management Events ──
  GROUP_RENAMED: "GROUP_RENAMED",
  MEMBERS_ADDED: "MEMBERS_ADDED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
  MEMBER_LEFT: "MEMBER_LEFT",
  OWNER_TRANSFERRED: "OWNER_TRANSFERRED",
  ADMINS_UPDATED: "ADMINS_UPDATED",
  JOIN_REQUEST_CREATED: "JOIN_REQUEST_CREATED",
  JOIN_REQUEST_UPDATED: "JOIN_REQUEST_UPDATED",
  JOIN_REQUEST_APPROVED: "JOIN_REQUEST_APPROVED",
  JOIN_APPROVALS_UPDATED: "JOIN_APPROVALS_UPDATED",
  SEND_PERMISSION_UPDATED: "SEND_PERMISSION_UPDATED",
  ADD_MEMBER_PERMISSION_UPDATED: "ADD_MEMBER_PERMISSION_UPDATED",

  // ── Poll Events ──
  POLL_CREATED: "POLL_CREATED",
  POLL_UPDATED: "POLL_UPDATED",

  // ── Reminder Events ──
  REMINDER_TRIGGERED: "REMINDER_TRIGGERED",

  // ── Presence Events ──
  USER_PRESENCE_CHANGED: "USER_PRESENCE_CHANGED",

  // ── Social / Notification Events ──
  NOTIFICATION: "NOTIFICATION",
  POST_CREATED: "POST_CREATED",
  POST_UPDATED: "POST_UPDATED",
  COMMENT_CREATED: "COMMENT_CREATED",
  REACTION_ADDED: "REACTION_ADDED",

  // ── WebRTC Call Events ──
  CALL_OFFER: "CALL_OFFER",
  CALL_ANSWER: "CALL_ANSWER",
  CALL_ICE_CANDIDATE: "CALL_ICE_CANDIDATE",
  CALL_REJECT: "CALL_REJECT",
  CALL_END: "CALL_END",
  CALL_USER_JOINED: "CALL_USER_JOINED",
  CALL_USER_LEFT: "CALL_USER_LEFT",
  CALL_HOST_TRANSFERRED: "CALL_HOST_TRANSFERRED",
} as const;

/** Union type of all valid socket event type strings */
export type SocketEventType =
  (typeof SocketEventTypes)[keyof typeof SocketEventTypes];

/**
 * Incoming message events we accept from backend.
 * Keep this as the single source of truth so all consumers
 * (Messenger, ChatBox, hooks) stay consistent.
 */
export const IncomingMessageEventTypes = [
  SocketEventTypes.MESSAGE_RECEIVED,
  SocketEventTypes.MESSAGE_SENT,
  // Legacy aliases (backward compatibility with older backend nodes)
  "MESSAGE_CREATED",
  "NEW_MESSAGE",
] as const;

/**
 * STOMP Destinations — phải đồng bộ với backend SocketDestinations.java
 */
export const SocketDestinations = {
  TOPIC_PUBLIC: "/topic/public",
  TOPIC_ROOMS_PREFIX: "/topic/rooms.",
  QUEUE_NOTIFICATIONS: "/queue/notifications",
  QUEUE_WEBRTC: "/queue/webrtc",

  /** Build room subscription path: /topic/rooms.{conversationId} */
  roomDestination: (conversationId: string) =>
    `/topic/rooms.${conversationId}`,

  /** Build user notification path: /user/{username}/queue/notifications */
  userNotifications: (username: string) =>
    `/user/${username}/queue/notifications`,

  /** Build user WebRTC path: /user/{username}/queue/webrtc */
  userWebrtc: (username: string) => `/user/${username}/queue/webrtc`,
} as const;
