import { useState, useEffect } from 'react';
import { BarChart3, Check, Clock, Lock, Users } from 'lucide-react';
import type { Message, PollOption } from '../../../apis/messages';
import PollVotersModal from './PollVotersModal';

interface PollMessageCardProps {
  msg: Message;
  isMe: boolean;
  userId: string;
  onVote: (msg: Message, optionId: string) => void;
  onAddOption?: (msg: Message, text: string) => void;
  voting?: boolean;
  participantNames?: string[];
  participantIds?: string[];
}

function parseIso(iso: string | undefined | null): Date {
  if (!iso) return new Date();
  // Force UTC if missing timezone info to prevent local interpretation of UTC strings
  const sanitized = (!iso.endsWith('Z') && !iso.includes('+')) ? iso + 'Z' : iso;
  return new Date(sanitized);
}

function formatDeadline(iso: string): string {
  if (!iso) return '';
  const d = parseIso(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function useCountdown(deadlineIso: string | undefined | null): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!deadlineIso) {
      setLabel(null);
      return;
    }
    const update = () => {
      const diff = parseIso(deadlineIso).getTime() - Date.now();
      if (diff <= 0) {
        setLabel('Đã hết hạn');
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      if (h > 48) {
        setLabel(`Còn ${Math.floor(h / 24)} ngày`);
      } else if (h > 0) {
        setLabel(`Còn ${h}g ${m}p`);
      } else if (m > 0) {
        setLabel(`Còn ${m}p ${s}s`);
      } else {
        setLabel(`Còn ${s}s`);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  return label;
}

export default function PollMessageCard({
  msg,
  isMe,
  userId,
  onVote,
  onAddOption,
  voting = false,
  participantNames = [],
  participantIds = [],
}: PollMessageCardProps) {
  const [addingOption, setAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [showVoters, setShowVoters] = useState(false);

  const pollOptions: PollOption[] = msg.pollOptions || [];
  const totalVotes = pollOptions.reduce((sum, o) => sum + (o.voterUserIds?.length ?? 0), 0);
  const myVotedIds = new Set(
    pollOptions.filter((o) => (o.voterUserIds || []).includes(userId)).map((o) => o.optionId)
  );
  const hasVoted = myVotedIds.size > 0;

  const deadlineIso = msg.pollDeadline ?? null;
  const isExpired = deadlineIso ? parseIso(deadlineIso).getTime() < Date.now() : false;
  const isClosed = msg.pollClosed || isExpired;
  const countdown = useCountdown(deadlineIso && !isExpired ? deadlineIso : null);

  // Whether to show results: always show if voted or closed; hide if hideResultsBeforeVote and not voted
  const showResults = hasVoted || isClosed || !msg.pollHideResultsBeforeVote;

  const handleAddOption = () => {
    const text = newOptionText.trim();
    if (!text || !onAddOption) return;
    onAddOption(msg, text);
    setNewOptionText('');
    setAddingOption(false);
  };

  return (
    <div className="flex justify-center my-2">
      <div className="w-[450px] max-w-full flex flex-col items-center">
        {/* Sender name for others */}
        {!isMe && (
          <span className="text-xs text-gray-500 mb-1 ml-1">
            {(() => {
              const idx = participantIds.indexOf(msg.senderId);
              return idx >= 0 ? participantNames[idx] : (msg.senderName || msg.senderId);
            })()}
          </span>
        )}

        <div
          className={`w-full rounded-2xl border px-4 py-3 flex flex-col ${
            isMe
              ? 'bg-blue-50 border-blue-100'
              : 'bg-white border-gray-200'
          }`}
        >
          {/* Poll header */}
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">Bình chọn</span>
            {isClosed && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
                <Lock className="w-3 h-3" /> Đã đóng
              </span>
            )}
            {!isClosed && countdown && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-orange-500">
                <Clock className="w-3 h-3" /> {countdown}
              </span>
            )}
          </div>

          {/* Question */}
          <p className="text-sm font-semibold text-gray-900 mb-3 leading-snug">
            {msg.pollQuestion || msg.content}
          </p>

          {/* Options - scrollable if too many */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
            {pollOptions.map((option) => {
              const voteCount = option.voterUserIds?.length ?? 0;
              const selected = myVotedIds.has(option.optionId);
              const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              const canVote = !isClosed && !voting;

              return (
                <button
                  key={option.optionId}
                  type="button"
                  onClick={() => canVote && onVote(msg, option.optionId)}
                  disabled={!canVote}
                  className={`relative w-full text-left rounded-xl border overflow-hidden text-sm transition-colors ${
                    selected
                      ? 'border-blue-400 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                  } ${!canVote ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {/* Progress bar */}
                  {showResults && totalVotes > 0 && (
                    <div
                      className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-500 ${
                        selected ? 'bg-blue-200/60' : 'bg-gray-200/50'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2 font-medium">
                      {selected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      {option.text}
                    </span>
                    {showResults && (
                      <span className="text-xs text-gray-500 shrink-0 ml-2 flex items-center gap-1">
                        {!msg.pollHideVoters && <Users className="w-3 h-3" />}
                        {voteCount} {percent > 0 && `(${percent}%)`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add option (if allowed and not closed) */}
          {msg.pollCanAddOptions && !isClosed && (
            <div className="mt-2">
              {addingOption ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    autoFocus
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddOption();
                      if (e.key === 'Escape') { setAddingOption(false); setNewOptionText(''); }
                    }}
                    placeholder="Nhập lựa chọn mới..."
                    className="flex-1 h-8 px-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={!newOptionText.trim()}
                    className="h-8 px-3 rounded-lg bg-blue-500 text-white text-xs disabled:opacity-50"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingOption(false); setNewOptionText(''); }}
                    className="h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-500"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingOption(true)}
                  className="mt-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  + Thêm lựa chọn
                </button>
              )}
            </div>
          )}

          {/* Footer: total votes, deadline, settings */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
            <span>{totalVotes} lượt bình chọn</span>
            {!msg.pollHideVoters && totalVotes > 0 && (
              <button
                type="button"
                onClick={() => setShowVoters(true)}
                className="text-blue-500 hover:underline font-medium"
              >
                • Xem chi tiết
              </button>
            )}
            {msg.pollMultipleChoice && <span>• Nhiều lựa chọn</span>}
            {deadlineIso && (
              <span className={`ml-auto flex items-center gap-1 ${isExpired ? 'text-red-400' : ''}`}>
                <Clock className="w-3 h-3" />
                {isExpired ? `Hết hạn (${formatDeadline(deadlineIso)})` : formatDeadline(deadlineIso)}
              </span>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-gray-400 mt-0.5 mx-1">
          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {showVoters && (
        <PollVotersModal
          msg={msg}
          participantNames={participantNames}
          participantIds={participantIds}
          onClose={() => setShowVoters(false)}
        />
      )}
    </div>
  );
}
