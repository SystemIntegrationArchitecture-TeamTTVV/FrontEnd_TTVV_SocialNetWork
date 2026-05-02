import { useState } from 'react';
import { billingApi } from '../../../apis/billing';
import { useAuth } from '../../../contexts/AuthContext';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export default function DepositModal({ onClose, onSuccess }: DepositModalProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const PACKAGES = [
    { coins: 100, price: '10.000đ' },
    { coins: 500, price: '50.000đ', bonus: '+50 xu' },
    { coins: 1000, price: '100.000đ', bonus: '+150 xu' },
    { coins: 5000, price: '500.000đ', bonus: '+1000 xu' }
  ];

  const handleDeposit = async (amount: number) => {
    if (!user) return;
    try {
      setIsProcessing(true);
      // Giả lập delay thanh toán (nếu thật thì gọi QR SePay)
      await new Promise(r => setTimeout(r, 1000));
      const res = await billingApi.deposit(user.id, amount);
      onSuccess(res.balance);
      alert('Nạp xu thành công!');
      onClose();
    } catch (e) {
      alert('Lỗi nạp xu');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1d28] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.25)] border border-[#e4e6eb] dark:border-[#2b2f45] relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-4 flex items-center justify-between border-b border-[#e4e6eb] dark:border-[#2b2f45] bg-[#f7f8fa] dark:bg-[#13151f]/60">
          <h2 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa] flex items-center gap-2">
            <span className="text-yellow-500">💰</span> Nạp Xu
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] rounded-full text-[#65676b] dark:text-[#7e89a6] transition-colors">
            ✕
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-[#65676b] dark:text-[#7e89a6] mb-4 text-center">
            Đây là bản demo. Nhấn vào gói xu để cộng tiền vào ví lập tức mà không cần thanh toán thật.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.coins}
                disabled={isProcessing}
                onClick={() => handleDeposit(pkg.coins)}
                className="relative flex flex-col items-center justify-center p-4 border-2 border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl hover:border-[#1877F2] hover:bg-[#e7f3ff]/70 dark:hover:bg-[#1877F2]/15 transition-all disabled:opacity-50 group"
              >
                {pkg.bonus && (
                  <span className="absolute -top-2.5 right-2 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                    {pkg.bonus}
                  </span>
                )}
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🪙</span>
                <span className="font-bold text-[#050505] dark:text-[#edf0fa] text-lg">{pkg.coins.toLocaleString()} xu</span>
                <span className="text-sm text-[#1877F2] font-medium mt-1">{pkg.price}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
