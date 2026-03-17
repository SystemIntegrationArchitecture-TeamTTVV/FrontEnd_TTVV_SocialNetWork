import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Send, Bot, Loader2 } from 'lucide-react';
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
        className="fixed bottom-6 left-6 w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center text-gray-800 transition-colors hover:bg-gray-50 active:scale-95 z-50"
        title="Hỗ trợ"
        aria-label="Mở trợ lý"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center text-gray-800 hover:bg-gray-50 transition-colors active:scale-95 z-50"
        title="Mở hỗ trợ"
        aria-label="Mở lại trợ lý"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 w-[380px] h-[560px] bg-white rounded-2xl shadow-xl flex flex-col z-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white text-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
            <Bot className="w-5 h-5 text-gray-800" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Trợ lý</h3>
            <p className="text-xs text-gray-500">Hỗ trợ nhanh</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors active:scale-95"
            title="Thu nhỏ"
            aria-label="Thu nhỏ"
          >
            <Minimize2 className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors active:scale-95"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${
              message.isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                <Bot className="w-4 h-4 text-gray-700" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div
                className={`rounded-2xl px-3 py-2 ${
                  message.isUser
                    ? 'bg-gray-900 text-white rounded-tr-sm'
                    : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-tl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{message.text}</p>
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
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
              <Bot className="w-4 h-4 text-gray-700" />
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2 border border-gray-200">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 text-gray-700 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Đang trả lời…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn…"
              disabled={isLoading}
              className="w-full px-4 h-11 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="w-11 h-11 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors active:scale-95 shrink-0"
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

