import { Link, useParams } from 'react-router-dom';
import { Camera, Plus, UserPlus, Check, X, Loader2, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi } from '../../apis/auth';
import { usersApi, type User } from '../../apis/users';
import { friendRequestsApi, type FriendRequest } from '../../apis/friendRequests';
import { useSocket } from '../../contexts/SocketContext';
import { useChatBox } from '../../contexts/ChatBoxContext';

export default function Profile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loadingFriendRequest, setLoadingFriendRequest] = useState(false);
  const currentUser = authApi.getCurrentUser();
  const { subscribe } = useSocket();
  const { openChatBoxByUserId } = useChatBox();
  
  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!id) {
        return;
      }

      // If viewing own profile, use current user data
      if (currentUser && currentUser.id === id) {
        setProfileUser({
          id: currentUser.id,
          username: currentUser.username,
          firstName: currentUser.fullName.split(' ')[0] || '',
          lastName: currentUser.fullName.split(' ').slice(1).join(' ') || '',
          fullName: currentUser.fullName,
          avatar: currentUser.avatar,
          email: '',
          isActive: true,
          isVerified: false,
          role: currentUser.role,
        });
        return;
      }

      // Otherwise, fetch user data from API
      try {
        console.log('🔍 Loading user profile for ID:', id);
        const user = await usersApi.getUserById(id);
        console.log('✅ User profile loaded:', user);
        setProfileUser(user);
      } catch (error) {
        console.error('❌ Failed to load user profile:', error);
        setProfileUser(null);
      }
    };

    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  // Subscribe to socket notifications for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribe('NOTIFICATION', (event) => {
      if (event.type === 'NOTIFICATION' && event.data) {
        const notification = event.data;
        
        if (notification.type === 'FRIEND_REQUEST' || 
            notification.type === 'FRIEND_ACCEPTED' || 
            notification.type === 'FRIEND_REJECTED') {
          // Reload friend requests when notification arrives
          if (profileUser?.id) {
            loadFriendRequests();
          }
        }
      }
    });

    return unsubscribe;
  }, [currentUser?.id, profileUser?.id, subscribe]);

  const loadFriendRequests = async () => {
    if (!currentUser?.id || !profileUser?.id) return;
    
    try {
      const sent = await friendRequestsApi.getFriendRequestsBySenderId(currentUser.id);
      const received = await friendRequestsApi.getFriendRequestsByReceiverId(currentUser.id);
      const all = [...sent, ...received];
      setFriendRequests(all);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  // Load friend requests when profile user changes
  useEffect(() => {
    if (currentUser?.id && profileUser?.id) {
      loadFriendRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, profileUser?.id]);

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

  const getRequestId = (userId: string): string | null => {
    if (!currentUser?.id) return null;
    
    const request = friendRequests.find(req => 
      (req.senderId === currentUser.id && req.receiverId === userId) ||
      (req.receiverId === currentUser.id && req.senderId === userId)
    );
    
    return request?.id || null;
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUser?.id) return;
    
    setLoadingFriendRequest(true);
    try {
      console.log('📤 Sending friend request to user:', userId);
      const friendRequest = await friendRequestsApi.createFriendRequest({
        senderId: currentUser.id,
        receiverId: userId,
      });
      console.log('✅ Friend request sent successfully:', friendRequest);
      
      // Reload friend requests immediately to update UI
      // Backend will send socket notification to receiver automatically
      await loadFriendRequests();
      
      console.log('✅ Friend requests reloaded, status should be updated now');
    } catch (error) {
      console.error('❌ Failed to send friend request:', error);
      const message = error instanceof Error ? error.message : 'Failed to send friend request';
      alert(message);
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    setLoadingFriendRequest(true);
    try {
      await friendRequestsApi.acceptFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept friend request';
      alert(message);
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    setLoadingFriendRequest(true);
    try {
      await friendRequestsApi.rejectFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject friend request';
      alert(message);
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const handleMessageClick = async () => {
    if (!displayUser) return;
    try {
      await openChatBoxByUserId(displayUser.id, displayUser.fullName);
    } catch (error) {
      console.error('Failed to open chatbox:', error);
    }
  };
  
  const displayUser = profileUser;
  const displayName = displayUser?.fullName || 'Loading...';
  const displayAvatar = displayUser?.avatar || null;
  const displayInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4 pb-8">
        {/* Cover Photo */}
        <div className="relative h-[280px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden">
          {currentUser && currentUser.id === id && (
            <button className="absolute bottom-3 right-3 bg-white/95 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white transition-colors text-sm font-medium text-gray-700">
              <Camera className="w-4 h-4" />
              <span>Edit Cover</span>
            </button>
          )}
        </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl p-4 -mt-16 relative border border-gray-200">
        <div className="flex items-end justify-between mb-4 pt-12">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center overflow-hidden">
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-white font-semibold text-2xl">${displayInitials}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-white font-semibold text-2xl">{displayInitials}</span>
                )}
              </div>
              {currentUser && currentUser.id === id && (
                <button className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center shadow-sm transition-colors">
                  <Camera className="w-4 h-4 text-gray-700" />
                </button>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">{displayName}</h1>
              <p className="text-sm text-gray-600">1,234 friends</p>
            </div>
          </div>
          {currentUser && currentUser.id === id && (
            <div className="flex gap-2 pb-1">
              <button className="h-10 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                <span>Add Story</span>
              </button>
              <Link
                to="/profile/edit"
                className="h-10 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                <span>Edit Profile</span>
              </Link>
            </div>
          )}
          {currentUser && currentUser.id !== id && displayUser && (() => {
            const status = getFriendRequestStatus(displayUser.id);
            const requestId = getRequestId(displayUser.id);
            
            return (
              <div className="flex gap-2 pb-1">
                <button 
                  onClick={handleMessageClick}
                  className="h-10 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
                
                {status === 'none' && (
                  <button
                    onClick={() => handleSendFriendRequest(displayUser.id)}
                    disabled={loadingFriendRequest}
                    className="h-10 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingFriendRequest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>Add Friend</span>
                  </button>
                )}
                
                {status === 'sent' && (
                  <button
                    disabled
                    className="h-10 px-4 bg-gray-200 text-gray-600 font-medium rounded-lg cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <span>Pending</span>
                  </button>
                )}
                
                {status === 'received' && requestId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptFriendRequest(requestId)}
                      disabled={loadingFriendRequest}
                      className="h-10 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleRejectFriendRequest(requestId)}
                      disabled={loadingFriendRequest}
                      className="h-10 px-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
                
                {status === 'accepted' && (
                  <button
                    disabled
                    className="h-10 px-4 bg-green-100 text-green-700 font-medium rounded-lg cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Friends</span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-t border-gray-200 pt-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'about', label: 'About' },
            { id: 'friends', label: 'Friends' },
            { id: 'photos', label: 'Photos' },
            { id: 'videos', label: 'Videos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium text-base relative transition-all duration-200 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Post Card Example */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500 text-center py-6">No posts to show</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Intro Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Intro</h3>
            <p className="text-xs text-gray-600 mb-3">{displayUser?.bio || 'No introduction yet'}</p>
            {currentUser && currentUser.id === id && (
              <button className="w-full h-9 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
                Edit Details
              </button>
            )}
          </div>

          {/* Photos Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Photos</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                ></div>
              ))}
            </div>
            <Link
              to={`/profile/${id}/photos`}
              className="block text-center text-blue-600 text-xs font-medium hover:underline"
            >
              See All Photos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
