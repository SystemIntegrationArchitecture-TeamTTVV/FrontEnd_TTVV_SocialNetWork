import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  LogOut, Crown, Users, X, Check, ArrowRight, UserPlus,
} from 'lucide-react';
import { conversationsApi, type Conversation } from '../apis/conversations';
import { useEffect, useRef, useState, useCallback } from 'react';

interface CallWindowProps {
  isIncoming?: boolean;
  callerName: string;
  callType: 'voice' | 'video';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteStreams?: Array<{ peerId: string; stream: MediaStream }>;
  isGroup?: boolean;
  conversationId?: string;
  callCategory: 'DIRECT' | 'GROUP';
  hostId: string | null;
  currentUserId: string;
  activeParticipantIds: string[];
  callToasts: Array<{ id: string; text: string; type: 'join' | 'leave' | 'host' }>;
  onAccept?: () => void;
  onReject: () => void;
  onEnd: () => void;
  onLeave: (transferToUserId?: string) => void;
  onEndAll: () => void;
  onTransferHost: (newHostId: string) => void;
  onInvite?: (userId: string) => void;
}

export default function CallWindow({
  isIncoming,
  callerName,
  callType,
  localStream,
  remoteStream,
  remoteStreams = [],
  isGroup = false,
  callCategory,
  hostId,
  currentUserId,
  activeParticipantIds,
  callToasts,
  onAccept,
  onReject,
  onEnd,
  onLeave,
  onEndAll,
  onTransferHost,
  onInvite,
  conversationId,
}: CallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHostModal, setShowHostModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedNewHost, setSelectedNewHost] = useState<string | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const controlsTimerRef = useRef<number>(0);

  const isHost = currentUserId === hostId;
  const isGroupCall = callCategory === 'GROUP' || isGroup;

  // ── Call timer ──
  useEffect(() => {
    if (!isIncoming && (remoteStream || remoteStreams.length > 0)) {
      setIsConnected(true);
    }
  }, [isIncoming, remoteStream, remoteStreams.length]);

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setCallSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ── Auto-hide controls for video calls ──
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    if (callType === 'video' && !isIncoming) {
      controlsTimerRef.current = window.setTimeout(() => setShowControls(false), 4000);
    }
  }, [callType, isIncoming]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current); };
  }, [resetControlsTimer]);

  // ── Local video ──
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [localStream]);

  // ── Remote video ──
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, callType]);

  // ── Remote audio (voice calls) ──
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream && callType === 'voice') {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, callType]);

  // ── Group video streams ──
  useEffect(() => {
    if (!isGroupCall || callType !== 'video') return;
    for (const item of remoteStreams) {
      const el = remoteVideoRefs.current.get(item.peerId);
      if (!el) continue;
      if (el.srcObject !== item.stream) el.srcObject = item.stream;
      el.play().catch(() => {});
    }
  }, [isGroupCall, callType, remoteStreams]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleLeaveOrEnd = () => {
    if (isGroupCall && isHost) {
      const others = activeParticipantIds.filter(id => id !== currentUserId);
      if (others.length > 0) {
        setSelectedNewHost(others[0]);
        setShowHostModal(true);
        return;
      }
    }
    if (isGroupCall) {
      onLeave();
    } else {
      onEnd();
    }
  };

  const handleHostTransferAndLeave = () => {
    if (selectedNewHost) {
      onTransferHost(selectedNewHost);
      setTimeout(() => onLeave(selectedNewHost), 200);
    }
    setShowHostModal(false);
  };

  const handleEndAll = () => {
    setShowHostModal(false);
    onEndAll();
  };

  const openInviteModal = async () => {
    setShowInviteModal(true);
    if (conversationId && !conversation) {
      setInviteLoading(true);
      try {
        const conv = await conversationsApi.getConversationById(conversationId);
        setConversation(conv);
      } catch (error) {
        console.error('Failed to fetch conversation for invite modal:', error);
      } finally {
        setInviteLoading(false);
      }
    }
  };

  const handleInvite = (userId: string) => {
    if (onInvite) onInvite(userId);
    setShowInviteModal(false);
  };

  // Avatar initials
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Grid layout
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  return (
    <div
      className="fixed inset-0 bg-[#1a1a2e] z-50 flex flex-col overflow-hidden select-none"
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* ═══ INCOMING CALL ═══ */}
      {isIncoming && (
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />

          {/* Animated ring */}
          <div className="relative mb-10">
            <div className="absolute inset-[-24px] rounded-full border-2 border-blue-400/30 animate-ping" />
            <div className="absolute inset-[-12px] rounded-full border-2 border-blue-400/20 animate-pulse" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-semibold shadow-2xl shadow-blue-500/30">
              {getInitials(callerName)}
            </div>
          </div>

          {/* Call info */}
          <div className="flex items-center gap-2 mb-2 text-blue-300/80">
            {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            <span className="text-sm font-medium">
              {callType === 'video' ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}
            </span>
          </div>
          <h2 className="text-white text-2xl font-bold mb-1">{callerName}</h2>
          {isGroupCall && (
            <div className="flex items-center gap-1.5 text-white/50 text-sm">
              <Users className="w-4 h-4" />
              <span>Cuộc gọi nhóm</span>
            </div>
          )}

          {/* Accept / Reject */}
          <div className="flex items-center gap-12 mt-12">
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
          </div>
        </div>
      )}

      {/* ═══ ACTIVE CALL ═══ */}
      {!isIncoming && (
        <>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-3">
              <h2 className="text-white font-semibold text-base">{callerName}</h2>
              {isGroupCall && (
                <span className="flex items-center gap-1 text-white/40 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3" />
                  {activeParticipantIds.length}
                </span>
              )}
              {isHost && isGroupCall && (
                <span className="flex items-center gap-1 text-amber-400/70 text-xs">
                  <Crown className="w-3 h-3" />
                  Host
                </span>
              )}
            </div>
            <div className="text-white/50 text-sm font-mono tabular-nums">
              {isConnected ? formatTime(callSeconds) : 'Đang kết nối...'}
            </div>
          </div>

          {/* ── VIDEO CALL AREA ── */}
          {callType === 'video' && (
            <div className="flex-1 relative overflow-hidden">
              {/* Group video grid */}
              {isGroupCall && remoteStreams.length > 0 ? (
                <div className={`grid ${getGridClass(remoteStreams.length)} gap-1.5 p-2 w-full h-full`}>
                  {remoteStreams.map(item => (
                    <div key={item.peerId} className="relative bg-[#16213e] rounded-xl overflow-hidden">
                      <video
                        ref={el => {
                          if (el) remoteVideoRefs.current.set(item.peerId, el);
                          else remoteVideoRefs.current.delete(item.peerId);
                        }}
                        autoPlay playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-md px-2 py-0.5 text-white text-xs">
                        {item.peerId.slice(0, 8)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : remoteStream ? (
                /* 1-1 remote fullscreen */
                <video
                  ref={remoteVideoRef}
                  autoPlay playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Connecting placeholder */
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-semibold mb-4">
                      {getInitials(callerName)}
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      Đang kết nối
                    </div>
                  </div>
                </div>
              )}

              {/* Local PiP */}
              <div className="absolute top-4 right-4 w-[180px] h-[135px] bg-[#16213e] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <video
                  ref={localVideoRef}
                  autoPlay playsInline muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-[#16213e] flex items-center justify-center">
                    <VideoOff className="w-6 h-6 text-white/30" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── VOICE CALL AREA ── */}
          {callType === 'voice' && (
            <div className="flex-1 flex items-center justify-center">
              {isGroupCall ? (
                /* Group voice: avatar grid */
                <div className="flex flex-wrap justify-center gap-6 max-w-md">
                  {activeParticipantIds
                    .filter(id => id !== currentUserId)
                    .map(id => (
                      <div key={id} className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold ring-2 ring-transparent transition-all">
                          {id.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-white/50 text-xs">{id.slice(0, 8)}</span>
                      </div>
                    ))}
                  {/* Self avatar */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-semibold ring-2 ring-emerald-400/30">
                      Bạn
                    </div>
                    <span className="text-white/50 text-xs">Bạn</span>
                  </div>
                </div>
              ) : (
                /* 1-1 voice: single large avatar */
                <div className="text-center">
                  <div className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-semibold shadow-2xl shadow-blue-500/20 mb-6">
                    {getInitials(callerName)}
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-1">{callerName}</h3>
                  <p className="text-white/40 text-sm">
                    {isConnected ? 'Đang gọi' : 'Đang kết nối...'}
                  </p>
                </div>
              )}
              <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
            </div>
          )}

          {/* ── CONTROL BAR ── */}
          <div className={`flex justify-center pb-8 pt-4 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-xl rounded-full px-5 py-3 shadow-2xl ring-1 ring-white/[0.06]">
              {/* Mic */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-red-500/90 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
                title={isMuted ? 'Bật mic' : 'Tắt mic'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera (video only) */}
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isVideoOff ? 'bg-red-500/90 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                  }`}
                  title={isVideoOff ? 'Bật camera' : 'Tắt camera'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Separator */}
              <div className="w-px h-8 bg-white/10 mx-1" />

              {/* Leave / End */}
              {isGroupCall ? (
                <>
                  <button
                    onClick={openInviteModal}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all"
                    title="Thêm người"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLeaveOrEnd}
                    className="h-12 px-5 rounded-full bg-amber-500/90 hover:bg-amber-500 text-white text-sm font-medium flex items-center gap-2 transition-all"
                    title="Rời cuộc gọi"
                  >
                    <LogOut className="w-4 h-4" />
                    Rời
                  </button>
                  {isHost && (
                    <button
                      onClick={onEndAll}
                      className="h-12 px-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium flex items-center gap-2 transition-all"
                      title="Kết thúc cho tất cả"
                    >
                      <PhoneOff className="w-4 h-4" />
                      Kết thúc
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={onEnd}
                  className="w-14 h-12 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center text-white transition-all hover:scale-105"
                  title="Kết thúc cuộc gọi"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
        {callToasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-xl shadow-lg animate-[slideDown_0.3s_ease-out] ${
              toast.type === 'join'
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/20'
                : toast.type === 'host'
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/20'
                  : 'bg-white/10 text-white/70 ring-1 ring-white/10'
            }`}
          >
            {toast.type === 'join' && <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />{toast.text}</span>}
            {toast.type === 'leave' && <span className="inline-flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" />{toast.text}</span>}
            {toast.type === 'host' && <span className="inline-flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" />{toast.text}</span>}
          </div>
        ))}
      </div>

      {/* ═══ HOST TRANSFER MODAL ═══ */}
      {showHostModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl w-[380px] shadow-2xl ring-1 ring-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Crown className="w-5 h-5 text-amber-400" />
                Chuyển quyền Host
              </div>
              <button
                onClick={() => setShowHostModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Participant list */}
            <div className="px-5 py-3 max-h-48 overflow-y-auto">
              <p className="text-white/40 text-xs mb-3">Chọn người nhận quyền Host:</p>
              {activeParticipantIds
                .filter(id => id !== currentUserId)
                .map(id => (
                  <label
                    key={id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors mb-1 ${
                      selectedNewHost === id ? 'bg-blue-500/10 ring-1 ring-blue-500/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="newHost"
                      value={id}
                      checked={selectedNewHost === id}
                      onChange={() => setSelectedNewHost(id)}
                      className="sr-only"
                    />
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                      {id.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-white text-sm flex-1">{id.slice(0, 12)}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedNewHost === id ? 'border-blue-500 bg-blue-500' : 'border-white/20'
                    }`}>
                      {selectedNewHost === id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </label>
                ))}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-white/5 space-y-2">
              <button
                onClick={handleHostTransferAndLeave}
                disabled={!selectedNewHost}
                className="w-full h-11 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                Chuyển & Rời
              </button>
              <button
                onClick={handleEndAll}
                className="w-full h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                Kết thúc cuộc gọi cho tất cả
              </button>
              <button
                onClick={() => setShowHostModal(false)}
                className="w-full h-10 rounded-xl text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INVITE MODAL ═══ */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] rounded-2xl w-[380px] shadow-2xl ring-1 ring-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Mời thành viên nhóm
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Participant list */}
            <div className="px-5 py-3 max-h-64 overflow-y-auto">
              {inviteLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : conversation?.participantIds ? (
                conversation.participantIds.map((id, index) => {
                  if (id === currentUserId) return null;
                  const name = conversation.nicknames?.[id] || conversation.participantNames?.[index] || id;
                  const isAlreadyInCall = activeParticipantIds.includes(id);

                  return (
                    <div key={id} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5 mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                          {getInitials(name)}
                        </div>
                        <span className="text-white text-sm">{name}</span>
                      </div>
                      {isAlreadyInCall ? (
                        <span className="text-white/40 text-xs italic">{name} đã ở trong cuộc gọi rồi</span>
                      ) : (
                        <button
                          onClick={() => handleInvite(id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium transition-colors"
                        >
                          Mời
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-white/40 text-center text-sm py-4">Không tìm thấy thành viên</p>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-white/5">
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-down keyframe */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
