import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HttpError } from '../../apis/http';
import AuthFrame from '../../components/auth/AuthFrame';

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
    <AuthFrame
      brandHeading="TTVV"
      brandDescription="Kết nối với bạn bè và chia sẻ khoảnh khắc mỗi ngày."
    >
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
                  className={`w-full h-16 px-6 rounded-2xl border bg-white shadow-sm ${
                    errors.username ? 'border-red-300' : 'border-gray-200'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-lg transition-all`}
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
                      value: 3,
                      message: 'Mật khẩu tối thiểu 3 ký tự'
                    }
                  })}
                  type="password"
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  className={`w-full h-16 px-6 rounded-2xl border bg-white shadow-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-lg transition-all`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message as string}</p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50/90 border border-red-200 rounded-2xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full h-16 bg-blue-600 text-white font-bold text-xl rounded-2xl shadow-md transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full h-16 bg-green-600 text-white font-bold text-lg rounded-2xl shadow-sm transition-all hover:bg-green-700 active:scale-[0.98] flex items-center justify-center"
              >
                Tạo tài khoản mới
              </Link>
      </form>
    </AuthFrame>
  );
}
