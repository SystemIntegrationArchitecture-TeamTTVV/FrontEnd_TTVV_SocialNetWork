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
};

const FEATURE_TABS: FeatureTab[] = [
  {
    id: 'mascot',
    icon: Bot,
    label: 'Mascot',
    title: 'Mascot hướng dẫn thông minh',
    description:
      'Chú robot TTVV luôn sẵn sàng đồng hành cùng bạn, hướng dẫn từng bước sử dụng mọi tính năng trên nền tảng.',
    highlights: [
      { icon: Sparkles, text: 'Hướng dẫn tương tác trực quan' },
      { icon: CheckCircle2, text: 'Phản ứng cảm xúc khi vuốt & chạm' },
      { icon: Bell, text: 'Tự động gợi ý tính năng mới' },
    ],
    image: mascot1Src,
    imageAlt: 'TTVV Mascot',
    accentColor: 'text-blue-500',
    accentBg: 'bg-blue-500/10',
  },
  {
    id: 'livestream',
    icon: Radio,
    label: 'Live Stream',
    title: 'Phát trực tiếp',
    description:
      'Livestream trực tiếp với bạn bè, chia sẻ khoảnh khắc real-time. Hỗ trợ chat trực tiếp trong stream.',
    highlights: [
      { icon: Play, text: 'Phát trực tiếp video chất lượng cao' },
      { icon: MessageCircle, text: 'Chat real-time trong stream' },
      { icon: Bell, text: 'Thông báo khi bạn bè đang live' },
    ],
    illustrationIcon: Radio,
    accentColor: 'text-red-500',
    accentBg: 'bg-red-500/10',
  },
  {
    id: 'music',
    icon: Music2,
    label: 'Nhạc',
    title: 'Nghe nhạc trực tuyến',
    description:
      'Thưởng thức âm nhạc ngay trên TTVV. Tìm kiếm, phát và chia sẻ bài hát yêu thích với bạn bè.',
    highlights: [
      { icon: Headphones, text: 'Kho nhạc phong phú đa thể loại' },
      { icon: Play, text: 'Tạo playlist cá nhân' },
      { icon: Share2, text: 'Chia sẻ bài hát lên bảng tin' },
    ],
    illustrationIcon: Music2,
    accentColor: 'text-emerald-500',
    accentBg: 'bg-emerald-500/10',
  },
  {
    id: 'games',
    icon: Gamepad2,
    label: 'Trò chơi',
    title: 'Mini Games',
    description:
      'Giải trí với các trò chơi mini ngay trên nền tảng. Thách đấu bạn bè và leo bảng xếp hạng.',
    highlights: [
      { icon: Gamepad2, text: 'Nhiều thể loại game hấp dẫn' },
      { icon: Trophy, text: 'Bảng xếp hạng toàn cầu' },
      { icon: Users, text: 'Thách đấu bạn bè real-time' },
    ],
    illustrationIcon: Gamepad2,
    accentColor: 'text-amber-500',
    accentBg: 'bg-amber-500/10',
  },
  {
    id: 'chatbox',
    icon: MessageCircle,
    label: 'Chat Box',
    title: 'Chat nhanh trên Newsfeed',
    description:
      'Nhắn tin trực tiếp mà không cần rời khỏi bảng tin. Hỗ trợ gửi ảnh, video, voice message.',
    highlights: [
      { icon: Send, text: 'Chat real-time không rời trang' },
      { icon: Image, text: 'Gửi ảnh, video và voice message' },
      { icon: Phone, text: 'Gọi thoại và video call' },
    ],
    illustrationIcon: MessageCircle,
    accentColor: 'text-violet-500',
    accentBg: 'bg-violet-500/10',
  },
  {
    id: 'stories',
    icon: Eye,
    label: 'Stories',
    title: 'Stories 24h',
    description:
      'Chia sẻ khoảnh khắc qua Stories tự động biến mất sau 24 giờ. Hỗ trợ cả ảnh và video.',
    highlights: [
      { icon: Image, text: 'Đăng Stories ảnh và video' },
      { icon: Clock, text: 'Tự động xóa sau 24 giờ' },
      { icon: Eye, text: 'Xem ai đã xem Story của bạn' },
    ],
    illustrationIcon: Eye,
    accentColor: 'text-pink-500',
    accentBg: 'bg-pink-500/10',
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
    <div className="flex items-center justify-center gap-4 py-3">
      {[mascot1Src, mascot2Src, mascot3Src].map((src, i) => (
        <div
          key={i}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-100 dark:border-blue-500/10 flex items-center justify-center overflow-hidden shadow-sm"
        >
          <img
            src={src}
            alt={`Mascot ${i + 1}`}
            className="w-16 h-16 object-contain"
          />
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
          className={`w-24 h-24 rounded-3xl ${feature.accentBg} flex items-center justify-center shadow-sm`}
        >
          <Icon className={`w-12 h-12 ${feature.accentColor}`} />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Bản cập nhật hệ thống"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: 'sysUpdateSlideUp 0.35s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────── */}
        <div className="relative px-6 pt-6 pb-4 text-center border-b border-gray-100 dark:border-[#22263a]">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2b2f45] flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Mascot avatar */}
          <div
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/10 dark:to-indigo-500/10 flex items-center justify-center mb-3 shadow-lg shadow-blue-100/50 dark:shadow-none overflow-hidden"
            style={{ animation: 'sysUpdateBounce 2s ease-in-out infinite' }}
          >
            <img src={mascotHappySrc} alt="TTVV Mascot" className="w-16 h-16 object-contain" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
            Ban cap nhat he thong {CHANGELOG_VERSION}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kham pha nhung tinh nang moi nhat cua TTVV!
          </p>
        </div>

        {/* ── Tab Navigation ─────────────────────── */}
        <div className="px-4 pt-3 pb-0 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {FEATURE_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? `${tab.accentBg} ${tab.accentColor}`
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#22263a]'
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
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div
            className={`transition-opacity duration-150 ${tabTransition ? 'opacity-0' : 'opacity-100'}`}
          >
            {/* Feature image / illustration */}
            {activeFeature.image ? (
              activeFeature.id === 'mascot' ? (
                renderMascotShowcase()
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#22263a]">
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mt-2">
              {activeFeature.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1.5 leading-relaxed max-w-md mx-auto">
              {activeFeature.description}
            </p>

            {/* Highlights */}
            <div className="mt-5 space-y-2.5 max-w-sm mx-auto">
              {activeFeature.highlights.map((hl, i) => {
                const HlIcon = hl.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0c0e14] border border-gray-100 dark:border-[#22263a]"
                  >
                    <div className={`w-7 h-7 rounded-lg ${activeFeature.accentBg} flex items-center justify-center shrink-0`}>
                      <HlIcon className={`w-3.5 h-3.5 ${activeFeature.accentColor}`} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {hl.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#22263a] bg-gray-50/50 dark:bg-[#13151f] flex justify-center">
          <button
            onClick={handleClose}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            Da hieu, dong
          </button>
        </div>
      </div>

      {/* ── Scoped Animations ── */}
      <style>{`
        @keyframes sysUpdateSlideUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sysUpdateBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
