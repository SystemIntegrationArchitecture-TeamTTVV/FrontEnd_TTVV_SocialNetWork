import { useEffect, useState } from 'react';
import { billingApi } from '../../../apis/billing';
import type { TopDonorData } from '../../../apis/billing';

interface TopDonorsProps {
  streamerId: string;
  /** Ẩn hoàn toàn (ThamKhao: "Ẩn Top Donate") */
  hidden?: boolean;
  /** Card trắng giống ThamKhao host */
  variant?: 'glass' | 'lightCard';
  className?: string;
}

export default function TopDonors({ streamerId, hidden, variant = 'glass', className = '' }: TopDonorsProps) {
  const [donors, setDonors] = useState<TopDonorData[]>([]);

  useEffect(() => {
    // Fetch initial top donors
    const fetchDonors = () => {
      billingApi.getTopDonors(streamerId)
        .then(setDonors)
        .catch(console.error);
    };

    fetchDonors();
    // Poll every 30s to update the leaderboard (can be replaced by socket push later)
    const interval = setInterval(fetchDonors, 30000);
    return () => clearInterval(interval);
  }, [streamerId]);

  if (hidden) return null;
  if (donors.length === 0) return null;

  const isLight = variant === 'lightCard';

  return (
    <div
      className={`absolute top-4 right-4 z-30 flex flex-col gap-2 rounded-2xl shadow-lg border ${
        isLight
          ? 'w-52 p-3 bg-white border-slate-200 text-slate-800'
          : 'w-52 p-3 bg-black/40 backdrop-blur-md border-white/10 text-white'
      } ${className}`}
    >
      <div
        className={`flex items-center gap-2 px-0.5 mb-0.5 ${
          isLight ? 'border-b border-slate-100 pb-2' : 'border-b border-white/10 pb-2'
        }`}
      >
        <span className="text-amber-500">🏆</span>
        <span
          className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-blue-700' : 'text-white'}`}
        >
          Top Donate
        </span>
      </div>

      {donors.map((d, index) => (
        <div
          key={d.senderId}
          className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-xl ${
            isLight ? 'bg-slate-50' : 'bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <span
              className={`font-bold w-5 shrink-0 ${
                index === 0
                  ? 'text-amber-500'
                  : index === 1
                    ? 'text-slate-500'
                    : index === 2
                      ? 'text-amber-700'
                      : isLight
                        ? 'text-slate-400'
                        : 'text-white/40'
              }`}
            >
              #{index + 1}
            </span>
            <span className={`truncate ${isLight ? 'text-slate-800 font-medium' : 'text-white/90'}`}>
              {d.senderName}
            </span>
          </div>
          <div
            className={`flex items-center gap-0.5 font-mono font-bold shrink-0 text-[11px] ${
              isLight ? 'text-blue-600' : 'text-yellow-400'
            }`}
          >
            {d.totalCoins}
            <span className="text-[10px]">xu</span>
          </div>
        </div>
      ))}
    </div>
  );
}
