import { useState } from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { LiveKitRoom, useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Tv, X } from 'lucide-react';
import { useLiveStreamViewer } from '../../../contexts/LiveStreamViewerContext';
import { useAuth } from '../../../contexts/AuthContext';
import ViewerThamKhaoExperience from './ViewerThamKhaoExperience';
import LiveRegulationsModal from './LiveRegulationsModal';
import DepositModal from './DepositModal';

function MiniViewerPlayer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { streamId } = useLiveStreamViewer();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ], { onlySubscribed: false });
  
  // Prefer screen share if available, else camera
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const camTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const videoTrack = screenTrack || camTrack;

  return (
    <div className="fixed bottom-6 right-6 w-80 aspect-video bg-black rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] z-[9998] overflow-hidden group border border-slate-800">
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          if (streamId) navigate(`/livestream/${streamId}`);
        }}
      >
        {videoTrack?.publication?.track ? (
          <VideoTrack trackRef={videoTrack as any} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/50">
            <div className="flex flex-col items-center gap-2">
              <Tv className="w-8 h-8" />
              <span className="text-xs">Đang tải video...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* LIVE Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded-md shadow-md pointer-events-none">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        <span className="text-white text-[10px] font-bold tracking-wider">LIVE</span>
      </div>

      {/* Close button */}
      <button 
        className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Đóng stream"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Hover Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-white font-bold text-sm bg-black/60 backdrop-blur px-4 py-1.5 rounded-full shadow-lg">Mở rộng</span>
      </div>
    </div>
  );
}

function ViewerThamKhaoExperienceWrapper() {
  const {
    stream, streamId, viewerCount, setViewerCount, isEnded, setIsEnded,
    canSubscribe, setCanSubscribe, setStream, setLkKey, leaveCurrentStream
  } = useLiveStreamViewer();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showRules, setShowRules] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  if (!stream || !streamId || !user) return null;

  return (
    <>
      <LiveRegulationsModal open={showRules} onClose={() => setShowRules(false)} />
      {showDepositModal && user && (
        <DepositModal onClose={() => setShowDepositModal(false)} onSuccess={() => setShowDepositModal(false)} />
      )}
      <ViewerThamKhaoExperience
        stream={stream}
        streamId={streamId}
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
        onLeaveRoom={leaveCurrentStream}
        onOpenDeposit={() => setShowDepositModal(true)}
        onOpenRules={() => setShowRules(true)}
      />
    </>
  );
}

export default function GlobalViewerOverlay() {
  const { stream, streamId, isEnded, rulesGate, leaveCurrentStream, portalElement } = useLiveStreamViewer();
  const { user } = useAuth();
  const location = useLocation();

  // Check if we are currently on the LiveViewer page for THIS stream
  const match = matchPath({ path: "/livestream/:id" }, location.pathname);
  const isViewingCurrentStream = match && match.params.id === streamId;

  if (!stream || !stream.livekitUrl || !stream.livekitToken || !user || !rulesGate) {
    return null;
  }

  const viewerContent = (
    <div className="w-full h-full relative fade-in">
       <ViewerThamKhaoExperienceWrapper />
    </div>
  );

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={stream.livekitToken}
      serverUrl={stream.livekitUrl}
      connect={!isEnded}
      className="global-viewer-room"
    >
      {isViewingCurrentStream ? (
        portalElement ? createPortal(viewerContent, portalElement) : null
      ) : (
        <MiniViewerPlayer onClose={leaveCurrentStream} />
      )}
    </LiveKitRoom>
  );
}
