import { useEffect, useMemo, useState } from 'react';
import { Search, X, Send } from 'lucide-react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usersApi, type User } from '../../apis/users';
import { conversationsApi } from '../../apis/conversations';
import { getFriends } from '../../apis/friendRequests';
import { useAuth } from '../../contexts/AuthContext';

interface NewMessageLocationState {
  createGroup?: boolean;
}

const FRIENDS_PAGE_SIZE = 20;

export default function NewMessage() {
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: NewMessageLocationState };
  const { user } = useAuth();
  const createGroup = location.state?.createGroup ?? false;
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<User[]>([]);
  const [visibleFriendCount, setVisibleFriendCount] = useState(FRIENDS_PAGE_SIZE);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsLoadError, setFriendsLoadError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!createGroup || !user?.id) {
      setFriendSuggestions([]);
      setVisibleFriendCount(FRIENDS_PAGE_SIZE);
      setFriendsLoadError(null);
      return;
    }

    let cancelled = false;
    const loadFriends = async () => {
      try {
        setFriendsLoading(true);
        setFriendsLoadError(null);
        const friends = await getFriends(user.id);
        if (cancelled) return;

        const mapped: User[] = friends.map((friend) => ({
          id: friend.id,
          fullName: friend.name,
          avatar: friend.avatar,
        }));
        setFriendSuggestions(mapped);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load friends for group creation', err);
        setFriendsLoadError(t('messenger.newMessage.friendsLoadFailed'));
      } finally {
        if (!cancelled) {
          setFriendsLoading(false);
        }
      }
    };

    loadFriends();
    return () => {
      cancelled = true;
    };
  }, [createGroup, user?.id, t]);

  // Fetch users by search query (debounced) for direct chat mode
  useEffect(() => {
    if (createGroup) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await usersApi.searchUsers(trimmed);
        const filtered = results.filter((u) => u.id !== user?.id);
        setSearchResults(filtered);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [searchQuery, user?.id, createGroup]);

  useEffect(() => {
    if (!createGroup) return;
    setVisibleFriendCount(FRIENDS_PAGE_SIZE);
  }, [searchQuery, createGroup]);

  const filteredFriends = useMemo(() => {
    if (!createGroup) return [];
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return friendSuggestions;

    return friendSuggestions.filter((friend) => {
      const name = (friend.fullName || friend.username || '').toLowerCase();
      const email = (friend.email || '').toLowerCase();
      return name.includes(keyword) || email.includes(keyword);
    });
  }, [createGroup, friendSuggestions, searchQuery]);

  const visibleContacts = useMemo(() => {
    if (createGroup) {
      return filteredFriends.slice(0, visibleFriendCount);
    }
    return searchResults;
  }, [createGroup, filteredFriends, visibleFriendCount, searchResults]);

  const canLoadMoreFriends = createGroup && visibleFriendCount < filteredFriends.length;

  const contactNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const contact of friendSuggestions) {
      if (!contact.id) continue;
      map.set(contact.id, contact.fullName || contact.username || contact.id);
    }
    for (const contact of searchResults) {
      if (!contact.id) continue;
      map.set(contact.id, contact.fullName || contact.username || contact.id);
    }
    return map;
  }, [friendSuggestions, searchResults]);

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const removeContact = (id: string) => {
    setSelectedContacts((prev) => prev.filter((c) => c !== id));
  };

  const isGroup = selectedContacts.length >= 2;
  const minimumReached = useMemo(() => {
    // Need at least 1 for direct, 2 (plus self) for group => total >=3
    return selectedContacts.length > 0 && (!isGroup || selectedContacts.length >= 2);
  }, [selectedContacts.length, isGroup]);

  const handleStartConversation = async () => {
    if (!user?.id) {
      setError(t('messenger.newMessage.loginRequired'));
      return;
    }
    if (!minimumReached) {
      setError(t('messenger.newMessage.minimumReached'));
      return;
    }

    setCreating(true);
    setError(null);

    try {
      if (!isGroup) {
        // Direct chat with exactly 1 other user
        const otherUserId = selectedContacts[0];
        const conversation = await conversationsApi.getOrCreateDirectConversation(user.id, otherUserId);
        navigate('/messenger', { state: { openConversationId: conversation.id } });
      } else {
        // Group chat: current user + selected contacts => total >= 3
        const participantIds = Array.from(new Set([...selectedContacts, user.id]));
        if (participantIds.length < 3) {
          setError(t('messenger.newMessage.groupMinMembers'));
          setCreating(false);
          return;
        }

        const conversation = await conversationsApi.createGroupConversation({
          participantIds,
          ownerId: user.id,
          adminIds: [user.id],
          groupName: groupName.trim() || '', // Empty → BE auto-generates from member names
          isGroup: true,
        });

        navigate('/messenger', { state: { openConversationId: conversation.id } });
      }
    } catch (err: any) {
      console.error('Failed to start conversation', err);
      const message = err?.message || t('messenger.newMessage.createConversationFailed');
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-20 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/messenger')}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {createGroup ? t('messenger.newMessage.createGroupTitle') : t('messenger.newMessage.title')}
            </h1>
            <p className="text-sm text-gray-600">
              {createGroup ? t('messenger.newMessage.createGroupSubtitle') : t('messenger.newMessage.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">{t('messenger.newMessage.toLabel')} </span>
            {selectedContacts.map((id) => {
              const name = contactNameById.get(id) || id;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full"
                >
                  <span className="text-sm font-semibold text-blue-700">{name}</span>
                  <button
                    onClick={() => removeContact(id)}
                    className="w-5 h-5 rounded-full hover:bg-blue-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-blue-700" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder={createGroup ? t('messenger.newMessage.searchMembersPlaceholder') : t('messenger.newMessage.searchUsersPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            {t('messenger.newMessage.suggestionsTitle')}
          </h2>
          <div className="space-y-2">
            {searching && <div className="text-sm text-gray-500">{t('messenger.newMessage.searching')}</div>}

            {createGroup && friendsLoading && (
              <div className="text-sm text-gray-500">{t('messenger.newMessage.friendsLoading')}</div>
            )}

            {createGroup && friendsLoadError && (
              <div className="text-sm text-red-600">{friendsLoadError}</div>
            )}

            {!searching && !friendsLoading && visibleContacts.length === 0 && (
              <div className="text-sm text-gray-500">
                {createGroup ? t('messenger.newMessage.emptyFriendMembers') : t('messenger.newMessage.emptySearchUsers')}
              </div>
            )}
            
            {createGroup && selectedContacts.length === 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">
                  {t('messenger.newMessage.createGroupHint')}
                </p>
              </div>
            )}

            {visibleContacts.map((contact) => {
              if (!contact.id) return null;
              const isSelected = selectedContacts.includes(contact.id);
              const color = '#42B72A';
              const initials =
                contact.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ||
                contact.username?.slice(0, 2).toUpperCase() ||
                'US';
              return (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id!)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-lg text-gray-900">{contact.fullName || contact.username}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}

            {canLoadMoreFriends && (
              <button
                onClick={() => setVisibleFriendCount((prev) => prev + FRIENDS_PAGE_SIZE)}
                className="w-full h-11 rounded-lg border border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
              >
                {t('messenger.newMessage.loadMoreFriends')}
              </button>
            )}
          </div>
        </div>
      </div>

      {isGroup && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('messenger.newMessage.groupNameLabel')}</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t('messenger.newMessage.groupNamePlaceholder')}
            className="w-full h-12 px-4 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {error && (
        <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      {/* Start Conversation Button */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleStartConversation}
            disabled={creating}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {creating
              ? t('messenger.newMessage.creating')
              : isGroup
                ? t('messenger.newMessage.createGroupButton')
                : t('messenger.newMessage.startChatButton')}
          </button>
        </div>
      )}
    </div>
  );
}
