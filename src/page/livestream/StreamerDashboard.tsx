import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Tv, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveStreamHost } from '../../contexts/LiveStreamHostContext';

export default function StreamerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { activeStream, loading, creating, handleCreateStream, ending } = useLiveStreamHost();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiresApprovalCreate, setRequiresApprovalCreate] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const showLiveActionOverlay = creating || ending;
  const liveActionLabel = creating ? 'Đang bắt đầu phát trực tiếp...' : 'Đang kết thúc phát trực tiếp...';
  const liveActionHint = creating
    ? 'Vui lòng chờ trong giây lát, hệ thống đang khởi tạo phòng live.'
    : 'Vui lòng chờ trong giây lát, hệ thống đang đóng phòng live.';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-3 border-[#e4e6eb] dark:border-[#2b2f45] border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If there's an active stream, we just render a portal target.
  // The GlobalStreamerOverlay will use createPortal to render the actual layout here.
  if (activeStream) {
    return (
      <div className="space-y-4 pb-8 max-w-[1600px] mx-auto h-[calc(100vh-6rem)]">
         {showLiveActionOverlay && (
          <div className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] shadow-[0_16px_50px_rgba(0,0,0,0.28)] p-6 text-center">
              <div className="mx-auto mb-4 relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#1877F2]/80 animate-spin" />
                <div className="absolute inset-[10px] rounded-full border-2 border-[#1877F2]/20" />
              </div>
              <p className="text-base font-bold text-[#050505] dark:text-[#edf0fa]">{liveActionLabel}</p>
              <p className="mt-1.5 text-sm text-[#65676b] dark:text-[#7e89a6]">{liveActionHint}</p>
            </div>
          </div>
        )}
        <div id="streamer-dashboard-portal" className="w-full h-full" />
      </div>
    );
  }

  // If no active stream, render the Create Stream form
  return (
    <div className="space-y-4 pb-8 max-w-[1600px] mx-auto">
      {showLiveActionOverlay && (
        <div className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] shadow-[0_16px_50px_rgba(0,0,0,0.28)] p-6 text-center">
            <div className="mx-auto mb-4 relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#1877F2]/80 animate-spin" />
              <div className="absolute inset-[10px] rounded-full border-2 border-[#1877F2]/20" />
            </div>
            <p className="text-base font-bold text-[#050505] dark:text-[#edf0fa]">{liveActionLabel}</p>
            <p className="mt-1.5 text-sm text-[#65676b] dark:text-[#7e89a6]">{liveActionHint}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/livestream')}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white"
                style={{ backgroundColor: '#1877F2' }}
              >
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Phát trực tiếp</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-7">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white"
              style={{ backgroundColor: '#1877F2' }}
            >
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tạo phiên phát trực tiếp</h2>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-2 block text-slate-800 dark:text-slate-200">
                Tiêu đề
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Mặc định: Phòng live của ${user?.fullName || user?.username || 'bạn'}`}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block text-slate-800 dark:text-slate-200">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                maxLength={500}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block text-slate-800 dark:text-slate-200">
                Ảnh bìa (tuỳ chọn)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:text-white file:bg-blue-600"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresApprovalCreate}
                onChange={(e) => setRequiresApprovalCreate(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">Yêu cầu duyệt người xem (waiting room)</span>
            </label>

            <button
              type="button"
              onClick={() => handleCreateStream({ title, description, requiresApprovalCreate, thumbnailFile })}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-bold shadow-md disabled:opacity-50 hover:opacity-95 transition"
              style={{ backgroundColor: '#1877F2' }}
            >
              <Radio className="w-5 h-5" />
              {creating ? 'Đang tạo...' : 'Bắt đầu phát trực tiếp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
