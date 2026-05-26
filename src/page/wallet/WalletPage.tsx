import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { billingApi, type CoinPackageData, type TransactionData, type PaymentTransactionData } from '../../apis/billing';
import toast from 'react-hot-toast';
import { Coins, Gem, History, CreditCard, Gift, ArrowDownToLine, ReceiptText, ShieldCheck } from 'lucide-react';

type Tab = 'packages' | 'history' | 'payments';

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [tab, setTab] = useState<Tab>('packages');
  const [packages, setPackages] = useState<CoinPackageData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [wallet, pkgs] = await Promise.all([
        billingApi.getWallet(user.id),
        billingApi.getCoinPackages(),
      ]);
      setBalance(wallet.balance);
      setPackages(pkgs);
    } catch {
      toast.error('Không thể tải dữ liệu ví');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    try {
      const txs = await billingApi.getTransactions(user.id);
      setTransactions(txs);
    } catch {
      toast.error('Không thể tải lịch sử giao dịch');
    }
  };

  const loadPayments = async () => {
    if (!user) return;
    try {
      const pays = await billingApi.getPayments(user.id);
      setPayments(pays);
    } catch {
      toast.error('Không thể tải lịch sử thanh toán');
    }
  };

  useEffect(() => {
    if (tab === 'history') loadTransactions();
    if (tab === 'payments') loadPayments();
  }, [tab]);

  /** VNPAY payment flow */
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
    } finally {
      setIsProcessing(null);
    }
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return { text: 'Nạp xu', color: 'text-emerald-500', icon: <ArrowDownToLine className="w-5 h-5 text-emerald-500" /> };
      case 'donate': return { text: 'Tặng quà', color: 'text-orange-500', icon: <Gift className="w-5 h-5 text-orange-500" /> };
      case 'receive': return { text: 'Nhận quà', color: 'text-blue-500', icon: <Gem className="w-5 h-5 text-blue-500" /> };
      default: return { text: type, color: 'text-gray-500', icon: <ReceiptText className="w-5 h-5 text-gray-500" /> };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'PENDING': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      case 'FAILED': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'CANCELLED': return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'Thành công';
      case 'PENDING': return 'Đang xử lý';
      case 'FAILED': return 'Thất bại';
      case 'CANCELLED': return 'Đã hủy';
      case 'EXPIRED': return 'Hết hạn';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1877F2]/30 border-t-[#1877F2] rounded-full animate-spin" />
          <span className="text-[#65676b] dark:text-[#7e89a6] font-medium">Đang tải ví...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ── Balance Card ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1877F2] via-[#4267B2] to-[#6B5CE7] p-8 mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkgy NHYtMmgxMnptLTE2IDZ2MkgyMHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">Số dư ví của bạn</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl font-black text-white tracking-tight">
              {balance.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-2xl text-yellow-300 font-bold bg-white/10 px-3 py-1 rounded-xl backdrop-blur-sm">
              <Coins className="w-6 h-6 fill-yellow-300" />
              <span>xu</span>
            </div>
          </div>
          <p className="text-white/60 text-sm">
            Nạp thêm xu để tặng quà cho streamer yêu thích của bạn
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -right-5 -bottom-12 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-[#f0f2f5] dark:bg-[#22263a] rounded-2xl mb-6">
        {([
          { key: 'packages' as Tab, icon: <Gem className="w-4 h-4" />, label: 'Nạp Xu' },
          { key: 'history' as Tab, icon: <History className="w-4 h-4" />, label: 'Lịch sử' },
          { key: 'payments' as Tab, icon: <CreditCard className="w-4 h-4" />, label: 'Thanh toán' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t.key
                ? 'bg-white dark:bg-[#1a1d28] text-[#1877F2] shadow-md'
                : 'text-[#65676b] dark:text-[#7e89a6] hover:text-[#050505] dark:hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      {tab === 'packages' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#050505] dark:text-[#edf0fa] flex items-center gap-2">
            <Gem className="w-6 h-6 text-[#1877F2]" /> Chọn gói xu để nạp
          </h2>
          <p className="text-sm text-[#65676b] dark:text-[#7e89a6] mb-4">
            Thanh toán an toàn qua VNPAY. Xu sẽ được cộng ngay sau khi thanh toán thành công.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                disabled={!!isProcessing}
                onClick={() => handleBuyPackage(pkg)}
                className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] hover:border-[#1877F2] hover:shadow-lg hover:shadow-[#1877F2]/10 transition-all duration-300 disabled:opacity-50"
              >
                {pkg.bonusCoins > 0 && (
                  <span className="absolute -top-3 right-4 text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full shadow-lg">
                    +{pkg.bonusCoins} xu FREE
                  </span>
                )}

                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  <Coins className="w-10 h-10 text-yellow-500 fill-yellow-500/20" />
                </div>

                <span className="text-2xl font-black text-[#050505] dark:text-[#edf0fa]">
                  {pkg.coins.toLocaleString()} xu
                </span>

                {pkg.bonusCoins > 0 && (
                  <span className="text-sm text-emerald-500 font-medium mt-1">
                    + {pkg.bonusCoins} xu bonus
                  </span>
                )}

                <div className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#6B5CE7] text-white font-bold text-lg group-hover:from-[#1664d9] group-hover:to-[#5a4bd6] transition-all">
                  {isProcessing === pkg.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </span>
                  ) : (
                    formatVnd(pkg.priceVnd)
                  )}
                </div>

                <span className="text-xs text-[#65676b] dark:text-[#7e89a6] mt-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Thanh toán qua VNPAY
                </span>
              </button>
            ))}
          </div>

          {/* VNPAY Logo */}
          <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#e4e6eb] dark:border-[#2b2f45] mt-6">
            <span className="text-xs text-[#8a8d91] dark:text-[#7e89a6]">Powered by</span>
            <div className="bg-[#003087] text-white font-bold text-sm px-3 py-1 rounded-lg">VNPAY</div>
            <span className="text-xs text-[#8a8d91] dark:text-[#7e89a6]">Thanh toán an toàn & bảo mật</span>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-[#050505] dark:text-[#edf0fa] flex items-center gap-2">
            <History className="w-6 h-6 text-[#1877F2]" /> Lịch sử giao dịch xu
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <ReceiptText className="w-12 h-12 text-[#bcc0c4] dark:text-[#4b4f5b]" />
              </div>
              <p className="text-[#65676b] dark:text-[#7e89a6] font-medium">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const typeInfo = getTypeLabel(tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl flex-shrink-0">{typeInfo.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${typeInfo.color}`}>{typeInfo.text}</p>
                      <p className="text-xs text-[#65676b] dark:text-[#7e89a6] truncate">
                        {tx.giftName && `🎁 ${tx.giftName}`}
                        {tx.receiverName && tx.type === 'donate' && ` → ${tx.receiverName}`}
                        {tx.senderName && tx.type === 'receive' && ` từ ${tx.senderName}`}
                        {tx.type === 'deposit' && 'Nạp xu vào ví'}
                      </p>
                      <p className="text-[10px] text-[#8a8d91] dark:text-[#5c6177] mt-0.5">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className={`text-right font-bold text-lg ${
                      tx.type === 'donate' ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {tx.type === 'donate' ? '-' : '+'}{tx.amount.toLocaleString()} xu
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-[#050505] dark:text-[#edf0fa] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#1877F2]" /> Lịch sử thanh toán VNPAY
          </h2>

          {payments.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <CreditCard className="w-12 h-12 text-[#bcc0c4] dark:text-[#4b4f5b]" />
              </div>
              <p className="text-[#65676b] dark:text-[#7e89a6] font-medium">Chưa có giao dịch thanh toán nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(pay => (
                <div
                  key={pay.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#050505] dark:text-[#edf0fa]">
                      {pay.coinPackageName}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(pay.status)}`}>
                      {getStatusLabel(pay.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#65676b] dark:text-[#7e89a6]">
                      {formatVnd(pay.amountVnd)} → {pay.coinAmount.toLocaleString()} xu
                    </span>
                    <span className="text-xs text-[#8a8d91] dark:text-[#5c6177]">
                      {formatDate(pay.createdAt)}
                    </span>
                  </div>
                  {pay.vnpBankCode && (
                    <p className="text-xs text-[#8a8d91] dark:text-[#5c6177] mt-1">
                      Ngân hàng: {pay.vnpBankCode} | Mã GD: {pay.orderCode}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
