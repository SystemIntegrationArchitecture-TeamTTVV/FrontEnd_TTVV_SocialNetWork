import { Phone, PhoneOff, Video, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authApi } from '../apis/auth';
import type { CallPhase, CallType } from '../contexts/CallContext';

interface CallWindowProps {
  phase: CallPhase;
  callerName: string;
  callType: CallType;
  isGroup: boolean;
  roomId: string | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
}

export default function CallWindow({
  phase,
  callerName,
  callType,
  isGroup,
  roomId,
  onAccept,
  onReject,
  onEnd,
}: CallWindowProps) {
  const [webrtcUrl, setWebrtcUrl] = useState<string>('');

  useEffect(() => {
    if (phase === 'connected' && roomId) {
      const currentUser = authApi.getCurrentUser();
      if (!currentUser) return;

      const token = localStorage.getItem('token') || '';
      
      const url = new URL('/webrtc-call.html', window.location.origin);
      url.searchParams.set('roomId', roomId);
      url.searchParams.set('userId', currentUser.id);
      url.searchParams.set('username', currentUser.username);
      url.searchParams.set('displayName', currentUser.displayName);
      url.searchParams.set('callType', callType);
      url.searchParams.set('token', token);
      url.searchParams.set('group', isGroup ? '1' : '0');
      url.searchParams.set('embedded', '1');
      
      // Get the backend URL without the /api suffix if present
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      if (apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.substring(0, apiUrl.length - 4);
      }
      url.searchParams.set('wsUrl', `${apiUrl}/ws`);

      setWebrtcUrl(url.toString());
    }
  }, [phase, roomId, callType, isGroup]);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (phase === 'connected') {
    return (
      <div className="fixed inset-0 bg-[#0b1220] z-50 flex flex-col overflow-hidden select-none">
        {webrtcUrl ? (
          <iframe
            id="webrtc-iframe"
            src={webrtcUrl}
            className="w-full h-full border-none"
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
            title="Cuộc gọi WebRTC"
          />
        ) : null}
      </div>
    );
  }

  // Ringing UI
  return (
    <div className="fixed inset-0 bg-[#1a1a2e] z-50 flex flex-col overflow-hidden select-none">
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />

        <div className="relative mb-10">
          <div className="absolute inset-[-24px] rounded-full border-2 border-blue-400/30 animate-ping" />
          <div className="absolute inset-[-12px] rounded-full border-2 border-blue-400/20 animate-pulse" />
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-semibold shadow-2xl shadow-blue-500/30">
            {getInitials(callerName)}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2 text-blue-300/80">
          {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {phase === 'incoming_ringing' 
              ? (callType === 'video' ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến')
              : 'Đang gọi...'}
          </span>
        </div>
        <h2 className="text-white text-2xl font-bold mb-1">{callerName}</h2>
        {isGroup && (
          <div className="flex items-center gap-1.5 text-white/50 text-sm">
            <Users className="w-4 h-4" />
            <span>Cuộc gọi nhóm</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-12 mt-12">
          {phase === 'incoming_ringing' ? (
            <>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onReject}
                  className="w-16 h-16 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg shadow-red-500/20"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-white/60 text-xs">Từ chối</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onAccept}
                  className="w-16 h-16 rounded-full bg-emerald-500/90 hover:bg-emerald-500 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg shadow-emerald-500/20 animate-pulse"
                >
                  {callType === 'video' ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
                </button>
                <span className="text-white/60 text-xs">Trả lời</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onEnd}
                className="w-16 h-16 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg shadow-red-500/20"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-white/60 text-xs">Kết thúc</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
