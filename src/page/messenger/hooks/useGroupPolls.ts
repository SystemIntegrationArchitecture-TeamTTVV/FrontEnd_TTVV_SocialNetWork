import { useState } from 'react';
import { messagesApi, type Message } from '../../../apis/messages';
import { notify } from '../../../services/notify';
import type { PollFormData } from '../components/CreatePollModal';

interface UseGroupPollsProps {
  conversationId: string;
  userId?: string;
  userName?: string;
}

export function useGroupPolls({ conversationId, userId, userName }: UseGroupPollsProps) {
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [votingPollMessageId, setVotingPollMessageId] = useState<string | null>(null);

  const handleCreatePoll = async (form: PollFormData) => {
    if (!userId) return;
    const question = form.question.trim();
    const options = form.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question) {
      notify.error('Vui lòng nhập câu hỏi.');
      return;
    }
    if (options.length < 2) {
      notify.error('Vui lòng nhập ít nhất 2 lựa chọn.');
      return;
    }

    setCreatingPoll(true);
    try {
      await messagesApi.createPoll(conversationId, {
        userId,
        question,
        options,
        multipleChoice: form.multipleChoice,
        canAddOptions: form.canAddOptions,
        hideResultsBeforeVote: form.hideResultsBeforeVote,
        hideVoters: form.hideVoters,
        actorName: userName,
        deadline: form.deadline || undefined,
      });
      setIsCreatePollOpen(false);
    } catch (err) {
      console.error('Failed to create poll', err);
      notify.error('Không thể tạo bình chọn.');
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleVotePoll = async (msg: Message, optionId: string) => {
    if (!userId) return;
    if (votingPollMessageId) return;

    // Check deadline on client side
    if (msg.pollDeadline) {
      const iso = msg.pollDeadline;
      const sanitized = (!iso.endsWith('Z') && !iso.includes('+')) ? iso + 'Z' : iso;
      const deadlineTime = new Date(sanitized).getTime();
      if (Date.now() > deadlineTime) {
        notify.error('Bình chọn đã hết thời hạn.');
        return;
      }
    }

    const currentSelections = (msg.pollOptions || [])
      .filter((o) => (o.voterUserIds || []).includes(userId))
      .map((o) => o.optionId);

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
      await messagesApi.votePoll(msg.id, {
        userId,
        optionIds: newSelections,
      });
    } catch (err: any) {
      console.error('Vote fail', err);
      const errMsg = err?.message || '';
      if (errMsg.includes('deadline') || errMsg.includes('closed')) {
        notify.error('Bình chọn đã đóng hoặc hết hạn.');
      } else {
        notify.error('Lỗi khi bình chọn.');
      }
    } finally {
      setVotingPollMessageId(null);
    }
  };

  return {
    isCreatePollOpen,
    setIsCreatePollOpen,
    creatingPoll,
    votingPollMessageId,
    handleCreatePoll,
    handleVotePoll,
  };
}
