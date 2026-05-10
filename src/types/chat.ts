// Chat types
export interface ChatContact {
  id: string; // conversationId for message routing
  userId?: string; // actual userId for calls (undefined for group chats)
  name: string;
  avatar: string;    // initials fallback
  avatarUrl?: string; // real photo URL (optional)
  color: string;
  online: boolean;
  isGroup?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  senderAvatar?: string;
  content: string;
  isMe: boolean;
  time: string;
  attachments?: Array<{
    type: string;
    url: string;
    fileName?: string;
    fileSize?: number;
  }>;
}

