import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { livestreamApi, type LiveStreamData } from '../../apis/livestream';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import LiveRegulationsModal from './components/LiveRegulationsModal';
import DepositModal from './components/DepositModal';
import ViewerThamKhaoExperience from './components/ViewerThamKhaoExperience';

const RULES_KEY = 'ttvv_live_regulations_accepted';

export default function LiveViewer() {
  const { id: streamId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [rulesGate, setRulesGate] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(RULES_KEY) === '1';
  });

  const [lkKey, setLkKey] = useState(0);
  const [canSubscribe, setCanSubscribe] = useState(true);

  const acceptRules = useCallback(() => {
    try {
      localStorage.setItem(RULES_KEY, '1');
    } catch {
      /* ignore */
    }
    setRulesGate(true);
  }, []);

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
      }
    } catch {
      navigate('/livestream');
    } finally {
      setLoading(false);
    }
  }, [streamId, user, navigate]);

  useEffect(() => {
    if (!streamId || !user || !rulesGate) return;
    void bootstrap();
    return () => {
      livestreamApi.leaveStream(streamId, user.id).catch(() => {});
    };
  }, [streamId, user, rulesGate, bootstrap]);

  if (!rulesGate) {
    return (
      <LiveRegulationsModal
        open
        onClose={() => navigate('/livestream')}
        onAccept={acceptRules}
        acceptLabel="Đồng ý và vào xem"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div
          className="w-10 h-10 border-[3px] rounded-full animate-spin border-blue-600 border-t-transparent"
          aria-label="Đang tải"
        />
      </div>
    );
  }

  if (!stream) {
    return <div className="text-center py-32 text-slate-600 dark:text-slate-300">Stream không tồn tại</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-2 sm:px-4">
      <LiveRegulationsModal open={showRules} onClose={() => setShowRules(false)} />
      {showDepositModal && user && (
        <DepositModal onClose={() => setShowDepositModal(false)} onSuccess={() => setShowDepositModal(false)} />
      )}

      {stream.livekitToken && stream.livekitUrl && user ? (
        <LiveKitRoom
          key={`${stream.id}-${lkKey}`}
          video={true}
          audio={true}
          token={stream.livekitToken}
          serverUrl={stream.livekitUrl}
          connect={!isEnded}
          className="min-h-[min(92vh,900px)]"
        >
          <ViewerThamKhaoExperience
            stream={stream}
            streamId={streamId!}
            user={user}
            viewerCount={viewerCount}
            setViewerCount={setViewerCount}
            isEnded={isEnded}
            setIsEnded={setIsEnded}
            canSubscribe={canSubscribe}
            setCanSubscribe={setCanSubscribe}
            setStream={setStream}
            setLkKey={setLkKey}
            navigate={navigate}
            onOpenDeposit={() => setShowDepositModal(true)}
            onOpenRules={() => setShowRules(true)}
          />
        </LiveKitRoom>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-2">
          <p>Không có token phòng live.</p>
          <button
            type="button"
            className="text-blue-600 font-semibold underline"
            onClick={() => navigate('/livestream')}
          >
            Quay lại danh sách
          </button>
        </div>
      )}
    </div>
  );
}
