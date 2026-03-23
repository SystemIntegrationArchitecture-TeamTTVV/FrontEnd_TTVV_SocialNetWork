import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CallWindowProps {
  isIncoming?: boolean;
  callerName: string;
  callType: 'voice' | 'video';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAccept?: () => void;
  onReject: () => void;
  onEnd: () => void;
}

export default function CallWindow({
  isIncoming,
  callerName,
  callType,
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onEnd,
}: CallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null); // Add audio ref for voice calls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  // Used only to reflect remote peer track state (e.g., when peer disables mic/camera).
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);

  // Setup local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(err => {
          console.error('❌ Failed to play local video:', err);
        });
      }
    }
  }, [localStream]);

  // Setup remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      console.log('🎬 Setting remote stream to video element:', remoteStream);
      console.log('📺 Remote stream tracks:', {
        audio: remoteStream.getAudioTracks().map(t => ({ id: t.id, enabled: t.enabled, muted: t.muted, readyState: t.readyState })),
        video: remoteStream.getVideoTracks().map(t => ({ id: t.id, enabled: t.enabled, muted: t.muted, readyState: t.readyState }))
      });
      
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Force play the video
        remoteVideoRef.current.play().catch(err => {
          console.error('❌ Failed to play remote video:', err);
        });
      }
    } else if (callType === 'video') {
      console.log('⚠️ Cannot set remote video stream:', {
        hasRef: !!remoteVideoRef.current,
        hasStream: !!remoteStream
      });
    }
  }, [remoteStream, isIncoming, callType]);

  // Setup remote audio for voice calls
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream && callType === 'voice') {
      console.log('🎧 Setting remote stream to audio element:', remoteStream);
      console.log('📺 Remote audio tracks:', {
        audio: remoteStream.getAudioTracks().map(t => ({ id: t.id, enabled: t.enabled, muted: t.muted, readyState: t.readyState }))
      });
      
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        
        // Force play the audio
        remoteAudioRef.current.play().catch(err => {
          console.error('❌ Failed to play remote audio:', err);
        });
      }
    }
  }, [remoteStream, isIncoming, callType]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Keep remote playback in sync with remote track state.
  // WebRTC track.enabled flips on the sender; on some browsers the "audio still plays"
  // until the media element is muted/updated, so we mirror it on the receiver element.
  useEffect(() => {
    if (!remoteStream) return;

    const syncRemotePlayback = () => {
      const audioTracks = remoteStream.getAudioTracks();
      const videoTracks = remoteStream.getVideoTracks();

      const remoteAudioMuted = audioTracks.length > 0 && audioTracks.some(t => !t.enabled);
      const remoteVideoDisabled = videoTracks.length > 0 && videoTracks.some(t => !t.enabled);

      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = remoteAudioMuted;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = remoteAudioMuted;
        // Some browsers require re-assigning srcObject / calling play
        // after tracks are added to the same MediaStream reference.
        if (remoteVideoRef.current.srcObject !== remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }

        if (!remoteVideoDisabled) {
          remoteVideoRef.current.play().catch(() => {
            // Ignore autoplay/play errors; UI will update when browser allows playback.
          });
        }
      }
      setRemoteVideoOff(remoteVideoDisabled);
    };

    syncRemotePlayback();
    const interval = window.setInterval(syncRemotePlayback, 300);
    return () => window.clearInterval(interval);
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col overflow-hidden">
      {/* Header - Only show for active calls, not incoming */}
      {!isIncoming && (
        <div className="p-4 text-white text-center bg-black/30 backdrop-blur-sm">
          <h2 className="text-xl font-semibold">{callerName}</h2>
          <p className="text-gray-400 text-sm mt-1">
            {callType === 'video' ? 'Video call' : 'Thoại call'}
          </p>
        </div>
      )}

      {/* Video Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Incoming Call Screen */}
        {isIncoming && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Caller Avatar with Animation */}
            <div className="relative mb-8">
              {/* Ripple Animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-blue-500 opacity-20 animate-ping"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-blue-500 opacity-30 animate-pulse"></div>
              </div>
              {/* Avatar */}
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
                {callerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Call Type Icon */}
            <div className="mb-4">
              {callType === 'video' ? (
                <Video className="w-12 h-12 text-blue-400" />
              ) : (
                <Phone className="w-12 h-12 text-green-400" />
              )}
            </div>

            {/* Caller Name */}
            <h3 className="text-white text-3xl font-bold mb-2">{callerName}</h3>
            <p className="text-gray-400 text-lg mb-8">
              đang gọi {callType === 'video' ? 'video' : 'thoại'} cho bạn...
            </p>
          </div>
        )}

        {/* Active Call - Remote Video (Full Screen) */}
        {!isIncoming && callType === 'video' && (
          <>
            {remoteStream ? (
              <div className="w-full h-full relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {remoteVideoOff && (
                  <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {callerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-gray-400">Đang kết nối...</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Active Call - Voice Call Placeholder */}
        {!isIncoming && callType === 'voice' && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                {callerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <p className="text-white text-xl">{remoteStream ? 'Đang gọi...' : 'Đang kết nối...'}</p>
            </div>
            {/* Hidden audio element for voice calls */}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
          </div>
        )}

        {/* Local Video (Picture-in-Picture) - Only for active video calls */}
        {!isIncoming && callType === 'video' && (
          <div className="absolute top-4 right-4 w-40 h-30 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}
      </div>

      {/* Controls - Fixed at bottom with backdrop */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-8 pb-6 px-6 z-10">
        {/* Incoming Call Controls */}
        {isIncoming && onAccept && (
          <div className="flex justify-center items-center gap-8">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onReject}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-2xl"
                aria-label="Từ chối"
              >
                <PhoneOff className="w-10 h-10" />
              </button>
              <span className="text-white text-sm font-medium">Từ chối</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onAccept}
                className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-2xl animate-pulse"
                aria-label="Chấp nhận"
              >
                {callType === 'video' ? <Video className="w-10 h-10" /> : <Phone className="w-10 h-10" />}
              </button>
              <span className="text-white text-sm font-medium">Chấp nhận</span>
            </div>
          </div>
        )}

        {/* Active Call Controls */}
        {!isIncoming && (
          <div className="flex justify-center items-center gap-6 max-w-2xl mx-auto">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'} flex items-center justify-center text-white transition-all shadow-lg`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'} flex items-center justify-center text-white transition-all shadow-lg`}
                aria-label={isVideoOff ? 'Turn on video' : 'Turn off video'}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={onEnd}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg transform hover:scale-105"
              aria-label="End call"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
