import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { LiveKitRoom, useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Tv } from 'lucide-react';
import { useLiveStreamHost } from '../../../contexts/LiveStreamHostContext';
import { useAuth } from '../../../contexts/AuthContext';
import StreamerThamKhaoLayout from './StreamerThamKhaoLayout';
import LiveRegulationsModal from './LiveRegulationsModal';
import DepositModal from './DepositModal';
import type { GiftOverlayRef } from './GiftOverlay';
import type { DanmakuLayerRef } from './DanmakuLayer';

// Component to render the mini player when navigating away from dashboard
function MiniStreamerPlayer() {
  const navigate = useNavigate();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ], { onlySubscribed: false });
  
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const camTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const videoTrack = screenTrack || camTrack;

  return (
    <div
      onClick={() => navigate('/livestream/dashboard')}
      className="fixed bottom-6 right-6 w-72 aspect-video bg-black rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-[9999] overflow-hidden group cursor-pointer border-2 border-transparent hover:border-[#1877F2] transition-all"
    >
      {videoTrack?.publication?.track ? (
        <VideoTrack trackRef={videoTrack as any} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/50">
          <Tv className="w-8 h-8" />
        </div>
      )}
      
      {/* LIVE Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded-md shadow-md">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        <span className="text-white text-[10px] font-bold tracking-wider">LIVE</span>
      </div>
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
        <span className="text-white font-bold text-sm bg-[#1877F2] px-4 py-2 rounded-full shadow-lg">Trở lại phòng Live</span>
      </div>
    </div>
  );
}

function StreamerThamKhaoLayoutWrapper({ user }: { user: any }) {
  const {
    activeStream, hostChatMessages, requiresApprovalLive, setRequiresApprovalLive,
    savingSettings, saveRoomSettings, donateTtsEnabled, setDonateTtsEnabled, handleEndStream, ending,
    recentGiftEvent, newDanmakuMessage
  } = useLiveStreamHost();
  
  const [showRules, setShowRules] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  
  const giftOverlayRef = useRef<GiftOverlayRef>(null);
  const danmakuRef = useRef<DanmakuLayerRef>(null);
  
  useEffect(() => {
    if (recentGiftEvent && giftOverlayRef.current) {
      giftOverlayRef.current.showGift({
        senderName: recentGiftEvent.senderName,
        giftName: recentGiftEvent.giftName,
        giftEmoji: recentGiftEvent.giftEmoji,
        giftMessage: recentGiftEvent.giftMessage,
      });
    }
  }, [recentGiftEvent]);
  
  useEffect(() => {
    if (newDanmakuMessage && danmakuRef.current) {
      danmakuRef.current.addMessage(newDanmakuMessage.content, newDanmakuMessage.isSelf);
    }
  }, [newDanmakuMessage]);

  if (!activeStream) return null;

  return (
     <>
       <LiveRegulationsModal open={showRules} onClose={() => setShowRules(false)} />
       {showDeposit && user && (
         <DepositModal onClose={() => setShowDeposit(false)} onSuccess={() => setShowDeposit(false)} />
       )}
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
          onDonateTtsEnabledChange={setDonateTtsEnabled}
       />
     </>
  );
}

export default function GlobalStreamerOverlay() {
  const { activeStream, portalElement } = useLiveStreamHost();
  const { user } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname === '/livestream/dashboard';

  if (!activeStream || !activeStream.livekitUrl || !activeStream.livekitToken || !user) {
    return null;
  }

  const streamerContent = (
    <div className="w-full h-full relative fade-in">
       <StreamerThamKhaoLayoutWrapper user={user} />
    </div>
  );

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={activeStream.livekitToken}
      serverUrl={activeStream.livekitUrl}
      connect={true}
      className="global-streamer-room"
    >
      {isDashboard ? (
        portalElement ? createPortal(streamerContent, portalElement) : null
      ) : (
        <MiniStreamerPlayer />
      )}
    </LiveKitRoom>
  );
}
