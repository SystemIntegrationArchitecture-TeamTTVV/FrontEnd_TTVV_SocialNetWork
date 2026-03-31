import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo-favicon.png';

const FACEBOOK_STYLE_IMAGE_URL =
  "https://static.xx.fbcdn.net/rsrc.php/yb/r/HpEiFYDux5j.webp";

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

      {/* Theme toggle */}
      <button
        onClick={() => toggleTheme()}
        aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        className="absolute top-5 right-5 z-20 inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1e2133] border border-gray-200 dark:border-[#2b2f45] shadow-sm px-3 h-10 hover:bg-gray-50 dark:hover:bg-[#22263a] transition-all"
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-[#c8d0e6]">Light</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Dark</span>
          </>
        )}
      </button>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left visual panel */}
        <div className="hidden lg:flex relative bg-[#f5f7fb] dark:bg-[#141826] px-10 py-16 overflow-hidden">
          <div className="w-full max-w-[680px] mx-auto grid grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#1877f2] flex items-center justify-center text-white text-xl font-bold shadow-sm mb-7">
              TTVV
              </div>
              <h1 className="text-[56px] font-extrabold leading-[1.05] tracking-tight text-gray-900 dark:text-[#edf0fa]">
                Explore the
                <br />
                things
                <br />
                <span className="text-[#1877f2]">you love.</span>
              </h1>
              <p className="mt-6 text-[22px] leading-relaxed text-gray-600 dark:text-[#93a0c0] max-w-sm">
                {brandDescription}
              </p>
            </div>

            <div className="relative h-[360px]">
              <div className="absolute left-4 top-2 w-[250px] h-[305px] rounded-[28px] bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-[#2b2f45] shadow-xl overflow-hidden">
                <img
                  src={FACEBOOK_STYLE_IMAGE_URL}
                  alt="Login visual"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -left-2 top-14 rounded-2xl bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-[#2b2f45] shadow-md px-3 py-2">
                <span className="text-xl">😂</span>
              </div>
              <div className="absolute right-3 bottom-10 rounded-full bg-[#ff2d87] text-white w-12 h-12 flex items-center justify-center shadow-lg text-xl">
                ❤
              </div>
              <div className="absolute left-20 bottom-0 w-16 h-16 rounded-full border-4 border-[#f5f7fb] dark:border-[#141826] shadow-md overflow-hidden bg-white">
                <img src={logo} alt="TTVV Logo mini" className="w-full h-full object-cover" />
              </div>
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
