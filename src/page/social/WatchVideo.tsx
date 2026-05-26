import {
  Search,
  Globe,
  Users,
  Lock,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Save,
  Flag,
  EyeOff,
  Heart,
  Laugh,
  Frown,
  Angry,
  Film,
  Video,
  X,
  Loader2,
  ChevronDown,
  Play,
  Upload,
  Compass,
  User,
  Send,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { videosApi, type VideoData } from "../../apis/video";
import { reactionsApi, type ReactionData } from "../../apis/reactions";
import { commentsApi, type CommentData } from "../../apis/comments";
import { HttpError } from "../../apis/http";
import { showAuthRequiredPrompt } from "../../utils/authPrompt";
import { useToast } from "../../contexts/useToast";
import { getLocaleTag } from "../../i18n";
import { VIDEO_MAX_BYTES, VIDEO_MAX_MB } from "../../constants/uploadLimits";
import { API_CONFIG } from "../../apis/config";

const getMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = API_CONFIG.COMMON_SERVICE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

type Visibility = "PUBLIC" | "FRIENDS" | "ONLY_ME";

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: typeof Globe;
  desc: string;
}[] = [
  { value: "PUBLIC", label: "Công khai", icon: Globe, desc: "Bất kỳ ai cũng có thể xem" },
  { value: "FRIENDS", label: "Bạn bè", icon: Users, desc: "Chỉ bạn bè của bạn" },
  { value: "ONLY_ME", label: "Chỉ mình tôi", icon: Lock, desc: "Chỉ bạn mới thấy" },
];

const REACTION_TYPES = [
  { type: "LIKE", icon: ThumbsUp, color: "text-blue-500", bg: "hover:bg-blue-50 dark:hover:bg-blue-500/10" },
  { type: "LOVE", icon: Heart, color: "text-red-500", bg: "hover:bg-red-50 dark:hover:bg-red-500/10" },
  { type: "HAHA", icon: Laugh, color: "text-yellow-500", bg: "hover:bg-yellow-50 dark:hover:bg-yellow-500/10" },
  { type: "SAD", icon: Frown, color: "text-yellow-600", bg: "hover:bg-yellow-50 dark:hover:bg-yellow-500/10" },
  { type: "ANGRY", icon: Angry, color: "text-orange-500", bg: "hover:bg-orange-50 dark:hover:bg-orange-500/10" },
] as const;

function formatNumber(n?: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [imgError, setImgError] = useState(false);
  const dim = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-sm" : "w-10 h-10 text-sm";
  const initials = (name ?? "?").substring(0, 2).toUpperCase();
  const finalSrc = getMediaUrl(src || undefined);

  if (!finalSrc || imgError) {
    return (
      <div className={`${dim} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0`}>
        {initials}
      </div>
    );
  }

  return <img src={finalSrc} alt={name ?? ""} className={`${dim} rounded-full object-cover shrink-0`} onError={() => setImgError(true)} />;
}

function VisibilityBadge({ v }: { v?: string }) {
  const opt = VISIBILITY_OPTIONS.find((o) => o.value === v) ?? VISIBILITY_OPTIONS[0];
  const Icon = opt.icon;
  return <Icon className="w-3 h-3" />;
}

function CreateVideoModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (v: VideoData) => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [showVisMenu, setShowVisMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      showToast("Chỉ chấp nhận file video (mp4, mov, webm,...)", "error");
      return;
    }
    if (f.size > VIDEO_MAX_BYTES) {
      showToast(`Video vượt quá ${VIDEO_MAX_MB} MB. Vui lòng chọn video ngắn hơn hoặc nén video trước khi đăng.`, "error");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim() || !user?.id) return;
    setUploading(true);
    try {
      const video = await videosApi.uploadVideo({
        authorId: user.id,
        title: title.trim(),
        description,
        visibility,
        file,
      });
      showToast("Đăng video thành công!", "success");
      onCreated(video);
      onClose();
    } catch (err: any) {
      if (err?.message === "VIDEO_TOO_LARGE") {
        showToast(`Video vượt quá ${VIDEO_MAX_MB} MB. Vui lòng chọn video ngắn hơn.`, "error");
      } else {
        showToast("Đăng video thất bại. Vui lòng thử lại.", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const visOpt = VISIBILITY_OPTIONS.find((o) => o.value === visibility) ?? VISIBILITY_OPTIONS[0];
  const VisIcon = visOpt.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-[#242526] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#3a3b3c]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tải video lên</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3a3b3c] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#4e4f50] transition">
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} name={user?.fullName} size="md" />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.fullName}</p>
              <div className="relative">
                <button onClick={() => setShowVisMenu((p) => !p)} className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3a3b3c] hover:bg-gray-200 dark:hover:bg-[#4e4f50] text-xs font-medium text-gray-700 dark:text-gray-200 transition">
                  <VisIcon className="w-3 h-3" />
                  {visOpt.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showVisMenu && (
                  <div className="absolute top-full mt-1 left-0 z-50 bg-white dark:bg-[#242526] border border-gray-200 dark:border-[#3a3b3c] rounded-xl shadow-xl min-w-[220px]">
                    {VISIBILITY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setVisibility(opt.value);
                            setShowVisMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-[#3a3b3c] transition ${
                            visibility === opt.value ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="text-left">
                            <p className="font-medium">{opt.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                          </div>
                          {visibility === opt.value && (
                            <div className="ml-auto w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <input
            type="text"
            placeholder="Tiêu đề video *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#3a3b3c] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          <textarea
            placeholder="Mô tả video (tùy chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#3a3b3c] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />

          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-[#3a3b3c] rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#3a3b3c] flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/10 transition">
                <Video className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Kéo thả video vào đây hoặc nhấp để chọn</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  MP4, MOV, WEBM - tối đa <span className="font-semibold text-blue-600">{VIDEO_MAX_MB} MB</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video src={previewUrl} controls className="w-full h-full object-contain" />
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 rounded-full px-2 py-0.5">{(file!.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#3a3b3c]">
          <button
            onClick={handleSubmit}
            disabled={!file || !title.trim() || uploading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-[#3a3b3c] disabled:text-gray-400 dark:disabled:text-gray-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang đăng...
              </>
            ) : (
              "Đăng video"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WatchVideo() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "MINE">("ALL");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openReactionId, setOpenReactionId] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionData>>({});
  const [comments, setComments] = useState<Record<string, CommentData[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<VideoData | null>(null);

  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reactionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (lightbox && !comments[lightbox.id!]) {
      loadComments(lightbox.id!);
    }
  }, [lightbox]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const raw = await videosApi.getAllVideos();
      const list = Array.isArray(raw) ? raw : [];
      setVideos(list);
      list.forEach((v) => v.id && loadReactions(v.id));
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const loadReactions = async (videoId: string) => {
    try {
      const list = await reactionsApi.getReactionsByVideoId(videoId);
      const mine = list.find((r) => r.userId === user?.id);
      if (mine) setUserReactions((p) => ({ ...p, [videoId]: mine }));
    } catch {
      // no-op
    }
  };

  const loadComments = async (videoId: string) => {
    try {
      const list = await commentsApi.getCommentsByVideoId(videoId);
      setComments((p) => ({ ...p, [videoId]: list }));
    } catch {
      // no-op
    }
  };

  const handleReaction = async (videoId: string, type: string) => {
    if (!user?.id) {
      showAuthRequiredPrompt(window.location.pathname);
      return;
    }

    try {
      const existing = userReactions[videoId];
      if (existing?.type === type) {
        await reactionsApi.deleteReactionByVideoIdAndUserId(videoId, user.id);
        setUserReactions((p) => {
          const n = { ...p };
          delete n[videoId];
          return n;
        });
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likeCount: Math.max(0, (v.likeCount || 1) - 1) } : v));
      } else {
        await reactionsApi.createReaction({ userId: user.id, type: type as ReactionData["type"], videoId });
        await loadReactions(videoId);
        if (!existing) {
          setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likeCount: (v.likeCount || 0) + 1 } : v));
        }
      }
      setOpenReactionId(null);
    } catch {
      // no-op
    }
  };

  const handleComment = async (videoId: string) => {
    if (!user?.id) {
      showAuthRequiredPrompt(window.location.pathname);
      return;
    }

    const content = commentText[videoId]?.trim();
    if (!content) return;

    try {
      await commentsApi.createComment({ videoId, userId: user.id, content });
      setCommentText((p) => ({ ...p, [videoId]: "" }));
      await loadComments(videoId);
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, commentCount: (v.commentCount || 0) + 1 } : v));
    } catch (err) {
      const msg = err instanceof HttpError ? err.data?.message || err.message : err instanceof Error ? err.message : "Gửi bình luận thất bại";
      showToast(msg, "error");
    }
  };

  const formatTime = (ds?: string) => {
    if (!ds) return "";
    const diff = Math.floor((Date.now() - new Date(ds).getTime()) / 1000);
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(ds).toLocaleDateString(getLocaleTag());
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      Object.values(menuRefs.current).forEach((r) => {
        if (r && !r.contains(e.target as Node)) setOpenMenuId(null);
      });
      Object.values(reactionRefs.current).forEach((r) => {
        if (r && !r.contains(e.target as Node)) setOpenReactionId(null);
      });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = videos.filter((v) => {
    if (search.trim()) {
      const s = search.toLowerCase();
      if (!v.title?.toLowerCase().includes(s) && !v.authorName?.toLowerCase().includes(s)) return false;
    }
    if (activeTab === "MINE") return v.authorId === user?.id;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f0f2f5] dark:bg-[#0c0e14] flex flex-col text-gray-900 dark:text-white">
      {/* Top Header / Sticky Nav */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#18191a]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 sm:gap-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
            Video
          </h1>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-[#0c0e14] p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab("ALL")}
               className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ALL' ? 'bg-white dark:bg-[#242526] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
             >
               <Compass className="w-4 h-4" /> Khám phá
             </button>
             {user && (
               <button 
                 onClick={() => setActiveTab("MINE")}
                 className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'MINE' ? 'bg-white dark:bg-[#242526] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
               >
                 <User className="w-4 h-4" /> Video của bạn
               </button>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm video..."
              className="w-full h-10 pl-9 pr-4 rounded-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#242526] focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 transition-all"
            />
          </div>
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-10 px-4 sm:px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 shrink-0 hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Tải lên</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Đang tải video...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 mt-4">
            <div className="w-28 h-28 relative mb-6">
              <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-full h-full bg-white dark:bg-[#1e1f22] border border-gray-100 dark:border-white/10 rounded-3xl shadow-xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Film className="w-12 h-12 text-blue-500" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              {search ? "Không tìm thấy kết quả" : activeTab === "MINE" ? "Bạn chưa đăng video nào" : "Chưa có video nào"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8 text-sm sm:text-base">
              {search 
                ? "Thử sử dụng các từ khóa khác xem sao." 
                : activeTab === "MINE" 
                  ? "Hãy chia sẻ những khoảnh khắc thú vị của bạn với mọi người ngay hôm nay!"
                  : "Khám phá và trở thành người đầu tiên chia sẻ video trên nền tảng này."}
            </p>
            {!search && user && (
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Tải video lên ngay
              </button>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((video) => {
              const vid = video.id!;
              return (
                <article key={vid} className="group relative bg-white dark:bg-[#18191a] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-[#3a3b3c] cursor-pointer flex flex-col" onClick={() => setLightbox(video)}>
                  {/* Thumbnail Area */}
                  <div className="relative aspect-video bg-gray-100 dark:bg-black rounded-t-2xl overflow-hidden shrink-0">
                    {video.thumbnailUrl ? (
                      <img src={getMediaUrl(video.thumbnailUrl)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={video.title || "Video"} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/640x360.png?text=Video'; }} />
                    ) : (
                      <video src={getMediaUrl(video.videoUrl)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" preload="metadata" muted playsInline />
                    )}
                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded border border-white/10 text-[10px] font-medium text-white shadow-sm z-10">
                      {formatNumber(video.viewCount)} lượt xem
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-3 sm:p-4 flex gap-3 flex-1 bg-white dark:bg-[#242526] rounded-b-2xl">
                    <Avatar src={video.authorId === user?.id ? user?.avatar : getMediaUrl(video.authorAvatar)} name={video.authorId === user?.id ? user?.fullName : video.authorName} size="md" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={video.title}>
                          {video.title || "Video không có tiêu đề"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{video.authorId === user?.id ? user?.fullName : video.authorName}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                          <span className="shrink-0">{formatTime(video.createdAt)}</span>
                          <span className="shrink-0 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <div className="shrink-0"><VisibilityBadge v={video.visibility} /></div>
                        </div>
                    </div>
                    {/* More button */}
                    <div className="relative" ref={(el) => { menuRefs.current[vid] = el; }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === vid ? null : vid); }} 
                        className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#3a3b3c] flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      {openMenuId === vid && (
                        <div className="absolute right-0 top-10 bg-white dark:bg-[#242526] rounded-xl shadow-xl border border-gray-100 dark:border-[#3a3b3c] py-1.5 z-50 min-w-[180px] origin-top-right animate-in fade-in zoom-in duration-150">
                          {[{ icon: Save, label: "Lưu video" }, { icon: EyeOff, label: "Ẩn video" }].map(({ icon: Icon, label }) => (
                            <button key={label} onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} className="w-full px-4 py-2 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3a3b3c] transition-colors">
                              <Icon className="w-4 h-4" />{label}
                            </button>
                          ))}
                          <div className="border-t border-gray-100 dark:border-[#3a3b3c] my-1" />
                          <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} className="w-full px-4 py-2 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <Flag className="w-4 h-4" />Báo cáo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox / Video Modal (Reels/TikTok Style) */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition z-50">
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="w-full max-w-6xl mx-auto h-[100dvh] md:h-[90vh] md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-[#18191a]" onClick={(e) => e.stopPropagation()}>
            
            {/* Video Player Area */}
            <div className="flex-1 bg-black relative flex items-center justify-center h-[40vh] md:h-full shrink-0 md:shrink">
              {lightbox.videoUrl ? (
                  <video src={getMediaUrl(lightbox.videoUrl)} poster={getMediaUrl(lightbox.thumbnailUrl)} autoPlay controls className="w-full h-full object-contain" />
              ) : (
                  <Film className="w-16 h-16 text-gray-700" />
              )}
            </div>

            {/* Info & Comments Sidebar */}
            <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-white dark:bg-[#242526] h-[60vh] md:h-full border-l border-gray-200 dark:border-[#3a3b3c]">
              
              {/* Header Info */}
              <div className="p-4 border-b border-gray-100 dark:border-[#3a3b3c] shrink-0 bg-white dark:bg-[#242526]">
                <div className="flex items-center gap-3">
                  <Avatar src={lightbox.authorId === user?.id ? user?.avatar : getMediaUrl(lightbox.authorAvatar)} name={lightbox.authorId === user?.id ? user?.fullName : lightbox.authorName} size="md" />
                  <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{lightbox.authorId === user?.id ? user?.fullName : lightbox.authorName}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>{formatTime(lightbox.createdAt)}</span>
                        <span>·</span>
                        <VisibilityBadge v={lightbox.visibility} />
                      </div>
                  </div>
                  {user?.id !== lightbox.authorId && (
                    <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#3a3b3c] dark:hover:bg-[#4e4f50] text-gray-900 dark:text-white text-sm font-semibold rounded-full transition-colors">
                      Theo dõi
                    </button>
                  )}
                </div>
                {lightbox.title && <h2 className="mt-4 font-semibold text-gray-900 dark:text-white text-base leading-snug">{lightbox.title}</h2>}
                {lightbox.description && <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">{lightbox.description}</p>}
                
                {/* Stats & Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#3a3b3c] flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={(el) => { reactionRefs.current[lightbox.id!] = el; }}>
                      <button 
                        onClick={() => {
                          const myReaction = userReactions[lightbox.id!];
                          if (myReaction) handleReaction(lightbox.id!, myReaction.type);
                          else setOpenReactionId(openReactionId === lightbox.id! ? null : lightbox.id!);
                        }} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${userReactions[lightbox.id!] ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3a3b3c]'}`}
                      >
                        {userReactions[lightbox.id!] ? (
                          (() => {
                            const RIcon = REACTION_TYPES.find(r => r.type === userReactions[lightbox.id!].type)?.icon || ThumbsUp;
                            return <RIcon className="w-5 h-5 fill-current" />;
                          })()
                        ) : (
                          <ThumbsUp className="w-5 h-5" />
                        )}
                        <span>{formatNumber(lightbox.likeCount)}</span>
                      </button>
                      
                      {openReactionId === lightbox.id! && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-[#242526] rounded-full shadow-xl border border-gray-100 dark:border-[#3a3b3c] px-2 py-1.5 flex gap-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
                          {REACTION_TYPES.map((r) => {
                            const Icon = r.icon;
                            return (
                              <button key={r.type} onClick={() => handleReaction(lightbox.id!, r.type)} className={`w-10 h-10 rounded-full ${r.bg} flex items-center justify-center hover:scale-125 transition-transform`} title={r.type}>
                                <Icon className={`w-6 h-6 ${r.color}`} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-[#3a3b3c]">
                      <MessageCircle className="w-5 h-5" />
                      <span>{formatNumber(lightbox.commentCount)}</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3a3b3c] px-3 py-1.5 rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span className="hidden sm:inline">Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#18191a]">
                  {(comments[lightbox.id!] ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                      <MessageCircle className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">Chưa có bình luận nào</p>
                    </div>
                  ) : (
                    comments[lightbox.id!].map((c: CommentData) => (
                        <div key={c.id} className="flex gap-2.5">
                          <Avatar src={c.userAvatar} name={c.userName} size="sm" />
                          <div className="flex-1">
                            <div className="bg-white dark:bg-[#242526] px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-transparent text-sm inline-block max-w-full">
                              <span className="font-semibold text-gray-900 dark:text-white block mb-0.5">{c.userName}</span>
                              <span className="text-gray-800 dark:text-gray-200 leading-relaxed break-words">{c.content}</span>
                            </div>
                            <div className="flex gap-4 text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 ml-2 font-medium">
                              <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Thích</button>
                              <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Phản hồi</button>
                              <span>{formatTime(c.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                    ))
                  )}
              </div>

              {/* Comment Input */}
              <div className="p-3 border-t border-gray-200 dark:border-[#3a3b3c] bg-white dark:bg-[#242526] shrink-0">
                <div className="flex items-center gap-2.5">
                  <Avatar src={user?.avatar} name={user?.fullName} size="sm" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Viết bình luận..."
                      value={commentText[lightbox.id!] ?? ""}
                      onChange={e => setCommentText(p => ({ ...p, [lightbox.id!]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleComment(lightbox.id!);
                        }
                      }}
                      className="w-full bg-gray-100 dark:bg-[#3a3b3c] rounded-full pl-4 pr-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-500"
                    />
                    <button 
                      onClick={() => handleComment(lightbox.id!)}
                      disabled={!commentText[lightbox.id!]?.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 flex items-center justify-center transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-white ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateVideoModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(v) => {
            setVideos((prev) => [v, ...prev]);
            setActiveTab("MINE");
          }}
        />
      )}
    </div>
  );
}
