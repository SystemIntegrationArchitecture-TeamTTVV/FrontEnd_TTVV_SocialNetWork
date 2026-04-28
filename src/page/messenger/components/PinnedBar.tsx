// ─── PinnedBar — compact Zalo-style pinned messages strip under header ───
import { useState } from 'react';
import { Pin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { DisplayMessage } from '../../../hooks/useMessages';

interface PinnedBarProps {
  messages: DisplayMessage[];
  onUnpin: (messageId: string) => void;
  onScrollTo: (messageId: string) => void;
}

export default function PinnedBar({ messages, onUnpin, onScrollTo }: PinnedBarProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (messages.length === 0) return null;

  const safeIdx = Math.min(currentIdx, messages.length - 1);
  const current = messages[safeIdx];

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev <= 0 ? messages.length - 1 : prev - 1));
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev >= messages.length - 1 ? 0 : prev + 1));
  };
  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnpin(current.id);
    if (safeIdx >= messages.length - 1 && safeIdx > 0) {
      setCurrentIdx(safeIdx - 1);
    }
  };

  return (
    <div
      onClick={() => onScrollTo(current.id)}
      className="border-b border-gray-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-2 flex items-center gap-2.5 cursor-pointer hover:bg-blue-50/60 transition-colors group"
    >
      {/* Pin icon + counter */}
      <div className="flex items-center gap-1 shrink-0">
        <Pin className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center">
          {messages.length}
        </span>
      </div>

      {/* Navigation arrows (only when > 1) */}
      {messages.length > 1 && (
        <div className="flex flex-col gap-0 shrink-0">
          <button
            onClick={goPrev}
            className="w-4 h-3 flex items-center justify-center rounded hover:bg-blue-100 transition-colors"
          >
            <ChevronLeft className="w-3 h-3 text-blue-400 rotate-90" />
          </button>
          <button
            onClick={goNext}
            className="w-4 h-3 flex items-center justify-center rounded hover:bg-blue-100 transition-colors"
          >
            <ChevronRight className="w-3 h-3 text-blue-400 rotate-90" />
          </button>
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-600 truncate">
          {current.sender}
        </p>
        <p className="text-xs text-gray-700 truncate">
          {current.content || '📎 Tệp đính kèm'}
        </p>
      </div>

      {/* Index indicator */}
      {messages.length > 1 && (
        <span className="text-[10px] text-gray-400 shrink-0 font-medium">
          {safeIdx + 1}/{messages.length}
        </span>
      )}

      {/* Unpin button */}
      <button
        onClick={handleUnpin}
        className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all shrink-0"
        title="Bỏ ghim"
      >
        <X className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}
