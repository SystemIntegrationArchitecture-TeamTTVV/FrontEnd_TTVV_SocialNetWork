import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { messagesApi, type Message } from '../../../apis/messages';
import { notify } from '../../../services/notify';

interface UseGroupMessagesProps {
  conversationId: string;
  userId?: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useGroupMessages({ conversationId: _conversationId, userId, messages, setMessages }: UseGroupMessagesProps) {
  const { t } = useTranslation();
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null);
  const [forwardTargetId, setForwardTargetId] = useState('');

  const togglePinMessage = async (messageId: string) => {
    if (!userId) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    try {
      await messagesApi.togglePin(messageId, userId);
    } catch (err) {
      console.error('Failed to toggle pin', err);
      notify.error(t('messenger.group.pinMessageError'));
    }
  };

  const recallMessage = async (messageId: string) => {
    if (!userId) return;
    if (!window.confirm(t('messenger.group.confirmRecallMessage'))) return;
    try {
      await messagesApi.deleteMessage(messageId, userId);
    } catch (err) {
      console.error('Recall fail', err);
      notify.error(t('messenger.group.recallMessageError'));
    }
  };

  const deleteMessageForMe = async (messageId: string) => {
    if (!userId) return;
    if (!window.confirm(t('messenger.group.confirmDeleteForMe'))) return;
    try {
      await messagesApi.deleteMessageForMe(messageId, userId);
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
      await messagesApi.updateMessage(editingMessageId, {
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
      await messagesApi.toggleStar(msgId, userId);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const starredIds = m.starredByUserIds || [];
          const nextIds = starredIds.includes(userId)
            ? starredIds.filter((id) => id !== userId)
            : [...starredIds, userId];
          return { ...m, starredByUserIds: nextIds };
        })
      );
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
