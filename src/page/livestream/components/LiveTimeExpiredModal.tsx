// LiveTimeExpiredModal — Shown when a stream is auto-ended due to VIP time limit
import { Clock, Crown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LiveTimeExpiredModalProps {
  open: boolean;
  vipLevel?: number;
  maxMinutes?: number;
  onClose: () => void;
}

export default function LiveTimeExpiredModal({ open, vipLevel = 0, maxMinutes = 5, onClose }: LiveTimeExpiredModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const durationLabel =
    maxMinutes >= 60 ? `${Math.floor(maxMinutes / 60)} giờ` : `${maxMinutes} phút`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white dark:bg-[#1a1d28] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeInScale_0.3s_ease-out]">
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Hết thời gian live!</h2>
          <p className="text-white/80 text-sm">
            Phiên phát trực tiếp đã kết thúc sau {durationLabel}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {vipLevel === 0 ? (
                <>Gói <strong>Miễn phí</strong> giới hạn <strong>{durationLabel}</strong> mỗi phiên live. Nâng cấp VIP để phát lâu hơn!</>
              ) : (
                <>Gói <strong>VIP {vipLevel}</strong> giới hạn <strong>{durationLabel}</strong> mỗi phiên. Nâng cấp gói cao hơn để có thêm thời gian!</>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { onClose(); navigate('/livestream/vip-packages'); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:shadow-lg active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}
            >
              <Crown className="w-4 h-4" />
              Nâng cấp VIP
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gray-100 dark:bg-[#22263a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
