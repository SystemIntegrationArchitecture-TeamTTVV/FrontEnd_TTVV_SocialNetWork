// ─── GroupInput — input area for GroupChat with polls, mentions, typing ──
import { Send, AtSign, BarChart3, Calendar } from 'lucide-react';

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
  onOpenPollModal: () => void;
  // Appointment
  onOpenAppointmentModal: () => void;
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
  onOpenPollModal,
  onOpenAppointmentModal,
  mentionOpen,
  mentionCandidates,
  onApplyMention,
}: GroupInputProps) {
  return (
    <div className="border-t border-gray-200 p-3 bg-white">
      {!canSend && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
          Nhóm đang bật chế độ chỉ admin/owner mới được gửi tin nhắn.
        </div>
      )}

      {activeTab === 'chat' && typingNames.length > 0 && (
        <div className="text-xs text-gray-500 mb-2 inline-flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          {typingNames.join(', ')} đang nhập...
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Poll button */}
          {activeTab === 'chat' && canSend && (
            <div className="flex gap-2">
              <button
                onClick={onOpenPollModal}
                className="w-11 h-11 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                title="Tạo bình chọn"
              >
                <BarChart3 className="w-5 h-5 text-indigo-500" />
              </button>
              <button
                onClick={onOpenAppointmentModal}
                className="w-11 h-11 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                title="Lên lịch hẹn"
              >
                <Calendar className="w-5 h-5 text-emerald-500" />
              </button>
            </div>
          )}

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
            placeholder="Nhập tin nhắn (mention: @[Tên Thành Viên])"
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
