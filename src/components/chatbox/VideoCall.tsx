import { useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useWebRTC } from '../../hooks/useWebRTC';

interface VideoCallProps {
  contactId: string;
  callType: 'video' | 'audio';
  onEnd: () => void;
}

interface IncomingCallProps {
  contactName: string;
  callType: 'video' | 'audio';
  onAnswer: () => void;
  onReject: () => void;
}

export function IncomingCall({ contactName, callType, onAnswer, onReject }: IncomingCallProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
            {callType === 'video' ? (
              <Video className="w-12 h-12 text-white" />
            ) : (
              <Phone className="w-12 h-12 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Cuộc gọi đến</h3>
          <p className="text-lg text-gray-600">{contactName}</p>
          <p className="text-sm text-gray-500 mt-2">
            {callType === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onReject}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            title="Từ chối"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={onAnswer}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            title="Trả lời"
          >
            <Phone className="w-8 h-8 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function VideoCall({ contactId: _contactId, callType, onEnd }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const {
    isCallActive,
    isCalling,
    isIncomingCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTC({
    localVideoRef,
    remoteVideoRef,
    onCallStart: () => console.log('Call started'),
    onCallEnd: () => {
      onEnd();
    },
    onCallReject: () => {
      onEnd();
    },
  });

  // Handle call controls
  const handleEndCall = () => {
    endCall();
    onEnd();
  };

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const handleToggleAudio = () => {
    toggleAudio();
    setAudioEnabled(!audioEnabled);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setVideoEnabled(!videoEnabled);
  };

  // Show incoming call UI
  if (isIncomingCall) {
    return <IncomingCall contactName="Contact" callType={callType} onAnswer={answerCall} onReject={rejectCall} />;
  }

  // Show calling UI
  if (isCalling && !isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
              {callType === 'video' ? (
                <Video className="w-12 h-12 text-white" />
              ) : (
                <Phone className="w-12 h-12 text-white" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Đang gọi...</h3>
            <p className="text-lg text-gray-600">Đang chờ phản hồi</p>
          </div>
          <button
            onClick={handleEndCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center mx-auto transition-colors shadow-lg"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Show active call UI
  if (isCallActive) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-[100]">
        {/* Remote video (main view) */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Local video (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-48 h-64 rounded-lg overflow-hidden border-2 border-white shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Call controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
            {/* Toggle audio */}
            <button
              onClick={handleToggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                audioEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
              }`}
              title={audioEnabled ? 'Tắt mic' : 'Bật mic'}
            >
              {audioEnabled ? (
                <Mic className="w-7 h-7 text-white" />
              ) : (
                <MicOff className="w-7 h-7 text-white" />
              )}
            </button>

            {/* Toggle video (only for video calls) */}
            {callType === 'video' && (
              <button
                onClick={handleToggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  videoEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
                }`}
                title={videoEnabled ? 'Tắt camera' : 'Bật camera'}
              >
                {videoEnabled ? (
                  <Video className="w-7 h-7 text-white" />
                ) : (
                  <VideoOff className="w-7 h-7 text-white" />
                )}
              </button>
            )}

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
              title="Kết thúc cuộc gọi"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

