import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { aiApi, type AIDailySummaryResponse } from '../../../apis/ai';

interface UseAIChatProps {
  userId?: string;
  getLocaleTag: () => string;
}

export function useAIChat({ userId, getLocaleTag }: UseAIChatProps) {
  const { t } = useTranslation();
  const AI_CONVERSATION_ID = 'ai_assistant';
  
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; text: string; isUser: boolean; timestamp: Date }>>([
    {
      id: '1',
      text: t('messenger.aiAssistant.welcome'),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isDailySummaryPrompt = (input: string) => {
    const normalized = input.toLowerCase().trim();
    return (
      normalized.includes('tóm tắt') ||
      normalized.includes('tom tat') ||
      normalized.includes('summary') ||
      normalized.includes('thông báo hôm nay') ||
      normalized.includes('thong bao hom nay') ||
      normalized.includes('notification')
    );
  };

  const appendAiMessage = (text: string) => {
    const aiMessage = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp: new Date(),
    };
    setAiMessages((prev) => [...prev, aiMessage]);
  };

  const formatDailySummaryMessage = (data: AIDailySummaryResponse) => {
    const generatedAt = data.generatedAt
      ? new Date(data.generatedAt).toLocaleTimeString(getLocaleTag(), {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return [
      t('messenger.aiAssistant.summaryHeader'),
      t('messenger.aiAssistant.summaryCounts', {
        notifications: data.notificationsCount,
        posts: data.friendsPostCount,
        messages: data.incomingMessageCount,
      }),
      '',
      data.summary,
      generatedAt ? '' : null,
      generatedAt ? t('messenger.aiAssistant.summaryGeneratedAt', { time: generatedAt }) : null,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleGenerateDailySummaryForAi = async (userPrompt?: string) => {
    if (!userId) return;

    if (userPrompt) {
      const userMessage = {
        id: Date.now().toString(),
        text: userPrompt,
        isUser: true,
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, userMessage]);
    }

    setIsAiLoading(true);
    try {
      const summary = await aiApi.dailySummary({
        userId,
        limit: 6,
      });
      appendAiMessage(formatDailySummaryMessage(summary));
    } catch (error) {
      console.error('Error generating AI daily summary:', error);
      appendAiMessage(t('messenger.aiAssistant.summaryError'));
    } finally {
      setIsAiLoading(false);
    }
  };

  return {
    AI_CONVERSATION_ID,
    aiMessages,
    setAiMessages,
    aiConversationId,
    setAiConversationId,
    isAiLoading,
    setIsAiLoading,
    isDailySummaryPrompt,
    appendAiMessage,
    formatDailySummaryMessage,
    handleGenerateDailySummaryForAi,
  };
}
