import { useEffect, useState } from 'react';
import { billingApi, type GiftData } from '../../../apis/billing';
import { useAuth } from '../../../contexts/AuthContext';
import { X, Coins, Gift, Coffee, CupSoda, Star, Gem, Car, Rocket, Castle, Flower2, Send } from 'lucide-react';

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
        className={`${pos} w-80 h-64 bg-white/90 dark:bg-[#1a1d28]/90 backdrop-blur-xl rounded-3xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-2xl flex flex-col items-center justify-center`}
      >
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
        <span className="text-sm font-medium text-[#65676b] dark:text-[#7e89a6]">Đang tải kho quà...</span>
      </div>
    );

  const renderGiftIcon = (name: string) => {
    const str = name.toLowerCase();
    const c = "w-9 h-9 mb-2 drop-shadow-md transition-transform group-hover:scale-110";
    if (str.includes('hoa')) return <Flower2 className={`${c} text-pink-500`} />;
    if (str.includes('cà phê')) return <Coffee className={`${c} text-amber-700`} />;
    if (str.includes('trà sữa')) return <CupSoda className={`${c} text-orange-500`} />;
    if (str.includes('ngôi sao')) return <Star className={`${c} text-yellow-400`} fill="currentColor" />;
    if (str.includes('kim cương')) return <Gem className={`${c} text-cyan-400`} fill="currentColor" />;
    if (str.includes('xe')) return <Car className={`${c} text-red-500`} fill="currentColor" />;
    if (str.includes('lửa')) return <Rocket className={`${c} text-orange-500`} fill="currentColor" />;
    if (str.includes('lâu đài')) return <Castle className={`${c} text-indigo-500`} />;
    return <Gift className={`${c} text-purple-500`} />;
  };

  return (
    <div
      className={`${pos} w-[340px] bg-white/95 dark:bg-[#1a1d28]/95 backdrop-blur-xl rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-[#e4e6eb]/80 dark:border-[#2b2f45]/80 overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-center bg-gradient-to-r from-[#f0f2f5] to-white dark:from-[#1e2230] dark:to-[#1a1d28] border-b border-[#e4e6eb] dark:border-[#2b2f45]">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-[#050505] dark:text-[#edf0fa] text-base">Kho Quà Tặng</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-[#65676b] dark:text-[#7e89a6] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] hover:text-[#050505] dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Balance & Deposit */}
      <div className="px-5 py-3 flex justify-between items-center bg-[#e7f3ff]/50 dark:bg-[#1877F2]/10">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400/20 p-1.5 rounded-lg">
            <Coins className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="font-bold text-[#050505] dark:text-[#edf0fa] text-[15px]">
            {balance.toLocaleString()} xu
          </span>
        </div>
        <button onClick={onNeedDeposit} className="text-xs px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-[#1877F2] text-white rounded-full font-bold hover:shadow-lg hover:opacity-90 transition-all">
          Nạp thêm
        </button>
      </div>

      {/* Gift Grid */}
      <div className="grid grid-cols-4 gap-3 p-4 overflow-y-auto max-h-64 custom-scrollbar">
        {gifts.map(g => (
          <button
            key={g.id}
            disabled={isSending}
            onClick={() => handleSend(g)}
            className="group relative flex flex-col items-center p-3 rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 hover:bg-white dark:hover:bg-[#22263a] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-indigo-500/10 transition-all disabled:opacity-50"
          >
            {renderGiftIcon(g.name)}
            <span className="text-[11px] font-medium text-[#65676b] dark:text-[#c8ccde] truncate w-full text-center mt-1">
              {g.name}
            </span>
            <div className="flex items-center gap-1 mt-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500">{g.price}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 pt-2 bg-gradient-to-t from-white to-transparent dark:from-[#1a1d28]">
        <div className="relative">
          <input
            type="text"
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            maxLength={120}
            placeholder="Gửi kèm lời chúc ngọt ngào..."
            className="w-full rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-[#f0f2f5] dark:bg-[#13151f] pl-4 pr-10 py-3 text-sm font-medium text-[#050505] dark:text-[#edf0fa] placeholder:text-[#8a8d91] dark:placeholder:text-[#7e89a6] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 opacity-60">
            <Send className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
