import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import type { SocketEvent } from '../services/socket';
import { livestreamApi, type LiveStreamData } from '../apis/livestream';

const RULES_KEY = 'ttvv_live_regulations_accepted';

export type ViewerChatLine = {
  id: string | number;
  userId?: string;
  userName?: string;
  content: string;
  isSystem?: boolean;
  isGift?: boolean;
  giftEmoji?: string;
  ts?: number;
};

type LiveStreamViewerContextType = {
  streamId: string | null;
  stream: LiveStreamData | null;
  loading: boolean;
  viewerCount: number;
  isEnded: boolean;
  rulesGate: boolean;
  lkKey: number;
  canSubscribe: boolean;
  portalElement: HTMLElement | null;
  chatMessages: ViewerChatLine[];
  setStreamId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewerCount: React.Dispatch<React.SetStateAction<number>>;
  setIsEnded: React.Dispatch<React.SetStateAction<boolean>>;
  setCanSubscribe: React.Dispatch<React.SetStateAction<boolean>>;
  setStream: React.Dispatch<React.SetStateAction<LiveStreamData | null>>;
  setLkKey: React.Dispatch<React.SetStateAction<number>>;
  setPortalElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  setChatMessages: React.Dispatch<React.SetStateAction<ViewerChatLine[]>>;
  acceptRules: () => void;
  leaveCurrentStream: () => void;
};

const LiveStreamViewerContext = createContext<LiveStreamViewerContextType | null>(null);

export function LiveStreamViewerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribe } = useSocket();

  const [streamId, setStreamId] = useState<string | null>(null);
  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isEnded, setIsEnded] = useState(false);

  const [rulesGate, setRulesGate] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(RULES_KEY) === '1';
  });

  const [lkKey, setLkKey] = useState(0);
  const [canSubscribe, setCanSubscribe] = useState(true);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [chatMessages, setChatMessages] = useState<ViewerChatLine[]>([]);
  const recentGiftSigs = React.useRef<Map<string, number>>(new Map());

  const acceptRules = useCallback(() => {
    try {
      localStorage.setItem(RULES_KEY, '1');
    } catch { }
    setRulesGate(true);
  }, []);

  const leaveCurrentStream = useCallback(() => {
    if (streamId && user) {
      livestreamApi.leaveStream(streamId, user.id).catch(() => { });
    }
    setStreamId(null);
    setStream(null);
    setIsEnded(false);
    setViewerCount(0);
    setPortalElement(null);
    setChatMessages([]);
    setLkKey((k) => k + 1);
  }, [streamId, user]);

  const bootstrap = useCallback(async () => {
    if (!streamId || !user) return;
    setLoading(true);
    try {
      const data = await livestreamApi.getStreamById(streamId, user.id);
      setStream(data);
      setViewerCount(data.viewerCount ?? 0);
      if (data.status === 'ENDED') setIsEnded(true);

      if (data.status === 'LIVE') {
        const tokenData = await livestreamApi.getToken(data.roomName, user.id, user.fullName || user.username);
        setStream(tokenData);
        setCanSubscribe(tokenData.canSubscribe !== false);
        await livestreamApi.joinStream(streamId, user.id);
        // Re-fetch stream after joining to get the updated viewer count (including this user)
        try {
          const refreshed = await livestreamApi.getStreamById(streamId, user.id);
          setViewerCount(refreshed.viewerCount ?? data.viewerCount ?? 0);
        } catch {
          // keep the initial count if re-fetch fails
        }
      }
    } catch {
      setStreamId(null);
      setStream(null);
    } finally {
      setLoading(false);
    }
  }, [streamId, user]);

  useEffect(() => {
    if (!streamId || !user || !rulesGate) return;
    void bootstrap();
  }, [streamId, user, rulesGate, bootstrap]);

  // Socket subscriptions for the active stream
  useEffect(() => {
    if (!streamId || !stream || !user) return;

    const handleViewerCount = (ev: SocketEvent) => {
      const data = ev.data as { streamId?: string; viewerCount?: number } | undefined;
      if (data?.streamId === streamId && typeof data.viewerCount === 'number') {
        setViewerCount(data.viewerCount);
      }
    };

    const handleLiveEnded = (ev: SocketEvent) => {
      const data = ev.data as { streamId?: string } | undefined;
      if (data?.streamId === streamId) setIsEnded(true);
    };

    const handleGift = (ev: SocketEvent) => {
      const data = ev.data as {
        roomId?: string;
        receiverId?: string;
        senderName?: string;
        giftName?: string;
        giftEmoji?: string;
        giftMessage?: string;
      } | undefined;
      if (!data || data.roomId !== stream.roomName) return;
      if (data.receiverId && data.receiverId !== stream.streamerId) return;

      const sig = `${data.senderName ?? 'u'}-${data.giftName ?? 'gift'}-${stream.roomName}`;
      const now = Date.now();
      const prevAt = recentGiftSigs.current.get(sig);
      if (prevAt && now - prevAt < 2200) return;
      recentGiftSigs.current.set(sig, now);

      const gName = data.giftName ?? 'quà';
      const sName = data.senderName ?? 'Ai đó';
      const note = data.giftMessage?.trim();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `gift-${Date.now()}-${Math.random()}`,
          isSystem: true,
          isGift: true,
          giftEmoji: data.giftEmoji,
          content: note ? `${sName} đã tặng ${gName}: "${note}"` : `${sName} đã tặng ${gName}`,
          ts: Date.now(),
        },
      ]);
    };

    const handleChat = (ev: SocketEvent) => {
      const data = ev.data as {
        streamId?: string;
        userId?: string;
        userName?: string;
        content?: string;
      } | undefined;
      if (data?.streamId !== streamId || !data.content) return;
      
      const DANMU_PREFIX = '\u200B[D]';
      const raw = data.content;
      const isDanmaku = raw.startsWith(DANMU_PREFIX);
      const display = isDanmaku ? raw.slice(DANMU_PREFIX.length) : raw;
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          userId: data.userId,
          userName: data.userName,
          content: display,
          ts: Date.now(),
        },
      ]);
    };

    const handleApproved = async (ev: SocketEvent) => {
      const data = ev.data as { streamId?: string; roomName?: string } | undefined;
      if (data?.streamId !== streamId || !data.roomName) return;
      try {
        const tokenData = await livestreamApi.getToken(
          String(data.roomName),
          user.id,
          user.fullName || user.username
        );
        setStream((prev) => (prev ? { ...prev, ...tokenData } : tokenData));
        setCanSubscribe(tokenData.canSubscribe !== false);
        setLkKey((k) => k + 1);
      } catch {
        /* ignore */
      }
    };

    const handleKicked = (ev: SocketEvent) => {
      const data = ev.data as { streamId?: string } | undefined;
      if (data?.streamId === streamId) {
        navigate('/livestream', { replace: true });
      }
    };

    const unsubs = [
      subscribe('LIVE_VIEWER_COUNT', handleViewerCount),
      subscribe('LIVE_ENDED', handleLiveEnded),
      subscribe('LIVE_GIFT_RECEIVED', handleGift),
      subscribe('LIVE_CHAT', handleChat),
      subscribe('LIVE_VIEWER_APPROVED', handleApproved),
      subscribe('LIVE_KICKED', handleKicked),
    ];
    return () => unsubs.forEach((u) => u());
  }, [streamId, stream?.roomName, stream?.streamerId, user, subscribe, navigate]);

  return (
    <LiveStreamViewerContext.Provider
      value={{
        streamId,
        stream,
        loading,
        viewerCount,
        isEnded,
        rulesGate,
        lkKey,
        canSubscribe,
        portalElement,
        chatMessages,
        setStreamId,
        setViewerCount,
        setIsEnded,
        setCanSubscribe,
        setStream,
        setLkKey,
        setPortalElement,
        setChatMessages,
        acceptRules,
        leaveCurrentStream,
      }}
    >
      {children}
    </LiveStreamViewerContext.Provider>
  );
}

export function useLiveStreamViewer() {
  const context = useContext(LiveStreamViewerContext);
  if (!context) {
    throw new Error('useLiveStreamViewer must be used within a LiveStreamViewerProvider');
  }
  return context;
}
