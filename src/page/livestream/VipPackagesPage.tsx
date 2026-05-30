// VipPackagesPage — Premium pricing page for VIP livestream packages
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Star, Diamond, Zap, Check, ArrowLeft, Clock, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { vipApi, type VipSubscription, type VipPackageInfo } from '../../apis/vip';
import { usersApi } from '../../apis/users';
import toast from 'react-hot-toast';

const TIER_STYLES = [
  { gradient: 'from-gray-400 to-gray-500', ring: 'ring-gray-200', icon: Zap, iconColor: 'text-gray-500', cardBg: 'bg-white dark:bg-[#1a1d28]', badge: '' },
  { gradient: 'from-amber-400 to-yellow-500', ring: 'ring-amber-200', icon: Star, iconColor: 'text-amber-500', cardBg: 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-[#1a1d28]', badge: '⭐' },
  { gradient: 'from-violet-500 to-purple-600', ring: 'ring-purple-200', icon: Diamond, iconColor: 'text-purple-500', cardBg: 'bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-[#1a1d28]', badge: '💎' },
  { gradient: 'from-rose-500 via-red-500 to-orange-500', ring: 'ring-red-200', icon: Crown, iconColor: 'text-red-500', cardBg: 'bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-[#1a1d28]', badge: '👑' },
];

function formatDuration(minutes: number): string {
  if (minutes <= 0) return 'Không giới hạn';
  if (minutes < 60) return `${minutes} phút`;
  return `${minutes / 60} giờ`;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Đã hết hạn'); return; }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    };
    calc();
    const interval = setInterval(calc, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-sm font-mono">
      <Clock className="w-4 h-4 text-blue-500" />
      <span className="text-[#050505] dark:text-[#edf0fa] font-semibold">{timeLeft}</span>
    </div>
  );
}

export default function VipPackagesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailUserId = searchParams.get('userId');

  const [packages, setPackages] = useState<VipPackageInfo[]>([]);
  const [currentVip, setCurrentVip] = useState<VipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  // States check mismatch tài khoản
  const [emailUser, setEmailUser] = useState<any>(null);
  const [isMismatch, setIsMismatch] = useState(false);

  useEffect(() => {
    const checkMismatch = async () => {
      if (!emailUserId) {
        setIsMismatch(false);
        return;
      }
      if (!user?.id) return;

      if (user.id === emailUserId) {
        setIsMismatch(false);
        return;
      }

      // Xảy ra mismatch giữa user đăng nhập và userId từ email
      try {
        const fetchedUser = await usersApi.getUserById(emailUserId);
        setEmailUser(fetchedUser);
        setIsMismatch(true);
        toast.error("Tài khoản bạn tư vấn và tài khoản bạn đăng nhập khác nhau!", {
          duration: 6000,
          position: "top-center"
        });
      } catch (err) {
        console.error("Failed to fetch user by emailUserId:", err);
        setIsMismatch(true); // Vẫn báo mismatch
      }
    };
    checkMismatch();
  }, [emailUserId, user?.id]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [pkgs, vip] = await Promise.all([
        vipApi.getVipPackages(),
        vipApi.getVipInfo(user.id),
      ]);
      setPackages(pkgs);
      setCurrentVip(vip);
    } catch (err) {
      console.error('Failed to load VIP data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePurchase = async (level: number) => {
    if (!user?.id || level < 1) return;
    setPurchasing(level);
    try {
      // Step 1: Create payment order
      const order = await vipApi.purchaseVip(user.id, level);
      // Step 2: Get VNPAY URL
      const paymentUrl = await vipApi.getVnpayVipUrl(order.orderCode, order.amountVnd);
      // Step 3: Redirect to VNPAY
      window.location.href = paymentUrl;
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo đơn thanh toán');
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-3 border-[#e4e6eb] dark:border-[#2b2f45] border-t-[#1877F2] rounded-full animate-spin" />
      </div>
    );
  }

  const currentLevel = currentVip?.vipLevel ?? 0;
  const isActive = currentVip?.status === 'ACTIVE' && currentLevel > 0;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-sm overflow-hidden">
        <div
          className="p-6 md:p-8 text-center relative"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}
        >
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute left-1/2 top-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="relative z-10">
            <button
              onClick={() => navigate('/livestream')}
              className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
              Gói VIP Livestream
            </h1>
            <p className="text-white/70 text-sm max-w-md mx-auto">
              Nâng cấp để mở khóa thời gian phát trực tiếp dài hơn và nhiều tính năng cao cấp
            </p>
          </div>
        </div>

        {/* Current VIP status bar */}
        {isActive && currentVip?.expiresAt && (
          <div className="px-6 py-4 border-t border-[#e4e6eb] dark:border-[#2b2f45] flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${TIER_STYLES[currentLevel]?.gradient} flex items-center justify-center shadow-md`}>
                {(() => { const Icon = TIER_STYLES[currentLevel]?.icon || Zap; return <Icon className="w-5 h-5 text-white" />; })()}
              </div>
              <div>
                <p className="text-sm font-bold text-[#050505] dark:text-[#edf0fa]">
                  Gói hiện tại: VIP {currentLevel}
                </p>
                <p className="text-xs text-[#65676b] dark:text-[#7e89a6]">
                  Còn lại:
                </p>
              </div>
            </div>
            <CountdownTimer expiresAt={currentVip.expiresAt} />
          </div>
        )}
      </div>

      {/* Mismatch Warning Banner */}
      {isMismatch && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-base font-bold text-red-700 dark:text-red-400">
                ⚠️ Tài khoản không khớp!
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300">
                Tài khoản bạn được tư vấn là <span className="font-bold underline">{emailUser?.fullName || emailUser?.username || "đang được tải..."}</span>, nhưng tài khoản bạn đang đăng nhập là <span className="font-bold underline">{user?.fullName || user?.username}</span>.
              </p>
              <p className="text-xs text-red-500/80 dark:text-red-400/80">
                Vui lòng đăng nhập đúng tài khoản được tư vấn để tiếp tục thanh toán và tránh lỗi giao dịch.
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="shrink-0 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-red-600/20"
          >
            Đăng nhập tài khoản khác
          </button>
        </div>
      )}

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => {
          const style = TIER_STYLES[pkg.level] || TIER_STYLES[0];
          const Icon = style.icon;
          const isCurrent = currentLevel === pkg.level && isActive;
          const isUpgrade = pkg.level > currentLevel;
          const isDowngrade = pkg.level < currentLevel && pkg.level > 0;
          const isFree = pkg.level === 0;
          const isPurchasing = purchasing === pkg.level;

          return (
            <div
              key={pkg.level}
              className={`
                relative rounded-2xl border overflow-hidden transition-all duration-300
                ${isCurrent
                  ? `ring-2 ${style.ring} border-transparent shadow-lg scale-[1.02]`
                  : 'border-[#e4e6eb] dark:border-[#2b2f45] hover:shadow-lg hover:-translate-y-1'
                }
                ${style.cardBg}
              `}
            >
              {/* Popular tag for Pro */}
              {pkg.level === 2 && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider">
                  PHỔ BIẾN
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" /> ĐANG DÙNG
                </div>
              )}

              <div className="p-5 pt-8">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${style.gradient} flex items-center justify-center shadow-md mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa] mb-1">
                  {pkg.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  {isFree ? (
                    <div className="text-2xl font-black text-gray-400">Miễn phí</div>
                  ) : (
                    <>
                      <div className="text-2xl font-black text-[#050505] dark:text-[#edf0fa]">
                        {formatVnd(pkg.priceVnd)}
                      </div>
                      <div className="text-xs text-[#65676b] dark:text-[#7e89a6]">/ tháng</div>
                    </>
                  )}
                </div>

                {/* Duration highlight */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#22263a]">
                  <Clock className={`w-4 h-4 ${style.iconColor}`} />
                  <span className="text-sm font-semibold text-[#050505] dark:text-[#edf0fa]">
                    {formatDuration(pkg.maxLiveDurationMinutes)}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconColor}`} />
                      <span className="text-[#050505] dark:text-[#edf0fa]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isFree ? (
                  <div className="w-full py-3 text-center text-sm font-medium text-gray-400 rounded-xl bg-gray-50 dark:bg-[#22263a]">
                    Gói mặc định
                  </div>
                ) : isCurrent ? (
                  <div className="w-full py-3 text-center text-sm font-bold text-emerald-600 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                    ✓ Đang sử dụng
                  </div>
                ) : isDowngrade ? (
                  <div className="w-full py-3 text-center text-sm font-medium text-gray-400 rounded-xl bg-gray-50 dark:bg-[#22263a]">
                    Gói thấp hơn
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(pkg.level)}
                    disabled={isPurchasing || isMismatch}
                    className={`
                      w-full flex items-center justify-center gap-2 py-3 rounded-xl
                      text-sm font-bold text-white transition-all
                      hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${isMismatch 
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed' 
                        : `bg-gradient-to-r ${style.gradient}`
                      }
                    `}
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isMismatch 
                      ? 'Khác tài khoản tư vấn' 
                      : (isPurchasing ? 'Đang xử lý...' : isUpgrade ? 'Nâng cấp ngay' : 'Mua ngay')
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] p-6">
        <h3 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa] mb-4">Câu hỏi thường gặp</h3>
        <div className="space-y-3">
          {[
            { q: 'Gói VIP có thời hạn bao lâu?', a: 'Mỗi gói VIP có thời hạn 30 ngày kể từ ngày thanh toán thành công.' },
            { q: 'Hết thời gian live sẽ như thế nào?', a: 'Phiên live sẽ tự động kết thúc khi hết thời gian giới hạn. Tất cả người xem và host đều sẽ nhận thông báo.' },
            { q: 'Có thể nâng cấp giữa chừng không?', a: 'Có! Bạn có thể nâng cấp lên gói cao hơn bất cứ lúc nào. Gói mới sẽ được kích hoạt ngay sau thanh toán.' },
            { q: 'Thanh toán qua đâu?', a: 'Thanh toán an toàn qua cổng VNPAY — hỗ trợ thẻ ngân hàng, ví điện tử và QR code.' },
          ].map((item, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer text-sm font-semibold text-[#050505] dark:text-[#edf0fa] hover:text-[#1877F2] transition-colors py-2">
                {item.q}
              </summary>
              <p className="text-sm text-[#65676b] dark:text-[#7e89a6] pl-4 pb-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
