import { Link, useParams } from 'react-router-dom';
import { Camera, Plus, UserPlus, Check, X, Loader2, MessageCircle, Heart, Share2, MoreHorizontal, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi } from '../../apis/auth';
import { usersApi, type User } from '../../apis/users';
import { friendRequestsApi, type FriendRequest } from '../../apis/friendRequests';
import { postsApi, type PostData } from '../../apis/posts';
import { reactionsApi } from '../../apis/reactions';
import { commentsApi, type CommentData } from '../../apis/comments';
import { useSocket } from '../../contexts/SocketContext';
import { useChatBox } from '../../contexts/ChatBoxContext';

export default function Profile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loadingFriendRequest, setLoadingFriendRequest] = useState(false);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, CommentData[]>>({});
  const [commentReplies, setCommentReplies] = useState<Record<string, CommentData[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});
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

  // Load user posts
  useEffect(() => {
    const loadUserPosts = async () => {
      if (!id) return;

      setIsLoadingPosts(true);
      try {
        console.log('📡 Loading posts for user:', id);
        const userPosts = await postsApi.getPostsByUserId(id);
        console.log('✅ Loaded user posts:', userPosts.length);
        setPosts(userPosts);

        // Load current user's reactions to mark liked posts
        if (currentUser?.id) {
          try {
            const userReactions = await reactionsApi.getReactionsByUserId(currentUser.id);
            const likedPostIds = new Set(
              userReactions
                .filter(r => r.postId)
                .map(r => r.postId!)
            );
            setLikedPosts(likedPostIds);
            
            const likedCommentIds = new Set(
              userReactions
                .filter(r => r.commentId)
                .map(r => r.commentId!)
            );
            setLikedComments(likedCommentIds);
            console.log('✅ Loaded user reactions:', likedPostIds.size, 'posts,', likedCommentIds.size, 'comments');
          } catch (err) {
            console.error('Failed to load user reactions:', err);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load user posts:', error);
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    if (activeTab === 'posts') {
      loadUserPosts();
    }
  }, [id, activeTab, currentUser?.id]);

  // Subscribe to socket events for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribers = [
      // Listen for reaction events
      subscribe('REACTION_ADDED', (event) => {
        if (event.data?.postId) {
          // Reload the specific post to get updated like count
          postsApi.getPostById(event.data.postId).then(updatedPost => {
            setPosts(prev => prev.map(p => p.id === event.data.postId ? updatedPost : p));
          }).catch(console.error);
        }
      }),

      // Listen for comment events  
      subscribe('COMMENT_CREATED', (event) => {
        if (event.data?.postId) {
          // Reload the specific post to get updated comment count
          postsApi.getPostById(event.data.postId).then(updatedPost => {
            setPosts(prev => prev.map(p => p.id === event.data.postId ? updatedPost : p));
          }).catch(console.error);
        }
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser?.id, subscribe]);

  const toggleComments = async (postId: string) => {
    const isExpanding = !expandedComments.has(postId);
    
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    if (isExpanding && !postComments[postId]) {
      try {
        const comments = await commentsApi.getCommentsByPostId(postId);
        setPostComments(prev => ({ ...prev, [postId]: comments }));
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;

    const isLiked = likedPosts.has(postId);

    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likeCount: (p.likeCount || 0) + (isLiked ? -1 : 1) }
        : p
    ));

    try {
      await reactionsApi.togglePostReaction(postId, currentUser.id, 'LIKE');
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likeCount: (p.likeCount || 0) + (isLiked ? 1 : -1) }
          : p
      ));
    }
  };

  const handleSendComment = async (postId: string) => {
    const comment = commentInputs[postId];
    if (!comment?.trim() || !currentUser) return;

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));

    try {
      const newComment = await commentsApi.createComment(postId, currentUser.id, comment.trim());
      
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));

      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
      ));

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      if (!expandedComments.has(postId)) {
        toggleComments(postId);
      }
    } catch (error) {
      console.error('Failed to send comment:', error);
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleLikeComment = async (commentId: string, postId: string) => {
    if (!currentUser) return;

    const isLiked = likedComments.has(commentId);

    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    setPostComments(prev => ({
      ...prev,
      [postId]: prev[postId]?.map(c => 
        c.id === commentId 
          ? { ...c, likeCount: (c.likeCount || 0) + (isLiked ? -1 : 1) }
          : c
      ) || []
    }));

    try {
      await reactionsApi.toggleCommentReaction(commentId, currentUser.id, 'LIKE');
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });
      setPostComments(prev => ({
        ...prev,
        [postId]: prev[postId]?.map(c => 
          c.id === commentId 
            ? { ...c, likeCount: (c.likeCount || 0) + (isLiked ? 1 : -1) }
            : c
        ) || []
      }));
    }
  };

  const handleReplyToComment = (commentId: string, postId: string) => {
    setReplyingTo(commentId);
    setCommentInputs(prev => ({ ...prev, [`reply-${commentId}`]: '' }));
  };

  const handleSendReply = async (parentCommentId: string, postId: string) => {
    const replyText = commentInputs[`reply-${parentCommentId}`];
    if (!replyText?.trim() || !currentUser) return;

    setIsSubmittingComment(prev => ({ ...prev, [`reply-${parentCommentId}`]: true }));

    try {
      const newReply = await commentsApi.createComment(
        postId, 
        currentUser.id, 
        replyText.trim(), 
        parentCommentId
      );

      setCommentReplies(prev => ({
        ...prev,
        [parentCommentId]: [...(prev[parentCommentId] || []), newReply]
      }));

      setPostComments(prev => ({
        ...prev,
        [postId]: prev[postId]?.map(c => 
          c.id === parentCommentId 
            ? { ...c, replyCount: (c.replyCount || 0) + 1 }
            : c
        ) || []
      }));

      setCommentInputs(prev => ({ ...prev, [`reply-${parentCommentId}`]: '' }));
      setReplyingTo(null);

      if (!expandedReplies.has(parentCommentId)) {
        setExpandedReplies(prev => new Set(prev).add(parentCommentId));
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [`reply-${parentCommentId}`]: false }));
    }
  };

  const toggleReplies = async (commentId: string) => {
    const isExpanding = !expandedReplies.has(commentId);
    
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    if (isExpanding && !commentReplies[commentId]) {
      try {
        const replies = await commentsApi.getRepliesByCommentId(commentId);
        setCommentReplies(prev => ({ ...prev, [commentId]: replies }));
      } catch (error) {
        console.error('Failed to load replies:', error);
      }
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
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
          {activeTab === 'posts' && (
            <>
              {isLoadingPosts ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-200 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-200">
                  <p className="text-sm text-gray-500 text-center">No posts yet</p>
                </div>
              ) : (
                posts.map((post) => {
                  const isCommentsExpanded = expandedComments.has(post.id!);
                  const commentInput = commentInputs[post.id!] || '';

                  return (
                    <div key={post.id} className="bg-white rounded-2xl border border-gray-200">
                      {/* Post Header */}
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                            {post.authorAvatar ? (
                              <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              post.authorName?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{post.authorName || 'Unknown User'}</p>
                            <p className="text-sm text-gray-500">{getTimeAgo(post.createdAt)}</p>
                          </div>
                        </div>
                        <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="px-5 pb-4">
                        <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Post Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="mb-4">
                          {post.images.length === 1 ? (
                            <img src={post.images[0]} alt="Post" className="w-full max-h-[600px] object-cover" />
                          ) : (
                            <div className="grid grid-cols-2 gap-1">
                              {post.images.map((img, idx) => (
                                <img key={idx} src={img} alt={`Post ${idx + 1}`} className="w-full h-[250px] object-cover" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Post Videos */}
                      {post.videos && post.videos.length > 0 && (
                        <div className="mb-4">
                          {post.videos.map((video, idx) => (
                            <video key={idx} src={video} controls className="w-full max-h-[600px] bg-black" />
                          ))}
                        </div>
                      )}

                      {/* Post Stats */}
                      <div className="px-5 pb-3">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span className="font-semibold">{post.likeCount || 0} likes</span>
                          <div className="flex items-center gap-4">
                            <span>{post.commentCount || 0} comments</span>
                            <span>·</span>
                            <span>{post.shareCount || 0} shares</span>
                          </div>
                        </div>

                        {/* Post Actions */}
                        <div className="border-t border-gray-200 pt-3 flex items-center">
                          <button
                            onClick={() => handleLikePost(post.id!)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
                              likedPosts.has(post.id!) ? 'text-red-500' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${
                              likedPosts.has(post.id!) ? 'text-red-500 fill-red-500' : 'text-gray-500'
                            }`} />
                            <span className="text-sm font-medium">
                              {likedPosts.has(post.id!) ? 'Liked' : 'Like'}
                            </span>
                          </button>
                          <button
                            onClick={() => toggleComments(post.id!)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
                              isCommentsExpanded ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                            }`}
                          >
                            <MessageCircle className={`w-5 h-5 ${isCommentsExpanded ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className="text-sm font-medium">Comment</span>
                          </button>
                          <Link
                            to={`/post/${post.id}/share`}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Share2 className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Share</span>
                          </Link>
                        </div>

                        {/* Comments Section */}
                        {isCommentsExpanded && (
                          <div className="border-t border-gray-200 pt-4 mt-3 space-y-3">
                            {/* Comment Input */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                                {currentUser?.fullName?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={commentInput}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id!]: e.target.value }))}
                                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment(post.id!)}
                                  placeholder="Write a comment..."
                                  disabled={isSubmittingComment[post.id!]}
                                  className="w-full h-10 px-4 pr-12 rounded-full bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <button
                                  onClick={() => handleSendComment(post.id!)}
                                  disabled={!commentInput.trim() || isSubmittingComment[post.id!]}
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center ${
                                    commentInput.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  {isSubmittingComment[post.id!] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Comments List */}
                            {postComments[post.id!] && postComments[post.id!].length > 0 && (
                              <div className="space-y-3">
                                {postComments[post.id!].map((comment) => (
                                  <div key={comment.id} className="flex flex-col gap-2">
                                    {/* Main Comment */}
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                                        {comment.userName?.charAt(0) || 'U'}
                                      </div>
                                      <div className="flex-1">
                                        <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                          <p className="font-semibold text-sm text-gray-900">{comment.userName || 'Unknown'}</p>
                                          <p className="text-gray-700 text-sm">{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 px-3">
                                          <button 
                                            onClick={() => handleLikeComment(comment.id!, post.id!)}
                                            className={`text-xs font-semibold transition-colors ${
                                              likedComments.has(comment.id!) 
                                                ? 'text-red-600' 
                                                : 'text-gray-600 hover:text-blue-600'
                                            }`}
                                          >
                                            {likedComments.has(comment.id!) ? 'Liked' : 'Like'}
                                            {comment.likeCount && comment.likeCount > 0 && ` (${comment.likeCount})`}
                                          </button>
                                          <button 
                                            onClick={() => handleReplyToComment(comment.id!, post.id!)}
                                            className="text-xs font-semibold text-gray-600 hover:text-blue-600"
                                          >
                                            Reply
                                          </button>
                                          {comment.replyCount && comment.replyCount > 0 && (
                                            <button
                                              onClick={() => toggleReplies(comment.id!)}
                                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                              {expandedReplies.has(comment.id!) ? 'Hide' : 'View'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                                            </button>
                                          )}
                                          <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
                                        </div>

                                        {/* Reply Input */}
                                        {replyingTo === comment.id && (
                                          <div className="flex items-center gap-2 mt-2">
                                            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                              {currentUser?.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 relative">
                                              <input
                                                type="text"
                                                value={commentInputs[`reply-${comment.id}`] || ''}
                                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [`reply-${comment.id}`]: e.target.value }))}
                                                onKeyPress={(e) => {
                                                  if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendReply(comment.id!, post.id!);
                                                  }
                                                }}
                                                placeholder={`Reply to ${comment.userName}...`}
                                                disabled={isSubmittingComment[`reply-${comment.id}`]}
                                                className="w-full h-8 px-3 pr-9 rounded-full bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => handleSendReply(comment.id!, post.id!)}
                                                disabled={!commentInputs[`reply-${comment.id}`]?.trim() || isSubmittingComment[`reply-${comment.id}`]}
                                                className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${
                                                  commentInputs[`reply-${comment.id}`]?.trim() 
                                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                              >
                                                {isSubmittingComment[`reply-${comment.id}`] ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <Send className="w-3 h-3" />
                                                )}
                                              </button>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setReplyingTo(null);
                                                setCommentInputs(prev => ({ ...prev, [`reply-${comment.id}`]: '' }));
                                              }}
                                              className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        )}

                                        {/* Replies List */}
                                        {expandedReplies.has(comment.id!) && commentReplies[comment.id!] && commentReplies[comment.id!].length > 0 && (
                                          <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
                                            {commentReplies[comment.id!].map((reply) => (
                                              <div key={reply.id} className="flex items-start gap-2">
                                                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                                  {reply.userName?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                  <div className="bg-gray-50 rounded-2xl px-3 py-1.5">
                                                    <p className="font-semibold text-sm text-gray-900">{reply.userName || 'Unknown'}</p>
                                                    <p className="text-gray-700 text-sm">{reply.content}</p>
                                                  </div>
                                                  <div className="flex items-center gap-2 mt-1 px-2">
                                                    <button 
                                                      onClick={() => handleLikeComment(reply.id!, post.id!)}
                                                      className={`text-xs font-semibold transition-colors ${
                                                        likedComments.has(reply.id!) 
                                                          ? 'text-red-600' 
                                                          : 'text-gray-600 hover:text-blue-600'
                                                      }`}
                                                    >
                                                      {likedComments.has(reply.id!) ? 'Liked' : 'Like'}
                                                      {reply.likeCount && reply.likeCount > 0 && ` (${reply.likeCount})`}
                                                    </button>
                                                    <span className="text-xs text-gray-500">{getTimeAgo(reply.createdAt)}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab !== 'posts' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 text-center py-6">Content for {activeTab} tab</p>
            </div>
          )}
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
