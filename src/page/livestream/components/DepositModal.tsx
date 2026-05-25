import { useEffect, useState } from 'react';
import { billingApi, type CoinPackageData } from '../../../apis/billing';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Coins } from 'lucide-react';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export default function DepositModal({ onClose, onSuccess }: DepositModalProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [packages, setPackages] = useState<CoinPackageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const pkgs = await billingApi.getCoinPackages();
      setPackages(pkgs);
    } catch {
      // Fallback to legacy mock packages if API fails
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  /** Real VNPAY payment flow */
  const handleBuyPackage = async (pkg: CoinPackageData) => {
    if (!user) return;
    setIsProcessing(pkg.id);
    try {
      // Step 1: Create payment order in backend
      const paymentOrder = await billingApi.createPaymentOrder(user.id, pkg.id);

      // Step 2: Get VNPAY payment URL
      const paymentUrl = await billingApi.getVnpayPaymentUrl(
        paymentOrder.orderCode,
        paymentOrder.amountVnd
      );

      // Step 3: Redirect to VNPAY
      window.location.href = paymentUrl;
    } catch (err: any) {
      toast.error(err?.message || 'Không thể khởi tạo thanh toán');
      setIsProcessing(null);
    }
  };

  /** Fallback demo deposit (when packages API unavailable) */
  const handleDemoDeposit = async (amount: number) => {
    if (!user) return;
    try {
      setIsProcessing(String(amount));
      await new Promise(r => setTimeout(r, 800));
      const res = await billingApi.deposit(user.id, amount);
      onSuccess(res.balance);
      toast.success('Nạp xu thành công!');
      onClose();
    } catch {
      toast.error('Lỗi nạp xu');
    } finally {
      setIsProcessing(null);
    }
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const LEGACY_PACKAGES = [
    { id: '100', coins: 100, priceVnd: 10000 },
    { id: '500', coins: 500, priceVnd: 50000, bonusCoins: 50 },
    { id: '1000', coins: 1000, priceVnd: 100000, bonusCoins: 150 },
    { id: '5000', coins: 5000, priceVnd: 500000, bonusCoins: 1000 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1d28] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.25)] border border-[#e4e6eb] dark:border-[#2b2f45] relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-4 flex items-center justify-between border-b border-[#e4e6eb] dark:border-[#2b2f45] bg-[#f7f8fa] dark:bg-[#13151f]/60">
          <h2 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa] flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500 fill-yellow-500/20" /> Nạp Xu
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] rounded-full text-[#65676b] dark:text-[#7e89a6] transition-colors">
            ✕
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#1877F2]/30 border-t-[#1877F2] rounded-full animate-spin" />
            </div>
          ) : packages.length > 0 ? (
            <>
              <p className="text-sm text-[#65676b] dark:text-[#7e89a6] mb-4 text-center">
                Thanh toán an toàn qua <span className="font-bold text-[#003087]">VNPAY</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    disabled={!!isProcessing}
                    onClick={() => handleBuyPackage(pkg)}
                    className="relative flex flex-col items-center justify-center p-4 border-2 border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl hover:border-[#1877F2] hover:bg-[#e7f3ff]/70 dark:hover:bg-[#1877F2]/15 transition-all disabled:opacity-50 group"
                  >
                    {pkg.bonusCoins > 0 && (
                      <span className="absolute -top-2.5 right-2 text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                        +{pkg.bonusCoins} xu
                      </span>
                    )}
                    <Coins className="w-8 h-8 mb-2 text-yellow-500 fill-yellow-500/20 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-[#050505] dark:text-[#edf0fa] text-lg">
                      {pkg.coins.toLocaleString()} xu
                    </span>
                    <span className="text-sm text-[#1877F2] font-medium mt-1">
                      {isProcessing === pkg.id ? 'Đang xử lý...' : formatVnd(pkg.priceVnd)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#e4e6eb] dark:border-[#2b2f45]">
                <div className="bg-[#003087] text-white font-bold text-[10px] px-2 py-0.5 rounded">VNPAY</div>
                <span className="text-[10px] text-[#8a8d91]">Bảo mật SSL 256-bit</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[#65676b] dark:text-[#7e89a6] mb-4 text-center">
                Chế độ demo — Nhấn để cộng xu trực tiếp
              </p>

              <div className="grid grid-cols-2 gap-3">
                {LEGACY_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    disabled={!!isProcessing}
                    onClick={() => handleDemoDeposit(pkg.coins + (pkg.bonusCoins || 0))}
                    className="relative flex flex-col items-center justify-center p-4 border-2 border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl hover:border-[#1877F2] hover:bg-[#e7f3ff]/70 dark:hover:bg-[#1877F2]/15 transition-all disabled:opacity-50 group"
                  >
                    {pkg.bonusCoins && (
                      <span className="absolute -top-2.5 right-2 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                        +{pkg.bonusCoins} xu
                      </span>
                    )}
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🪙</span>
                    <span className="font-bold text-[#050505] dark:text-[#edf0fa] text-lg">{pkg.coins.toLocaleString()} xu</span>
                    <span className="text-sm text-[#1877F2] font-medium mt-1">
                      {isProcessing === pkg.id ? '⏳...' : formatVnd(pkg.priceVnd)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
