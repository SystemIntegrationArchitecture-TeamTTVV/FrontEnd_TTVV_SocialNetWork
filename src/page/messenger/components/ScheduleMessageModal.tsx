// ─── ScheduleMessageModal — modal to create a scheduled message ──────────
import { useState } from 'react';
import { X, Clock, Send, Loader2 } from 'lucide-react';

interface ScheduleMessageModalProps {
  onClose: () => void;
  onSubmit: (content: string, scheduledAt: string) => Promise<void>;
}

export default function ScheduleMessageModal({ onClose, onSubmit }: ScheduleMessageModalProps) {
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Minimum datetime = now + 1 minute
  const now = new Date();
  const minDate = now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes() + 1).padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung tin nhắn');
      return;
    }
    if (!date || !time) {
      setError('Vui lòng chọn ngày và giờ');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);
    if (scheduledAt.getTime() <= Date.now() + 60000) {
      setError('Thời gian phải sau ít nhất 1 phút');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), scheduledAt.toISOString());
      onClose();
    } catch {
      setError('Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-gray-800">Hẹn giờ gửi tin nhắn</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Message content */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nội dung tin nhắn
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung tin nhắn..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-300 text-sm resize-none transition-all outline-none"
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Ngày
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-300 text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Giờ
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={date === minDate ? currentTime : undefined}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-300 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 font-medium bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !date || !time}
            className="px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{submitting ? 'Đang đặt...' : 'Đặt lịch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
