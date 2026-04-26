// ─── ForwardModal — forward message to another conversation ─────────────
import type { Conversation } from '../../../apis/conversations';

interface ForwardModalProps {
  message: { id: string; content: string };
  conversations: Conversation[];
  getConversationDisplayName: (conv: Conversation) => string;
  targetConversationId: string;
  onTargetChange: (id: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  isForwarding: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ForwardModal({
  message,
  conversations,
  getConversationDisplayName,
  targetConversationId,
  onTargetChange,
  note,
  onNoteChange,
  isForwarding,
  onConfirm,
  onCancel,
}: ForwardModalProps) {
  return (
    <div
      className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-2xl p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Forward message</h3>
          <p className="text-sm text-gray-600 mt-1">Select a conversation and optionally add a note.</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm text-gray-700 max-h-24 overflow-auto whitespace-pre-wrap">
          {message.content || '[No text content]'}
        </div>

        <select
          value={targetConversationId}
          onChange={(e) => onTargetChange(e.target.value)}
          className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Select conversation</option>
          {conversations.map((conv) => (
            <option key={conv.id} value={conv.id}>
              {getConversationDisplayName(conv)}
            </option>
          ))}
        </select>

        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add an optional note"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
        />

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={isForwarding}
            className="h-10 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!targetConversationId || isForwarding}
            className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {isForwarding ? 'Forwarding...' : 'Forward'}
          </button>
        </div>
      </div>
    </div>
  );
}
