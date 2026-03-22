import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo-favicon.png';

type AuthFrameProps = {
  brandHeading: string;
  brandDescription: string;
  cardTitle?: string;
  cardSubtitle?: string;
  children: ReactNode;
};

export default function AuthFrame({
  brandHeading,
  brandDescription,
  cardTitle,
  cardSubtitle,
  children,
}: AuthFrameProps) {
  const introSlides = [
    {
      title: 'Kết nối nhanh',
      description: 'Trò chuyện, nhắn tin và cập nhật trạng thái với bạn bè theo thời gian thực.',
    },
    {
      title: 'Chia sẻ dễ dàng',
      description: 'Đăng bài, chia sẻ khoảnh khắc và xây dựng cộng đồng của riêng bạn.',
    },
    {
      title: 'Trải nghiệm liền mạch',
      description: 'Giao diện hiện đại, thao tác mượt mà trên cả máy tính và điện thoại.',
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % introSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [introSlides.length]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 via-white to-blue-50/50 dark:from-[#0c0e14] dark:via-[#12151f] dark:to-[#0c0e14] px-4 py-12">
      {/* Về feed — không bắt buộc đăng nhập */}
      <Link
        to="/home"
        className="absolute top-5 left-5 z-10 inline-flex items-center gap-2 rounded-2xl border border-gray-200/90 bg-white/85 px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900 dark:border-[#2b2f45] dark:bg-[#1a1d28]/90 dark:text-[#c8d0e6] dark:hover:bg-[#22263a] dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="hidden min-[380px]:inline">Về trang chủ</span>
        <span className="min-[380px]:hidden">Trang chủ</span>
      </Link>

      {/* Theme toggle */}
      <button
        onClick={() => toggleTheme()}
        aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        className="absolute top-5 right-5 z-10 w-11 h-11 rounded-2xl bg-white/80 dark:bg-[#1e2133] border border-gray-200 dark:border-[#2b2f45] shadow-sm backdrop-blur-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#22263a] transition-all"
      >
        {isDark
          ? <Sun className="w-5 h-5 text-amber-400" />
          : <Moon className="w-5 h-5 text-gray-500" />
        }
      </button>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="hidden lg:flex flex-col items-center justify-start text-center pt-4 min-h-155">
          <div className="w-32 h-32 rounded-3xl bg-white dark:bg-[#1a1d28] flex items-center justify-center mb-8 shadow-xl border border-gray-200/70 dark:border-[#2b2f45] overflow-hidden">
            <img src={logo} alt="TTVV Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-[#edf0fa] mb-6">{brandHeading}</h1>
          <p className="text-2xl text-gray-600 dark:text-[#7e89a6] leading-relaxed max-w-lg mb-8">{brandDescription}</p>

          <div className="w-full max-w-lg rounded-[24px] border border-gray-200/80 dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] shadow-sm p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                Giới thiệu hệ thống
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-[#5a6278]">
                {activeSlide + 1}/{introSlides.length}
              </span>
            </div>

            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {introSlides.map((slide) => (
                  <div key={slide.title} className="w-full shrink-0 px-1">
                    <p className="text-base font-semibold text-gray-900 dark:text-[#edf0fa] mb-2">{slide.title}</p>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-[#7e89a6] min-h-11">{slide.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {introSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Chuyển tới slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${idx === activeSlide ? 'w-6 bg-blue-600 dark:bg-blue-500' : 'w-2 bg-gray-300 dark:bg-[#353a54] hover:bg-gray-400 dark:hover:bg-[#4e5870]'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-125 bg-white dark:bg-[#1a1d28] rounded-[28px] shadow-lg p-8 lg:p-10 border border-gray-200/80 dark:border-[#2b2f45]">
            {(cardTitle || cardSubtitle) && (
              <div className="text-center mb-6">
                {cardTitle && <h2 className="text-3xl font-bold text-gray-900 dark:text-[#edf0fa]">{cardTitle}</h2>}
                {cardSubtitle && <p className="text-sm text-gray-500 dark:text-[#7e89a6] mt-1">{cardSubtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-0 right-0 text-center">
        <p className="text-sm text-gray-500 dark:text-[#5a6278]">
          TTVV © 2026 · Quyền riêng tư · Điều khoản · Trợ giúp
        </p>
      </div>
    </div>
  );
}
