import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useState } from 'react';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  month: string;
  day: string;
  year: string;
  gender: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<RegisterForm>();
  const [isOpen, setIsOpen] = useState(true);

  const onSubmit = (data: RegisterForm) => {
    console.log('Register:', data);
    // Handle register logic
  };

  if (!isOpen) return null;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-[#DFE1E6]">
          <button
            onClick={() => navigate('/auth/login')}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors"
          >
            <X className="w-5 h-5 text-[#8A8D91]" />
          </button>
          <h2 className="text-3xl font-bold text-[#1C1E21] text-center">Sign Up</h2>
          <p className="text-center text-[#606770] mt-1">It's quick and easy.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name Inputs */}
          <div className="flex gap-3">
            <input
              {...register('firstName', { required: true })}
              type="text"
              placeholder="First name"
              className="flex-1 h-12 px-4 rounded-md border border-[#CCD0D5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
            />
            <input
              {...register('lastName', { required: true })}
              type="text"
              placeholder="Last name"
              className="flex-1 h-12 px-4 rounded-md border border-[#CCD0D5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
            />
          </div>

          {/* Email Input */}
          <input
            {...register('email', { required: true })}
            type="email"
            placeholder="Email or mobile number"
            className="w-full h-12 px-4 rounded-md border border-[#CCD0D5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
          />

          {/* Password Input */}
          <input
            {...register('password', { required: true })}
            type="password"
            placeholder="New password"
            className="w-full h-12 px-4 rounded-md border border-[#CCD0D5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
          />

          {/* Birthday */}
          <div>
            <label className="block text-xs text-[#606770] mb-2">Birthday</label>
            <div className="flex gap-2">
              <select
                {...register('month', { required: true })}
                className="flex-1 h-10 px-3 rounded-md border border-[#CCD0D5] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              >
                <option value="">Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                {...register('day', { required: true })}
                className="flex-1 h-10 px-3 rounded-md border border-[#CCD0D5] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              >
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                {...register('year', { required: true })}
                className="flex-1 h-10 px-3 rounded-md border border-[#CCD0D5] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs text-[#606770] mb-2">Gender</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center gap-2 p-3 rounded-md border border-[#CCD0D5] cursor-pointer hover:bg-[#F0F2F5]">
                <input
                  {...register('gender', { required: true })}
                  type="radio"
                  value="female"
                  className="w-4 h-4 text-[#1877F2]"
                />
                <span>Female</span>
              </label>
              <label className="flex-1 flex items-center gap-2 p-3 rounded-md border border-[#CCD0D5] cursor-pointer hover:bg-[#F0F2F5]">
                <input
                  {...register('gender', { required: true })}
                  type="radio"
                  value="male"
                  className="w-4 h-4 text-[#1877F2]"
                />
                <span>Male</span>
              </label>
              <label className="flex-1 flex items-center gap-2 p-3 rounded-md border border-[#CCD0D5] cursor-pointer hover:bg-[#F0F2F5]">
                <input
                  {...register('gender', { required: true })}
                  type="radio"
                  value="custom"
                  className="w-4 h-4 text-[#1877F2]"
                />
                <span>Custom</span>
              </label>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-[#777]">
            By clicking Sign Up, you agree to our Terms, Privacy Policy and Cookies Policy. You may receive SMS notifications from us and can opt out at any time.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 bg-[#42B72A] text-white font-bold text-lg rounded-md hover:bg-[#36A420] transition-colors"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

