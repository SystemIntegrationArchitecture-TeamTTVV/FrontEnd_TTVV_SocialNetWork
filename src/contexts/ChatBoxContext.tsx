import { createContext, useContext, useState, ReactNode } from 'react';
import type { ChatContact, ChatMessage } from '../types/chat';

// Re-export types for convenience
export type { ChatContact, ChatMessage };

interface ChatBoxContextType {
  openChatBoxes: ChatContact[];
  openChatBox: (contact: ChatContact) => void;
  closeChatBox: (contactId: string) => void;
  toggleMinimize: (contactId: string) => void;
  minimizedBoxes: Set<string>;
  messages: Record<string, ChatMessage[]>;
  addMessage: (contactId: string, message: ChatMessage) => void;
}

const ChatBoxContext = createContext<ChatBoxContextType | undefined>(undefined);

export function ChatBoxProvider({ children }: { children: ReactNode }) {
  const [openChatBoxes, setOpenChatBoxes] = useState<ChatContact[]>([]);
  const [minimizedBoxes, setMinimizedBoxes] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const openChatBox = (contact: ChatContact) => {
    setOpenChatBoxes((prev) => {
      // Nếu đã mở rồi thì không mở lại
      if (prev.some((c) => c.id === contact.id)) {
        // Nếu đang minimized thì maximize lại
        setMinimizedBoxes((prevMin) => {
          const newMin = new Set(prevMin);
          newMin.delete(contact.id);
          return newMin;
        });
        return prev;
      }
      // Thêm chat box mới vào đầu danh sách
      return [contact, ...prev].slice(0, 5); // Giới hạn tối đa 5 chat boxes
    });

    // Khởi tạo messages nếu chưa có
    setMessages((prev) => {
      if (!prev[contact.id]) {
        return {
          ...prev,
          [contact.id]: [
            {
              id: '1',
              content: `Xin chào! Bạn có thể nhắn tin với ${contact.name} ngay bây giờ.`,
              isMe: false,
              time: 'Vừa xong',
            },
          ],
        };
      }
      return prev;
    });
  };

  const closeChatBox = (contactId: string) => {
    setOpenChatBoxes((prev) => prev.filter((c) => c.id !== contactId));
    setMinimizedBoxes((prev) => {
      const newMin = new Set(prev);
      newMin.delete(contactId);
      return newMin;
    });
  };

  const toggleMinimize = (contactId: string) => {
    setMinimizedBoxes((prev) => {
      const newMin = new Set(prev);
      if (newMin.has(contactId)) {
        newMin.delete(contactId);
      } else {
        newMin.add(contactId);
      }
      return newMin;
    });
  };

  const addMessage = (contactId: string, message: ChatMessage) => {
    setMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), message],
    }));
  };

  return (
    <ChatBoxContext.Provider
      value={{
        openChatBoxes,
        openChatBox,
        closeChatBox,
        toggleMinimize,
        minimizedBoxes,
        messages,
        addMessage,
      }}
    >
      {children}
    </ChatBoxContext.Provider>
  );
}

export function useChatBox() {
  const context = useContext(ChatBoxContext);
  if (context === undefined) {
    throw new Error('useChatBox must be used within a ChatBoxProvider');
  }
  return context;
}
