import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { aiApi, type AIChatRequest } from '../../apis/ai';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là AI Assistant. Tôi có thể giúp bạn trả lời câu hỏi, giải thích khái niệm, hoặc hỗ trợ bạn trong nhiều việc khác. Bạn muốn hỏi gì?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading || !user?.id) return;

    // Save message before clearing input
    const messageToSend = inputMessage.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const request: AIChatRequest = {
        message: messageToSend,
        userId: user.id,
        conversationId: conversationId || undefined,
      };

      const response = await aiApi.chat(request);

      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('❌ Error chatting with AI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen && !isMinimized) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl hover:shadow-3xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 z-50 group"
        title="Chat với AI"
        aria-label="Mở AI Assistant"
      >
        <div className="relative">
          <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
        </div>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl hover:shadow-3xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 z-50"
        title="Mở chat AI"
        aria-label="Mở lại AI Assistant"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 w-[420px] h-[640px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base">AI Assistant</h3>
            <p className="text-xs text-white/80 font-medium">Trợ lý thông minh</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-9 h-9 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
            title="Thu nhỏ"
            aria-label="Thu nhỏ"
          >
            <Minimize2 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="w-9 h-9 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              message.isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {!message.isUser && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div
                className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.isUser
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
              </div>
              <span
                className={`text-xs px-1 ${
                  message.isUser ? 'text-gray-500 text-right' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm transition-all placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white transition-all shadow-lg hover:shadow-xl active:scale-95 shrink-0"
            title="Gửi"
            aria-label="Gửi tin nhắn"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

