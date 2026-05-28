import { useCallback, useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  StopCircle,
  Type,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Clock,
  Monitor,
  Globe,
  Gift,
  Plus,
  X,
  HelpCircle,
  Heart,
  ThumbsUp,
} from 'lucide-react';
import type { LiveStreamData } from '../../../apis/livestream';
import { livestreamApi } from '../../../apis/livestream';
import { billingApi } from '../../../apis/billing';
import type { User } from '../../../contexts/AuthContext';
import GiftOverlay from './GiftOverlay';
import type { GiftOverlayRef } from './GiftOverlay';
import DanmakuLayer from './DanmakuLayer';
import type { DanmakuLayerRef } from './DanmakuLayer';
import TopDonors from './TopDonors';
import MemberPanelHost from './MemberPanelHost';
import VipBadge from './VipBadge';

const VIOLET = '#1877F2';
const DANMU_PREFIX = '\u200B[D]';

export type HostChatLine = {
  id: number;
  userId?: string;
  userName?: string;
  content?: string;
  system?: boolean;
};

type Props = {
  stream: LiveStreamData;
  user: User;
  hostChatMessages: HostChatLine[];
  giftOverlayRef: RefObject<GiftOverlayRef | null>;
  danmakuRef: RefObject<DanmakuLayerRef | null>;
  onEndStream: () => void;
  ending: boolean;
  requiresApprovalLive: boolean;
  setRequiresApprovalLive: (v: boolean) => void;
  savingSettings: boolean;
  saveRoomSettings: () => void;
  onOpenRules: () => void;
  onOpenDeposit?: () => void;
  /** Giọng đọc donate (TTS) khi viewer tặng quà — giống ThamKhao isTtsEnabled */
  donateTtsEnabled: boolean;
  onDonateTtsEnabledChange: (v: boolean) => void;
};

function StreamerVideoStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const videoTrack = tracks.find((t) => t.source === Track.Source.Camera);
  return (
    <div className="relative w-full aspect-video bg-black">
      {videoTrack?.publication?.track ? (
        <VideoTrack trackRef={videoTrack as any} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
          Đang bật camera…
        </div>
      )}
    </div>
  );
}

function formatElapsed(startedAt?: string): string {
  if (!startedAt) return '0:00';
  
  let t = NaN;
  const match = startedAt.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, y, m, d, h, min, s] = match;
    t = Date.UTC(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(h, 10),
      parseInt(min, 10),
      parseInt(s, 10)
    );
  } else {
    t = new Date(startedAt).getTime();
  }

  if (Number.isNaN(t)) return '0:00';
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}



export default function StreamerThamKhaoLayout({
  stream,
  user,
  hostChatMessages,
  giftOverlayRef,
  danmakuRef,
  onEndStream,
  ending,
  requiresApprovalLive,
  setRequiresApprovalLive,
  savingSettings,
  saveRoomSettings,
  onOpenRules,
  onOpenDeposit,
  donateTtsEnabled,
  onDonateTtsEnabledChange,
}: Props) {
  const navigate = useNavigate();
  const room = useRoomContext();
  const connState = useConnectionState(room);
  const { localParticipant } = useLocalParticipant();

  const [tick, setTick] = useState(0);
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [hideGiftOverlay, setHideGiftOverlay] = useState(false);
  const [hideTopDonors, setHideTopDonors] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [sendAsDanmaku, setSendAsDanmaku] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; type: 'heart' | 'like'; left: number }>>([]);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    billingApi
      .getWallet(user.id)
      .then((w) => setWalletBalance(w.balance))
      .catch(() => setWalletBalance(null));
  }, [user.id]);

  const elapsed = useMemo(() => formatElapsed(stream.startedAt), [stream.startedAt, tick]);

  const countdown = useMemo(() => {
    if (!stream.maxLiveDurationMinutes || stream.maxLiveDurationMinutes <= 0) return null;
    if (!stream.startedAt) return '00:00';
    
    let t = NaN;
    const match = stream.startedAt.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, h, min, s] = match;
      t = Date.UTC(
        parseInt(y, 10),
        parseInt(m, 10) - 1,
        parseInt(d, 10),
        parseInt(h, 10),
        parseInt(min, 10),
        parseInt(s, 10)
      );
    } else {
      t = new Date(stream.startedAt).getTime();
    }

    if (Number.isNaN(t)) return '00:00';
    const elapsedSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    const totalSec = stream.maxLiveDurationMinutes * 60;
    const remainingSec = Math.max(0, totalSec - elapsedSec);

    const h = Math.floor(remainingSec / 3600);
    const m = Math.floor((remainingSec % 3600) / 60);
    const s = remainingSec % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [stream.startedAt, stream.maxLiveDurationMinutes, tick]);

  const isTimeRunningOut = useMemo(() => {
    if (!stream.maxLiveDurationMinutes || stream.maxLiveDurationMinutes <= 0) return false;
    if (!stream.startedAt) return false;
    
    let t = NaN;
    const match = stream.startedAt.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, h, min, s] = match;
      t = Date.UTC(
        parseInt(y, 10),
        parseInt(m, 10) - 1,
        parseInt(d, 10),
        parseInt(h, 10),
        parseInt(min, 10),
        parseInt(s, 10)
      );
    } else {
      t = new Date(stream.startedAt).getTime();
    }

    if (Number.isNaN(t)) return false;
    const elapsedSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    const totalSec = stream.maxLiveDurationMinutes * 60;
    const remainingSec = Math.max(0, totalSec - elapsedSec);
    return remainingSec <= 60;
  }, [stream.startedAt, stream.maxLiveDurationMinutes, tick]);

  const micOn = localParticipant?.isMicrophoneEnabled ?? false;
  const camOn = localParticipant?.isCameraEnabled ?? false;

  const sendHostChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    const content = sendAsDanmaku ? `${DANMU_PREFIX}${text}` : text;
    try {
      await livestreamApi.sendChat(stream.id, {
        userId: user.id,
        userName: user.fullName || user.username || 'Host',
        content,
      });
    } catch {
      setChatInput(text);
    }
  }, [chatInput, sendAsDanmaku, stream.id, user]);

  useEffect(() => {
    const spawnReaction = (type: 'heart' | 'like') => {
      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const left = 12 + Math.random() * 76;
      setFloatingReactions((prev) => [...prev, { id, type, left }]);
      window.setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((item) => item.id !== id));
      }, 1800);
    };

    const onData = (
      payload: Uint8Array,
      participant?: { identity: string },
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic !== 'reaction' || participant?.identity === localParticipant?.identity) return;
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as {
          type?: string;
          reaction?: string;
        };
        if (parsed?.type === 'reaction' && (parsed.reaction === 'heart' || parsed.reaction === 'like')) {
          spawnReaction(parsed.reaction);
        }
      } catch {
        /* ignore malformed payload */
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, localParticipant.identity]);

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    try {
      const cur =
        localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track != null;
      await localParticipant.setScreenShareEnabled(!cur);
    } catch {
      window.alert('Trình duyệt cần quyền chia sẻ màn hình.');
    }
  };

  const gridBtn = (
    base: string,
    label: string,
    icon: ReactNode,
    onClick?: () => void,
    disabled?: boolean
  ) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-3 px-2 text-[11px] font-bold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 min-h-[76px] ${base}`}
    >
      <span className="w-6 h-6 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      <span className="text-center leading-tight px-0.5">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
      {/* ── Cột trái: video + overlay + chat dưới (ThamKhao) ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-black">
          <StreamerVideoStage />
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[25]">
            {floatingReactions.map((item) => (
              <div
                key={item.id}
                className="absolute bottom-6 flex h-10 w-10 items-center justify-center rounded-full shadow-lg animate-[ttvvReactionFloat_1.8s_ease-out_forwards]"
                style={{
                  left: `${item.left}%`,
                  background: item.type === 'heart' ? 'rgba(244,63,94,0.2)' : 'rgba(123,63,228,0.2)',
                  border: item.type === 'heart' ? '1px solid rgba(244,63,94,0.45)' : '1px solid rgba(123,63,228,0.45)',
                }}
              >
                {item.type === 'heart' ? (
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                ) : (
                  <ThumbsUp className="w-5 h-5 text-blue-600" />
                )}
              </div>
            ))}
          </div>

          {!hideGiftOverlay && <GiftOverlay ref={giftOverlayRef} />}
          <DanmakuLayer ref={danmakuRef} visible={showDanmaku} />

          <div className={speakerMuted ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : ''}>
            <RoomAudioRenderer />
          </div>

          {/* Góc trên trái: LIVE + lượt xem + đồng hồ */}
          <div className="absolute top-3 left-3 z-40 flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-black/55 backdrop-blur-md px-3 py-1.5 border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-white text-xs font-bold">live</span>
              <span className="text-white/90 text-xs font-medium border-l border-white/20 pl-2 ml-0.5">
                {stream.viewerCount ?? 0} người xem
              </span>
              <VipBadge vipLevel={stream.vipLevel} size="sm" className="ml-1" />
            </div>
            <div className="flex gap-2">
              <div className="rounded-xl bg-black/55 backdrop-blur-md px-3 py-1.5 border border-white/10 w-max">
                <div className="flex items-center gap-2 text-white text-xs font-mono font-semibold">
                  <Clock className="w-3.5 h-3.5 opacity-80" />
                  {elapsed}
                </div>
              </div>
              {countdown && (
                <div className={`rounded-xl backdrop-blur-md px-3 py-1.5 border w-max transition-all ${
                  isTimeRunningOut
                    ? 'bg-red-600/90 border-red-500 animate-pulse text-white font-bold'
                    : 'bg-black/55 border-white/10 text-amber-400'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Còn lại: {countdown}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {connState === ConnectionState.Reconnecting && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 rounded-full bg-amber-500/90 text-white text-xs font-bold px-3 py-1.5 shadow-md backdrop-blur">
              ↻ Đang kết nối lại...
            </div>
          )}

          {/* Giữa trên: icon trang trí giống ThamKhao */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex gap-2">
            <button
              type="button"
              title="Chia sẻ màn hình"
              onClick={toggleScreenShare}
              className="w-9 h-9 rounded-xl bg-black/45 backdrop-blur border border-white/15 text-white flex items-center justify-center hover:bg-black/60"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Ngôn ngữ"
              className="w-9 h-9 rounded-xl bg-black/45 backdrop-blur border border-white/15 text-white flex items-center justify-center hover:bg-black/60"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {!hideTopDonors && (
            <TopDonors streamerId={user.id} variant="lightCard" className="!top-3 !right-3" />
          )}

          {/* Nút trợ giúp nổi góc phải dưới video */}
          <button
            type="button"
            onClick={onOpenRules}
            className="absolute bottom-3 right-3 z-40 flex items-center gap-2 rounded-full pl-3 pr-4 py-2 text-white text-xs font-bold shadow-lg border border-white/20"
            style={{ backgroundColor: VIOLET }}
          >
            <HelpCircle className="w-4 h-4" />
            Hướng dẫn chi tiết
          </button>
        </div>

        {/* Bình luận / chat dưới video */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d28] shadow-sm overflow-hidden flex flex-col min-h-[220px] max-h-[320px]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-800 dark:text-white">Bình luận</span>
            <span className="text-xs text-slate-500">
              {hostChatMessages.filter((m) => !m.system).length} tin nhắn
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm">
            {hostChatMessages.map((m) => (
              <div key={m.id} className={m.system ? 'text-center text-slate-400 text-xs py-2' : ''}>
                {m.system ? (
                  m.content
                ) : (
                  <p>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{m.userName}:</span>{' '}
                    <span className="text-slate-700 dark:text-slate-200">{m.content}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-[#22263a]">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSendAsDanmaku(!sendAsDanmaku)}
                className={`p-2 rounded-xl border transition-colors ${
                  sendAsDanmaku
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600'
                }`}
                title="Gửi dưới dạng chữ chạy"
              >
                <Type className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                {walletBalance != null ? walletBalance : '—'}
                <button
                  type="button"
                  className="ml-1 w-6 h-6 rounded-lg bg-amber-400 text-white flex items-center justify-center hover:bg-amber-500"
                  title="Nạp xu"
                  onClick={() => (onOpenDeposit ? onOpenDeposit() : navigate('/livestream'))}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500"
                title="Quà"
              >
                <Gift className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendHostChat();
                  }
                }}
                placeholder={sendAsDanmaku ? 'Nhập tin nhắn chạy màn hình...' : 'Viết bình luận...'}
                className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={sendHostChat}
                className="shrink-0 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-md"
                style={{ backgroundColor: VIOLET }}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar phải (ThamKhao) ── */}
      <aside className="w-full lg:w-[340px] shrink-0 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d28] shadow-md overflow-hidden max-h-[calc(100vh-8rem)] lg:max-h-[min(90vh,920px)]">
        <div className="flex items-start justify-between px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Live Stream</h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Bạn là chủ phòng</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/livestream')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container for Sidebar Content */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col [scrollbar-width:thin]">
          <div className="p-3 grid grid-cols-2 gap-2 shrink-0">
            {gridBtn(
              micOn ? 'bg-blue-600' : 'bg-blue-800',
              micOn ? 'Tắt mic' : 'Bật mic',
              micOn ? <Mic /> : <MicOff />,
              () => localParticipant?.setMicrophoneEnabled(!micOn)
            )}
            {gridBtn(
              camOn ? 'bg-blue-600' : 'bg-blue-800',
              camOn ? 'Tắt cam' : 'Bật cam',
              camOn ? <Video /> : <VideoOff />,
              () => localParticipant?.setCameraEnabled(!camOn)
            )}
            {gridBtn('bg-slate-600', 'Share', <Share2 />, toggleScreenShare)}
            {gridBtn('bg-red-600', 'Kết thúc', <StopCircle />, onEndStream, ending)}
            {gridBtn(
              showDanmaku ? 'bg-emerald-600' : 'bg-emerald-800',
              showDanmaku ? 'Ẩn chữ' : 'Hiện chữ',
              <Type />,
              () => setShowDanmaku(!showDanmaku)
            )}
            {gridBtn(
              speakerMuted ? 'bg-blue-800' : 'bg-blue-600',
              speakerMuted ? 'Bật loa' : 'Tắt loa',
              speakerMuted ? <VolumeX /> : <Volume2 />,
              () => setSpeakerMuted(!speakerMuted)
            )}
            {gridBtn(
              hideGiftOverlay ? 'bg-pink-600' : 'bg-pink-500',
              hideGiftOverlay ? 'Hiện chữ Donate' : 'Ẩn chữ Donate',
              <Sparkles />,
              () => setHideGiftOverlay(!hideGiftOverlay)
            )}
            {gridBtn(
              hideTopDonors ? 'bg-orange-700' : 'bg-orange-500',
              hideTopDonors ? 'Hiện Top Donate' : 'Ẩn Top Donate',
              <Trophy />,
              () => setHideTopDonors(!hideTopDonors)
            )}
          </div>

          <div className="shrink-0 px-2 pb-2 h-[280px]">
            <MemberPanelHost streamId={stream.id} roomName={stream.roomName} hostUserId={user.id} embedded />
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-[#151822] shrink-0">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Cài đặt phòng</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Chủ phòng quản lý cách người xem tham gia</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-600 dark:text-slate-400">Yêu cầu duyệt</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={requiresApprovalLive}
                  onClick={() => setRequiresApprovalLive(!requiresApprovalLive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    requiresApprovalLive ? '' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  style={requiresApprovalLive ? { backgroundColor: VIOLET } : undefined}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      requiresApprovalLive ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-600 dark:text-slate-400">Giọng đọc donate (TTS)</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={donateTtsEnabled}
                  onClick={() => onDonateTtsEnabledChange(!donateTtsEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    donateTtsEnabled ? '' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  style={donateTtsEnabled ? { backgroundColor: VIOLET } : undefined}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      donateTtsEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <button
              type="button"
              disabled={savingSettings}
              onClick={saveRoomSettings}
              className="w-full py-3.5 rounded-2xl text-white text-sm font-bold shadow-md disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: VIOLET }}
            >
              {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </div>
      </aside>
      <style>{`
        @keyframes ttvvReactionFloat {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          15% { opacity: 1; transform: translateY(-22px) scale(1); }
          100% { transform: translateY(-170px) scale(1.08); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
