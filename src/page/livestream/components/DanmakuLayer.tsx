import { forwardRef, useImperativeHandle, useState } from 'react';

interface DanmakuMessage {
  id: string;
  text: string;
  isSelf: boolean;
  trackIndex: number;
}

export interface DanmakuLayerRef {
  addMessage: (text: string, isSelf?: boolean) => void;
}

const TRACK_COUNT = 8;
const ANIMATION_DURATION = 10000; // 10s across screen

type DanmakuProps = { visible?: boolean };

const DanmakuLayer = forwardRef<DanmakuLayerRef, DanmakuProps>(({ visible = true }, ref) => {
  const [messages, setMessages] = useState<DanmakuMessage[]>([]);
  let currentTrack = 0;

  useImperativeHandle(ref, () => ({
    addMessage: (text, isSelf = false) => {
      const id = Date.now().toString() + Math.random();
      const trackIndex = currentTrack % TRACK_COUNT;
      currentTrack++;

      setMessages((prev) => [...prev, { id, text, isSelf, trackIndex }]);

      // Remove after animation finishes
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, ANIMATION_DURATION);
    },
  }));

  return (
    <div
      className={`absolute inset-x-0 top-0 h-[40%] pointer-events-none overflow-hidden z-30 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 invisible'
      }`}
    >
      {messages.map((m) => (
        <div
          key={m.id}
          className="absolute whitespace-nowrap text-lg font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] px-2 py-1"
          style={{
            top: `${(m.trackIndex * 100) / TRACK_COUNT}%`,
            animation: `danmakuMove ${ANIMATION_DURATION}ms linear forwards`,
            color: m.isSelf ? '#7dc3ff' : 'white',
          }}
        >
          {m.text}
        </div>
      ))}

      <style>{`
        @keyframes danmakuMove {
          from { transform: translateX(100vw); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
});

export default DanmakuLayer;
