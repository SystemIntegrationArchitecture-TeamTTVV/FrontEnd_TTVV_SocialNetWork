import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { HttpError } from "../../apis/http";
import AuthFrame from "../../components/auth/AuthFrame";

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  month: string;
  day: string;
  year: string;
  gender: string;
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RegisterForm>();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      setIsSubmitting(true);

      // Format date of birth
      // const dateOfBirth =
      //   data.year && data.month && data.day
      //     ? `${data.year}-${String(data.month).padStart(2, "0")}-${String(data.day).padStart(2, "0")}`
      //     : undefined;

      const dateOfBirth = `${data.year}-${String(data.month).padStart(2, "0")}-${String(data.day).padStart(2, "0")}T00:00:00`;

      // Generate username from email if not provided
      const username = data.username || data.email.split("@")[0];

      await registerUser({
        email: data.email,
        username: username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth,
      });
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error("Register error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i,
  );

  const nextStep = async () => {
    let fields: Array<keyof RegisterForm> = [];

    if (step === 1) {
      fields = ["firstName", "lastName", "email"];
    } else if (step === 2) {
      fields = ["username", "password"];
    }

    if (fields.length === 0) return;
    const isValid = await trigger(fields);
    if (isValid) {
      setError(null);
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const previousStep = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <AuthFrame
      brandHeading="TTVV"
      brandDescription="Tạo tài khoản để bắt đầu kết nối và chia sẻ cùng bạn bè."
      cardTitle="Tạo tài khoản"
      cardSubtitle="Quy trình 3 bước nhanh gọn và rõ ràng"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-3">
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <p className={`text-center ${step >= 1 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>Bước 1</p>
            <p className={`text-center ${step >= 2 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>Bước 2</p>
            <p className={`text-center ${step >= 3 ? "text-blue-600 font-semibold" : "text-gray-400"}`}>Bước 3</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                {...register("firstName", { required: "Vui lòng nhập tên" })}
                type="text"
                placeholder="Tên"
                className={`h-12 px-4 rounded-xl border ${errors.firstName ? "border-red-300" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all`}
              />
              <input
                {...register("lastName", { required: "Vui lòng nhập họ" })}
                type="text"
                placeholder="Họ"
                className={`h-12 px-4 rounded-xl border ${errors.lastName ? "border-red-300" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all`}
              />
            </div>
            {(errors.firstName || errors.lastName) && (
              <p className="text-xs text-red-600">
                {(errors.firstName?.message || errors.lastName?.message) as string}
              </p>
            )}

            <input
              {...register("email", {
                required: "Vui lòng nhập email",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email không hợp lệ",
                },
              })}
              type="email"
              placeholder="Email"
              className={`w-full h-12 px-4 rounded-xl border ${
                errors.email ? "border-red-300" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 -mt-1">{errors.email.message as string}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input
              {...register("username", {
                required: "Vui lòng nhập tên đăng nhập",
                minLength: {
                  value: 3,
                  message: "Tên đăng nhập tối thiểu 3 ký tự",
                },
              })}
              type="text"
              placeholder="Tên đăng nhập"
              className={`w-full h-12 px-4 rounded-xl border ${
                errors.username ? "border-red-300" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all`}
            />
            {errors.username && (
              <p className="text-xs text-red-600 -mt-1">{errors.username.message as string}</p>
            )}

            <input
              {...register("password", {
                required: "Vui lòng nhập mật khẩu",
                minLength: {
                  value: 3,
                  message: "Mật khẩu tối thiểu 3 ký tự",
                },
              })}
              type="password"
              placeholder="Mật khẩu mới"
              className={`w-full h-12 px-4 rounded-xl border ${
                errors.password ? "border-red-300" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all`}
            />
            {errors.password && (
              <p className="text-xs text-red-600 -mt-1">{errors.password.message as string}</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Ngày sinh</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  {...register("month", { required: "Vui lòng chọn tháng" })}
                  className="h-11 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50"
                >
                  <option value="">Tháng</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  {...register("day", { required: "Vui lòng chọn ngày" })}
                  className="h-11 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50"
                >
                  <option value="">Ngày</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  {...register("year", { required: "Vui lòng chọn năm" })}
                  className="h-11 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50"
                >
                  <option value="">Năm</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {(errors.month || errors.day || errors.year) && (
                <p className="text-xs text-red-600 mt-1">
                  {(errors.month?.message || errors.day?.message || errors.year?.message) as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Giới tính</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 px-3 h-11 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    {...register("gender", { required: "Vui lòng chọn giới tính" })}
                    type="radio"
                    value="female"
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Nữ</span>
                </label>
                <label className="flex items-center gap-2 px-3 h-11 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    {...register("gender", { required: "Vui lòng chọn giới tính" })}
                    type="radio"
                    value="male"
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Nam</span>
                </label>
                <label className="flex items-center gap-2 px-3 h-11 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    {...register("gender", { required: "Vui lòng chọn giới tính" })}
                    type="radio"
                    value="custom"
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Khác</span>
                </label>
              </div>
              {errors.gender && (
                <p className="text-xs text-red-600 mt-1">{errors.gender.message as string}</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">Xác nhận thông tin</p>
              <p>Họ tên: {watch("lastName") || "-"} {watch("firstName") || "-"}</p>
              <p>Email: {watch("email") || "-"}</p>
              <p>Tên đăng nhập: {watch("username") || "-"}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 leading-relaxed">
          Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản, Chính sách quyền riêng tư và Chính sách cookie của chúng tôi.
        </p>

        <div className="flex gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={previousStep}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Đăng nhập
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 h-11 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 h-11 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? "Đang tạo tài khoản..." : "Hoàn tất tạo tài khoản"}
            </button>
          )}
        </div>
      </form>
    </AuthFrame>
  );
}
