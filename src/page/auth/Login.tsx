import { Link } from 'react-router-dom';
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
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      setIsSubmitting(true);
      await login(data.username, data.password);
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setError(err.message || 'Invalid username or password');
      } else {
        setError('An error occurred. Please try again.');
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
            Connect with friends and the world around you on TTVV Social Network.
          </p>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-xl p-10 lg:p-12 border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <input
                  {...register('username', { 
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters'
                    }
                  })}
                  type="text"
                  placeholder="Username"
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
                    required: 'Password is required',
                    minLength: {
                      value: 3,
                      message: 'Password must be at least 3 characters'
                    }
                  })}
                  type="password"
                  placeholder="Password"
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
                className="w-full h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xl rounded-2xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting || isLoading ? 'Logging in...' : 'Log In'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/auth/forgot-password"
                  className="text-blue-600 text-base hover:underline font-semibold transition-colors"
                >
                  Forgotten password?
                </Link>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              <Link
                to="/auth/register"
                className="block w-full h-16 bg-green-500 text-white font-bold text-lg rounded-2xl hover:bg-green-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                Create new account
              </Link>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-sm text-gray-500">
          TTVV Social Network © 2026 · Privacy · Terms · Help
        </p>
      </div>
    </div>
  );
}
