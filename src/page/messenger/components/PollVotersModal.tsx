import { X, Users } from 'lucide-react';
import type { Message, PollOption } from '../../../apis/messages';

interface PollVotersModalProps {
  msg: Message;
  participantNames?: string[];
  participantIds?: string[];
  onClose: () => void;
}

export default function PollVotersModal({ msg, participantNames = [], participantIds = [], onClose }: PollVotersModalProps) {
  const pollOptions: PollOption[] = msg.pollOptions || [];

  const getUserName = (userId: string) => {
    const idx = participantIds.indexOf(userId);
    if (idx >= 0) return participantNames[idx];
    return userId; // Fallback to ID if name not found
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết bình chọn</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{msg.pollQuestion || msg.content}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {pollOptions.map((option) => {
            const voterIds = option.voterUserIds || [];
            return (
              <div key={option.optionId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {option.text}
                  </h3>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {voterIds.length}
                  </span>
                </div>
                
                {voterIds.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 pl-3.5">
                    {voterIds.map((uid) => (
                      <div key={uid} className="flex items-center gap-2.5 group">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {getUserName(uid).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                          {getUserName(uid)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic pl-3.5">Chưa có ai bình chọn</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
