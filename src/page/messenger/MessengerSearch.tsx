import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { useNavigate } from 'react-router-dom';

export default function MessengerSearch() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [pin, setPin] = useState('');
  const [activeHiddenId, setActiveHiddenId] = useState<string | null>(null);
  const [results, setResults] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    if (!user?.id) {
      setError(t('messengerSearch.loginRequired'));
      return;
    }
    const q = keyword.trim();
    if (!q) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await conversationsApi.searchGroupConversations(user.id, q);
      setResults(data);
    } catch (err: any) {
      setError(err?.message || t('messengerSearch.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const openConversation = (conversation: Conversation) => {
    navigate(`/messenger?conversation=${encodeURIComponent(conversation.id)}`);
  };

  const restoreConversation = async (conversationId: string) => {
    if (!user?.id) return;
    try {
      setError(null);
      await conversationsApi.restoreConversation(conversationId, { userId: user.id });
      navigate(`/messenger?conversation=${encodeURIComponent(conversationId)}`);
    } catch (err: any) {
      setError(err?.message || t('messengerSearch.errorRestore'));
    }
  };

  const unlockConversation = async (conversationId: string) => {
    if (!user?.id) return;
    if (!pin.trim()) {
      setError(t('messengerSearch.enterPin'));
      return;
    }

    try {
      setError(null);
      await conversationsApi.unhideConversation(conversationId, { userId: user.id, pin: pin.trim() });
      setPin('');
      setActiveHiddenId(null);
      navigate(`/messenger?conversation=${encodeURIComponent(conversationId)}`);
    } catch (err: any) {
      setError(err?.message || t('messengerSearch.errorUnlock'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('messengerSearch.title')}</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-2 mb-4">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder={t('messengerSearch.placeholder')}
            className="flex-1 h-11 px-4 rounded-lg border border-gray-300"
          />
          <button onClick={runSearch} className="h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            {t('messengerSearch.search')}
          </button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>}

        {loading && <p className="text-[#65676B]">{t('messengerSearch.loading')}</p>}

        {!loading && results.length === 0 && <p className="text-[#65676B]">{t('messengerSearch.noResults')}</p>}

        <div className="space-y-2">
          {results.map((conversation) => {
            const hidden = !!conversation.hiddenForCurrentUser;
            const hiddenRequiresPin = !!conversation.hiddenRequiresPin;
            return (
              <div key={conversation.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{conversation.groupName || 'Group Chat'}</div>
                    <div className="text-xs text-gray-500">
                      {conversation.participantIds?.length || 0} {t('messengerSearch.members')}
                      {hidden ? ` • ${t('messengerSearch.hidden')}` : ''}
                    </div>
                  </div>

                  {!hidden ? (
                    <button onClick={() => openConversation(conversation)} className="h-9 px-3 rounded-lg bg-gray-900 hover:bg-black text-white text-sm">
                      {t('messengerSearch.open')}
                    </button>
                  ) : hiddenRequiresPin ? (
                    <button
                      onClick={() => setActiveHiddenId((prev) => prev === conversation.id ? null : conversation.id)}
                      className="h-9 px-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      {t('messengerSearch.unlock')}
                    </button>
                  ) : (
                    <button
                      onClick={() => restoreConversation(conversation.id)}
                      className="h-9 px-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      {t('messengerSearch.restore')}
                    </button>
                  )}
                </div>

                {hidden && hiddenRequiresPin && activeHiddenId === conversation.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder={t('messengerSearch.pinPlaceholder')}
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => unlockConversation(conversation.id)}
                      className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      {t('messengerSearch.confirm')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

