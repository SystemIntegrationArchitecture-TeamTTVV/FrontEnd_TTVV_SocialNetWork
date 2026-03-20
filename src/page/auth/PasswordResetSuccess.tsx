import { Link } from 'react-router-dom';
import { CheckCircle2, Shield } from 'lucide-react';

export default function PasswordResetSuccess() {
  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="bg-white dark:bg-[#1a1d28] rounded-[28px] shadow-xl p-8 border border-gray-200/80 dark:border-[#2b2f45]">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-[#edf0fa] text-center mb-4">
          Đặt lại mật khẩu thành công!
        </h2>

        <p className="text-center text-gray-600 dark:text-[#7e89a6] mb-2">
          Mật khẩu của bạn đã được thay đổi thành công.
        </p>
        <p className="text-center text-gray-600 dark:text-[#7e89a6] mb-8">
          Bạn có thể đăng nhập bằng mật khẩu mới.
        </p>

        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 mb-6 border border-blue-100 dark:border-blue-500/20">
          <div className="flex items-start gap-2 mb-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Lời khuyên bảo mật:</p>
          </div>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-[#7e89a6] ml-7">
            <li>• Không chia sẻ mật khẩu với bất kỳ ai</li>
            <li>• Sử dụng mật khẩu khác nhau cho các tài khoản</li>
            <li>• Đổi mật khẩu định kỳ để bảo vệ tài khoản</li>
          </ul>
        </div>

        <Link
          to="/auth/login"
          className="w-full max-w-[280px] mx-auto h-12 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}