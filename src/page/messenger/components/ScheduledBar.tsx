// ─── ScheduledBar — shows pending scheduled messages under pinned bar ───
import { useEffect, useState } from 'react';
import { Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ScheduledMessage } from '../../../apis/messages';

interface ScheduledBarProps {
  messages: ScheduledMessage[];
  onCancel: (id: string) => void;
}

function formatCountdown(targetDate: string): string {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return 'Đang gửi...';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

export default function ScheduledBar({ messages, onCancel }: ScheduledBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Countdown timer — re-render every second
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const pending = messages.filter((m) => m.status === 'PENDING');
  if (pending.length === 0) return null;

  const nearest = pending[0]; // sorted by scheduledAt ASC

  return (
    <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white">
      {/* Compact bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-2 flex items-center gap-2.5 cursor-pointer hover:bg-amber-50/60 transition-colors group"
      >
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 rounded-full w-4 h-4 flex items-center justify-center">
            {pending.length}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-600 truncate">
            Tin nhắn hẹn giờ
          </p>
          <p className="text-xs text-gray-700 truncate">
            {nearest.content.substring(0, 50) || '📎 Tệp đính kèm'}
            <span className="ml-1.5 text-amber-500 font-semibold">{formatCountdown(nearest.scheduledAt)}</span>
          </p>
        </div>

        <div className="shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded list */}
      {expanded && (
        <div className="px-4 pb-2 space-y-1.5 max-h-40 overflow-y-auto">
          {pending.map((msg) => (
            <div
              key={msg.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-amber-100 text-left"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{msg.content || '📎 Tệp đính kèm'}</p>
                <p className="text-[10px] text-amber-500 font-medium">
                  ⏰ {formatTime(msg.scheduledAt)} · {formatCountdown(msg.scheduledAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(msg.id);
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                title="Hủy tin nhắn hẹn giờ"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
