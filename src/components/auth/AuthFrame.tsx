import { type ReactNode, useEffect, useState } from 'react';
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % introSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [introSlides.length]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 via-white to-blue-50/50 px-4 py-12">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="hidden lg:flex flex-col items-center justify-start text-center pt-4 min-h-155">
          <div className="w-32 h-32 rounded-3xl bg-white flex items-center justify-center mb-8 shadow-xl border border-gray-200/70 overflow-hidden">
            <img src={logo} alt="TTVV Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">{brandHeading}</h1>
          <p className="text-2xl text-gray-600 leading-relaxed max-w-lg mb-8">{brandDescription}</p>

          <div className="w-full max-w-lg rounded-[24px] border border-gray-200/80 bg-white shadow-sm p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Giới thiệu hệ thống
              </span>
              <span className="text-xs font-semibold text-gray-500">
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
                    <p className="text-base font-semibold text-gray-900 mb-2">{slide.title}</p>
                    <p className="text-sm leading-relaxed text-gray-600 min-h-11">{slide.description}</p>
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
                  className={`h-2 rounded-full transition-all ${idx === activeSlide ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-125 bg-white rounded-[28px] shadow-lg p-8 lg:p-10 border border-gray-200/80">
            {(cardTitle || cardSubtitle) && (
              <div className="text-center mb-6">
                {cardTitle && <h2 className="text-3xl font-bold text-gray-900">{cardTitle}</h2>}
                {cardSubtitle && <p className="text-sm text-gray-500 mt-1">{cardSubtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-0 right-0 text-center">
        <p className="text-sm text-gray-500">
          TTVV © 2026 · Quyền riêng tư · Điều khoản · Trợ giúp
        </p>
      </div>
    </div>
  );
}
