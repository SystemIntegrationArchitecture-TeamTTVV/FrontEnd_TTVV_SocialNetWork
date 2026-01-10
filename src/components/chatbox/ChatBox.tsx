import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Smile, Paperclip, Send } from 'lucide-react';
import { useChatBox } from '../../contexts/ChatBoxContext';
import type { ChatContact, ChatMessage } from '../../types/chat';

interface ChatBoxProps {
  contact: ChatContact;
  index: number;
}

export default function ChatBox({ contact, index }: ChatBoxProps) {
  const { closeChatBox, toggleMinimize, minimizedBoxes, messages, addMessage } = useChatBox();
  const [messageInput, setMessageInput] = useState('');
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

  const handleSend = () => {
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageInput,
      isMe: true,
      time: 'Vừa xong',
    };

    addMessage(contact.id, newMessage);
    setMessageInput('');

    // Auto reply sau 1 giây (giả lập)
    setTimeout(() => {
      const replies = [
        'Cảm ơn bạn đã nhắn tin! 😊',
        'Tôi sẽ trả lời bạn sớm nhất có thể.',
        'Đã nhận được tin nhắn của bạn!',
        'OK, mình hiểu rồi! 👍',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: randomReply,
        isMe: false,
        time: 'Vừa xong',
      };

      addMessage(contact.id, replyMessage);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    const minimizedWidth = 280;
    const minimizedGap = 20;
    const rightPosition = index * (minimizedWidth + minimizedGap);
    
    return (
      <div
        className="fixed bottom-0 bg-white rounded-t-2xl shadow-2xl border border-gray-200 cursor-pointer transition-all duration-300 z-50"
        style={{
          right: `${rightPosition}px`,
          width: `${minimizedWidth}px`,
        }}
        onClick={() => toggleMinimize(contact.id)}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-base truncate">{contact.name}</p>
            {contactMessages.length > 0 && (
              <p className="text-sm text-gray-500 truncate">
                {contactMessages[contactMessages.length - 1].content}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const boxWidth = 380;
  const boxGap = 20;
  const rightPosition = index * (boxWidth + boxGap);
  
  return (
    <div
      className="fixed bottom-0 bg-white rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 z-50"
      style={{
        right: `${rightPosition}px`,
        width: `${boxWidth}px`,
        height: '600px',
        maxHeight: '85vh',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
              style={{ backgroundColor: contact.color }}
            >
              {contact.avatar}
            </div>
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg truncate">{contact.name}</p>
            <p className="text-sm text-gray-500">{contact.online ? 'Đang hoạt động' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleMinimize(contact.id)}
            className="w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Thu gọn"
          >
            <Minimize2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => closeChatBox(contact.id)}
            className="w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {contactMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
          >
            {!msg.isMe && (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm"
                style={{ backgroundColor: contact.color }}
              >
                {contact.avatar}
              </div>
            )}
            <div className={`max-w-[75%] ${msg.isMe ? 'text-right' : ''}`}>
              <div
                className={`rounded-2xl px-4 py-3 mb-1 shadow-sm ${
                  msg.isMe
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-base leading-relaxed">{msg.content}</p>
              </div>
              <p className="text-xs text-gray-500 px-2">{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhắn tin..."
              className="w-full min-h-[44px] max-h-32 px-4 py-3 pr-12 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
              rows={1}
            />
            <button className="absolute right-3 bottom-3 w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <button className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleSend}
            disabled={!messageInput.trim()}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              messageInput.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

