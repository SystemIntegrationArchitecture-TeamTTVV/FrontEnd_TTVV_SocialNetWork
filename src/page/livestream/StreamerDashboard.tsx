import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { livestreamApi, type LiveStreamData } from '../../apis/livestream';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { Radio, Tv, ArrowLeft, ScrollText } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import type { SocketEvent } from '../../services/socket';
import type { GiftOverlayRef } from './components/GiftOverlay';
import type { DanmakuLayerRef } from './components/DanmakuLayer';
import LiveRegulationsModal from './components/LiveRegulationsModal';
import StreamerThamKhaoLayout, { type HostChatLine } from './components/StreamerThamKhaoLayout';
import DepositModal from './components/DepositModal';
import { speakLiveDonateAnnouncement } from '../../utils/livestreamTts';

const DANMU_PREFIX = '\u200B[D]';

export default function StreamerDashboard() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const navigate = useNavigate();

  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiresApprovalCreate, setRequiresApprovalCreate] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [requiresApprovalLive, setRequiresApprovalLive] = useState(false);

  const [showRules, setShowRules] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [hostChatMessages, setHostChatMessages] = useState<HostChatLine[]>([]);
  /** Giống ThamKhao isTtsEnabled — đọc to khi có donate */
  const [donateTtsEnabled, setDonateTtsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('ttvv_host_tts_donate') !== '0';
  });

  const giftOverlayRef = useRef<GiftOverlayRef>(null);
  const danmakuRef = useRef<DanmakuLayerRef>(null);
  const recentGiftSigsRef = useRef<Map<string, number>>(new Map());
  const showLiveActionOverlay = creating || ending;
  const liveActionLabel = creating ? 'Đang bắt đầu phát trực tiếp...' : 'Đang kết thúc phát trực tiếp...';
  const liveActionHint = creating
    ? 'Vui lòng chờ trong giây lát, hệ thống đang khởi tạo phòng live.'
    : 'Vui lòng chờ trong giây lát, hệ thống đang đóng phòng live.';

  const loadMyStream = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stream = await livestreamApi.getMyActiveStream(user.id);
      setActiveStream(stream);
      if (stream) setRequiresApprovalLive(!!stream.requiresApproval);
    } catch {
      setActiveStream(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMyStream();
  }, [loadMyStream]);

  useEffect(() => {
    if (!activeStream?.id) return;
    setHostChatMessages([{ id: Date.now(), system: true, content: 'Bạn đã vào phòng' }]);
  }, [activeStream?.id]);

  useEffect(() => {
    if (!activeStream) return;

    const handleViewerCount = (ev: SocketEvent) => {
      const data = ev.data as { streamId?: string; viewerCount?: number } | undefined;
      if (data?.streamId === activeStream.id && typeof data.viewerCount === 'number') {
        setActiveStream((prev) => (prev ? { ...prev, viewerCount: data.viewerCount! } : null));
      }
    };

    const handleGift = (ev: SocketEvent) => {
      const data = ev.data as {
        roomId?: string;
        receiverId?: string;
        senderName?: string;
        giftName?: string;
        giftEmoji?: string;
        giftPrice?: number;
        giftMessage?: string;
      } | undefined;
      if (!data || data.roomId !== activeStream.roomName) return;
      const forThisHost =
        !data.receiverId || data.receiverId === user?.id || data.receiverId === activeStream?.streamerId;
      if (!forThisHost) return;
      const sig = `${data.senderName ?? 'u'}-${data.giftName ?? 'gift'}-${data.giftMessage ?? ''}-${activeStream.roomName}`;
      const now = Date.now();
      const last = recentGiftSigsRef.current.get(sig);
      if (last && now - last < 2200) return;
      recentGiftSigsRef.current.set(sig, now);

      if (giftOverlayRef.current) {
        giftOverlayRef.current.showGift({
          senderName: data.senderName ?? '',
          giftName: data.giftName ?? '',
          giftEmoji: data.giftEmoji ?? '🎁',
          giftMessage: data.giftMessage,
        });
      }
      speakLiveDonateAnnouncement({
        enabled: donateTtsEnabled,
        senderName: data.senderName,
        giftName: data.giftName,
        giftPrice: typeof data.giftPrice === 'number' ? data.giftPrice : undefined,
        giftMessage: data.giftMessage,
      });
    };

    const handleChat = (ev: SocketEvent) => {
      const data = ev.data as {
        streamId?: string;
        content?: string;
        userId?: string;
        userName?: string;
      } | undefined;
      if (data?.streamId !== activeStream.id || !data.content) return;
      const isDanmaku = data.content.startsWith(DANMU_PREFIX);
      const display = isDanmaku ? data.content.slice(DANMU_PREFIX.length) : data.content;
      setHostChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          userId: data.userId,
          userName: data.userName,
          content: display,
        },
      ]);
      if (isDanmaku && danmakuRef.current) {
        danmakuRef.current.addMessage(display, data.userId === user?.id);
      }
    };

    const unsubs = [
      subscribe('LIVE_VIEWER_COUNT', handleViewerCount),
      subscribe('LIVE_GIFT_RECEIVED', handleGift),
      subscribe('LIVE_CHAT', handleChat),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe, activeStream, user?.id, donateTtsEnabled]);

  const setDonateTtsEnabledPersist = useCallback((v: boolean) => {
    setDonateTtsEnabled(v);
    try {
      localStorage.setItem('ttvv_host_tts_donate', v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const handleCreateStream = async () => {
    if (!user?.id) return;
    setCreating(true);
    try {
      const fallbackTitle = `Phòng live của ${user.fullName || user.username || 'Unknown'}`;
      const resolvedTitle = title.trim() || fallbackTitle;
      let stream = await livestreamApi.createStream({
        userId: user.id,
        streamerName: user.fullName || user.username || 'Unknown',
        streamerAvatar: user.avatar,
        title: resolvedTitle,
        description: description.trim() || undefined,
        requiresApproval: requiresApprovalCreate,
      });
      if (thumbnailFile) {
        try {
          stream = await livestreamApi.uploadThumbnail(stream.id, user.id, thumbnailFile);
        } catch (e) {
          console.warn('Thumbnail upload failed', e);
        }
      }
      setActiveStream(stream);
      setRequiresApprovalLive(!!stream.requiresApproval);
      setThumbnailFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo phiên live';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEndStream = async () => {
    if (!activeStream || !user?.id) return;
    if (!window.confirm('Bạn có chắc muốn kết thúc phát trực tiếp?')) return;
    setEnding(true);
    try {
      await livestreamApi.endStream(activeStream.id, user.id);
      setActiveStream(null);
    } catch {
      alert('Không thể kết thúc stream');
    } finally {
      setEnding(false);
    }
  };

  const saveRoomSettings = async () => {
    if (!activeStream || !user?.id) return;
    setSavingSettings(true);
    try {
      const updated = await livestreamApi.updateSettings(
        activeStream.id,
        user.id,
        requiresApprovalLive
      );
      setActiveStream((prev) => (prev ? { ...prev, requiresApproval: updated.requiresApproval } : null));
    } catch {
      alert('Không thể lưu cài đặt');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-3 border-[#e4e6eb] dark:border-[#2b2f45] border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 max-w-[1600px] mx-auto">
      {showLiveActionOverlay && (
        <div className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] shadow-[0_16px_50px_rgba(0,0,0,0.28)] p-6 text-center">
            <div className="mx-auto mb-4 relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#1877F2]/80 animate-spin" />
              <div className="absolute inset-[10px] rounded-full border-2 border-[#1877F2]/20" />
            </div>
            <p className="text-base font-bold text-[#050505] dark:text-[#edf0fa]">{liveActionLabel}</p>
            <p className="mt-1.5 text-sm text-[#65676b] dark:text-[#7e89a6]">{liveActionHint}</p>
          </div>
        </div>
      )}
      <LiveRegulationsModal open={showRules} onClose={() => setShowRules(false)} />
      {showDeposit && user && (
        <DepositModal onClose={() => setShowDeposit(false)} onSuccess={() => setShowDeposit(false)} />
      )}

      <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/livestream')}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white"
                style={{ backgroundColor: '#1877F2' }}
              >
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Phát trực tiếp</h1>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ScrollText className="w-4 h-4" />
            Nội quy
          </button>
        </div>
      </div>

      {activeStream && activeStream.livekitUrl && activeStream.livekitToken && user ? (
        <LiveKitRoom
          video={true}
          audio={true}
          token={activeStream.livekitToken}
          serverUrl={activeStream.livekitUrl}
          connect={true}
          className="relative"
        >
          <StreamerThamKhaoLayout
            stream={activeStream}
            user={user}
            hostChatMessages={hostChatMessages}
            giftOverlayRef={giftOverlayRef}
            danmakuRef={danmakuRef}
            onEndStream={handleEndStream}
            ending={ending}
            requiresApprovalLive={requiresApprovalLive}
            setRequiresApprovalLive={setRequiresApprovalLive}
            savingSettings={savingSettings}
            saveRoomSettings={saveRoomSettings}
            onOpenRules={() => setShowRules(true)}
            onOpenDeposit={() => setShowDeposit(true)}
            donateTtsEnabled={donateTtsEnabled}
            onDonateTtsEnabledChange={setDonateTtsEnabledPersist}
          />
        </LiveKitRoom>
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white"
                style={{ backgroundColor: '#1877F2' }}
              >
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tạo phiên phát trực tiếp</h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block text-slate-800 dark:text-slate-200">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Mặc định: Phòng live của ${user?.fullName || user?.username || 'bạn'}`}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block text-slate-800 dark:text-slate-200">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block text-slate-800 dark:text-slate-200">
                  Ảnh bìa (tuỳ chọn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:text-white file:bg-blue-600"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requiresApprovalCreate}
                  onChange={(e) => setRequiresApprovalCreate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-800 dark:text-slate-200">Yêu cầu duyệt người xem (waiting room)</span>
              </label>

              <button
                type="button"
                onClick={handleCreateStream}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-bold shadow-md disabled:opacity-50 hover:opacity-95 transition"
                style={{ backgroundColor: '#1877F2' }}
              >
                <Radio className="w-5 h-5" />
                {creating ? 'Đang tạo...' : 'Bắt đầu phát trực tiếp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
