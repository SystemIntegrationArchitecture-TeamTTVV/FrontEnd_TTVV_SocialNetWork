import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Settings } from 'lucide-react';
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
    <div className="relative w-full min-h-screen bg-[#f0f2f5] dark:bg-[#0f111a]">
      {/* Back home */}
      <Link
        to="/home"
        className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-[#2b2f45] dark:bg-[#1a1d28] dark:text-[#c8d0e6] dark:hover:bg-[#22263a]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="hidden min-[380px]:inline">Về trang chủ</span>
        <span className="min-[380px]:hidden">Trang chủ</span>
      </Link>

      {/* Top-right control */}
      <button
        onClick={() => toggleTheme()}
        aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1e2133] border border-gray-200 dark:border-[#2b2f45] shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#22263a] transition-all"
      >
        {isDark
          ? <Sun className="w-5 h-5 text-amber-400" />
          : <Settings className="w-5 h-5 text-gray-600" />
        }
      </button>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left visual panel */}
        <div className="hidden lg:flex relative bg-[#f5f7fb] dark:bg-[#141826] px-12 py-20 overflow-hidden">
          <div className="max-w-xl">
            <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white text-2xl font-bold shadow-sm mb-8">
              f
            </div>
            <h1 className="text-6xl font-extrabold leading-tight text-gray-900 dark:text-[#edf0fa]">
              Explore the
              <br />
              things
              <br />
              <span className="text-[#1877f2]">you love.</span>
            </h1>
            <p className="mt-8 text-xl text-gray-600 dark:text-[#93a0c0] max-w-lg">
              {brandDescription}
            </p>
          </div>

          <div className="absolute right-10 top-24 w-[360px] h-[360px]">
            <div className="absolute inset-0 rounded-[36px] bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-[#2b2f45] shadow-xl overflow-hidden">
              <img src={logo} alt="TTVV Logo" className="w-full h-full object-cover opacity-95" />
            </div>
            <div className="absolute -left-8 top-12 rounded-2xl bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-[#2b2f45] shadow-lg px-4 py-3">
              <span className="text-2xl">😂</span>
            </div>
            <div className="absolute -right-5 bottom-8 rounded-full bg-[#ff2d87] text-white w-14 h-14 flex items-center justify-center shadow-lg text-2xl">
              ❤
            </div>
          </div>
        </div>

        {/* Right auth panel */}
        <div className="relative flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-[540px] bg-white dark:bg-[#1a1d28] rounded-3xl shadow-xl border border-gray-200/90 dark:border-[#2b2f45] p-8 lg:p-10">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#1877f2] text-white flex items-center justify-center font-bold text-xl">f</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-[#edf0fa]">{brandHeading}</p>
                <p className="text-xs text-gray-500 dark:text-[#7e89a6]">{brandDescription}</p>
              </div>
            </div>

            {(cardTitle || cardSubtitle) && (
              <div className="text-left mb-6">
                {cardTitle && <h2 className="text-3xl font-bold text-gray-900 dark:text-[#edf0fa]">{cardTitle}</h2>}
                {cardSubtitle && <p className="text-sm text-gray-500 dark:text-[#7e89a6] mt-1">{cardSubtitle}</p>}
              </div>
            )}
            {children}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-[#5a6278]">
            {activeSlide + 1}/{introSlides.length} · {introSlides[activeSlide].title}
          </div>
        </div>
      </div>
    </div>
  );
}
