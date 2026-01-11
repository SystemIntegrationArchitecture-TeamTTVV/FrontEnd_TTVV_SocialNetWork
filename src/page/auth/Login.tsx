import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();

  const onSubmit = (data: LoginForm) => {
    console.log('Login:', data);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Section - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-8 shadow-2xl">
            <span className="text-white font-bold text-7xl">S</span>
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
                  {...register('email', { required: true })}
                  type="text"
                  placeholder="Email or phone number"
                  className="w-full h-16 px-6 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <input
                  {...register('password', { required: true })}
                  type="password"
                  placeholder="Password"
                  className="w-full h-16 px-6 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xl rounded-2xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Log In
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
