import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Laptop, Loader2, ShieldAlert, Smartphone, Trash2 } from 'lucide-react';
import { FEATURE_FLAGS } from '../../apis/config';
import { deviceSessionsApi, type DeviceSession } from '../../apis/deviceSessions';
import { useToast } from '../../contexts/useToast';

const formatDate = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const shortenUa = (userAgent?: string) => {
  if (!userAgent) return 'Unknown device';
  if (userAgent.length <= 90) return userAgent;
  return `${userAgent.slice(0, 90)}...`;
};

export default function DeviceSessions() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DeviceSession[]>([]);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [revokeAllBusy, setRevokeAllBusy] = useState(false);

  const activeCount = useMemo(() => items.filter(x => !x.revoked).length, [items]);

  useEffect(() => {
    const load = async () => {
      if (!FEATURE_FLAGS.DEVICE_SESSIONS) {
        setLoading(false);
        return;
      }

      try {
        const data = await deviceSessionsApi.getMySessions();
        setItems(data || []);
      } catch {
        showToast('Khong tai duoc danh sach phien dang nhap', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showToast]);

  const handleRevoke = async (sessionId: string) => {
    setBusySessionId(sessionId);
    try {
      await deviceSessionsApi.revokeSession(sessionId);
      setItems(prev =>
        prev.map(x => (x.id === sessionId ? { ...x, revoked: true, revokedAt: new Date().toISOString() } : x)),
      );
      showToast('Da thu hoi phien dang nhap', 'success');
    } catch {
      showToast('Thu hoi phien that bai', 'error');
    } finally {
      setBusySessionId(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokeAllBusy(true);
    try {
      await deviceSessionsApi.revokeAll();
      setItems(prev => prev.map(x => ({ ...x, revoked: true, revokedAt: x.revokedAt || new Date().toISOString() })));
      showToast('Da thu hoi toan bo phien dang nhap', 'success');
    } catch {
      showToast('Thu hoi toan bo that bai', 'error');
    } finally {
      setRevokeAllBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cai dat
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Phien dang nhap thiet bi</h1>
          <p className="text-sm text-gray-500 mt-1">Quan ly cac phien dang nhap de tang bao mat tai khoan.</p>
        </div>

        {FEATURE_FLAGS.DEVICE_SESSIONS && items.length > 0 ? (
          <button
            disabled={revokeAllBusy || activeCount === 0}
            onClick={handleRevokeAll}
            className="h-10 px-4 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            {revokeAllBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Thu hoi tat ca
          </button>
        ) : null}
      </div>

      {!FEATURE_FLAGS.DEVICE_SESSIONS ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          Tinh nang device sessions dang tat. Bat VITE_FEATURE_DEVICE_SESSIONS=true de su dung.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Chua co phien dang nhap nao</p>
          <p className="text-sm text-gray-500 mt-1">Danh sach phien dang nhap se hien thi o day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isRevoked = Boolean(item.revoked);
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    {(item.userAgent || '').toLowerCase().includes('mobile') ? (
                      <Smartphone className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Laptop className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{shortenUa(item.userAgent)}</p>
                    <p className="text-xs text-gray-500 truncate">IP: {item.ipAddress || 'Unknown'} | Last seen: {formatDate(item.lastSeenAt)}</p>
                    <p className="text-xs text-gray-500 truncate">Source: {item.source || 'Unknown'} | Created: {formatDate(item.createdAt)}</p>
                    {isRevoked ? <p className="text-xs text-red-500 mt-1">Da thu hoi</p> : null}
                  </div>
                </div>

                <button
                  disabled={isRevoked || busySessionId === item.id}
                  onClick={() => handleRevoke(item.id)}
                  className="h-9 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-sm font-medium flex items-center gap-1 shrink-0"
                >
                  {busySessionId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Thu hoi
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
