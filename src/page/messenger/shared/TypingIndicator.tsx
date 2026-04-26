// ─── TypingIndicator — animated dots when someone is typing ─────────────
import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  isAIChat: boolean;
  typingNames: string[];
  conversationName?: string;
}

export default function TypingIndicator({ isAIChat, typingNames, conversationName }: TypingIndicatorProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 md:px-6 py-3 bg-white border-t border-gray-100">
      <div className="flex items-center gap-3">
        {isAIChat && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {isAIChat
              ? t('messenger.typing.ai')
              : typingNames.length > 1
                ? `${typingNames[0]} +${typingNames.length - 1} dang nhap...`
                : t('messenger.typing.user', { name: typingNames[0] ?? conversationName ?? '' })}
          </span>
        </div>
      </div>
    </div>
  );
}
