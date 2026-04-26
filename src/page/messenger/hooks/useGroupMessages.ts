import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { conversationsApi, messagesApi } from '../../../apis/conversations';
import { notify } from '../../../utils/toast';
import type { Message } from '../../../apis/conversations';

interface UseGroupMessagesProps {
  conversationId: string;
  userId?: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useGroupMessages({ conversationId, userId, messages, setMessages }: UseGroupMessagesProps) {
  const { t } = useTranslation();
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null);
  const [forwardTargetId, setForwardTargetId] = useState('');

  const togglePinMessage = async (messageId: string) => {
    if (!userId) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const isPinned = msg.pinned;

    try {
      if (isPinned) {
        await conversationsApi.unpinMessage(conversationId, messageId, userId);
      } else {
        await conversationsApi.pinMessage(conversationId, messageId, userId);
      }
    } catch (err) {
      console.error('Failed to toggle pin', err);
      notify.error(t('messenger.group.pinMessageError'));
    }
  };

  const recallMessage = async (messageId: string) => {
    if (!userId) return;
    if (!window.confirm(t('messenger.group.confirmRecallMessage'))) return;
    try {
      await messagesApi.recallMessage(conversationId, messageId, userId);
    } catch (err) {
      console.error('Recall fail', err);
      notify.error(t('messenger.group.recallMessageError'));
    }
  };

  const deleteMessageForMe = async (messageId: string) => {
    if (!userId) return;
    if (!window.confirm(t('messenger.group.confirmDeleteForMe'))) return;
    try {
      await messagesApi.deleteMessageForMe(conversationId, messageId, userId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Delete for me fail', err);
      notify.error(t('messenger.group.deleteForMeError'));
    }
  };

  const startEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content || '');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const submitEdit = async () => {
    if (!userId || !editingMessageId || !editContent.trim()) return;
    try {
      await messagesApi.editMessage(conversationId, editingMessageId, {
        senderId: userId,
        content: editContent.trim(),
      });
      cancelEdit();
    } catch (err) {
      console.error('Failed to edit', err);
      notify.error(t('messenger.group.editMessageError'));
    }
  };

  const handleToggleStar = async (msgId: string) => {
    if (!userId) return;
    try {
      const msg = messages.find((m) => m.id === msgId);
      if (!msg) return;
      const isStarred = msg.starred;
      if (isStarred) {
        await conversationsApi.unstarMessage(conversationId, msgId, userId);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, starred: false } : m))
        );
      } else {
        await conversationsApi.starMessage(conversationId, msgId, userId);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, starred: true } : m))
        );
      }
    } catch (err) {
      console.error('Failed to toggle star', err);
      notify.error(t('messenger.group.toggleStarError'));
    }
  };

  return {
    editingMessageId,
    editContent,
    setEditContent,
    forwardingMessageId,
    setForwardingMessageId,
    forwardTargetId,
    setForwardTargetId,
    togglePinMessage,
    recallMessage,
    deleteMessageForMe,
    startEdit,
    cancelEdit,
    submitEdit,
    handleToggleStar,
  };
}
