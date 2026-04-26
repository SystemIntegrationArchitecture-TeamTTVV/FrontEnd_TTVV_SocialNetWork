import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { conversationsApi } from '../../../apis/conversations';
import { notify } from '../../../utils/toast';
import type { Message } from '../../../apis/conversations';

interface UseGroupPollsProps {
  conversationId: string;
  userId?: string;
}

export function useGroupPolls({ conversationId, userId }: UseGroupPollsProps) {
  const { t } = useTranslation();
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [votingPollMessageId, setVotingPollMessageId] = useState<string | null>(null);

  const setPollOptionAt = (index: number, value: string) => {
    setPollOptions((prev) => {
      const clone = [...prev];
      clone[index] = value;
      return clone;
    });
  };

  const addPollOptionField = () => {
    setPollOptions((prev) => [...prev, '']);
  };

  const removePollOptionField = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePoll = async () => {
    if (!userId) return;
    const question = pollQuestion.trim();
    const options = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question) {
      notify.error('Vui long nhap cau hoi.');
      return;
    }
    if (options.length < 2) {
      notify.error('Vui long nhap it nhat 2 lua chon.');
      return;
    }

    setCreatingPoll(true);
    try {
      await conversationsApi.createPoll(conversationId, {
        senderId: userId,
        question,
        options,
        multipleChoice: pollMultipleChoice,
      });
      setShowPollComposer(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollMultipleChoice(false);
    } catch (err) {
      console.error('Failed to create poll', err);
      notify.error('Khong the tao binh chon.');
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleVotePoll = async (msg: Message, optionId: string) => {
    if (!userId) return;
    if (votingPollMessageId) return;

    const currentSelections = (msg.pollOptions || [])
      .filter((o) => (o.voterUserIds || []).includes(userId))
      .map((o) => o.id);

    let newSelections: string[];
    if (msg.pollMultipleChoice) {
      if (currentSelections.includes(optionId)) {
        newSelections = currentSelections.filter((id) => id !== optionId);
      } else {
        newSelections = [...currentSelections, optionId];
      }
    } else {
      if (currentSelections.includes(optionId)) {
        newSelections = [];
      } else {
        newSelections = [optionId];
      }
    }

    setVotingPollMessageId(msg.id);
    try {
      await conversationsApi.votePoll(conversationId, msg.id, {
        voterId: userId,
        selectedOptionIds: newSelections,
      });
    } catch (err) {
      console.error('Vote fail', err);
      notify.error('Loi khi binh chon');
    } finally {
      setVotingPollMessageId(null);
    }
  };

  return {
    showPollComposer,
    setShowPollComposer,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollMultipleChoice,
    pollMultipleChoice,
    creatingPoll,
    votingPollMessageId,
    setPollOptionAt,
    addPollOptionField,
    removePollOptionField,
    handleCreatePoll,
    handleVotePoll,
  };
}
