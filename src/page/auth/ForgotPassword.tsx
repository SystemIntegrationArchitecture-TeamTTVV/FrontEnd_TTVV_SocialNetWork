import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { X, Lock } from 'lucide-react';
import { useState } from 'react';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();
  const [error, setError] = useState(false);

  const onSubmit = (data: ForgotPasswordForm) => {
    console.log('Forgot Password:', data);
    // Handle forgot password logic
    // If account not found, setError(true)
    // Otherwise navigate to reset-verification
    navigate('/auth/reset-verification');
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
          <div className="w-20 h-20 rounded-full bg-[#E7F3FF] flex items-center justify-center">
            <Lock className="w-10 h-10 text-[#1877F2]" />
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-[#1C1E21] text-center mb-4">
          Tìm tài khoản của bạn
        </h2>

        {/* Description */}
        <p className="text-center text-[#606770] mb-6">
          Nhập email hoặc số điện thoại để tìm kiếm tài khoản của bạn.
        </p>

        {/* Divider */}
        <div className="border-t border-[#DFE1E6] mb-6"></div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email/Phone Input */}
          <div>
            <input
              {...register('email', { required: 'Vui lòng nhập email hoặc số điện thoại' })}
              type="text"
              placeholder="Email hoặc số điện thoại"
              className={`w-full h-14 px-4 rounded-md border ${
                error ? 'border-red-500' : 'border-[#DFE1E6]'
              } focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#FFEBE8] rounded-md p-4">
              <p className="text-[#E41E3F] text-sm font-medium">⚠️ Không tìm thấy tài khoản</p>
              <p className="text-[#606770] text-xs mt-1">
                Vui lòng kiểm tra lại thông tin và thử lại.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
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
              Tìm kiếm
            </button>
          </div>
        </form>

        {/* Footer Text */}
        <p className="text-center text-[#65676B] text-sm mt-6">
          Bạn không thể truy cập email hoặc số điện thoại?
        </p>
      </div>
    </div>
  );
}

