// ─── PinnedMessagesPanel — shows pinned messages in a conversation ──────
import { Pin, X } from 'lucide-react';
import type { DisplayMessage } from '../../../hooks/useMessages';

interface PinnedMessagesPanelProps {
  messages: DisplayMessage[];
  loading: boolean;
  onClose: () => void;
}

export default function PinnedMessagesPanel({ messages, loading, onClose }: PinnedMessagesPanelProps) {
  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800">Tin nhắn đã ghim</span>
          <span className="text-xs text-gray-400">({messages.length})</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-2">
        {loading ? (
          <p className="text-xs text-gray-400 py-2">Đang tải...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">Chưa có tin nhắn nào được ghim</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/60 hover:bg-blue-50 transition-colors cursor-pointer text-left"
              onClick={() => {
                const el = document.getElementById(`msg-${msg.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-2', 'ring-blue-400');
                  setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000);
                }
              }}
            >
              <Pin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-700">{msg.sender}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{msg.content || '📎 Tệp đính kèm'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{msg.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
