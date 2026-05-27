import { useState, useEffect } from 'react';
import {
  X, Bot, Radio, Music2, Gamepad2, MessageCircle, Eye,
  CheckCircle2, Sparkles, Trophy, Users, Share2, Bell,
  Headphones, Play, Send, Phone, Image, Clock,
} from 'lucide-react';
import mascotHappySrc from '../../assets/Bot/happy.png';
import mascot1Src from '../../assets/Bot/mascot1.jpg';
import mascot2Src from '../../assets/Bot/mascot2.jpg';
import mascot3Src from '../../assets/Bot/mascot3.jpg';

// ── Constants ──────────────────────────────────────────────

const CHANGELOG_VERSION = 'v2.5';
const STORAGE_KEY_PREFIX = 'changelog:lastSeen';

type FeatureTab = {
  id: string;
  icon: typeof Bot;
  label: string;
  title: string;
  description: string;
  highlights: { icon: typeof CheckCircle2; text: string }[];
  image?: string;
  imageAlt?: string;
  illustrationIcon?: typeof Bot;
  accentColor: string;
  accentBg: string;
  gradient: string;
};

const FEATURE_TABS: FeatureTab[] = [
  {
    id: 'mascot',
    icon: Bot,
    label: 'Mascot AI',
    title: 'Mascot Hướng Dẫn Thông Minh',
    description:
      'Chú robot TTVV thông minh luôn sẵn sàng đồng hành cùng bạn, hướng dẫn từng bước và gợi ý các tính năng thú vị trên nền tảng.',
    highlights: [
      { icon: Sparkles, text: 'Hướng dẫn tương tác trực quan & sinh động' },
      { icon: CheckCircle2, text: 'Phản ứng cảm xúc đáng yêu khi tương tác' },
      { icon: Bell, text: 'Tự động gợi ý những tính năng hữu ích' },
    ],
    image: mascot1Src,
    imageAlt: 'TTVV Mascot',
    accentColor: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-950/40',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'livestream',
    icon: Radio,
    label: 'Live Stream',
    title: 'Phát Trực Tiếp Real-time',
    description:
      'Livestream trực tiếp với bạn bè chất lượng cao, chia sẻ từng khoảnh khắc tuyệt vời thời gian thực và tương tác ngay trong luồng live.',
    highlights: [
      { icon: Play, text: 'Phát trực tiếp video Full HD siêu mượt' },
      { icon: MessageCircle, text: 'Khung chat thời gian thực sống động' },
      { icon: Bell, text: 'Thông báo đẩy lập tức khi bạn bè lên sóng' },
    ],
    illustrationIcon: Radio,
    accentColor: 'text-rose-600 dark:text-rose-400',
    accentBg: 'bg-rose-50 dark:bg-rose-950/40',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 'music',
    icon: Music2,
    label: 'Âm Nhạc',
    title: 'Thưởng Thức Âm Nhạc Trực Tuyến',
    description:
      'Tích hợp kho nhạc phong phú trực tiếp trên TTVV. Tìm kiếm, phát nhạc chất lượng cao và tạo playlist chia sẻ cùng bạn bè.',
    highlights: [
      { icon: Headphones, text: 'Kho nhạc bản quyền phong phú, đa thể loại' },
      { icon: Play, text: 'Trình phát nhạc mini hiện đại dưới nền' },
      { icon: Share2, text: 'Chia sẻ bài hát yêu thích lên Bảng tin chỉ 1 click' },
    ],
    illustrationIcon: Music2,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'games',
    icon: Gamepad2,
    label: 'Trò Chơi',
    title: 'Giải Trí Cùng Mini Games',
    description:
      'Trải nghiệm những tựa game giải trí đỉnh cao ngay trên ứng dụng. Thách đấu bạn bè và đua top xếp hạng gay cấn.',
    highlights: [
      { icon: Gamepad2, text: 'Hàng loạt mini game đa dạng, tải cực nhanh' },
      { icon: Trophy, text: 'Bảng xếp hạng vinh danh người chơi xuất sắc' },
      { icon: Users, text: 'Chế độ thách đấu bạn bè kịch tính' },
    ],
    illustrationIcon: Gamepad2,
    accentColor: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'chatbox',
    icon: MessageCircle,
    label: 'Trò Chuyện',
    title: 'Khung Chat Siêu Tiện Lợi',
    description:
      'Nhắn tin trực tiếp ngay trên Newsfeed mà không cần chuyển trang. Hỗ trợ gửi tệp tin, hình ảnh chất lượng cao và voice message.',
    highlights: [
      { icon: Send, text: 'Nhắn tin tốc độ cao không rời Newsfeed' },
      { icon: Image, text: 'Gửi ảnh sắc nét, video và tin nhắn thoại' },
      { icon: Phone, text: 'Hỗ trợ gọi thoại & video call sắc nét' },
    ],
    illustrationIcon: MessageCircle,
    accentColor: 'text-violet-600 dark:text-violet-400',
    accentBg: 'bg-violet-50 dark:bg-violet-950/40',
    gradient: 'from-violet-500 to-fuchsia-600',
  },
  {
    id: 'stories',
    icon: Eye,
    label: 'Khoảnh Khắc',
    title: 'Stories Lưu Giữ Kỷ Niệm 24h',
    description:
      'Chia sẻ những khoảnh khắc đời thường qua tin ảnh/video ngắn tự động biến mất sau 24 giờ, giúp bảng tin của bạn luôn tươi mới.',
    highlights: [
      { icon: Image, text: 'Đăng khoảnh khắc bằng hình ảnh, video ngắn' },
      { icon: Clock, text: 'Tự động biến mất sau 24 giờ đăng tải' },
      { icon: Eye, text: 'Xem danh sách bạn bè đã xem tin của bạn' },
    ],
    illustrationIcon: Eye,
    accentColor: 'text-pink-600 dark:text-pink-400',
    accentBg: 'bg-pink-50 dark:bg-pink-950/40',
    gradient: 'from-pink-500 to-rose-600',
  },
];

// ── Helpers ─────────────────────────────────────────────────

function getStorageKey(userId?: string) {
  return `${STORAGE_KEY_PREFIX}:${userId || 'guest'}`;
}

export function hasSeenLatestChangelog(userId?: string): boolean {
  try {
    return localStorage.getItem(getStorageKey(userId)) === CHANGELOG_VERSION;
  } catch {
    return false;
  }
}

function markChangelogSeen(userId?: string) {
  try {
    localStorage.setItem(getStorageKey(userId), CHANGELOG_VERSION);
  } catch {
    // silently ignore
  }
}

// ── Component ───────────────────────────────────────────────

interface SystemUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function SystemUpdateModal({ isOpen, onClose, userId }: SystemUpdateModalProps) {
  const [activeTab, setActiveTab] = useState(FEATURE_TABS[0].id);
  const [tabTransition, setTabTransition] = useState(false);

  // Reset to first tab when modal opens
  useEffect(() => {
    if (isOpen) setActiveTab(FEATURE_TABS[0].id);
  }, [isOpen]);

  if (!isOpen) return null;

  const activeFeature = FEATURE_TABS.find((t) => t.id === activeTab) || FEATURE_TABS[0];

  const handleTabSwitch = (tabId: string) => {
    if (tabId === activeTab) return;
    setTabTransition(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setTabTransition(false);
    }, 150);
  };

  const handleClose = () => {
    markChangelogSeen(userId);
    onClose();
  };

  // Mascot tab shows multiple mascot images in a row
  const renderMascotShowcase = () => (
    <div className="flex items-center justify-center gap-5 py-4">
      {[mascot1Src, mascot2Src, mascot3Src].map((src, i) => (
        <div
          key={i}
          className="group relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
        >
          <img
            src={src}
            alt={`Mascot ${i + 1}`}
            className="w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      ))}
    </div>
  );

  // Generic feature illustration using large icon
  const renderIconIllustration = (feature: FeatureTab) => {
    const Icon = feature.illustrationIcon || feature.icon;
    return (
      <div className="flex items-center justify-center py-4">
        <div
          className={`w-28 h-28 rounded-[2rem] ${feature.accentBg} flex items-center justify-center shadow-inner border border-white/20 dark:border-white/5 relative group`}
        >
          <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
          <Icon className={`w-14 h-14 ${feature.accentColor} transition-transform duration-300 group-hover:scale-110`} />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Bản cập nhật hệ thống"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/75 backdrop-blur-[6px] transition-all duration-300" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-xl bg-white/95 dark:bg-[#151722]/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 dark:border-gray-800/60"
        style={{ 
          animation: 'sysUpdateSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${activeFeature.gradient}`} />

        {/* ── Header ─────────────────────────────── */}
        <div className="relative px-6 pt-6 pb-3 text-center border-b border-gray-100 dark:border-gray-800/40">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100/80 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/60 flex items-center justify-center transition-all duration-200 active:scale-90"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Mascot avatar */}
          <div
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100/60 to-indigo-100/60 dark:from-blue-500/10 dark:to-indigo-500/10 flex items-center justify-center mb-3 shadow-lg overflow-hidden border border-white dark:border-gray-800"
            style={{ animation: 'sysUpdateBounce 2.5s ease-in-out infinite' }}
          >
            <img src={mascotHappySrc} alt="TTVV Mascot" className="w-16 h-16 object-contain" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Bản Cập Nhật Hệ Thống {CHANGELOG_VERSION}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            Khám phá những tính năng mới cực hot của TTVV!
          </p>
        </div>

        {/* ── Tab Navigation ─────────────────────── */}
        <div 
          className="px-4 py-2.5 overflow-x-auto whitespace-nowrap border-b border-gray-100 dark:border-gray-800/40 bg-gray-50/50 dark:bg-[#1c1e2b]/30 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-1.5 justify-start">
            {FEATURE_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
                    isActive
                      ? `${tab.accentBg} ${tab.accentColor} shadow-sm border border-black/5 dark:border-white/5`
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className={`transition-all duration-200 transform ${tabTransition ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}
          >
            {/* Feature image / illustration */}
            {activeFeature.image ? (
              activeFeature.id === 'mascot' ? (
                renderMascotShowcase()
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800/40">
                    <img
                      src={activeFeature.image}
                      alt={activeFeature.imageAlt || activeFeature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )
            ) : (
              renderIconIllustration(activeFeature)
            )}

            {/* Feature title & description */}
            <h3 className="text-base font-bold text-gray-900 dark:text-white text-center mt-2 tracking-tight">
              {activeFeature.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 leading-relaxed max-w-sm mx-auto font-medium">
              {activeFeature.description}
            </p>

            {/* Highlights */}
            <div className="mt-5 space-y-2 max-w-xs mx-auto">
              {activeFeature.highlights.map((hl, i) => {
                const HlIcon = hl.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gray-50/70 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800/20 hover:border-gray-250 dark:hover:border-gray-700/30 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-xl ${activeFeature.accentBg} flex items-center justify-center shrink-0`}>
                      <HlIcon className={`w-3.5 h-3.5 ${activeFeature.accentColor}`} />
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold tracking-wide">
                      {hl.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-900/30 flex justify-center">
          <button
            onClick={handleClose}
            className={`px-10 py-3 bg-gradient-to-r ${activeFeature.gradient} text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95`}
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>

      {/* ── Scoped Animations ── */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        @keyframes sysUpdateSlideUp {
          0% { opacity: 0; transform: translateY(30px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sysUpdateBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
