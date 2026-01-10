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
    <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-center min-h-screen">
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center max-w-lg">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-8 shadow-xl">
          <span className="text-white font-bold text-6xl">S</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">TTVV</h1>
        <p className="text-xl text-gray-600 text-center leading-relaxed">
          Connect with friends and the world around you on TTVV Social Network.
        </p>
      </div>

      <div className="w-full lg:w-[440px] flex items-center justify-center">
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              {...register('email', { required: true })}
              type="text"
              placeholder="Email or phone number"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
            />

            <input
              {...register('password', { required: true })}
              type="password"
              placeholder="Password"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
            />

            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01]"
            >
              Log In
            </button>

            <div className="text-center">
              <Link
                to="/auth/forgot-password"
                className="text-blue-600 text-sm hover:underline font-medium"
              >
                Forgotten password?
              </Link>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>

            <Link
              to="/auth/register"
              className="block w-full h-12 bg-green-500 text-white font-semibold text-base rounded-xl hover:bg-green-600 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01] flex items-center justify-center"
            >
              Create new account
            </Link>
          </form>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-gray-500">
        TTVV Social Network © 2026 · Privacy · Terms · Help
      </div>
    </div>
  );
}
