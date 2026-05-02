import { useEffect, useState } from 'react';
import { billingApi, type GiftData } from '../../../apis/billing';
import { useAuth } from '../../../contexts/AuthContext';

interface GiftPickerProps {
  streamerId: string;
  streamerName: string;
  roomId: string;
  onClose: () => void;
  onGiftSent: (gift: GiftData) => void;
  onNeedDeposit: () => void;
  /** Neo gần nút quà (panel bình luận ThamKhao) thay vì góc phải màn hình */
  docked?: boolean;
}

export default function GiftPicker({
  streamerId,
  streamerName,
  roomId,
  onClose,
  onGiftSent,
  onNeedDeposit,
  docked,
}: GiftPickerProps) {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      billingApi.getGifts(),
      billingApi.getWallet(user.id)
    ])
    .then(([giftsData, wallet]) => {
      setGifts(giftsData);
      setBalance(wallet.balance);
    })
    .catch(console.error)
    .finally(() => setIsLoading(false));
  }, [user]);

  const handleSend = async (gift: GiftData) => {
    if (!user) return;
    if (balance < gift.price) {
      onNeedDeposit();
      return;
    }

    try {
      setIsSending(true);
      await billingApi.donate({
        senderId: user.id,
        senderName: user.fullName,
        receiverId: streamerId,
        receiverName: streamerName,
        giftId: gift.id,
        roomId,
        giftMessage: giftMessage.trim() || undefined,
      });
      setBalance((b) => b - gift.price);
      onGiftSent(gift);
      setGiftMessage('');
      onClose();
    } catch (error) {
      console.error('Lỗi tặng quà:', error);
      alert('Không thể gửi quà. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const pos = docked
    ? 'absolute bottom-full left-0 mb-2 z-[120]'
    : 'absolute bottom-16 right-4 z-50';

  if (isLoading)
    return (
      <div
        className={`${pos} w-72 h-40 bg-white dark:bg-[#1a1d28] rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center`}
      >
        <span className="text-sm font-medium text-[#65676b] dark:text-[#7e89a6]">Đang tải...</span>
      </div>
    );

  return (
    <div
      className={`${pos} w-80 bg-white dark:bg-[#1a1d28] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-[#e4e6eb] dark:border-[#2b2f45] overflow-hidden flex flex-col`}
    >
      <div className="p-3 border-b border-[#e4e6eb] dark:border-[#2b2f45] flex justify-between items-center bg-[#f7f8fa] dark:bg-[#13151f]/60">
        <h3 className="font-bold text-[#050505] dark:text-[#edf0fa]">Kho Quà Tặng</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full text-[#65676b] dark:text-[#7e89a6] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="p-3 flex justify-between items-center bg-[#e7f3ff] dark:bg-[#1877F2]/12">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 font-bold">🪙</span>
          <span className="font-bold text-[#050505] dark:text-[#edf0fa]">{balance.toLocaleString()} xu</span>
        </div>
        <button onClick={onNeedDeposit} className="text-xs px-3 py-1 bg-[#1877F2] text-white rounded-full font-medium hover:bg-[#1664d9]">
          Nạp thêm
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3 overflow-y-auto max-h-60">
        {gifts.map(g => (
          <button
            key={g.id}
            disabled={isSending}
            onClick={() => handleSend(g)}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] transition-colors disabled:opacity-50"
          >
            <span className="text-3xl mb-1">{g.emoji}</span>
            <span className="text-xs text-[#65676b] dark:text-[#c8ccde] truncate w-full text-center">{g.name}</span>
            <span className="text-[10px] font-bold text-yellow-500 mt-0.5">{g.price} xu</span>
          </button>
        ))}
      </div>

      <div className="px-3 pb-3">
        <input
          type="text"
          value={giftMessage}
          onChange={(e) => setGiftMessage(e.target.value)}
          maxLength={120}
          placeholder="Lời nhắn kèm quà (tuỳ chọn)"
          className="w-full rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-[#f7f8fa] dark:bg-[#13151f] px-3 py-2 text-sm text-[#050505] dark:text-[#edf0fa] placeholder:text-[#8a8d91] dark:placeholder:text-[#7e89a6]"
        />
      </div>
    </div>
  );
}
