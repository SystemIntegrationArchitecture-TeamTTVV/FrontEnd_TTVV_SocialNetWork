import { useNavigate } from 'react-router-dom';
import { X, Key, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordNew() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPassword = watch('newPassword');
  const hasMinLength = newPassword?.length >= 8;
  const hasUpperLower = newPassword && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberOrSpecial = newPassword && (/[0-9]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword));

  const onSubmit = (data: ResetPasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      return;
    }
    console.log('Reset Password:', data);
    navigate('/auth/reset-success');
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-8 relative">
        {/* Close Button */}
        <button
          onClick={() => navigate('/auth/login')}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors"
        >
          <X className="w-5 h-5 text-[#8A8D91]" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#D4EDDA] flex items-center justify-center">
            <Key className="w-10 h-10 text-[#42B72A]" />
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-[#1C1E21] text-center mb-4">
          Tạo mật khẩu mới
        </h2>

        {/* Description */}
        <p className="text-center text-[#606770] mb-6">
          Mật khẩu mới phải khác với mật khẩu đã sử dụng trước đó.
        </p>

        {/* Divider */}
        <div className="border-t border-[#DFE1E6] mb-6"></div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-[#050505] mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                {...register('newPassword', {
                  required: 'Vui lòng nhập mật khẩu mới',
                  minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                className="w-full h-14 px-4 pr-12 rounded-md border border-[#DFE1E6] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-[#65676B]" />
                ) : (
                  <Eye className="w-4 h-4 text-[#65676B]" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-[#050505] mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (value) =>
                    value === newPassword || 'Mật khẩu xác nhận không khớp',
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                className="w-full h-14 px-4 pr-12 rounded-md border border-[#DFE1E6] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-[#65676B]" />
                ) : (
                  <Eye className="w-4 h-4 text-[#65676B]" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-[#F0F2F5] rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-[#050505]">Yêu cầu mật khẩu:</p>
            <div className="space-y-1 text-sm">
              <p className={hasMinLength ? 'text-[#42B72A]' : 'text-[#65676B]'}>
                {hasMinLength ? '✓' : '○'} Tối thiểu 8 ký tự
              </p>
              <p className={hasUpperLower ? 'text-[#42B72A]' : 'text-[#65676B]'}>
                {hasUpperLower ? '✓' : '○'} Có chữ hoa và chữ thường
              </p>
              <p className={hasNumberOrSpecial ? 'text-[#42B72A]' : 'text-[#65676B]'}>
                {hasNumberOrSpecial ? '✓' : '○'} Có số hoặc ký tự đặc biệt
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="flex-1 h-12 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 h-12 bg-[#1877F2] text-white font-semibold rounded-md hover:bg-[#166FE5] transition-colors"
            >
              Đặt lại mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

