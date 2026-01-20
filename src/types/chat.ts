// Chat types
export interface ChatContact {
  id: string; // conversationId for message routing
  userId?: string; // actual userId for calls (undefined for group chats)
  name: string;
  avatar: string;
  color: string;
  online: boolean;
  isGroup?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  content: string;
  isMe: boolean;
  time: string;
  attachments?: Array<{
    type: string; // 'image' | 'video' | 'file' | 'audio'
    url: string;
    fileName?: string;
    fileSize?: number;
  }>;
}

