import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HttpError } from '../../apis/http';
import logo from '../../assets/logo-favicon.png';

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      setIsSubmitting(true);
      await login(data.username, data.password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu.');
      } else {
        setError('Không thể đăng nhập lúc này. Bạn thử lại sau nhé.');
      }
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Section - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-3xl bg-white flex items-center justify-center mb-8 shadow-2xl border border-gray-100 overflow-hidden">
            <img 
              src={logo} 
              alt="TTVV Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">TTVV</h1>
          <p className="text-2xl text-gray-600 leading-relaxed max-w-lg">
            Kết nối với bạn bè và chia sẻ khoảnh khắc mỗi ngày.
          </p>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-xl p-10 lg:p-12 border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <input
                  {...register('username', { 
                    required: 'Vui lòng nhập tên đăng nhập',
                    minLength: {
                      value: 3,
                      message: 'Tên đăng nhập tối thiểu 3 ký tự'
                    }
                  })}
                  type="text"
                  placeholder="Tên đăng nhập"
                  autoComplete="username"
                  className={`w-full h-16 px-6 rounded-2xl border-2 ${
                    errors.username ? 'border-red-300' : 'border-gray-200'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg bg-gray-50 focus:bg-white transition-all`}
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600">{errors.username.message as string}</p>
                )}
              </div>

              <div>
                <input
                  {...register('password', { 
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu tối thiểu 6 ký tự'
                    }
                  })}
                  type="password"
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  className={`w-full h-16 px-6 rounded-2xl border-2 ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg bg-gray-50 focus:bg-white transition-all`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message as string}</p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full h-16 bg-blue-600 text-white font-bold text-xl rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isLoading ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/auth/forgot-password"
                  className="text-blue-600 text-base hover:underline font-semibold transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              <Link
                to="/auth/register"
                className="w-full h-16 bg-green-600 text-white font-bold text-lg rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center"
              >
                Tạo tài khoản mới
              </Link>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-sm text-gray-500">
          TTVV © 2026 · Quyền riêng tư · Điều khoản · Trợ giúp
        </p>
      </div>
    </div>
  );
}
