// ── LiveStreamPage — List active live streams (design-system aligned) ──
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { livestreamApi, type LiveStreamData } from '../../apis/livestream';
import { Radio, Eye, Plus, Users, Tv } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function LiveStreamPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [activeStreams, setActiveStreams] = useState<LiveStreamData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActiveStreams = useCallback(async () => {
    try {
      const streams = await livestreamApi.getActiveStreams();
      setActiveStreams(streams);
    } catch (err) {
      console.error('Failed to load active streams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadActiveStreams(); }, [loadActiveStreams]);

  // Realtime: reload on LIVE_STARTED / LIVE_ENDED
  useEffect(() => {
    if (!socket) return;
    const reload = () => loadActiveStreams();
    socket.on('LIVE_STARTED', reload);
    socket.on('LIVE_ENDED', reload);
    return () => { socket.off('LIVE_STARTED', reload); socket.off('LIVE_ENDED', reload); };
  }, [socket, loadActiveStreams]);

  const getInitials = (name: string) =>
    (name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="space-y-4 pb-8">
      {/* Header card */}
      <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-5 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-md shadow-blue-500/20">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa]">Phát trực tiếp</h1>
              <p className="text-xs text-[#65676b] dark:text-[#7e89a6]">Live Stream</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/livestream/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] hover:bg-[#1664d9] text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Phát trực tiếp
          </button>
        </div>
      </div>

      {/* Active count */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#65676b] dark:text-[#7e89a6]">
          {activeStreams.length} stream đang phát trực tiếp
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-3 border-[#e4e6eb] dark:border-[#2b2f45] border-t-[#1877F2] rounded-full animate-spin" />
        </div>
      ) : activeStreams.length === 0 ? (
        /* Empty state card */
        <div className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-[#f0f2f5] dark:bg-[#22263a] flex items-center justify-center mb-5">
              <Radio className="w-9 h-9 text-[#65676b] dark:text-[#7e89a6]" />
            </div>
            <h2 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa] mb-2">
              Chưa có ai phát trực tiếp
            </h2>
            <p className="text-sm text-[#65676b] dark:text-[#7e89a6] max-w-sm mb-6">
              Hãy là người đầu tiên bắt đầu phát trực tiếp! Kết nối OBS Studio và chia sẻ khoảnh khắc của bạn.
            </p>
            <button
              onClick={() => navigate('/livestream/dashboard')}
              className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#1664d9] text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.97]"
            >
              <Radio className="w-4 h-4" />
              Bắt đầu phát trực tiếp
            </button>
          </div>
        </div>
      ) : (
        /* Stream grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStreams.map((stream) => (
            <div
              key={stream.id}
              onClick={() => navigate(`/livestream/${stream.id}`)}
              className="group cursor-pointer rounded-xl overflow-hidden bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-lg hover:border-[#1877F2]/40 dark:hover:border-[#1877F2]/30 transition-all hover:-translate-y-0.5"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-[#f0f2f5] dark:bg-[#22263a] flex items-center justify-center overflow-hidden">
                <div className="text-4xl opacity-20">📡</div>

                {/* LIVE badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-lg shadow-md">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-[11px] font-bold tracking-wider">LIVE</span>
                </div>

                {/* Viewer count badge */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                  <Eye className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-white text-xs font-medium">{stream.viewerCount}</span>
                </div>

                {/* Hover play overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
                    <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1877F2] to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                    {stream.streamerAvatar
                      ? <img src={resolveMediaUrl(stream.streamerAvatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : getInitials(stream.streamerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#050505] dark:text-[#edf0fa] truncate group-hover:text-[#1877F2] transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-xs text-[#65676b] dark:text-[#7e89a6] mt-0.5">{stream.streamerName}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-[#65676b] dark:text-[#7e89a6]">
                      <Users className="w-3 h-3" />
                      <span>{stream.viewerCount} người xem</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
