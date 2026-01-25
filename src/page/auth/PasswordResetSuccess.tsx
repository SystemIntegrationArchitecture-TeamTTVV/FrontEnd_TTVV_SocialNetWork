import { Link } from 'react-router-dom';
import { CheckCircle2, Shield } from 'lucide-react';

export default function PasswordResetSuccess() {
  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-[#D4EDDA] flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[#42B72A] flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <h2 className="text-3xl font-bold text-[#1C1E21] text-center mb-4">
          Đặt lại mật khẩu thành công!
        </h2>

        {/* Description */}
        <p className="text-center text-[#606770] mb-2">
          Mật khẩu của bạn đã được thay đổi thành công.
        </p>
        <p className="text-center text-[#606770] mb-8">
          Bạn có thể đăng nhập bằng mật khẩu mới.
        </p>

        {/* Security Tips */}
        <div className="bg-[#E7F3FF] rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2 mb-3">
            <Shield className="w-5 h-5 text-[#1877F2] mt-0.5 flex-shrink-0" />
            <p className="text-sm font-semibold text-[#1877F2]">Lời khuyên bảo mật:</p>
          </div>
          <ul className="space-y-1 text-sm text-[#606770] ml-7">
            <li>• Không chia sẻ mật khẩu với bất kỳ ai</li>
            <li>• Sử dụng mật khẩu khác nhau cho các tài khoản</li>
            <li>• Đổi mật khẩu định kỳ để bảo vệ tài khoản</li>
          </ul>
        </div>

        {/* Login Button */}
        <Link
          to="/auth/login"
          className="block w-full max-w-[280px] mx-auto h-12 bg-[#1877F2] text-white font-semibold rounded-md hover:bg-[#166FE5] transition-colors flex items-center justify-center"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}