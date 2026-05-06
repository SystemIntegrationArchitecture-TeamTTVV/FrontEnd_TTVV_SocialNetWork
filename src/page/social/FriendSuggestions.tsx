import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/useToast';
import { FEATURE_FLAGS } from '../../apis/config';
import { friendSuggestionsApi, type FriendSuggestion } from '../../apis/friendSuggestions';
import { friendRequestsApi } from '../../apis/friendRequests';

export default function FriendSuggestions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!FEATURE_FLAGS.FRIEND_SUGGESTIONS || !user?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await friendSuggestionsApi.getSuggestions(user.id, 20);
      setSuggestions(data || []);
    } catch {
      showToast('Không tải được gợi ý kết bạn', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleAddFriend = async (suggestion: FriendSuggestion) => {
    if (!user?.id) return;
    setBusyId(suggestion.userId);
    try {
      await friendRequestsApi.createFriendRequest({ senderId: user.id, receiverId: suggestion.userId });
      setSentIds(prev => new Set(prev).add(suggestion.userId));
      showToast(`Đã gửi lời mời đến ${suggestion.fullName}`, 'success');
    } catch {
      showToast('Gửi lời mời thất bại', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">Gợi ý kết bạn</h1>
      </div>

      {!FEATURE_FLAGS.FRIEND_SUGGESTIONS ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          Tính năng này đang tắt. Bật <code className="font-mono">VITE_FEATURE_FRIEND_SUGGESTIONS=true</code> để sử dụng.
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Chưa có gợi ý nào</p>
          <p className="text-sm text-gray-500 mt-1">Thêm bạn bè để nhận gợi ý kết bạn qua bạn chung</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map(s => {
            const sent = sentIds.has(s.userId);
            return (
              <div key={s.userId} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
                <button
                  onClick={() => navigate(`/profile/${s.userId}`)}
                  className="shrink-0 w-12 h-12 rounded-full bg-blue-100 overflow-hidden"
                >
                  {s.avatar ? (
                    <img src={s.avatar} alt={s.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-lg">
                      {(s.fullName?.[0] || s.username?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => navigate(`/profile/${s.userId}`)}
                    className="font-semibold text-gray-900 text-sm hover:underline truncate block text-left"
                  >
                    {s.fullName}
                  </button>
                  <p className="text-xs text-gray-500 mb-2">@{s.username}</p>
                  {s.mutualFriendCount > 0 && (
                    <p className="text-xs text-blue-600 mb-2">{s.mutualFriendCount} bạn chung</p>
                  )}
                  <button
                    disabled={busyId === s.userId || sent}
                    onClick={() => handleAddFriend(s)}
                    className={`w-full h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      sent
                        ? 'bg-green-50 text-green-600 cursor-default'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                    }`}
                  >
                    {busyId === s.userId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : sent ? (
                      '✓ Đã gửi lời mời'
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Kết bạn
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
