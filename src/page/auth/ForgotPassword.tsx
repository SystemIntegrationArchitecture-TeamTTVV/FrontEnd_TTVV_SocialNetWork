import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { passwordResetApi } from '../../apis/passwordReset';
import AuthFrame from '../../components/auth/AuthFrame';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const goNextStep = () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email của bạn');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email không đúng định dạng');
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setError('Email không đúng định dạng');
      setStep(1);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await passwordResetApi.forgotPassword(email);
      console.log('✅ Password reset email sent:', response.message);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Failed to send reset email:', err);
      setError(err.message || 'Không gửi được email đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthFrame
        brandHeading="TTVV"
        brandDescription="Khôi phục tài khoản an toàn, nhanh chóng chỉ với email của bạn."
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-500/15 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa] mb-2">Kiểm tra email</h2>
          <p className="text-gray-600 dark:text-[#7e89a6] mb-4 leading-relaxed">
            Nếu tài khoản tồn tại với email <strong className="text-gray-900 dark:text-[#c0c8de]">{email}</strong>, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.
          </p>
          <p className="text-sm text-gray-500 dark:text-[#5a6278] mb-8">
            Chưa thấy email? Hãy kiểm tra thư rác hoặc thử lại.
          </p>
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      brandHeading="TTVV"
      brandDescription="Lấy lại mật khẩu để tiếp tục kết nối cùng mọi người."
      cardTitle="Quên mật khẩu"
      cardSubtitle="Thực hiện theo các bước để lấy lại tài khoản"
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="h-2 rounded-full bg-gray-100 dark:bg-[#22263a] overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p className={`text-center ${step >= 1 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-[#5a6278]'}`}>Nhập email</p>
            <p className={`text-center ${step >= 2 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-[#5a6278]'}`}>Xác nhận gửi</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-[#c0c8de] mb-2">
                Địa chỉ email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#5a6278]" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-4 border border-gray-200 dark:border-[#2b2f45] rounded-xl bg-gray-50 dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-[#2b2f45] transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/auth/login"
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-700 dark:text-[#c0c8de] font-medium hover:bg-gray-50 dark:hover:bg-[#2b2f45] transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Đăng nhập
              </Link>
              <button
                type="button"
                onClick={goNextStep}
                className="flex-1 h-11 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2b2f45]">
              <p className="text-sm text-gray-700 dark:text-[#7e89a6]">
                Chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến email:
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-[#edf0fa] mt-1">{email}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-700 dark:text-[#c0c8de] font-medium hover:bg-gray-50 dark:hover:bg-[#2b2f45] transition-colors"
              >
                Chỉnh sửa email
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex-1 h-11 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isLoading
                    ? 'bg-gray-300 dark:bg-[#353a54] text-gray-500 dark:text-[#5a6278] cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Đang gửi...' : 'Gửi liên kết'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthFrame>
  );
}

