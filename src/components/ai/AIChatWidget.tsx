import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Send, Bot, Loader2 } from 'lucide-react';
import { aiApi, type AIAutoPostRequest, type AIChatRequest } from '../../apis/ai';
import { useAuth } from '../../contexts/AuthContext';
import { postsApi } from '../../apis/posts';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIChatWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('aiWidget.greeting'),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPosting, setIsAutoPosting] = useState(false);
  const [mode, setMode] = useState<'chat' | 'autopost'>('chat');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [postPrompt, setPostPrompt] = useState('');
  const [postVisibility, setPostVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [draftContent, setDraftContent] = useState('');
  const [autoPostStatus, setAutoPostStatus] = useState<string | null>(null);
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
        text: t('aiWidget.chatError'),
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

  const handleGenerateDraft = async () => {
    if (!user?.id || !postPrompt.trim() || isAutoPosting) return;

    setIsAutoPosting(true);
    setAutoPostStatus(null);
    try {
      const request: AIAutoPostRequest = {
        prompt: postPrompt.trim(),
        userId: user.id,
        visibility: postVisibility,
      };
      const result = await aiApi.draftPost(request);
      setDraftContent(result.generatedContent || '');
      setAutoPostStatus(t('aiWidget.draftCreated'));
    } catch (error: any) {
      console.error('❌ Draft generation failed:', error);
      setAutoPostStatus(`❌ ${error?.message || t('aiWidget.draftCreateError')}`);
    } finally {
      setIsAutoPosting(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!draftContent.trim() || isAutoPosting || !user?.id) return;

    setIsAutoPosting(true);
    setAutoPostStatus(null);
    try {
      const createdPost = await postsApi.createPost({
        content: draftContent.trim(),
        visibility: postVisibility,
        allowComments: true,
        allowSharing: true,
      });

      window.dispatchEvent(new CustomEvent('post-created', { detail: createdPost }));

      setAutoPostStatus(t('aiWidget.publishSuccess'));
      setPostPrompt('');
      setDraftContent('');
    } catch (error: any) {
      console.error('❌ Publish draft failed:', error);
      setAutoPostStatus(`❌ ${error?.message || t('aiWidget.publishError')}`);
    } finally {
      setIsAutoPosting(false);
    }
  };

  if (!isOpen && !isMinimized) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed bottom-6 left-6 w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-200 items-center justify-center text-gray-800 transition-colors hover:bg-gray-50 active:scale-95 z-50"
        title={t('aiWidget.support')}
        aria-label={t('aiWidget.openAssistant')}
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="hidden md:flex fixed bottom-6 left-6 w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-200 items-center justify-center text-gray-800 hover:bg-gray-50 transition-colors active:scale-95 z-50"
        title={t('aiWidget.reopenSupport')}
        aria-label={t('aiWidget.reopenAssistant')}
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="hidden md:flex fixed bottom-6 left-6 w-[380px] h-[560px] bg-white rounded-2xl shadow-xl flex-col z-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white text-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
            <Bot className="w-5 h-5 text-gray-800" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t('aiWidget.assistant')}</h3>
            <p className="text-xs text-gray-500">{t('aiWidget.quickSupport')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors active:scale-95"
            title={t('aiWidget.minimize')}
            aria-label={t('aiWidget.minimize')}
          >
            <Minimize2 className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors active:scale-95"
            title={t('common.close')}
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-gray-100 bg-white flex items-center gap-2">
        <button
          onClick={() => setMode('chat')}
          className={`px-3 h-8 rounded-full text-xs font-medium transition-colors ${mode === 'chat' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Chat
        </button>
        <button
          onClick={() => setMode('autopost')}
          className={`px-3 h-8 rounded-full text-xs font-medium transition-colors ${mode === 'autopost' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {t('aiWidget.autodraftTab')}
        </button>
      </div>

      {mode === 'chat' ? (
      <>
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
                {message.timestamp.toLocaleTimeString(getLocaleTag(), {
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
                <span className="text-xs text-gray-500 font-medium">{t('messenger.aiAssistantReplying')}</span>
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
              placeholder={t('aiWidget.inputPlaceholder')}
              disabled={isLoading}
              className="w-full px-4 h-11 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="w-11 h-11 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors active:scale-95 shrink-0"
            title={t('aiWidget.send')}
            aria-label={t('aiWidget.sendMessage')}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      </>
      ) : (
      <div className="flex-1 p-4 bg-white flex flex-col gap-3">
        <label className="text-xs font-medium text-gray-600">{t('aiWidget.postIdea')}</label>
        <textarea
          value={postPrompt}
          onChange={(e) => setPostPrompt(e.target.value)}
          placeholder={t('aiWidget.postIdeaPlaceholder')}
          className="w-full min-h-36 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm placeholder:text-gray-400 resize-none"
        />

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-600">{t('aiWidget.visibility')}</span>
          <select
            value={postVisibility}
            onChange={(e) => setPostVisibility(e.target.value as 'PUBLIC' | 'FRIENDS' | 'PRIVATE')}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="PUBLIC">{t('aiWidget.visibilityPublic')}</option>
            <option value="FRIENDS">{t('aiWidget.visibilityFriends')}</option>
            <option value="PRIVATE">{t('aiWidget.visibilityPrivate')}</option>
          </select>
        </div>

        <button
          onClick={handleGenerateDraft}
          disabled={!postPrompt.trim() || isAutoPosting || !user?.id}
          className="h-11 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isAutoPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isAutoPosting ? t('aiWidget.creatingDraft') : t('aiWidget.aiCreateDraft')}
        </button>

        <label className="text-xs font-medium text-gray-600">{t('aiWidget.draftContent')}</label>
        <textarea
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          placeholder={t('aiWidget.draftPlaceholder')}
          className="w-full min-h-36 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm placeholder:text-gray-400 resize-none"
        />

        <button
          onClick={handlePublishDraft}
          disabled={!draftContent.trim() || isAutoPosting || !user?.id}
          className="h-11 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isAutoPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isAutoPosting ? t('aiWidget.publishing') : t('aiWidget.publishDraft')}
        </button>

        {autoPostStatus && (
          <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
            {autoPostStatus}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

