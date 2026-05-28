/**
 * UI + hành vi viewer live giống ThamKhao LiveWrapper.web (InnerRoomUI phía viewer):
 * video + overlay, bình luận dưới, sidebar phải, reaction LiveKit data, danmaku prefix, quà, Top Donate.
 * SePay / nạp QR — dùng DepositModal hiện có (bỏ sau theo yêu cầu).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  RoomAudioRenderer,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import {
  ArrowLeft,
  Clock,
  Gift,
  Heart,
  HelpCircle,
  Menu,
  MessageCircle,
  Plus,
  ThumbsUp,
  Trophy,
  Tv,
  Type,
  X,
} from 'lucide-react';
import { useSocket } from '../../../contexts/SocketContext';
import type { SocketEvent } from '../../../services/socket';
import type { User } from '../../../contexts/AuthContext';
import { livestreamApi, type LiveStreamData } from '../../../apis/livestream';
import { billingApi } from '../../../apis/billing';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import DanmakuLayer from './DanmakuLayer';
import type { DanmakuLayerRef } from './DanmakuLayer';
import GiftPicker from './GiftPicker';
import TopDonors from './TopDonors';
import MemberPanelHost from './MemberPanelHost';

import { useLiveStreamViewer } from '../../../contexts/LiveStreamViewerContext';
import VipBadge from './VipBadge';
import LiveTimeExpiredModal from './LiveTimeExpiredModal';

const VIOLET = '#1877F2';
const DANMU_PREFIX = '\u200B[D]';

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

type Props = {
  stream: LiveStreamData;
  streamId: string;
  user: User;
  viewerCount: number;
  setViewerCount: Dispatch<SetStateAction<number>>;
  isEnded: boolean;
  setIsEnded: Dispatch<SetStateAction<boolean>>;
  canSubscribe: boolean;
  setCanSubscribe: Dispatch<SetStateAction<boolean>>;
  setStream: Dispatch<SetStateAction<LiveStreamData | null>>;
  setLkKey: Dispatch<SetStateAction<number>>;
  navigate: NavigateFunction;
  onLeaveRoom?: () => void;
  onOpenDeposit: () => void;
  onOpenRules: () => void;
};

export default function ViewerThamKhaoExperience({
  stream,
  streamId,
  user,
  viewerCount,
  setViewerCount: _setViewerCount,
  isEnded,
  setIsEnded: _setIsEnded,
  canSubscribe,
  setCanSubscribe: _setCanSubscribe,
  setStream: _setStream,
  setLkKey: _setLkKey,
  navigate,
  onLeaveRoom,
  onOpenDeposit,
  onOpenRules,
}: Props) {
  const { chatMessages, setChatMessages, timeExpired, timeExpiredVipLevel, timeExpiredMaxMinutes, clearTimeExpired } = useLiveStreamViewer();
  const { subscribe } = useSocket();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const conn = useConnectionState(room);

  const [tick, setTick] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [danmakuEnabled, setDanmakuEnabled] = useState(true);
  const [sendAsDanmaku, setSendAsDanmaku] = useState(true);
  const [hideTopDonors, setHideTopDonors] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lastReconnectAt, setLastReconnectAt] = useState<number | null>(null);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; type: 'heart' | 'like'; left: number }>>(
    []
  );

  const danmakuRef = useRef<DanmakuLayerRef>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const mountTimeRef = useRef(Date.now());

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

  useEffect(() => {
    chatScrollRef.current && (chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight);
  }, [chatMessages.length]);

  useEffect(() => {
    if (conn === ConnectionState.Reconnecting || conn === ConnectionState.SignalReconnecting) {
      setLastReconnectAt(Date.now());
    }
  }, [conn]);

  useEffect(() => {
    if (!canSubscribe) return;
    setChatMessages((prev) => {
      if (prev.some((m) => m.isSystem && m.content === 'Bạn đã vào phòng')) return prev;
      return [...prev, { id: `join-${Date.now()}`, isSystem: true, content: 'Bạn đã vào phòng', ts: Date.now() }];
    });
  }, [canSubscribe, streamId]);

  const spawnReaction = useCallback((type: 'heart' | 'like') => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const left = 12 + Math.random() * 76;
    setFloatingReactions((prev) => [...prev, { id, type, left }]);
    window.setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  }, []);

  const sendReaction = useCallback(
    async (type: 'heart' | 'like') => {
      try {
        if (!localParticipant) return;
        const payload = new TextEncoder().encode(
          JSON.stringify({
            type: 'reaction',
            reaction: type,
            from: user.id,
            ts: Date.now(),
          })
        );
        await localParticipant.publishData(payload, { reliable: false, topic: 'reaction' });
        spawnReaction(type);
      } catch {
        /* ignore */
      }
    },
    [localParticipant, user.id, spawnReaction]
  );

  useEffect(() => {
    if (!room || !canSubscribe) return;
    const onData = (
      payload: Uint8Array,
      participant?: { identity: string },
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic !== 'reaction') return;
      if (participant?.identity === localParticipant.identity) return;
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as {
          type?: string;
          reaction?: string;
        };
        if (parsed?.type === 'reaction' && (parsed.reaction === 'heart' || parsed.reaction === 'like')) {
          spawnReaction(parsed.reaction);
        }
      } catch {
        /* ignore */
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, canSubscribe, localParticipant.identity, spawnReaction]);

  useEffect(() => {
    if (!room || !canSubscribe) return;
    const onJoin = (p: { name?: string; identity: string }) => {
      if (p.identity === localParticipant.identity) return;
      const text = `${p.name || p.identity} đã vào phòng`;
      setChatMessages((prev) => [...prev, { id: `sys-${Date.now()}`, isSystem: true, content: text, ts: Date.now() }]);
    };
    const onLeave = (p: { name?: string; identity: string }) => {
      if (p.identity === localParticipant.identity) return;
      const text = `${p.name || p.identity} đã rời phòng`;
      setChatMessages((prev) => [...prev, { id: `sys-${Date.now()}`, isSystem: true, content: text, ts: Date.now() }]);
    };
    room.on(RoomEvent.ParticipantConnected, onJoin);
    room.on(RoomEvent.ParticipantDisconnected, onLeave);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onJoin);
      room.off(RoomEvent.ParticipantDisconnected, onLeave);
    };
  }, [room, canSubscribe, localParticipant.identity]);

  useEffect(() => {
    const handleChat = (ev: SocketEvent) => {
      const data = ev.data as {
        streamId?: string;
        userId?: string;
        userName?: string;
        content?: string;
        createdAt?: string;
        timestamp?: string;
      } | undefined;
      if (data?.streamId !== streamId || !data.content) return;
      const raw = data.content;
      const isDanmaku = raw.startsWith(DANMU_PREFIX);
      const display = isDanmaku ? raw.slice(DANMU_PREFIX.length) : raw;
      const isSelf = data.userId === user.id;

      // Only show danmaku animation for real-time messages (sent after we mounted)
      const msgTimeStr = (ev as any).timestamp || data?.createdAt || data?.timestamp;
      const msgTime = msgTimeStr ? new Date(msgTimeStr).getTime() : Date.now();
      const isHistorical = msgTime < mountTimeRef.current - 2000;

      if (isDanmaku && danmakuEnabled && danmakuRef.current && canSubscribe && !isHistorical) {
        danmakuRef.current.addMessage(display, isSelf);
      }
    };

    const unsubs = [
      subscribe('LIVE_CHAT', handleChat),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe, streamId, danmakuEnabled, canSubscribe, user.id]);

  const sendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const payload = sendAsDanmaku ? `${DANMU_PREFIX}${trimmed}` : trimmed;
    setChatInput('');
    try {
      await livestreamApi.sendChat(streamId, {
        userId: user.id,
        userName: user.fullName || user.username || 'User',
        content: payload,
      });
    } catch {
      setChatInput(trimmed);
    }
  };

  const leaveRoom = () => {
    // Navigate FIRST to unmount LiveViewer — this prevents its useEffect
    // from re-setting streamId after leaveCurrentStream clears it
    navigate('/livestream');
    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

  const isConnecting =
    conn === ConnectionState.Connecting || conn === ConnectionState.Reconnecting || conn === ConnectionState.SignalReconnecting;

  return (
    <>
      <style>{`
        @keyframes ttvv-reaction-float {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          15% { opacity: 1; transform: translateY(-22px) scale(1); }
          100% { transform: translateY(-170px) scale(1.08); opacity: 0; }
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto space-y-3 pb-8">
        <div className="flex flex-wrap items-center gap-3 px-1">
          <button
            type="button"
            onClick={() => navigate('/livestream')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <img
            src={resolveMediaUrl(stream.streamerAvatar) || 'https://via.placeholder.com/40'}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white truncate">{stream.streamerName}</span>
              <VipBadge vipLevel={stream.vipLevel} size="sm" />
            </div>
            <p className="text-xs text-slate-500 truncate">{stream.title}</p>
          </div>
          {!isEnded && (
            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2 py-1 rounded-lg">
              live
            </span>
          )}
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">{viewerCount} xem</span>
          <button
            type="button"
            onClick={() => setShowDebugOverlay((v) => !v)}
            className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
            title="Debug live state"
          >
            debug
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 items-stretch border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0f1117] shadow-md min-h-[min(92vh,880px)]">
          {/* Cột trái */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="relative flex-1 min-h-[220px] lg:min-h-[360px] bg-[#f8fafc] dark:bg-black flex items-center justify-center">
              {isConnecting && !isEnded ? (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <div
                    className="w-10 h-10 border-[3px] rounded-full animate-spin"
                    style={{ borderColor: `${VIOLET} transparent transparent transparent` }}
                  />
                  <span className="text-sm">Đang kết nối phòng live...</span>
                </div>
              ) : (
                <ViewerVideoStage isEnded={isEnded} canSubscribe={canSubscribe} />
              )}

              <div className="absolute inset-0 pointer-events-none overflow-hidden z-[15]">
                {floatingReactions.map((item) => (
                  <div
                    key={item.id}
                    className="absolute bottom-6 flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
                    style={{
                      left: `${item.left}%`,
                      animation: 'ttvv-reaction-float 1.8s ease-out forwards',
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

              {canSubscribe && <DanmakuLayer ref={danmakuRef} visible={danmakuEnabled} />}

              {canSubscribe && !hideTopDonors && (
                <TopDonors streamerId={stream.streamerId} variant="lightCard" className="!top-3 !right-3" />
              )}

              {!isEnded && canSubscribe && (
                <div className="absolute top-3 left-3 z-40 flex flex-col gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 rounded-xl bg-black/55 backdrop-blur-md px-3 py-1.5 border border-white/10 pointer-events-auto">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <span className="text-white text-xs font-bold">live</span>
                    <span className="text-white/90 text-xs font-medium border-l border-white/20 pl-2 ml-0.5">
                      {viewerCount} người xem
                    </span>
                    <VipBadge vipLevel={stream.vipLevel} size="sm" className="ml-1" />
                  </div>
                  <div className="flex gap-2 pointer-events-auto">
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
              )}

              {!isEnded && canSubscribe && (
                <button
                  type="button"
                  onClick={onOpenRules}
                  className="absolute bottom-3 right-3 z-40 flex items-center gap-2 rounded-full pl-3 pr-4 py-2 text-white text-xs font-bold shadow-lg border border-white/20 pointer-events-auto"
                  style={{ backgroundColor: VIOLET }}
                >
                  <HelpCircle className="w-4 h-4" />
                  Hướng dẫn chi tiết
                </button>
              )}
              {lastReconnectAt && !isConnecting && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600/90 shadow backdrop-blur">
                  Đã kết nối lại
                </div>
              )}
            </div>

            {/* Bình luận — giống ThamKhao */}
            <div className="h-[220px] shrink-0 bg-white dark:bg-[#1a1d28] border-t border-slate-200 dark:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  Bình luận
                </span>
                <span className="text-[11px] text-slate-500">{chatMessages.length} tin nhắn</span>
              </div>
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-2.5 py-1.5 text-sm">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm mt-6">Chưa có bình luận nào</p>
                ) : (
                  chatMessages.map((message) => {
                    if (message.isSystem) {
                      if (message.isGift) {
                        return (
                          <div
                            key={message.id}
                            className="mb-1 px-2.5 py-2 rounded-lg bg-pink-50 dark:bg-pink-950/30 border-l-[3px] border-pink-600 flex items-center gap-2"
                          >
                            <span className="text-lg">{message.giftEmoji ?? '🎁'}</span>
                            <span className="text-pink-800 dark:text-pink-200 text-[13px] font-semibold leading-snug">
                              {message.content}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={message.id}
                          className="mb-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border-l-[3px] border-slate-300 dark:border-slate-600"
                        >
                          <span className="text-slate-500 dark:text-slate-400 text-xs">{message.content}</span>
                        </div>
                      );
                    }
                    const isHostMessage = message.userId === stream.streamerId;
                    return (
                      <div
                        key={message.id}
                        className={`mb-1 px-2.5 py-1.5 rounded-lg border-l-[3px] ${isHostMessage
                            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600'
                          }`}
                      >
                        <div className="flex justify-between items-center gap-2 mb-0.5">
                          <span
                            className={`text-xs font-bold inline-flex items-center gap-1 ${isHostMessage ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                              }`}
                          >
                            {message.userName || 'Khách'}
                            {isHostMessage && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block shrink-0" />
                            )}
                          </span>
                          {message.ts != null && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-slate-900 dark:text-slate-100 leading-snug">{message.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
              {!isEnded && (
                <div className="flex gap-2 px-2.5 py-2 border-t border-slate-200 dark:border-slate-700 items-center">
                  <button
                    type="button"
                    title="Gửi dưới dạng chữ chạy"
                    onClick={() => setSendAsDanmaku(!sendAsDanmaku)}
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${sendAsDanmaku
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700'
                        : 'border-slate-200 dark:border-slate-600 text-slate-400'
                      }`}
                  >
                    <Type className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 h-9 text-xs font-bold text-amber-900 dark:text-amber-100">
                    {walletBalance != null ? walletBalance : '—'}
                    <button
                      type="button"
                      className="ml-0.5 w-6 h-6 rounded-md bg-amber-400 text-white flex items-center justify-center hover:bg-amber-500"
                      title="Nạp xu"
                      onClick={onOpenDeposit}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      title="Tặng quà"
                      onClick={() => setShowGiftPicker(!showGiftPicker)}
                      className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-pink-600"
                    >
                      <Gift className="w-[18px] h-[18px]" />
                    </button>
                    {showGiftPicker && canSubscribe && (
                      <GiftPicker
                        streamerId={stream.streamerId}
                        streamerName={stream.streamerName}
                        roomId={stream.roomName}
                        docked
                        onClose={() => setShowGiftPicker(false)}
                        onGiftSent={() => {
                          billingApi
                            .getWallet(user.id)
                            .then((w) => setWalletBalance(w.balance))
                            .catch(() => { });
                        }}
                        onNeedDeposit={() => {
                          setShowGiftPicker(false);
                          onOpenDeposit();
                        }}
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendChat();
                      }
                    }}
                    placeholder={sendAsDanmaku ? 'Nhập tin nhắn chạy màn hình...' : 'Viết bình luận...'}
                    className="flex-1 h-9 min-w-0 rounded-[10px] border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 px-3 text-[13px] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => void sendChat()}
                    disabled={!chatInput.trim()}
                    className="shrink-0 h-9 px-4 rounded-[10px] text-white text-[13px] font-bold disabled:opacity-50"
                    style={{ backgroundColor: VIOLET }}
                  >
                    Gửi
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar phải */}
          <aside className="w-full lg:w-[320px] shrink-0 bg-white dark:bg-[#1a1d28] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 flex flex-col max-h-[520px] lg:max-h-none">
            <div
              className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-700"
              style={{
                background: 'linear-gradient(180deg, rgba(123,63,228,0.10), rgba(123,63,228,0))',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-bold text-slate-900 dark:text-white">Live Stream</div>
                  <div className="text-xs text-slate-500 mt-0.5">Đang xem live</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPanel(!showPanel)}
                  className="shrink-0 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300"
                  aria-label="Menu"
                >
                  {showPanel ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void sendReaction('heart')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-900 text-xs font-bold"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  Thả tim
                </button>
                <button
                  type="button"
                  onClick={() => void sendReaction('like')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 border border-blue-200 dark:border-blue-900 text-xs font-bold"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Like
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDanmakuEnabled(!danmakuEnabled)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold border transition-colors ${danmakuEnabled
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                  }`}
              >
                <Type className="w-4 h-4" />
                {danmakuEnabled ? 'Đang bật chữ chạy' : 'Đang tắt chữ chạy'}
              </button>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setHideTopDonors(!hideTopDonors)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold text-white min-h-[68px] ${hideTopDonors ? 'bg-orange-700' : 'bg-orange-500'
                    }`}
                >
                  <Trophy className="w-5 h-5" />
                  {hideTopDonors ? 'Hiện Top Donate' : 'Ẩn Top Donate'}
                </button>
              </div>
              <button
                type="button"
                onClick={leaveRoom}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-sm font-semibold"
              >
                Rời phòng
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {showPanel ? (
                <MemberPanelHost
                  streamId={streamId}
                  roomName={stream.roomName}
                  hostUserId={stream.streamerId}
                  embedded
                  viewerMode
                />
              ) : (
                <div className="p-4 text-slate-500 text-sm leading-relaxed">
                  Đang xem live stream. Nhấn menu để xem chi tiết và chia sẻ phòng.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      {showDebugOverlay && (
        <div className="fixed left-4 bottom-4 z-[180] rounded-xl bg-black/80 text-emerald-300 text-xs px-3 py-2 border border-emerald-600/40 shadow-xl">
          <div>conn: {String(conn)}</div>
          <div>canSubscribe: {String(canSubscribe)}</div>
          <div>viewerCount: {viewerCount}</div>
          <div>room: {stream.roomName}</div>
        </div>
      )}

      {/* Time Expired Modal */}
      <LiveTimeExpiredModal
        open={timeExpired}
        vipLevel={timeExpiredVipLevel}
        maxMinutes={timeExpiredMaxMinutes}
        onClose={clearTimeExpired}
      />
    </>
  );
}

function ViewerVideoStage({ isEnded, canSubscribe }: { isEnded: boolean; canSubscribe: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  const remoteTracks = useMemo(
    () => tracks.filter((t) => t.participant.identity !== localParticipant.identity),
    [tracks, localParticipant.identity]
  );

  const screenTrack = remoteTracks.find((t) => t.source === Track.Source.ScreenShare);
  const camTrack = remoteTracks.find((t) => t.source === Track.Source.Camera);

  if (isEnded) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900 text-white">
        <Tv className="w-14 h-14 text-slate-500 mb-3 opacity-50" />
        <h2 className="text-xl font-bold">Phiên Live đã kết thúc</h2>
        <p className="text-slate-400 mt-2 text-sm">Cảm ơn bạn đã theo dõi!</p>
      </div>
    );
  }

  if (!canSubscribe) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black text-white px-6 text-center">
        <Clock className="w-14 h-14 text-amber-400 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">Đang chờ chủ phòng duyệt</h2>
        <p className="text-slate-400 mt-2 text-sm max-w-sm">
          Bạn đã vào phòng nhưng chưa được duyệt xem video. Khi được duyệt, video sẽ tự hiển thị.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      {screenTrack?.publication?.track ? (
        <>
          <VideoTrack trackRef={screenTrack as any} className="w-full h-full object-contain" />
          {camTrack?.publication?.track && (
            <div className="absolute bottom-4 right-4 z-20 w-[200px] h-[150px] rounded-xl overflow-hidden border-2 border-blue-700 shadow-xl">
              <VideoTrack trackRef={camTrack as any} className="w-full h-full object-cover" />
            </div>
          )}
        </>
      ) : camTrack?.publication?.track ? (
        <VideoTrack trackRef={camTrack as any} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-400 px-6 text-center">
          <Clock className="w-10 h-10 text-blue-400 opacity-80" />
          <p className="text-sm font-medium text-slate-300">Đang chờ host phát video...</p>
          <p className="text-xs text-slate-500">Hãy giữ kết nối, live stream sẽ sớm bắt đầu</p>
        </div>
      )}
      <RoomAudioRenderer />
    </div>
  );
}
