import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/useToast';
import { FEATURE_FLAGS } from '../../../apis/config';
import { scheduledMessagesApi, type ScheduledMessage } from '../../../apis/scheduledMessages';

const fmt = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

const statusLabel: Record<string, { text: string; color: string }> = {
  PENDING: { text: 'Chờ gửi', color: 'text-amber-600 bg-amber-50' },
  SENT: { text: 'Đã gửi', color: 'text-green-600 bg-green-50' },
  CANCELLED: { text: 'Đã hủy', color: 'text-gray-500 bg-gray-100' },
};

export default function ScheduledMessages() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!FEATURE_FLAGS.SCHEDULED_MESSAGES || !conversationId || !user?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await scheduledMessagesApi.list(conversationId, user.id);
      setItems(data || []);
    } catch {
      showToast('Không tải được danh sách tin nhắn đã lên lịch', 'error');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (msgId: string) => {
    if (!user?.id) return;
    setBusyId(msgId);
    try {
      await scheduledMessagesApi.cancel(msgId, user.id);
      setItems(prev => prev.map(x => x.id === msgId ? { ...x, status: 'CANCELLED' } : x));
      showToast('Đã hủy tin nhắn lên lịch', 'success');
    } catch {
      showToast('Hủy thất bại', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const back = () => navigate(conversationId ? `/messenger?conversation=${conversationId}` : '/messenger');

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <div className="mb-5">
        <button onClick={back} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" />
          Quay lại cuộc trò chuyện
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h1 className="text-xl font-bold text-gray-900">Tin nhắn đã lên lịch</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">Quản lý các tin nhắn chờ được gửi tự động.</p>
      </div>

      {!FEATURE_FLAGS.SCHEDULED_MESSAGES ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          Tính năng này đang tắt. Bật <code className="font-mono">VITE_FEATURE_SCHEDULED_MESSAGES=true</code> để sử dụng.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Chưa có tin nhắn nào được lên lịch</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const st = statusLabel[item.status] ?? { text: item.status, color: 'text-gray-500 bg-gray-100' };
            const canCancel = item.status === 'PENDING';
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 break-words">{item.content}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.text}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Gửi lúc {fmt(item.scheduledAt)}
                      </span>
                    </div>
                  </div>
                  {canCancel && (
                    <button
                      disabled={busyId === item.id}
                      onClick={() => handleCancel(item.id)}
                      className="h-9 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium shrink-0"
                    >
                      {busyId === item.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
