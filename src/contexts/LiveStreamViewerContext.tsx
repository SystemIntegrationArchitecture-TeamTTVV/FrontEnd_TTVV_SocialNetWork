import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

import { useAuth } from './AuthContext';
import { livestreamApi, type LiveStreamData } from '../apis/livestream';

const RULES_KEY = 'ttvv_live_regulations_accepted';

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
  setStreamId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewerCount: React.Dispatch<React.SetStateAction<number>>;
  setIsEnded: React.Dispatch<React.SetStateAction<boolean>>;
  setCanSubscribe: React.Dispatch<React.SetStateAction<boolean>>;
  setStream: React.Dispatch<React.SetStateAction<LiveStreamData | null>>;
  setLkKey: React.Dispatch<React.SetStateAction<number>>;
  setPortalElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  acceptRules: () => void;
  leaveCurrentStream: () => void;
};

const LiveStreamViewerContext = createContext<LiveStreamViewerContextType | null>(null);

export function LiveStreamViewerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

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
        setStreamId,
        setViewerCount,
        setIsEnded,
        setCanSubscribe,
        setStream,
        setLkKey,
        setPortalElement,
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
