import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { livestreamApi, type LiveStreamData } from '../apis/livestream';
import type { SocketEvent } from '../services/socket';
import { speakLiveDonateAnnouncement } from '../utils/livestreamTts';

export type HostChatLine = {
  id: number;
  userId?: string;
  userName?: string;
  content?: string;
  system?: boolean;
};

type LiveStreamHostContextType = {
  activeStream: LiveStreamData | null;
  loading: boolean;
  creating: boolean;
  ending: boolean;
  savingSettings: boolean;
  hostChatMessages: HostChatLine[];
  requiresApprovalLive: boolean;
  donateTtsEnabled: boolean;
  setDonateTtsEnabled: (v: boolean) => void;
  setRequiresApprovalLive: (v: boolean) => void;
  recentGiftEvent: {
    senderName: string;
    giftName: string;
    giftEmoji: string;
    giftMessage?: string;
    timestamp: number;
  } | null;
  newDanmakuMessage: {
    content: string;
    isSelf: boolean;
    timestamp: number;
  } | null;
  handleCreateStream: (params: { title: string; description: string; requiresApprovalCreate: boolean; thumbnailFile: File | null }) => Promise<void>;
  handleEndStream: () => Promise<void>;
  saveRoomSettings: () => Promise<void>;
};

const LiveStreamHostContext = createContext<LiveStreamHostContextType | null>(null);

const DANMU_PREFIX = '\u200B[D]';

export function LiveStreamHostProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [requiresApprovalLive, setRequiresApprovalLive] = useState(false);
  const [hostChatMessages, setHostChatMessages] = useState<HostChatLine[]>([]);
  const [recentGiftEvent, setRecentGiftEvent] = useState<LiveStreamHostContextType['recentGiftEvent']>(null);
  const [newDanmakuMessage, setNewDanmakuMessage] = useState<LiveStreamHostContextType['newDanmakuMessage']>(null);

  const [donateTtsEnabled, setDonateTtsEnabledState] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('ttvv_host_tts_donate') !== '0';
  });

  const setDonateTtsEnabled = useCallback((v: boolean) => {
    setDonateTtsEnabledState(v);
    try {
      localStorage.setItem('ttvv_host_tts_donate', v ? '1' : '0');
    } catch {}
  }, []);

  const recentGiftSigsRef = useRef<Map<string, number>>(new Map());

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

      setRecentGiftEvent({
        senderName: data.senderName ?? '',
        giftName: data.giftName ?? '',
        giftEmoji: data.giftEmoji ?? '🎁',
        giftMessage: data.giftMessage,
        timestamp: Date.now(),
      });

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
      
      if (isDanmaku) {
        setNewDanmakuMessage({ content: display, isSelf: data.userId === user?.id, timestamp: Date.now() });
      }
    };

    const unsubs = [
      subscribe('LIVE_VIEWER_COUNT', handleViewerCount),
      subscribe('LIVE_GIFT_RECEIVED', handleGift),
      subscribe('LIVE_CHAT', handleChat),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe, activeStream, user?.id, donateTtsEnabled]);

  const handleCreateStream = async ({ title, description, requiresApprovalCreate, thumbnailFile }: { title: string; description: string; requiresApprovalCreate: boolean; thumbnailFile: File | null }) => {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo phiên live';
      alert(msg);
      throw err;
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

  return (
    <LiveStreamHostContext.Provider
      value={{
        activeStream,
        loading,
        creating,
        ending,
        savingSettings,
        hostChatMessages,
        requiresApprovalLive,
        donateTtsEnabled,
        setDonateTtsEnabled,
        setRequiresApprovalLive,
        recentGiftEvent,
        newDanmakuMessage,
        handleCreateStream,
        handleEndStream,
        saveRoomSettings,
      }}
    >
      {children}
    </LiveStreamHostContext.Provider>
  );
}

export function useLiveStreamHost() {
  const context = useContext(LiveStreamHostContext);
  if (!context) {
    throw new Error('useLiveStreamHost must be used within a LiveStreamHostProvider');
  }
  return context;
}
