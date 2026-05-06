import { useState } from 'react';
import { Calendar, Clock, X, Send } from 'lucide-react';

interface ScheduleMessagePickerProps {
  onConfirm: (scheduledAt: string) => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Build a local datetime string suitable for <input type="datetime-local"> min value */
const toLocalDTString = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function ScheduleMessagePicker({ onConfirm, onClose }: ScheduleMessagePickerProps) {
  const now = new Date();
  // Default: 1 hour from now
  const defaultDT = new Date(now.getTime() + 60 * 60 * 1000);
  const [value, setValue] = useState(toLocalDTString(defaultDT));

  const minValue = toLocalDTString(new Date(now.getTime() + 60 * 1000)); // at least 1 min ahead

  const handleConfirm = () => {
    if (!value) return;
    const picked = new Date(value);
    if (picked <= now) return;
    onConfirm(picked.toISOString());
  };

  const displayDate = value ? new Date(value).toLocaleString() : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900 text-base">Lên lịch tin nhắn</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Tin nhắn sẽ được gửi vào thời điểm bạn chọn.</p>

        {/* Datetime picker */}
        <div className="mb-5">
          <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Thời điểm gửi
          </label>
          <input
            type="datetime-local"
            value={value}
            min={minValue}
            onChange={e => setValue(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {value && (
            <p className="text-xs text-gray-400 mt-1.5">{displayDate}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value || new Date(value) <= now}
            className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
