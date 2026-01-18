import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Smile, Paperclip, Send, Phone, Video } from 'lucide-react';
import { useChatBox } from '../../contexts/ChatBoxContext';
import { useCall } from '../../contexts/CallContext';
import type { ChatContact, ChatMessage } from '../../types/chat';

interface ChatBoxProps {
  contact: ChatContact;
  index: number;
}

export default function ChatBox({ contact, index }: ChatBoxProps) {
  const { closeChatBox, toggleMinimize, minimizedBoxes, messages, sendMessage } = useChatBox();
  const { startCall } = useCall();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMinimized = minimizedBoxes.has(contact.id);
  const contactMessages = messages[contact.id] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [contactMessages, isMinimized]);

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(contact.id, messageInput);
      setMessageInput('');
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    const minimizedWidth = 260;
    const minimizedGap = 16;
    const rightPosition = index * (minimizedWidth + minimizedGap);
    
    return (
      <div
        className="fixed bottom-0 bg-white rounded-t-xl shadow-xl border border-gray-200 cursor-pointer transition-all duration-300 z-50"
        style={{
          right: `${rightPosition}px`,
          width: `${minimizedWidth}px`,
        }}
        onClick={() => toggleMinimize(contact.id)}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
            {contactMessages.length > 0 && (
              <p className="text-xs text-gray-500 truncate">
                {contactMessages[contactMessages.length - 1].content}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const boxWidth = 340;
  const boxGap = 16;
  const rightPosition = index * (boxWidth + boxGap);
  
  return (
    <div
      className="fixed bottom-0 bg-white rounded-t-xl shadow-xl border border-gray-200 flex flex-col transition-all duration-300 z-50"
      style={{
        right: `${rightPosition}px`,
        width: `${boxWidth}px`,
        height: '520px',
        maxHeight: '80vh',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
            <p className="text-xs text-gray-500">{contact.online ? 'Đang hoạt động' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => startCall(contact.userId, contact.name, 'voice')}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Gọi thoại"
          >
            <Phone className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => startCall(contact.userId, contact.name, 'video')}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Gọi video"
          >
            <Video className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => toggleMinimize(contact.id)}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Thu gọn"
          >
            <Minimize2 className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => closeChatBox(contact.id)}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {contactMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}
          >
            {!msg.isMe && (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm"
                style={{ backgroundColor: contact.color }}
              >
                {contact.avatar}
              </div>
            )}
            <div className={`max-w-[75%] ${msg.isMe ? 'text-right' : ''}`}>
              <div
                className={`rounded-xl px-3 py-2 mb-1 shadow-sm ${
                  msg.isMe
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
              <p className="text-xs text-gray-500 px-1.5">{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhắn tin..."
              className="w-full min-h-[40px] max-h-28 px-3 py-2.5 pr-10 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={1}
            />
            <button className="absolute right-2 bottom-2 w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Smile className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Paperclip className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleSend}
            disabled={!messageInput.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              messageInput.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

