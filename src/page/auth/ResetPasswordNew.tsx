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
  const hasMinLength = newPassword?.length >= 3;
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
    <div className="w-full max-w-125 mx-auto">
      <div className="bg-white dark:bg-[#1a1d28] rounded-[28px] shadow-xl p-8 relative border border-gray-200/80 dark:border-[#2b2f45]">
        <button
          onClick={() => navigate('/auth/login')}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 dark:bg-[#22263a] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-[#5a6278]" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
            <Key className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa] text-center mb-4">
          Tạo mật khẩu mới
        </h2>

        <p className="text-center text-gray-600 dark:text-[#7e89a6] mb-6">
          Mật khẩu mới phải khác với mật khẩu đã sử dụng trước đó.
        </p>

        <div className="border-t border-gray-200 dark:border-[#2b2f45] mb-6"></div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-[#c0c8de] mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                {...register('newPassword', {
                  required: 'Vui lòng nhập mật khẩu mới',
                  minLength: { value: 3, message: 'Mật khẩu phải có ít nhất 3 ký tự' },
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                className="w-full h-14 px-4 pr-12 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-100 dark:bg-[#353a54] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#4e5870] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-[#c0c8de] mb-2">
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
                className="w-full h-14 px-4 pr-12 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-100 dark:bg-[#353a54] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#4e5870] transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-[#22263a] rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-[#2b2f45]">
            <p className="text-sm font-semibold text-gray-900 dark:text-[#c0c8de]">Yêu cầu mật khẩu:</p>
            <div className="space-y-1 text-sm">
              <p className={hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-[#5a6278]'}>
                {hasMinLength ? '✓' : '○'} Tối thiểu 3 ký tự
              </p>
              <p className={hasUpperLower ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-[#5a6278]'}>
                {hasUpperLower ? '✓' : '○'} Có chữ hoa và chữ thường
              </p>
              <p className={hasNumberOrSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-[#5a6278]'}>
                {hasNumberOrSpecial ? '✓' : '○'} Có số hoặc ký tự đặc biệt
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="flex-1 h-12 bg-gray-100 dark:bg-[#22263a] text-gray-900 dark:text-[#c0c8de] font-semibold rounded-xl border border-gray-200 dark:border-[#2b2f45] hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 h-12 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Đặt lại mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

