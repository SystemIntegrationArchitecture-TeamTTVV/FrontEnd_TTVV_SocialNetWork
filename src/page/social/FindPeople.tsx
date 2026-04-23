import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Check, X, User as UserIcon, Loader2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usersApi, type User } from '../../apis/users';
import { friendRequestsApi, type FriendRequest } from '../../apis/friendRequests';
import { authApi } from '../../apis/auth';
import { useSocket } from '../../contexts/SocketContext';
import { useChatBox } from '../../contexts/ChatBoxContext';

export default function FindPeople() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const currentUser = authApi.getCurrentUser();
  const { subscribe } = useSocket();
  const { openChatBoxByUserId } = useChatBox();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load friend requests on mount
  useEffect(() => {
    if (currentUser?.id) {
      loadFriendRequests();
    }
  }, [currentUser?.id]);

  // Subscribe to socket notifications for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('🔔 Subscribing to friend request notifications for user:', currentUser.id);

    const unsubscribe = subscribe('NOTIFICATION', (event) => {
      if (event.type === 'NOTIFICATION' && event.data) {
        const notification = event.data;
        
        if (
          notification.type === 'FRIEND_REQUEST' ||
          notification.type === 'FRIEND_ACCEPTED' ||
          notification.type === 'FRIEND_REJECTED' ||
          notification.type === 'FRIEND_CANCELLED' ||
          notification.type === 'FRIEND_REMOVED'
        ) {
          // Reload friend requests on any friend-related socket event
          loadFriendRequests();
        }
      }
    });

    return unsubscribe;
  }, [currentUser?.id, subscribe]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    console.log('🔍 useEffect triggered, searchQuery:', searchQuery, 'currentUser:', currentUser?.id);
    
    if (!searchQuery.trim()) {
      console.log('⚠️ Empty query, clearing suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    console.log('⏳ Starting debounce timer...');
    const timeoutId = setTimeout(async () => {
      try {
        console.log('🚀 API call starting for:', searchQuery);
        const results = await usersApi.searchUsers(searchQuery);
        console.log('✅ API returned results:', results);
        console.log('📊 Results count:', results?.length || 0);
        
        // Filter out current user and limit to 5 suggestions
        const filtered = results
          .filter(user => user.id !== currentUser?.id)
          .slice(0, 5);
        console.log('📋 Filtered suggestions:', filtered);
        console.log('📋 Filtered count:', filtered.length);
        
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        console.log('✅ State updated - showSuggestions:', filtered.length > 0);
      } catch (error: any) {
        console.error('❌ Search suggestions failed:', error);
        console.error('❌ Error details:', error.message, error.stack);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => {
      console.log('🧹 Cleaning up timeout');
      clearTimeout(timeoutId);
    };
  }, [searchQuery, currentUser?.id]);

  const loadFriendRequests = async () => {
    if (!currentUser?.id) return;
    try {
      const sent = await friendRequestsApi.getFriendRequestsBySenderId(currentUser.id);
      const received = await friendRequestsApi.getFriendRequestsByReceiverId(currentUser.id);
      const all = [...sent, ...received];
      setFriendRequests(all);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const results = await usersApi.searchUsers(searchQuery);
      // Filter out current user
      const filtered = results.filter(user => user.id !== currentUser?.id);
      setUsers(filtered);
    } catch (error) {
      console.error('Search failed:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (user: User) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/profile/${user.id}`);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const getFriendRequestStatus = (userId: string): 'none' | 'pending' | 'sent' | 'received' | 'accepted' => {
    if (!currentUser?.id) return 'none';
    
    const request = friendRequests.find(req => 
      (req.senderId === currentUser.id && req.receiverId === userId) ||
      (req.receiverId === currentUser.id && req.senderId === userId)
    );

    if (!request) return 'none';
    
    if (request.status === 'ACTIVE') return 'accepted';
    if (request.status === 'PENDING') {
      return request.senderId === currentUser.id ? 'sent' : 'received';
    }
    return 'none';
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUser?.id) return;
    
    try {
      console.log('📤 Sending friend request to user:', userId);
      const friendRequest = await friendRequestsApi.createFriendRequest({
        senderId: currentUser.id,
        receiverId: userId,
      });
      console.log('✅ Friend request sent successfully:', friendRequest);
      
      await loadFriendRequests();
      
      // Note: Backend automatically sends socket notification to receiver
      // Receiver will see real-time notification if they have socket connected
    } catch (error: any) {
      console.error('❌ Failed to send friend request:', error);
      alert(error.message || t('findPeople.errorSendRequest'));
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await friendRequestsApi.acceptFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error: any) {
      alert(error.message || t('findPeople.errorAcceptRequest'));
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await friendRequestsApi.rejectFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error: any) {
      alert(error.message || t('findPeople.errorRejectRequest'));
    }
  };

  const handleCancelFriendRequest = async (requestId: string) => {
    try {
      await friendRequestsApi.cancelFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error: any) {
      alert(error.message || t('findPeople.errorCancelRequest'));
    }
  };

  const handleUnfriend = async (userId: string) => {
    if (!currentUser?.id) return;
    if (!confirm(t('friendToast.confirmUnfriend', { name: userId }))) return;
    try {
      await friendRequestsApi.unfriend(currentUser.id, userId);
      await loadFriendRequests();
    } catch (error: any) {
      alert(error.message || t('findPeople.errorUnfriend'));
    }
  };

  const getRequestId = (userId: string): string | null => {
    if (!currentUser?.id) return null;
    
    const request = friendRequests.find(req => 
      (req.senderId === currentUser.id && req.receiverId === userId) ||
      (req.receiverId === currentUser.id && req.senderId === userId)
    );
    
    return request?.id || null;
  };

  const handleMessage = async (user: User) => {
    if (!currentUser?.id || !user.id || user.id === currentUser.id) return;

    try {
      const displayName = user.fullName || user.username || t('findPeople.unknownUser');
      await openChatBoxByUserId(user.id, displayName, user.avatar);
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('findPeople.title')}</h1>
        <p className="text-gray-600">{t('findPeople.subtitle')}</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6" ref={searchRef}>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              console.log('📝 Input changed:', value);
              setSearchQuery(value);
            }}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            placeholder={t('findPeople.searchPlaceholder')}
            className="w-full h-14 pl-14 pr-24 rounded-2xl border border-gray-100/50 dark:border-white/5 bg-gray-100/50 dark:bg-[#1e2133]/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#22263a] transition-all text-gray-900 dark:text-gray-100"
          />

          <button
            onClick={() => {
              handleSearch();
              setShowSuggestions(false);
            }}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('findPeople.searchButton')}
          </button>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-9999 max-h-80 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">
                  {t('findPeople.suggestionsTitle')}
                </div>
                {suggestions.map((user) => {
                  const safeUsername = user.username ?? '';
                  const userInitials = user.fullName
                    ? user.fullName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : safeUsername.charAt(0).toUpperCase();

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSuggestionClick(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {userInitials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">
                          {user.fullName || user.username || safeUsername || t('findPeople.unknownUser')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">@{safeUsername}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {users.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('findPeople.resultsTitle')}</h2>
          <div className="space-y-3">
            {users.map((user) => {
              if (!user.id) return null;
              const safeUsername = user.username ?? '';
              const status = getFriendRequestStatus(user.id);
              const requestId = getRequestId(user.id);
              const userInitials = user.fullName
                ? user.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : safeUsername.charAt(0).toUpperCase();

              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-[#1a1d28] rounded-[32px] p-6 border border-gray-100/50 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300"
                >

                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div 
                      onClick={() => navigate(`/profile/${user.id}`)}
                      className="shrink-0 cursor-pointer"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-14 h-14 rounded-full object-cover hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg hover:opacity-80 transition-opacity">
                          {userInitials}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div 
                      onClick={() => navigate(`/profile/${user.id}`)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">{user.fullName || user.username || safeUsername || t('findPeople.unknownUser')}</p>
                      <p className="text-sm text-gray-500 truncate">@{safeUsername}</p>
                      {user.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="shrink-0 flex items-center gap-2">
                      {/* Message Button - Show for all statuses except none */}
                      {(status === 'sent' || status === 'received' || status === 'accepted') && (
                        <button
                          onClick={() => handleMessage(user)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          title={t('findPeople.messageButtonTitle')}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('findPeople.messageButton')}</span>
                        </button>
                      )}

                      {/* Friend Request Button */}
                      {status === 'none' && (
                        <button
                          onClick={() => {
                            if (user.id) {
                              handleSendFriendRequest(user.id);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <UserPlus className="w-4 h-4" />
                          {t('findPeople.addFriendButton')}
                        </button>
                      )}
                      {status === 'sent' && requestId && (
                        <button
                          onClick={() => handleCancelFriendRequest(requestId)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('friendToast.cancelButton')}</span>
                        </button>
                      )}
                      {status === 'received' && requestId && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptFriendRequest(requestId)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                          >
                            <Check className="w-4 h-4" />
                            {t('findPeople.acceptButton')}
                          </button>
                          <button
                            onClick={() => handleRejectFriendRequest(requestId)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            <X className="w-4 h-4" />
                            {t('findPeople.rejectButton')}
                          </button>
                        </div>
                      )}
                      {status === 'accepted' && user.id && (
                        <button
                          onClick={() => handleUnfriend(user.id!)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('friendToast.unfriendButton')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && searchQuery && users.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('findPeople.emptyNoResults', { query: searchQuery })}</p>
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">{t('findPeople.emptyNoSearch')}</p>
        </div>
      )}
    </div>
  );
}

