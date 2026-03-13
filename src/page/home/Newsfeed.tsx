import { Link } from 'react-router-dom';
import { Image, Smile, Activity, MessageCircle, Share2, Heart, MoreHorizontal, Send, Edit, Trash2, Bookmark, EyeOff, Flag, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LocationIcon } from '../../common/icons/IconComponents';
import { authApi } from '../../apis/auth';
import { postsApi } from '../../apis/posts';
import type { PostData } from '../../apis/posts';
import type { Story } from '../../types/story';
import { reactionsApi } from '../../apis/reactions';
import { commentsApi, type CommentData } from '../../apis/comments';
import { useSocket } from '../../contexts/SocketContext';
import { storiesApi } from '../../apis/storiesApi';
import { API_CONFIG } from '../../apis/config';
import AddStoryCard from '../../components/story/AddStoryCard';
import StoryViewer from '../../components/story/StoryViewer';
// import StoryViewer from './StoryViewer';
import CreateStoryModal from '../../components/story/CreateStoryModal';
export default function Newsfeed() {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [postComments, setPostComments] = useState<Record<string, CommentData[]>>({});
  const [commentReplies, setCommentReplies] = useState<Record<string, CommentData[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});
  const { subscribe } = useSocket();
  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [viewerUserIndex, setViewerUserIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  // Load posts from API
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoadingPosts(true);
        setError(null);
        const data = await postsApi.getAllPosts();
        setPosts(data);
        console.log('✅ Loaded posts:', data.length);

        // Load user's reactions to mark liked posts
        if (currentUser?.id) {
          try {
            const userReactions = await reactionsApi.getReactionsByUserId(currentUser.id);
            const likedPostIds = new Set(
              userReactions
                .filter(r => r.postId) // Only post reactions
                .map(r => r.postId!)
            );
            setLikedPosts(likedPostIds);

            const likedCommentIds = new Set(
              userReactions
                .filter(r => r.commentId) // Only comment reactions
                .map(r => r.commentId!)
            );
            setLikedComments(likedCommentIds);
            console.log('✅ Loaded user reactions:', likedPostIds.size, 'posts,', likedCommentIds.size, 'comments');
          } catch (err) {
            console.error('Failed to load user reactions:', err);
          }
        }
      } catch (err: any) {
        console.error('❌ Failed to load posts:', err);

        // MOCK DATA for testing without authentication
        console.log('⚠️ Using mock data for testing...');
        setPosts([
          {
            id: 'mock-1',
            authorId: 'user-1',
            authorName: 'Sarah Johnson',
            authorAvatar: '',
            content: 'Just finished an amazing hike! The view was breathtaking 🏔️',
            images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4'],
            location: 'Swiss Alps',
            visibility: 'PUBLIC',
            allowComments: true,
            allowSharing: true,
            likeCount: 124,
            commentCount: 8,
            shareCount: 12,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'mock-2',
            authorId: 'user-2',
            authorName: 'Mike Chen',
            authorAvatar: '',
            content: 'Working on a new project. Excited to share it soon! 💻✨',
            visibility: 'PUBLIC',
            allowComments: true,
            allowSharing: true,
            likeCount: 89,
            commentCount: 5,
            shareCount: 3,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'mock-3',
            authorId: 'user-3',
            authorName: 'Emma Davis',
            authorAvatar: '',
            content: 'Beautiful sunset today 🌅 Nature never fails to amaze me!',
            images: ['https://images.unsplash.com/photo-1495616811223-4d98c6e9c869'],
            visibility: 'PUBLIC',
            allowComments: true,
            allowSharing: true,
            likeCount: 256,
            commentCount: 15,
            shareCount: 8,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
        setError(null); // Clear error when using mock data
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();
  }, [currentUser?.id]);

  // Load stories from API
  useEffect(() => {
    if (!currentUser?.id) return;

    setLoadingStories(true);

    storiesApi
      .getStoryFeed(currentUser.id)
      .then((data) => {
        setStories(data);
      })
      .catch((err) => {
        console.error('Failed to load stories', err);
      })
      .finally(() => {
        setLoadingStories(false);
      });
  }, [currentUser?.id]);

  stories.forEach((story, index) => {
    console.log(`Story ${index}:`, story);
  });

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

      // Listen for new posts (including shares)
      subscribe('POST_CREATED', (event) => {
        if (event.data) {
          // Add new post to the top of the feed
          setPosts(prev => [event.data, ...prev]);
        }
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser?.id, subscribe]);
  const storiesByUser = stories.reduce<Record<string, Story[]>>((acc: any, story: any) => {
    const userId = story.user.id;

    if (!acc[userId]) {
      acc[userId] = [];
    }

    acc[userId].push(story);
    return acc;
  }, {});
  const storyGroups: Story[][] = Object.values(storiesByUser);
  // const handleViewStory = (storyId: string) => {
  //   setSelectedStoryId(storyId);
  //   setIsStoryViewerOpen(true);
  // };

  // const handleStoryCreated = async () => {
  //   // Reload stories after creating new one
  //   try {
  //     const data = await storiesApi.getAllActiveStories();
  //     setStories(Array.isArray(data) ? data : []);
  //   } catch (err) {
  //     console.error('Failed to reload stories:', err);
  //     setStories([]);
  //   }
  // };

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

    // Load comments when expanding
    if (isExpanding && !postComments[postId]) {
      try {
        const comments = await commentsApi.getCommentsByPostId(postId);
        setPostComments(prev => ({ ...prev, [postId]: comments }));
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSendComment = async (postId: string) => {
    const comment = commentInputs[postId];
    if (!comment?.trim() || !currentUser) return;

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));    try {
      const newComment = await commentsApi.createComment({
        postId,
        userId: currentUser.id,
        content: comment.trim(),
      });

      // Add comment to state
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));

      // Update post comment count
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
      ));

      // Clear input
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

      // Expand comments if not already expanded
      if (!expandedComments.has(postId)) {
        toggleComments(postId);
      }
    } catch (error) {
      console.error('Failed to send comment:', error);
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;

    const isLiked = likedPosts.has(postId);

    // Optimistic update
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
      console.error('Failed to toggle post reaction:', error);
      // Revert on error
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

  const handleLikeComment = async (commentId: string, postId: string) => {
    if (!currentUser) return;

    const isLiked = likedComments.has(commentId);

    // Optimistic update
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
      console.error('Failed to toggle comment reaction:', error);
      // Revert on error
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
  };  const handleReplyToComment = (commentId: string) => {
    setReplyingTo(commentId);
    setCommentInputs(prev => ({ ...prev, [`reply-${commentId}`]: '' }));
  };

  const handleSendReply = async (parentCommentId: string, postId: string) => {
    const replyText = commentInputs[`reply-${parentCommentId}`];
    if (!replyText?.trim() || !currentUser) return;

    setIsSubmittingComment(prev => ({ ...prev, [`reply-${parentCommentId}`]: true }));    try {
      const newReply = await commentsApi.createComment({
        postId,
        userId: currentUser.id,
        content: replyText.trim(),
        parentCommentId,
      });

      // Add reply to state
      setCommentReplies(prev => ({
        ...prev,
        [parentCommentId]: [...(prev[parentCommentId] || []), newReply]
      }));

      // Update parent comment reply count
      setPostComments(prev => ({
        ...prev,
        [postId]: prev[postId]?.map(c =>
          c.id === parentCommentId
            ? { ...c, replyCount: (c.replyCount || 0) + 1 }
            : c
        ) || []
      }));

      // Clear input and close reply mode
      setCommentInputs(prev => ({ ...prev, [`reply-${parentCommentId}`]: '' }));
      setReplyingTo(null);

      // Expand replies if not already expanded
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

    // Load replies when expanding
    if (isExpanding && !commentReplies[commentId]) {
      try {
        const replies = await commentsApi.getRepliesByCommentId(commentId);
        setCommentReplies(prev => ({ ...prev, [commentId]: replies }));
      } catch (error) {
        console.error('Failed to load replies:', error);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let clickedInsideAnyMenu = false;

      Object.values(menuRefs.current).forEach((ref) => {
        if (ref && ref.contains(target)) {
          clickedInsideAnyMenu = true;
        }
      });

      if (!clickedInsideAnyMenu && openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handlePostAction = async (postId: string, action: string) => {
    setOpenMenuId(null);

    if (action === 'edit') {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setEditingPostId(postId);
        setEditContent(post.content);
      }
    } else if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this post?')) {
        try {
          setIsDeleting(postId);
          await postsApi.deletePost(postId);
          setPosts(prev => prev.filter(p => p.id !== postId));
          console.log('✅ Post deleted successfully');
        } catch (error) {
          console.error('❌ Failed to delete post:', error);
          alert('Failed to delete post. Please try again.');
        } finally {
          setIsDeleting(null);
        }
      }
    } else if (action === 'save') {
      console.log('Save post:', postId);
      // TODO: Implement save post functionality
    } else if (action === 'hide') {
      console.log('Hide post:', postId);
      // TODO: Implement hide post functionality
    } else if (action === 'report') {
      console.log('Report post:', postId);
      // TODO: Implement report post functionality
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) {
      alert('Post content cannot be empty');
      return;
    }

    try {
      // Get the current post to preserve images and videos
      const currentPost = posts.find(p => p.id === postId);

      const updatedPost = await postsApi.updatePost(postId, {
        content: editContent.trim(),
        images: currentPost?.images, // Preserve existing images
        videos: currentPost?.videos, // Preserve existing videos
        location: currentPost?.location, // Preserve location
        visibility: currentPost?.visibility, // Preserve visibility
      });

      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      setEditingPostId(null);
      setEditContent('');
      console.log('✅ Post updated successfully');
    } catch (error) {
      console.error('❌ Failed to update post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
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

  const getAuthorInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Stories Section */}
      {/* Stories Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-1">

          {/* Add Story (Facebook Web style) */}
          {currentUser && (
            <AddStoryCard
              avatar={currentUser.avatar}
              onClick={() => setShowCreateStory(true)}
            />
          )}
          {loadingStories && (
            <div className="flex items-center justify-center w-full h-48 text-gray-500">
              Đang tải stories...
            </div>
          )}
          {/* Friends Stories */}
          {storyGroups.map((group, index) => {
            const firstStory = group[0];

            return (
              <button
                key={firstStory.user.id}
                onClick={() => setViewerUserIndex(index)}
                className="shrink-0 w-32 text-left"
              >
                <div className="w-32 h-48 rounded-2xl bg-gradient-to-b from-blue-500 to-purple-500 p-[2px] relative overflow-hidden">
                  {/* Story Content Background */}
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    {/* Story preview */}
                    {firstStory.contentType === 'image' && (
                      <img
                        src={`${API_CONFIG.COMMON_SERVICE_URL}${firstStory.content}`}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {firstStory.contentType === 'text' && (
                      <div
                        className={`w-full h-full ${firstStory.background} flex items-center justify-center p-3`}
                      >
                        <p className="text-white text-sm font-semibold text-center line-clamp-4">
                          {firstStory.content}
                        </p>
                      </div>
                    )}

                    {firstStory.contentType === 'video' && (
                      <video
                        src={`${API_CONFIG.COMMON_SERVICE_URL}${firstStory.content}`}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        onLoadedMetadata={(e) => {
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    )}


                    {/* Gradient overlay for better avatar visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

                    {/* User Avatar */}
                    <div className="absolute top-3 left-3">
                      <img
                        src={firstStory.user.avatar}
                        alt={firstStory.user.name}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-center mt-3 font-medium truncate text-sm">
                  {firstStory.user.name}
                </p>
              </button>
            );
          })}


        </div>
      </div>


      {/* Create Post */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && currentUser) {
                    const initials = currentUser.fullName
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    parent.innerHTML = `<span class="text-white font-semibold text-base">${initials}</span>`;
                  }
                }}
              />
            ) : currentUser?.fullName ? (
              <span className="text-white font-semibold text-base">
                {currentUser.fullName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            ) : (
              <span className="text-white font-semibold text-base">JD</span>
            )}
          </div>
          <Link
            to="/post/create"
            className="flex-1 h-14 px-5 rounded-xl bg-gray-50 hover:bg-gray-100 text-left flex items-center text-gray-600 hover:text-gray-900 cursor-pointer text-base font-medium transition-colors"
          >
            What's on your mind, {currentUser?.fullName?.split(' ')[0] || 'John'}?
          </Link>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Link
            to="/post/create"
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Image className="w-6 h-6 text-green-600" />
            <span className="text-base text-gray-700 font-medium">Photo</span>
          </Link>
          <Link
            to="/post/create"
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Smile className="w-6 h-6 text-yellow-600" />
            <span className="text-base text-gray-700 font-medium">Feeling</span>
          </Link>
          <Link
            to="/post/create"
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-6 h-6 text-red-600" />
            <span className="text-base text-gray-700 font-medium">Activity</span>
          </Link>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {/* Loading State */}
        {isLoadingPosts && (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-gray-500">Loading posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoadingPosts && (
          <div className="bg-white rounded-2xl p-8 border border-red-200">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingPosts && !error && posts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
            <p className="text-gray-500 text-lg">No posts yet. Be the first to post!</p>
            <Link
              to="/post/create"
              className="mt-4 inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Post
            </Link>
          </div>
        )}

        {/* Posts List */}
        {!isLoadingPosts && !error && posts.map((post) => {
          const isCommentsExpanded = expandedComments.has(post.id!);
          const commentInput = commentInputs[post.id!] || '';

          return (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors relative">
              {/* Post Header */}
              <div className="p-5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0 bg-blue-500">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      getAuthorInitials(post.authorName)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-base">{post.authorName || 'Unknown User'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{getTimeAgo(post.createdAt)}</span>
                      {post.location && (
                        <>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <LocationIcon className="w-4 h-4" />
                            <span>{post.location}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative" ref={(el) => {
                  if (el && post.id) menuRefs.current[post.id] = el;
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === post.id ? null : post.id!);
                    }}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>

                  {openMenuId === post.id && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-20">
                      {currentUser?.id === post.authorId && (
                        <>
                          <button
                            onClick={() => handlePostAction(post.id!, 'edit')}
                            className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                          >
                            <Edit className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-900 font-medium">Edit post</span>
                          </button>
                          <button
                            onClick={() => handlePostAction(post.id!, 'delete')}
                            className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                            <span className="text-red-600 font-medium">Delete post</span>
                          </button>
                          <div className="h-px bg-gray-200 my-2" />
                        </>
                      )}
                      <button
                        onClick={() => handlePostAction(post.id!, 'save')}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <Bookmark className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">Save post</span>
                      </button>
                      <button
                        onClick={() => handlePostAction(post.id!, 'hide')}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <EyeOff className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">Hide post</span>
                      </button>
                      <button
                        onClick={() => handlePostAction(post.id!, 'report')}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <Flag className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">Report post</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="px-5 pb-4">
                {editingPostId === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="What's on your mind?"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdatePost(post.id!)}
                        disabled={!editContent.trim()}
                        className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                )}
              </div>

              {/* Deleting Overlay */}
              {isDeleting === post.id && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-30 rounded-2xl">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">Deleting post...</p>
                  </div>
                </div>
              )}

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className="mb-4">
                  {post.images.length === 1 ? (
                    <img
                      src={post.images[0]}
                      alt="Post"
                      className="w-full max-h-[600px] object-cover"
                    />
                  ) : post.images.length === 2 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {post.images.map((imageUrl, idx) => (
                        <img
                          key={idx}
                          src={imageUrl}
                          alt={`Post ${idx + 1}`}
                          className="w-full h-[300px] object-cover"
                        />
                      ))}
                    </div>
                  ) : post.images.length === 3 ? (
                    <div className="grid grid-cols-2 gap-1">
                      <img
                        src={post.images[0]}
                        alt="Post 1"
                        className="w-full h-[400px] object-cover row-span-2"
                      />
                      <img
                        src={post.images[1]}
                        alt="Post 2"
                        className="w-full h-[199px] object-cover"
                      />
                      <img
                        src={post.images[2]}
                        alt="Post 3"
                        className="w-full h-[199px] object-cover"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {post.images.slice(0, 4).map((imageUrl, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Post ${idx + 1}`}
                            className="w-full h-[250px] object-cover"
                          />
                          {idx === 3 && post.images!.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-3xl font-bold">
                                +{post.images!.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Post Videos */}
              {post.videos && post.videos.length > 0 && (
                <div className="mb-4 space-y-2">
                  {post.videos.map((videoUrl, idx) => (
                    <video
                      key={idx}
                      src={videoUrl}
                      controls
                      className="w-full max-h-[600px] bg-black"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ))}
                </div>
              )}

              {/* Post Stats */}
              <div className="px-5 pb-3">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold">{post.likeCount || 0} likes</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{post.commentCount || 0} comments</span>
                    <span>·</span>
                    <span className="font-medium">{post.shareCount || 0} shares</span>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="border-t border-gray-200 pt-3 flex items-center">
                  <button
                    onClick={() => handleLikePost(post.id!)}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg transition-colors group ${likedPosts.has(post.id!) ? 'text-red-500' : 'hover:bg-gray-50'
                      }`}
                  >
                    <Heart className={`w-6 h-6 transition-colors ${likedPosts.has(post.id!)
                        ? 'text-red-500 fill-red-500'
                        : 'text-gray-500 group-hover:text-red-500 group-hover:fill-red-500'
                      }`} />
                    <span className={`text-base font-medium ${likedPosts.has(post.id!) ? 'text-red-500' : 'text-gray-700 group-hover:text-red-500'
                      }`}>
                      {likedPosts.has(post.id!) ? 'Liked' : 'Like'}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id!)}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg transition-colors ${isCommentsExpanded
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <MessageCircle className={`w-6 h-6 ${isCommentsExpanded ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-base font-medium">Comment</span>
                  </button>
                  <Link
                    to={`/post/${post.id}/share`}
                    className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <Share2 className="w-6 h-6 text-gray-500 group-hover:text-green-600 transition-colors" />
                    <span className="text-base text-gray-700 font-medium group-hover:text-green-600">Share</span>
                  </Link>
                </div>

                {/* Comments Section */}
                {isCommentsExpanded && (
                  <div className="border-t border-gray-200 pt-5 mt-3 space-y-4">
                    {/* Comment Input */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {currentUser?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => handleCommentChange(post.id!, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment(post.id!)}
                          placeholder="Viết bình luận..."
                          disabled={isSubmittingComment[post.id!]}
                          className="w-full h-12 px-4 pr-14 rounded-lg bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all disabled:opacity-50"
                        />
                        <button
                          onClick={() => handleSendComment(post.id!)}
                          disabled={!commentInput.trim()}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${commentInput.trim()
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          {isSubmittingComment[post.id!] ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {postComments[post.id!] && postComments[post.id!].length > 0 && (
                      <div className="space-y-3 mt-4">
                        {postComments[post.id!].map((comment) => (
                          <div key={comment.id} className="flex flex-col gap-2">
                            {/* Main Comment */}
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                {comment.userName?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                                  <p className="font-semibold text-sm text-gray-900">{comment.userName || 'Unknown'}</p>
                                  <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-1.5 px-3">
                                  <button
                                    onClick={() => handleLikeComment(comment.id!, post.id!)}
                                    className={`text-xs font-semibold transition-colors ${likedComments.has(comment.id!)
                                        ? 'text-red-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                      }`}
                                  >
                                    {likedComments.has(comment.id!) ? 'Liked' : 'Like'}
                                    {comment.likeCount && comment.likeCount > 0 && ` (${comment.likeCount})`}
                                  </button>                                <button
                                    onClick={() => handleReplyToComment(comment.id!)}
                                    className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                                  >
                                    Reply
                                  </button>
                                  {comment.replyCount && comment.replyCount > 0 && (
                                    <button
                                      onClick={() => toggleReplies(comment.id!)}
                                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                      {expandedReplies.has(comment.id!) ? 'Hide' : 'View'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                                    </button>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}
                                  </span>
                                </div>

                                {/* Reply Input */}
                                {replyingTo === comment.id && (
                                  <div className="flex items-center gap-2 mt-3 ml-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
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
                                        className="w-full h-9 px-3 pr-10 rounded-full bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSendReply(comment.id!, post.id!)}
                                        disabled={!commentInputs[`reply-${comment.id}`]?.trim() || isSubmittingComment[`reply-${comment.id}`]}
                                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${commentInputs[`reply-${comment.id}`]?.trim()
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          }`}
                                      >
                                        {isSubmittingComment[`reply-${comment.id}`] ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Send className="w-3.5 h-3.5" />
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
                                  <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                                    {commentReplies[comment.id!].map((reply) => (
                                      <div key={reply.id} className="flex items-start gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                          {reply.userName?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1">
                                          <div className="bg-gray-50 rounded-2xl px-3 py-2">
                                            <p className="font-semibold text-sm text-gray-900">{reply.userName || 'Unknown'}</p>
                                            <p className="text-gray-700 text-sm mt-0.5">{reply.content}</p>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 px-2">
                                            <button
                                              onClick={() => handleLikeComment(reply.id!, post.id!)}
                                              className={`text-xs font-semibold transition-colors ${likedComments.has(reply.id!)
                                                  ? 'text-red-600'
                                                  : 'text-gray-600 hover:text-blue-600'
                                                }`}
                                            >
                                              {likedComments.has(reply.id!) ? 'Liked' : 'Like'}
                                              {reply.likeCount && reply.likeCount > 0 && ` (${reply.likeCount})`}
                                            </button>
                                            <span className="text-xs text-gray-500">
                                              {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Just now'}
                                            </span>
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
        })}
      </div>      {/* Story Viewer */}
      {viewerUserIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialUserIndex={viewerUserIndex}
          onClose={() => setViewerUserIndex(null)}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onCreate={(story: Story) => {
            setStories((prev: Story[]) => [story, ...prev]);
            setShowCreateStory(false);
          }}
        />
      )}
    </div>
  );
}
