import { forwardRef, useImperativeHandle, useState } from 'react';

interface GiftEvent {
  id: string;
  senderName: string;
  giftName: string;
  giftEmoji: string;
  giftMessage?: string;
}

export interface GiftOverlayRef {
  showGift: (data: Omit<GiftEvent, 'id'>) => void;
}

const GiftOverlay = forwardRef<GiftOverlayRef, {}>((_, ref) => {
  const [gifts, setGifts] = useState<GiftEvent[]>([]);

  useImperativeHandle(ref, () => ({
    showGift: (data) => {
      const id = Date.now().toString();
      setGifts((prev) => [...prev, { ...data, id }]);

      // Remove after animation (3.5s)
      setTimeout(() => {
        setGifts((prev) => prev.filter((g) => g.id !== id));
      }, 3500);
    },
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40 flex items-center justify-center pb-20">
      <div className="flex flex-col gap-4 items-center justify-end w-full max-h-full">
        {gifts.map((g) => (
          <div
            key={g.id}
            className="animate-bounce-in-out flex items-center gap-3 bg-[#111827]/75 backdrop-blur-md text-white px-6 py-3 rounded-full border border-[#1877F2]/35 shadow-[0_0_20px_rgba(24,119,242,0.32)]"
          >
            <div className="flex flex-col">
              <span className="text-xs text-white/70">{g.senderName}</span>
              <span className="font-bold text-[#7dc3ff]">Đã tặng {g.giftName}</span>
              {g.giftMessage ? (
                <span className="text-[11px] text-white/85 max-w-[260px] truncate">"{g.giftMessage}"</span>
              ) : null}
            </div>
            <span className="text-5xl animate-pulse">{g.giftEmoji}</span>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes bounceInOut {
          0% { transform: scale(0.5) translateY(100px); opacity: 0; }
          20% { transform: scale(1.1) translateY(-10px); opacity: 1; }
          30% { transform: scale(1) translateY(0); opacity: 1; }
          80% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.8) translateY(-50px); opacity: 0; }
        }
        .animate-bounce-in-out {
          animation: bounceInOut 3.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
});

export default GiftOverlay;
