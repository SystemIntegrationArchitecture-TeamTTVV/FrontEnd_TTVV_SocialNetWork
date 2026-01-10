// Chat types
export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  color: string;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  isMe: boolean;
  time: string;
}

