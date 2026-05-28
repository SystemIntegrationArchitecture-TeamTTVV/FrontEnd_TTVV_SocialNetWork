// VnpayVipReturnPage — Handles VNPAY callback for VIP purchases
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { vipApi } from '../../apis/vip';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Crown, AlertCircle, RefreshCcw } from 'lucide-react';

export default function VnpayVipReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<{
    orderCode: string; amount: number; bankCode: string; isSuccess: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const queryString = searchParams.toString();
      if (!queryString) {
        setError('Không có thông tin thanh toán');
        setIsLoading(false);
        return;
      }

      // Step 1: Verify with VNPAY bridge
      const verifyResult = await vipApi.verifyVnpayVipReturn(queryString);
      setResult(verifyResult);

      // Step 2: If success, notify backend to activate VIP
      if (verifyResult.isSuccess) {
        await vipApi.processVipCallback({
          orderCode: verifyResult.orderCode,
          vnpResponseCode: verifyResult.responseCode,
          vnpTransactionNo: verifyResult.transactionNo,
          vnpBankCode: verifyResult.bankCode,
        });
        toast.success('Nâng cấp VIP thành công! 🎉');
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể xác thực kết quả thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-amber-300/30 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-lg font-medium text-[#65676b] dark:text-[#7e89a6]">
            Đang xác thực thanh toán VIP...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-500 mb-3">Lỗi xác thực</h2>
        <p className="text-[#65676b] dark:text-[#7e89a6] mb-8">{error}</p>
        <button
          onClick={() => navigate('/livestream/vip-packages')}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Quay lại gói VIP
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white dark:bg-[#1a1d28] rounded-3xl shadow-2xl border border-[#e4e6eb] dark:border-[#2b2f45] overflow-hidden">
        {/* Header */}
        <div
          className={`p-8 text-center flex flex-col items-center ${
            result?.isSuccess
              ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500'
              : 'bg-gradient-to-br from-red-500 to-orange-600'
          }`}
        >
          <div className="mb-4 bg-white/20 p-3 rounded-full">
            {result?.isSuccess ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : (
              <XCircle className="w-12 h-12 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-black text-white mb-1">
            {result?.isSuccess ? 'Nâng cấp VIP thành công!' : 'Thanh toán không thành công'}
          </h2>
          <p className="text-white/80 text-sm">
            {result?.isSuccess
              ? 'Gói VIP đã được kích hoạt cho tài khoản của bạn'
              : 'Giao dịch đã bị hủy hoặc thất bại'}
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {result && (
            <>
              <div className="flex justify-between items-center py-3 border-b border-[#e4e6eb] dark:border-[#2b2f45]">
                <span className="text-sm text-[#65676b] dark:text-[#7e89a6]">Mã giao dịch</span>
                <span className="font-mono font-bold text-[#050505] dark:text-[#edf0fa]">
                  {result.orderCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#e4e6eb] dark:border-[#2b2f45]">
                <span className="text-sm text-[#65676b] dark:text-[#7e89a6]">Số tiền</span>
                <span className="font-bold text-[#050505] dark:text-[#edf0fa]">
                  {formatVnd(result.amount)}
                </span>
              </div>
              {result.bankCode && (
                <div className="flex justify-between items-center py-3 border-b border-[#e4e6eb] dark:border-[#2b2f45]">
                  <span className="text-sm text-[#65676b] dark:text-[#7e89a6]">Ngân hàng</span>
                  <span className="font-semibold text-[#050505] dark:text-[#edf0fa]">{result.bankCode}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#65676b] dark:text-[#7e89a6]">Trạng thái</span>
                <span className={`font-bold ${result.isSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
                  {result.isSuccess ? 'Thành công' : 'Thất bại'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={() => navigate('/livestream/vip-packages')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <Crown className="w-5 h-5" />
            Xem gói VIP
          </button>
          {!result?.isSuccess && (
            <button
              onClick={() => navigate('/livestream/vip-packages')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#f0f2f5] dark:bg-[#22263a] text-[#050505] dark:text-[#edf0fa] rounded-xl font-bold hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
