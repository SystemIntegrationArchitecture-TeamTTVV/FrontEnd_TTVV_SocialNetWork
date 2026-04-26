// ─── GroupForwardModal — forward message in group chat ──────────────────
import { X } from 'lucide-react';

interface GroupForwardModalProps {
  conversations: Array<{ id: string; isGroup?: boolean; groupName?: string; participantNames?: string[] }>;
  targetId: string;
  onTargetChange: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GroupForwardModal({
  conversations,
  targetId,
  onTargetChange,
  onConfirm,
  onCancel,
}: GroupForwardModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Chuyển tiếp tin nhắn</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {conversations.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Không tìm thấy cuộc trò chuyện</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onTargetChange(conv.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm ${
                targetId === conv.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {conv.isGroup ? conv.groupName : conv.participantNames?.join(', ') || conv.id}
            </button>
          ))}
        </div>
        <button
          onClick={onConfirm}
          disabled={!targetId}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50"
        >
          Chuyển tiếp
        </button>
      </div>
    </div>
  );
}
