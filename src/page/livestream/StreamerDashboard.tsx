// ── StreamerDashboard — Create & manage live streams (design-system aligned) ─
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { livestreamApi, type LiveStreamData } from '../../apis/livestream';
import {
  Radio, Copy, Check, ArrowLeft, Eye, StopCircle,
  Tv, Clock, AlertCircle,
} from 'lucide-react';

export default function StreamerDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [activeStream, setActiveStream] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const loadMyStream = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stream = await livestreamApi.getMyActiveStream(user.id);
      setActiveStream(stream);
    } catch {
      setActiveStream(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadMyStream(); }, [loadMyStream]);

  // Realtime viewer count
  useEffect(() => {
    if (!socket || !activeStream) return;
    const handleViewerCount = (data: { streamId: string; viewerCount: number }) => {
      if (data.streamId === activeStream.id) {
        setActiveStream(prev => prev ? { ...prev, viewerCount: data.viewerCount } : null);
      }
    };
    const handleLiveStarted = (data: { streamId: string }) => {
      if (data.streamId === activeStream?.id) {
        setActiveStream(prev => prev ? { ...prev, status: 'LIVE' } : null);
      }
    };
    const handleLiveEnded = (data: { streamId: string }) => {
      if (data.streamId === activeStream?.id) {
        setActiveStream(null);
      }
    };
    socket.on('LIVE_VIEWER_COUNT', handleViewerCount);
    socket.on('LIVE_STARTED', handleLiveStarted);
    socket.on('LIVE_ENDED', handleLiveEnded);
    return () => {
      socket.off('LIVE_VIEWER_COUNT', handleViewerCount);
      socket.off('LIVE_STARTED', handleLiveStarted);
      socket.off('LIVE_ENDED', handleLiveEnded);
    };
  }, [socket, activeStream?.id]);

  const handleCreateStream = async () => {
    if (!user?.id || !title.trim()) return;
    setCreating(true);
    try {
      const stream = await livestreamApi.createStream({
        userId: user.id,
        streamerName: user.fullName || user.username || 'Unknown',
        streamerAvatar: user.avatar,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setActiveStream(stream);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo phiên live';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEndStream = async () => {
    if (!activeStream || !user?.id) return;
    if (!confirm('Bạn có chắc muốn kết thúc phát trực tiếp?')) return;
    setEnding(true);
    try {
      await livestreamApi.endStream(activeStream.id, user.id);
      setActiveStream(null);
    } catch {
      alert('Không thể kết thúc stream');
    } finally {
      setEnding(false);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'url') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'key') { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
      else { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-3 border-[#e4e6eb] dark:border-[#2b2f45] border-t-[#1877F2] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header card */}
      <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-5 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/livestream')}
            className="w-10 h-10 rounded-xl bg-[#f0f2f5] dark:bg-[#22263a] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#050505] dark:text-[#c8ccde]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-md shadow-blue-500/20">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa]">Quản lý phát trực tiếp</h1>
              <p className="text-xs text-[#65676b] dark:text-[#7e89a6]">Streamer Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {activeStream ? (
        /* ── Active Stream Panel ── */
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {activeStream.status === 'LIVE' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-xl">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-600 dark:text-red-400 text-sm font-bold">ĐANG PHÁT TRỰC TIẾP</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">ĐANG CHỜ OBS KẾT NỐI...</span>
                  </div>
                )}
              </div>

              {activeStream.status === 'LIVE' && (
                <div className="flex items-center gap-2 text-[#65676b] dark:text-[#7e89a6]">
                  <Eye className="w-4 h-4" />
                  <span className="text-lg font-bold text-[#050505] dark:text-[#edf0fa]">{activeStream.viewerCount}</span>
                  <span className="text-sm">người xem</span>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-[#050505] dark:text-[#edf0fa] mb-1">{activeStream.title}</h2>
            {activeStream.description && (
              <p className="text-[#65676b] dark:text-[#7e89a6] text-sm">{activeStream.description}</p>
            )}
          </div>

          {/* OBS Config */}
          <div className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none p-5">
            <h3 className="text-[#050505] dark:text-[#edf0fa] font-semibold mb-4 flex items-center gap-2">
              <Tv className="w-5 h-5 text-[#1877F2]" />
              Cấu hình OBS Studio
            </h3>

            <div className="space-y-4">
              {/* RTMP Server URL */}
              <div>
                <label className="text-xs text-[#65676b] dark:text-[#7e89a6] font-medium mb-1.5 block">Server URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-[#f0f2f5] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl text-[#050505] dark:text-[#edf0fa] font-mono text-sm select-all">
                    {activeStream.rtmpUrl || 'rtmp://localhost:1935/live'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(activeStream.rtmpUrl || 'rtmp://localhost:1935/live', 'url')}
                    className="w-10 h-10 rounded-xl bg-[#f0f2f5] dark:bg-[#22263a] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] flex items-center justify-center transition-colors shrink-0"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-[#65676b] dark:text-[#7e89a6]" />}
                  </button>
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <label className="text-xs text-[#65676b] dark:text-[#7e89a6] font-medium mb-1.5 block">Stream Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-[#f0f2f5] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl text-[#050505] dark:text-[#edf0fa] font-mono text-sm select-all">
                    {activeStream.streamKey || '••••••••••••••••'}
                  </div>
                  <button
                    onClick={() => activeStream.streamKey && copyToClipboard(activeStream.streamKey, 'key')}
                    className="w-10 h-10 rounded-xl bg-[#f0f2f5] dark:bg-[#22263a] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] flex items-center justify-center transition-colors shrink-0"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-[#65676b] dark:text-[#7e89a6]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-5 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#1877F2] mt-0.5 shrink-0" />
                <div className="text-sm text-[#050505] dark:text-[#c8ccde]">
                  <p className="font-medium text-[#1877F2] mb-1">Hướng dẫn OBS:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-xs text-[#65676b] dark:text-[#7e89a6]">
                    <li>Mở OBS Studio → Settings → Stream</li>
                    <li>Service: <strong className="text-[#050505] dark:text-[#edf0fa]">Custom</strong></li>
                    <li>Server: copy <strong className="text-[#050505] dark:text-[#edf0fa]">Server URL</strong> ở trên</li>
                    <li>Stream Key: copy <strong className="text-[#050505] dark:text-[#edf0fa]">Stream Key</strong> ở trên</li>
                    <li>Nhấn <strong className="text-[#050505] dark:text-[#edf0fa]">"Start Streaming"</strong> trong OBS</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* End stream button */}
          <button
            onClick={handleEndStream}
            disabled={ending}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <StopCircle className="w-5 h-5" />
            {ending ? 'Đang kết thúc...' : 'Kết thúc phát trực tiếp'}
          </button>
        </div>
      ) : (
        /* ── Create Stream Form ── */
        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-md shadow-blue-500/20">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#050505] dark:text-[#edf0fa]">Tạo phiên phát trực tiếp</h2>
                <p className="text-sm text-[#65676b] dark:text-[#7e89a6]">Điền thông tin rồi kết nối OBS</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm text-[#050505] dark:text-[#c8ccde] font-medium mb-2 block">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Stream chơi game cùng mình!"
                  className="w-full px-4 py-3 bg-[#f0f2f5] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl text-[#050505] dark:text-[#edf0fa] placeholder-[#65676b] dark:placeholder-[#7e89a6] focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/25 transition-all"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm text-[#050505] dark:text-[#c8ccde] font-medium mb-2 block">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn về nội dung stream..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#f0f2f5] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-xl text-[#050505] dark:text-[#edf0fa] placeholder-[#65676b] dark:placeholder-[#7e89a6] focus:outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]/25 transition-all resize-none"
                  maxLength={500}
                />
              </div>

              <button
                onClick={handleCreateStream}
                disabled={creating || !title.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#1877F2] hover:bg-[#1664d9] text-white rounded-xl font-semibold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <Radio className="w-5 h-5" />
                {creating ? 'Đang tạo...' : 'Tạo phiên phát trực tiếp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
