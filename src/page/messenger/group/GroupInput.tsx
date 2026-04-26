// ─── GroupInput — input area for GroupChat with polls, mentions, typing ──
import { Send, AtSign, BarChart3, X } from 'lucide-react';

interface MentionCandidate {
  participantId: string;
  name: string;
}

interface GroupInputProps {
  message: string;
  onMessageInput: (v: string) => void;
  onSend: () => void;
  canSend: boolean;
  sending: boolean;
  activeTab: 'chat' | 'pinned' | 'media';
  // Typing
  typingNames: string[];
  // Poll
  showPollComposer: boolean;
  onTogglePollComposer: () => void;
  pollQuestion: string;
  onPollQuestionChange: (v: string) => void;
  pollOptions: string[];
  onSetPollOptionAt: (index: number, value: string) => void;
  onAddPollOption: () => void;
  onRemovePollOption: (index: number) => void;
  pollMultipleChoice: boolean;
  onPollMultipleChoiceChange: (v: boolean) => void;
  onCreatePoll: () => void;
  creatingPoll: boolean;
  // Mention
  mentionOpen: boolean;
  mentionCandidates: MentionCandidate[];
  onApplyMention: (name: string) => void;
}

export default function GroupInput({
  message,
  onMessageInput,
  onSend,
  canSend,
  sending,
  activeTab,
  typingNames,
  showPollComposer,
  onTogglePollComposer,
  pollQuestion,
  onPollQuestionChange,
  pollOptions,
  onSetPollOptionAt,
  onAddPollOption,
  onRemovePollOption,
  pollMultipleChoice,
  onPollMultipleChoiceChange,
  onCreatePoll,
  creatingPoll,
  mentionOpen,
  mentionCandidates,
  onApplyMention,
}: GroupInputProps) {
  return (
    <div className="border-t border-gray-200 p-3 bg-white">
      {!canSend && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
          Nhom dang bat che do chi admin/owner moi duoc gui tin nhan.
        </div>
      )}

      {activeTab === 'chat' && typingNames.length > 0 && (
        <div className="text-xs text-gray-500 mb-2 inline-flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          {typingNames.join(', ')} dang nhap...
        </div>
      )}

      {activeTab === 'chat' && canSend && (
        <div className="mb-2">
          <button
            onClick={onTogglePollComposer}
            className="h-8 px-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs inline-flex items-center gap-1"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showPollComposer ? 'Dong tao poll' : 'Tao poll'}
          </button>
        </div>
      )}

      {activeTab === 'chat' && showPollComposer && canSend && (
        <div className="mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
          <input
            value={pollQuestion}
            onChange={(e) => onPollQuestionChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300"
            placeholder="Cau hoi binh chon"
          />
          <div className="space-y-2">
            {pollOptions.map((option, idx) => (
              <div key={`poll-option-${idx}`} className="flex items-center gap-2">
                <input
                  value={option}
                  onChange={(e) => onSetPollOptionAt(idx, e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-gray-300"
                  placeholder={`Lua chon ${idx + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button
                    onClick={() => onRemovePollOption(idx)}
                    className="h-9 px-2 rounded-lg border border-gray-300 text-xs hover:bg-white"
                  >
                    Xoa
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onAddPollOption} className="h-8 px-3 rounded-lg border border-gray-300 text-xs hover:bg-white">
              Them lua chon
            </button>
            <label className="text-xs text-gray-700 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={pollMultipleChoice}
                onChange={(e) => onPollMultipleChoiceChange(e.target.checked)}
              />
              Cho phep nhieu lua chon
            </label>
            <button
              onClick={onCreatePoll}
              disabled={creatingPoll}
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-60"
            >
              {creatingPoll ? 'Dang tao...' : 'Dang poll'}
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => onMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Nhap tin nhan (mention: @[Ten Thanh Vien])"
            className="flex-1 h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!canSend || sending || activeTab !== 'chat'}
          />
          <button
            onClick={onSend}
            disabled={!message.trim() || !canSend || sending || activeTab !== 'chat'}
            className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {mentionOpen && mentionCandidates.length > 0 && activeTab === 'chat' && (
          <div className="absolute bottom-14 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-1 z-10">
            {mentionCandidates.map((candidate) => (
              <button
                key={`mention-${candidate.participantId}`}
                onClick={() => onApplyMention(candidate.name)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                {candidate.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
