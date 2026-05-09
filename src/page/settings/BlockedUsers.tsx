import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldAlert, UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/useToast';
import { FEATURE_FLAGS } from '../../apis/config';
import { blockingApi, type BlockedUser } from '../../apis/blocking';

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!FEATURE_FLAGS.BLOCKING) {
        setLoading(false);
        return;
      }

      try {
        const data = await blockingApi.getBlockedUsers();
        setItems(data || []);
      } catch {
        showToast(t('blockedUsers.loadError'), 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showToast]);

  const handleUnblock = async (userId: string) => {
    setBusyUserId(userId);
    try {
      await blockingApi.unblockUser(userId);
      setItems(prev => prev.filter(x => x.userId !== userId));
      showToast(t('blockedUsers.unblockSuccess'), 'success');
    } catch {
      showToast(t('blockedUsers.unblockError'), 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pb-20">
      <div className="mb-6">
        <button
          onClick={() => navigate('/settings/privacy')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('blockedUsers.backToPrivacy')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('blockedUsers.pageTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('blockedUsers.pageSubtitle')}</p>
      </div>

      {!FEATURE_FLAGS.BLOCKING ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          {t('blockedUsers.featureDisabled')}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{t('blockedUsers.emptyTitle')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('blockedUsers.emptySubtitle')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {items.map(item => (
            <div key={item.userId} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  {item.avatar ? (
                    <img src={item.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.fullName || item.username || item.userId}</p>
                  <p className="text-xs text-gray-500 truncate">@{item.username || 'unknown'}</p>
                </div>
              </div>
              <button
                disabled={busyUserId === item.userId}
                onClick={() => handleUnblock(item.userId)}
                className="h-9 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
              >
                {busyUserId === item.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                {t('blockedUsers.unblock')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
