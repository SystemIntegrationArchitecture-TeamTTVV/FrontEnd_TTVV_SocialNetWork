// ── LiveViewer — Watch a live stream (design-system aligned) ───────────
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { livestreamApi, type LiveStreamData } from '../../apis/livestream';
import HlsPlayer from './components/HlsPlayer';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  ArrowLeft, Eye, Send, MessageCircle, X, Tv,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export default function LiveViewer() {
  const { id: streamId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);

  // Load stream data
  const loadStream = useCallback(async () => {
    if (!streamId) return;
    try {
      const data = await livestreamApi.getStreamById(streamId, user?.id);
      setStream(data);
      setViewerCount(data.viewerCount);
      if (data.status === 'ENDED') setIsEnded(true);
    } catch {
      navigate('/livestream');
    } finally {
      setLoading(false);
    }
  }, [streamId, user?.id, navigate]);

  useEffect(() => { loadStream(); }, [loadStream]);

  // Join stream as viewer
  useEffect(() => {
    if (!streamId || !user?.id || joinedRef.current || isEnded) return;
    joinedRef.current = true;
    livestreamApi.joinStream(streamId, user.id).catch(() => {});
    return () => {
      if (joinedRef.current) {
        livestreamApi.leaveStream(streamId, user.id).catch(() => {});
        joinedRef.current = false;
      }
    };
  }, [streamId, user?.id, isEnded]);

  // Socket events
  useEffect(() => {
    if (!socket || !streamId) return;
    const handleViewerCount = (data: { streamId: string; viewerCount: number }) => {
      if (data.streamId === streamId) setViewerCount(data.viewerCount);
    };
    const handleLiveEnded = (data: { streamId: string }) => {
      if (data.streamId === streamId) setIsEnded(true);
    };
    const handleLiveChat = (data: { streamId: string; userId: string; userName: string; content: string }) => {
      if (data.streamId === streamId) {
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          userId: data.userId,
          userName: data.userName,
          content: data.content,
          timestamp: new Date(),
        }]);
      }
    };
    socket.on('LIVE_VIEWER_COUNT', handleViewerCount);
    socket.on('LIVE_ENDED', handleLiveEnded);
    socket.on('LIVE_CHAT', handleLiveChat);
    return () => {
      socket.off('LIVE_VIEWER_COUNT', handleViewerCount);
      socket.off('LIVE_ENDED', handleLiveEnded);
      socket.off('LIVE_CHAT', handleLiveChat);
    };
  }, [socket, streamId]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim() || !socket || !user?.id || !streamId) return;
    socket.emit('LIVE_CHAT', {
      streamId,
      userId: user.id,
      userName: user.fullName || user.username || 'User',
      content: chatInput.trim(),
    });
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.fullName || user.username || 'User',
      content: chatInput.trim(),
      timestamp: new Date(),
    }]);
    setChatInput('');
  };

  const getInitials = (name: string) =>
    (name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const hashColor = (str: string) => {
    let hash = 0;
    for (const ch of str) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash % 360)}, 65%, 55%)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-3 border-[#e4e6eb] dark:border-[#2b2f45] border-t-[#1877F2] rounded-full animate-spin" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex items-center justify-center py-32 text-[#050505] dark:text-[#edf0fa]">
        <p>Stream không tồn tại</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header card */}
      <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-4 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/livestream')}
              className="w-9 h-9 rounded-xl bg-[#f0f2f5] dark:bg-[#22263a] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#050505] dark:text-[#c8ccde]" />
            </button>

            {/* Streamer info */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                style={{ backgroundColor: hashColor(stream.streamerId) }}
              >
                {stream.streamerAvatar
                  ? <img src={resolveMediaUrl(stream.streamerAvatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : getInitials(stream.streamerName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#050505] dark:text-[#edf0fa] leading-tight">{stream.streamerName}</p>
                <p className="text-xs text-[#65676b] dark:text-[#7e89a6] leading-tight truncate max-w-[200px]">{stream.title}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEnded && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/25 rounded-lg">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 dark:text-red-400 text-xs font-bold">LIVE</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[#65676b] dark:text-[#7e89a6]">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{viewerCount}</span>
            </div>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showChat ? 'bg-[#1877F2]/10 text-[#1877F2]' : 'bg-[#f0f2f5] dark:bg-[#22263a] text-[#65676b] dark:text-[#7e89a6] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45]'}`}
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content: Player + Chat */}
      <div className="flex gap-4 items-start">
        {/* Video player */}
        <div className={`${showChat ? 'flex-1' : 'w-full'} transition-all`}>
          <div className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {isEnded ? (
                <div className="text-center text-[#050505] dark:text-[#edf0fa] p-8">
                  <div className="w-16 h-16 rounded-full bg-[#f0f2f5] dark:bg-[#22263a] flex items-center justify-center mx-auto mb-4">
                    <Tv className="w-7 h-7 text-[#65676b] dark:text-[#7e89a6]" />
                  </div>
                  <h2 className="text-lg font-bold mb-1.5">Phát trực tiếp đã kết thúc</h2>
                  <p className="text-sm text-[#65676b] dark:text-[#7e89a6] mb-5">Cảm ơn bạn đã theo dõi!</p>
                  <button
                    onClick={() => navigate('/livestream')}
                    className="px-5 py-2.5 bg-[#1877F2] hover:bg-[#1664d9] text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Xem stream khác
                  </button>
                </div>
              ) : (
                <HlsPlayer src={stream.hlsUrl} autoPlay className="w-full h-full" />
              )}
            </div>
          </div>

          {/* Stream info below player */}
          <div className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none p-4 mt-4">
            <h2 className="text-base font-bold text-[#050505] dark:text-[#edf0fa] mb-1">{stream.title}</h2>
            {stream.description && (
              <p className="text-sm text-[#65676b] dark:text-[#7e89a6]">{stream.description}</p>
            )}
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 lg:w-[340px] shrink-0 bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none flex flex-col" style={{ height: 'calc(100vh - 200px)', maxHeight: '700px' }}>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#e4e6eb] dark:border-[#2b2f45] flex items-center justify-between shrink-0">
              <h3 className="text-[#050505] dark:text-[#edf0fa] font-semibold text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#1877F2]" />
                Chat trực tiếp
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="w-7 h-7 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[#65676b] dark:text-[#7e89a6]" />
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-8 h-8 text-[#e4e6eb] dark:text-[#2b2f45] mx-auto mb-2" />
                  <p className="text-sm text-[#65676b] dark:text-[#7e89a6]">Chưa có tin nhắn</p>
                  <p className="text-xs text-[#65676b] dark:text-[#7e89a6] mt-1 opacity-70">Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: hashColor(msg.userId) }}
                  >
                    {getInitials(msg.userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-xs font-semibold mr-1.5"
                      style={{ color: hashColor(msg.userId) }}
                    >
                      {msg.userName}
                    </span>
                    <span className="text-[#050505] dark:text-[#c8ccde] text-sm break-words">{msg.content}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {!isEnded && (
              <div className="px-3 py-3 border-t border-[#e4e6eb] dark:border-[#2b2f45] shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Nhắn tin..."
                    className="flex-1 px-3 py-2 bg-[#f0f2f5] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl text-[#050505] dark:text-[#edf0fa] text-sm placeholder-[#65676b] dark:placeholder-[#7e89a6] focus:outline-none focus:border-[#1877F2]"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="w-9 h-9 rounded-xl bg-[#1877F2] hover:bg-[#1664d9] flex items-center justify-center disabled:opacity-30 transition-all"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
