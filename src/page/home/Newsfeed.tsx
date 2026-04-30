import { Link, useNavigate } from 'react-router-dom';
import { Image, Smile, Activity, MessageCircle, Share2, Heart, MoreHorizontal, Send, Edit, Trash2, Bookmark, EyeOff, Flag, Loader2, Globe, UserCheck, Lock, Radio, Eye } from 'lucide-react';
import { livestreamApi, type LiveStreamData } from '../../apis/livestream';
import { useState, useRef, useEffect, useMemo } from 'react';
import { LocationIcon } from '../../common/icons/IconComponents';
import { useAuth } from '../../contexts/AuthContext';
import { postsApi } from '../../apis/posts';
import type { PostData } from '../../apis/posts';
import type { Story } from '../../types/story';
import { reactionsApi } from '../../apis/reactions';
import { commentsApi, type CommentData } from '../../apis/comments';
import { HttpError } from '../../apis/http';
import { useSocket } from '../../contexts/SocketContext';
import { storiesApi } from '../../apis/storiesApi';
import PostSkeleton from '../../components/common/PostSkeleton';
import StorySkeleton from '../../components/common/StorySkeleton';
import AddStoryCard from '../../components/story/AddStoryCard';
import StoryAvatar from '../../components/story/StoryAvatar';
import StoryViewer from '../../components/story/StoryViewer';
// import StoryViewer from './StoryViewer';
import CreateStoryModal from '../../components/story/CreateStoryModal';
import { showAuthRequiredPrompt } from '../../utils/authPrompt';
import { useToast } from '../../contexts/useToast';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n';
import { resolveMediaUrl, resolveStoryContentUrl } from '../../utils/mediaUrl';
import { getUserInitials } from '../../utils/userDisplay';

/** Module-level cache — survives component unmount so returning to Newsfeed is instant */
const _postCache: {
  posts: PostData[];
  likedPosts: Set<string> | null;
  likedComments: Set<string> | null;
} = { posts: [], likedPosts: null, likedComments: null };

export default function Newsfeed() {
  const { t } = useTranslation();
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
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});
  // Tracks which postIds were successfully fetched (prevents re-fetch on collapse/expand)
  const fetchedCommentPosts = useRef<Set<string>>(new Set());
  const { subscribe } = useSocket();
  const { user: currentUser, isLoading: authLoading, refreshSessionUser } = useAuth();
  const [composerAvatarFailed, setComposerAvatarFailed] = useState(false);
  const composerAvatarSynced = useRef(false);

  useEffect(() => {
    composerAvatarSynced.current = false;
  }, [currentUser?.id]);

  const composerAvatarSrc = useMemo(() => {
    const raw = currentUser?.avatar?.trim();
    if (!raw) return '';
    return resolveMediaUrl(raw);
  }, [currentUser?.avatar]);

  useEffect(() => {
    setComposerAvatarFailed(false);
  }, [composerAvatarSrc]);

  /** Một lần: localStorage thiếu avatar nhưng server đã có (sau đổi Cloudinary / profile) */
  useEffect(() => {
    if (authLoading || !currentUser?.id || composerAvatarSynced.current) return;
    if (!currentUser.avatar?.trim()) {
      composerAvatarSynced.current = true;
      void refreshSessionUser();
    }
  }, [authLoading, currentUser?.id, currentUser?.avatar, refreshSessionUser]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [viewerUserIndex, setViewerUserIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const nav = useNavigate();
  const { showToast } = useToast();
  const requestLogin = () => showAuthRequiredPrompt(window.location.pathname);

  // ── Live Stream Banner State ──
  const [activeStreams, setActiveStreams] = useState<LiveStreamData[]>([]);

  useEffect(() => {
    livestreamApi.getActiveStreams().then(setActiveStreams).catch(() => {});
  }, []);

  // Realtime: reload when someone goes live / ends
  useEffect(() => {
    const unsubs = [
      subscribe('LIVE_STARTED', () => {
        livestreamApi.getActiveStreams().then(setActiveStreams).catch(() => {});
      }),
      subscribe('LIVE_ENDED', () => {
        livestreamApi.getActiveStreams().then(setActiveStreams).catch(() => {});
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [subscribe]);

  // ── Stale-while-revalidate: show cached posts instantly, refresh in background ──
  useEffect(() => {
    if (authLoading) return;

    // If we have cached posts, show them immediately (no loading spinner)
    const cached = _postCache.posts;
    if (cached.length > 0) {
      setPosts(cached);
      setIsLoadingPosts(false);
      if (_postCache.likedPosts) setLikedPosts(_postCache.likedPosts);
      if (_postCache.likedComments) setLikedComments(_postCache.likedComments);
    }

    const loadPosts = async () => {
      try {
        // Only show loading spinner if no cache
        if (cached.length === 0) {
          setIsLoadingPosts(true);
        }
        setError(null);

        // Fetch posts and reactions in parallel for faster load
        const [data, userReactions] = await Promise.all([
          postsApi.getAllPosts(currentUser?.id),
          currentUser?.id
            ? reactionsApi.getReactionsByUserId(currentUser.id)
            : Promise.resolve([]),
        ]);

        const freshPosts = Array.isArray(data) ? data : [];
        setPosts(freshPosts);

        // Update cache
        _postCache.posts = freshPosts;

        if (currentUser?.id && Array.isArray(userReactions)) {
          const likedPostIds = new Set(
            userReactions.filter((r) => r.postId).map((r) => r.postId!),
          );
          setLikedPosts(likedPostIds);
          _postCache.likedPosts = likedPostIds;
          const likedCommentIds = new Set(
            userReactions.filter((r) => r.commentId).map((r) => r.commentId!),
          );
          setLikedComments(likedCommentIds);
          _postCache.likedComments = likedCommentIds;
        }
      } catch (err: any) {
        console.error('❌ Failed to load posts:', err);

        // Only use mock data if no cache exists
        if (cached.length === 0) {
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
        }
        setError(null);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    loadPosts();
  }, [currentUser?.id, authLoading]);

  // Load stories from API
  useEffect(() => {
    if (!currentUser?.id) return;

    setLoadingStories(true);

    storiesApi
      .getStoryFeed(currentUser.id)
      .then((data) => {
        setStories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load stories', err);
      })
      .finally(() => {
        setLoadingStories(false);
      });
  }, [currentUser?.id]);

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

  useEffect(() => {
    const handleLocalPostCreated = (event: Event) => {
      const customEvent = event as CustomEvent<PostData>;
      const newPost = customEvent.detail;
      if (!newPost || !newPost.id) return;

      setPosts(prev => {
        if (prev.some(post => post.id === newPost.id)) {
          return prev;
        }
        return [newPost, ...prev];
      });
    };

    window.addEventListener('post-created', handleLocalPostCreated);
    return () => {
      window.removeEventListener('post-created', handleLocalPostCreated);
    };
  }, []);
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

    // Only load if expanding and not yet successfully fetched
    if (isExpanding && !fetchedCommentPosts.current.has(postId)) {
      setIsLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const comments = await commentsApi.getCommentsByPostId(postId);
        setPostComments(prev => ({ ...prev, [postId]: comments }));
        fetchedCommentPosts.current.add(postId); // mark as fetched only on success
      } catch (error) {
        console.error('Failed to load comments:', error);
        showToast(t('newsfeed.commentSendFailed'), 'error');
        // Don't set postComments on error — keep undefined so user can retry next expand
      } finally {
        setIsLoadingComments(prev => ({ ...prev, [postId]: false }));
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

      // Add comment to state and mark as fetched
      fetchedCommentPosts.current.add(postId);
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
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
          : error instanceof Error
            ? error.message
            : t('newsfeed.commentSendFailed');
      showToast(msg, "error");
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
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
          : error instanceof Error
            ? error.message
            : t('newsfeed.replySendFailed');
      showToast(msg, "error");
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
        setEditVisibility(normalizeVisibility(post.visibility));
      }
    } else if (action === 'delete') {
      if (window.confirm(t('newsfeed.confirmDeletePost'))) {
        try {
          setIsDeleting(postId);
          await postsApi.deletePost(postId);
          setPosts(prev => prev.filter(p => p.id !== postId));
          console.log('✅ Post deleted successfully');
        } catch (error) {
          console.error('❌ Failed to delete post:', error);
          showToast(t('newsfeed.deletePostFailed'), 'error');
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
      showToast(t('newsfeed.postContentEmpty'), 'info');
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
        visibility: editVisibility,
      });

      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      setEditingPostId(null);
      setEditContent('');
      console.log('✅ Post updated successfully');
    } catch (error) {
      console.error('❌ Failed to update post:', error);
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
            : t('newsfeed.updatePostFailed');
      showToast(msg, "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditVisibility('PUBLIC');
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return t('watch.justNow');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('watch.justNow');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getAuthorInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const normalizeVisibility = (visibility?: string): 'PUBLIC' | 'FRIENDS' | 'PRIVATE' => {
    if (!visibility) return 'PUBLIC';
    const normalized = visibility.toUpperCase();
    if (normalized === 'FRIENDS' || normalized === 'FRIEND') return 'FRIENDS';
    if (normalized === 'PRIVATE' || normalized === 'ONLY_ME') return 'PRIVATE';
    return 'PUBLIC';
  };

  const getVisibilityMeta = (visibility?: string) => {
    const mode = normalizeVisibility(visibility);
    if (mode === 'FRIENDS') {
      return { label: t('newsfeed.visibilityFriends'), Icon: UserCheck };
    }
    if (mode === 'PRIVATE') {
      return { label: t('newsfeed.visibilityPrivate'), Icon: Lock };
    }
    return { label: t('newsfeed.visibilityPublic'), Icon: Globe };
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Stories Section */}
      {/* Stories Section */}
      <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-4 sm:p-5 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">

        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-1">

          {/* Add Story (Facebook Web style) */}
          {currentUser && (
            <AddStoryCard
              avatar={resolveMediaUrl(currentUser.avatar)}
              onClick={() => setShowCreateStory(true)}
            />
          )}
          {loadingStories && <StorySkeleton />}
          {/* Friends Stories */}
          {storyGroups.map((group, index) => {
            const firstStory = group[0];
            const storyMediaUrl =
              firstStory.contentType !== 'text'
                ? resolveStoryContentUrl(firstStory.content)
                : '';

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
                      <div className="relative h-full w-full">
                        {storyMediaUrl ? (
                        <img
                          src={storyMediaUrl}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                        ) : (
                          <div className="h-full w-full bg-zinc-800" />
                        )}
                        {firstStory.caption?.trim() ? (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pb-8 pt-10 text-center text-[10px] font-semibold leading-tight text-white line-clamp-3">
                            {firstStory.caption.trim()}
                          </div>
                        ) : null}
                      </div>
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
                      <div className="relative h-full w-full">
                        {storyMediaUrl ? (
                        <video
                          src={storyMediaUrl}
                          preload="metadata"
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                          onLoadedMetadata={(e) => {
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                        ) : (
                          <div className="h-full w-full bg-zinc-800" />
                        )}
                        {firstStory.caption?.trim() ? (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pb-8 pt-10 text-center text-[10px] font-semibold leading-tight text-white line-clamp-3">
                            {firstStory.caption.trim()}
                          </div>
                        ) : null}
                      </div>
                    )}


                    {/* Gradient overlay for better avatar visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

                    {/* User Avatar */}
                    <div className="absolute top-3 left-3">
                      <StoryAvatar
                        name={firstStory.user.name}
                        avatar={firstStory.user.avatar}
                        className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-lg"
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

      {/* 🔴 Live Stream Banner */}
      {activeStreams.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 dark:from-red-500/15 dark:to-pink-500/15 border border-red-200 dark:border-red-500/20 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                {activeStreams.length} đang phát trực tiếp
              </span>
            </div>
            <button
              onClick={() => nav('/livestream')}
              className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline"
            >
              Xem tất cả →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {activeStreams.slice(0, 4).map((stream) => (
              <button
                key={stream.id}
                onClick={() => nav(`/livestream/${stream.id}`)}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1a1d28] rounded-xl border border-gray-100 dark:border-[#2b2f45] hover:shadow-md hover:border-red-200 dark:hover:border-red-500/30 transition-all min-w-[220px] shrink-0"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1d28] animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{stream.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stream.streamerName}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{stream.viewerCount}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Post */}
      <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-4 sm:p-5 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1877F2] to-[#166fe5] flex items-center justify-center shrink-0 overflow-hidden">
            {composerAvatarSrc && !composerAvatarFailed ? (
              <img
                key={composerAvatarSrc}
                src={composerAvatarSrc}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setComposerAvatarFailed(true)}
              />
            ) : (
              <span className="text-white font-semibold text-base">
                {getUserInitials(currentUser?.fullName)}
              </span>
            )}
          </div>
          {currentUser ? (
            <Link
              to="/post/create"
              className="flex-1 h-10 px-4 rounded-full bg-[#f0f2f5] dark:bg-[#22263a] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] border-0 text-left flex items-center text-[#65676b] dark:text-[#7e89a6] hover:text-[#050505] dark:hover:text-[#c8ccde] cursor-pointer text-[15px] transition-colors"
            >
              {t('newsfeed.createPostPlaceholder', { name: (currentUser.fullName || '').split(' ').filter(Boolean)[0] ?? '' })}
            </Link>
          ) : (
            <button
              type="button"
              onClick={requestLogin}
              className="flex-1 h-10 px-4 rounded-full bg-[#f0f2f5] dark:bg-[#22263a] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] text-left flex items-center text-[#65676b] dark:text-[#7e89a6] cursor-pointer text-[15px] transition-colors"
            >
              {t('newsfeed.createPostPlaceholderGuest')}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 pt-3 border-t border-[#e4e6eb] dark:border-[#22263a]">
          {currentUser ? (
            <>
              <Link
                to="/post/create"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-green-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f3ff] dark:bg-green-500/15">
                  <Image className="w-[18px] h-[18px] text-[#1877F2] dark:text-green-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.photoVideo')}</span>
              </Link>
              <Link
                to="/post/create"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-amber-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff4d6] dark:bg-amber-500/15">
                  <Smile className="w-[18px] h-[18px] text-[#f7b928] dark:text-amber-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.feeling')}</span>
              </Link>
              <Link
                to="/post/create"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-rose-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe8ec] dark:bg-rose-500/15">
                  <Activity className="w-[18px] h-[18px] text-[#f3425f] dark:text-rose-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.activity')}</span>
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={requestLogin}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-green-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f3ff] dark:bg-green-500/15">
                  <Image className="w-[18px] h-[18px] text-[#1877F2] dark:text-green-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.photoVideo')}</span>
              </button>
              <button
                type="button"
                onClick={requestLogin}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-amber-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff4d6] dark:bg-amber-500/15">
                  <Smile className="w-[18px] h-[18px] text-[#f7b928] dark:text-amber-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.feeling')}</span>
              </button>
              <button
                type="button"
                onClick={requestLogin}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-rose-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe8ec] dark:bg-rose-500/15">
                  <Activity className="w-[18px] h-[18px] text-[#f3425f] dark:text-rose-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.activity')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">

        {/* Loading State */}
        {isLoadingPosts && <PostSkeleton />}

        {/* Error State */}
        {error && !isLoadingPosts && (
          <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-8 border border-red-200/80 dark:border-red-500/10 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">

            <p className="text-red-500 text-center text-[15px]">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingPosts && !error && posts.length === 0 && (
          <div className="bg-white dark:bg-[#1a1d28] rounded-xl p-12 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none text-center">

            <p className="text-gray-400 text-[15px]">{t('newsfeed.emptyFeed')}</p>
            {currentUser ? (
              <Link
                to="/post/create"
                className="mt-5 inline-block px-5 py-2.5 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors text-[15px] font-semibold"
              >
                {t('newsfeed.createPost')}
              </Link>
            ) : (
              <button
                type="button"
                onClick={requestLogin}
                className="mt-5 inline-block px-5 py-2.5 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors text-[15px] font-semibold"
              >
                {t('newsfeed.loginToPost')}
              </button>
            )}
          </div>
        )}

        {/* Posts List */}
        {!isLoadingPosts && !error && posts.map((post) => {
          const isCommentsExpanded = expandedComments.has(post.id!);
          const commentInput = commentInputs[post.id!] || '';
          const visibilityMeta = getVisibilityMeta(post.visibility);
          const VisibilityIcon = visibilityMeta.Icon;

          return (
            <div key={post.id} className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-none dark:hover:shadow-none relative group/card">

              {/* Post Header */}
              <div className="p-5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 bg-linear-to-br from-blue-500 to-blue-600 shadow-sm">
                    {post.authorAvatar ? (
                      <img src={resolveMediaUrl(post.authorAvatar)} alt={post.authorName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      getAuthorInitials(post.authorName)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-base">{post.authorName || 'Unknown User'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{getTimeAgo(post.createdAt)}</span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <VisibilityIcon className="w-3.5 h-3.5" />
                        <span>{visibilityMeta.label}</span>
                      </div>
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
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-20">
                      {currentUser?.id === post.authorId && (
                        <>
                          <button
                            onClick={() => handlePostAction(post.id!, 'edit')}
                            className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                          >
                            <Edit className="w-[18px] h-[18px] text-gray-500" />
                            <span className="text-gray-800 text-[15px] font-medium">{t('newsfeed.menuEdit')}</span>
                          </button>
                          <button
                            onClick={() => handlePostAction(post.id!, 'delete')}
                            className="w-full px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                          >
                            <Trash2 className="w-[18px] h-[18px] text-red-500" />
                            <span className="text-red-500 text-[15px] font-medium">{t('newsfeed.menuDeletePost')}</span>
                          </button>
                          <div className="h-px bg-gray-100 my-1.5 mx-3" />
                        </>
                      )}
                      <button
                        onClick={() => handlePostAction(post.id!, 'save')}
                        className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                      >
                        <Bookmark className="w-[18px] h-[18px] text-gray-500" />
                        <span className="text-gray-800 text-[15px] font-medium">{t('newsfeed.menuSavePost')}</span>
                      </button>
                      <button
                        onClick={() => handlePostAction(post.id!, 'hide')}
                        className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                      >
                        <EyeOff className="w-[18px] h-[18px] text-gray-500" />
                        <span className="text-gray-800 text-[15px] font-medium">{t('newsfeed.menuHidePost')}</span>
                      </button>
                      <button
                        onClick={() => handlePostAction(post.id!, 'report')}
                        className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                      >
                        <Flag className="w-[18px] h-[18px] text-gray-500" />
                        <span className="text-gray-800 text-[15px] font-medium">{t('newsfeed.menuReport')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="px-5 pb-4">
                {editingPostId === post.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-end">
                      <select
                        value={editVisibility}
                        onChange={(e) => setEditVisibility(e.target.value as 'PUBLIC' | 'FRIENDS' | 'PRIVATE')}
                        className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PUBLIC">{t('newsfeed.visibilityPublic')}</option>
                        <option value="FRIENDS">{t('newsfeed.visibilityFriends')}</option>
                        <option value="PRIVATE">{t('newsfeed.visibilityPrivate')}</option>
                      </select>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder={t('newsfeed.editPlaceholder')}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() => handleUpdatePost(post.id!)}
                        disabled={!editContent.trim()}
                        className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('common.saveChanges')}
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
                    <p className="text-gray-700 font-medium">{t('newsfeed.deletingPost')}</p>
                  </div>
                </div>
              )}

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className="mb-4">
                  {post.images.length === 1 ? (
                    <img
                      src={resolveMediaUrl(post.images[0])}
                      alt="Post"
                      className="w-full max-h-[600px] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : post.images.length === 2 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {post.images.map((imageUrl, idx) => (
                        <img
                          key={idx}
                          src={resolveMediaUrl(imageUrl)}
                          alt={`Post ${idx + 1}`}
                          className="w-full h-[300px] object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ))}
                    </div>
                  ) : post.images.length === 3 ? (
                    <div className="grid grid-cols-2 gap-1">
                      <img
                        src={resolveMediaUrl(post.images[0])}
                        alt="Post 1"
                        className="w-full h-[400px] object-cover row-span-2"
                        loading="lazy"
                        decoding="async"
                      />
                      <img
                        src={resolveMediaUrl(post.images[1])}
                        alt="Post 2"
                        className="w-full h-[199px] object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <img
                        src={resolveMediaUrl(post.images[2])}
                        alt="Post 3"
                        className="w-full h-[199px] object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {post.images.slice(0, 4).map((imageUrl, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={resolveMediaUrl(imageUrl)}
                            alt={`Post ${idx + 1}`}
                            className="w-full h-[250px] object-cover"
                            loading="lazy"
                            decoding="async"
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
                      src={resolveMediaUrl(videoUrl)}
                      controls
                      className="w-full max-h-[600px] bg-black"
                      preload="metadata"
                    >
                      {t('newsfeed.videoNotSupported')}
                    </video>
                  ))}
                </div>
              )}

              {/* Post Stats */}
              <div className="px-5 pb-3">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium">{t('newsfeed.statsLikes', { count: post.likeCount || 0 })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="font-medium">{t('newsfeed.statsComments', { count: post.commentCount || 0 })}</span>
                    <span>·</span>
                    <span className="font-medium">{t('newsfeed.statsShares', { count: post.shareCount || 0 })}</span>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="border-t border-gray-100/80 dark:border-white/5 pt-2 flex items-center gap-1">

                  <button
                    onClick={() => currentUser ? handleLikePost(post.id!) : requestLogin()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all group ${likedPosts.has(post.id!) ? 'text-red-500 bg-red-50/60' : 'hover:bg-gray-50'
                      }`}
                  >
                    <Heart className={`w-5 h-5 transition-colors ${likedPosts.has(post.id!)
                        ? 'text-red-500 fill-red-500'
                        : 'text-gray-500 group-hover:text-red-500 group-hover:fill-red-500'
                      }`} />
                    <span className={`text-[15px] font-medium ${likedPosts.has(post.id!) ? 'text-red-500' : 'text-gray-600 group-hover:text-red-500'
                      }`}>
                      {likedPosts.has(post.id!) ? t('groupComments.liked') : t('groupComments.like')}
                    </span>
                  </button>
                  <button
                    onClick={() => currentUser ? toggleComments(post.id!) : requestLogin()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all ${isCommentsExpanded
                      ? 'bg-blue-50/70 text-blue-600'
                      : 'hover:bg-gray-50 text-gray-600'
                      }`}
                  >
                    <MessageCircle className={`w-5 h-5 ${isCommentsExpanded ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-[15px] font-medium">{t('newsfeed.actionComment')}</span>
                  </button>
                  <button
                    onClick={() => currentUser ? nav(`/post/${post.id}/share`) : requestLogin()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl hover:bg-gray-50 transition-all group"
                  >
                    <Share2 className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                    <span className="text-[15px] text-gray-600 font-medium group-hover:text-green-600">{t('newsfeed.actionShare')}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsExpanded && (
                  <div className="border-t border-gray-100/80 dark:border-white/5 pt-5 mt-3 space-y-4">

                    {/* Comment Input */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                        {composerAvatarSrc && !composerAvatarFailed ? (
                          <img
                            src={composerAvatarSrc}
                            alt={currentUser?.fullName || 'User'}
                            className="w-full h-full object-cover"
                            onError={() => setComposerAvatarFailed(true)}
                          />
                        ) : (
                          <span>{currentUser?.fullName?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => handleCommentChange(post.id!, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment(post.id!)}
                          placeholder={t('newsfeed.commentPlaceholder')}
                          disabled={isSubmittingComment[post.id!]}
                          className="w-full h-12 px-4 pr-14 rounded-xl bg-gray-100/50 dark:bg-[#22263a]/50 border-0 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#1e2133] text-base transition-all disabled:opacity-50 dark:text-gray-200"

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

                    {/* Comments Loading */}
                    {isLoadingComments[post.id!] && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="ml-2 text-sm text-gray-400">Đang tải bình luận...</span>
                      </div>
                    )}

                    {/* Empty state */}
                    {!isLoadingComments[post.id!] && Array.isArray(postComments[post.id!]) && postComments[post.id!].length === 0 && (
                      <div className="text-center py-3">
                        <p className="text-sm text-gray-400">{t('newsfeed.statsComments', { count: 0 }).replace('0 ', '') || 'Chưa có bình luận nào'}</p>
                      </div>
                    )}

                    {/* Comments List */}
                    {!isLoadingComments[post.id!] && postComments[post.id!] && postComments[post.id!].length > 0 && (
                      <div className="space-y-3 mt-4">
                        {postComments[post.id!].map((comment) => (
                          <div key={comment.id} className="flex flex-col gap-2">
                            {/* Main Comment */}
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden">
                                {comment.userAvatar ? (
                                  <img
                                    src={resolveMediaUrl(comment.userAvatar)}
                                    alt={comment.userName || 'User'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = comment.userName?.charAt(0) || 'U'; }}
                                  />
                                ) : (
                                  <span>{comment.userName?.charAt(0) || 'U'}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                                  <p className="font-semibold text-sm text-gray-900">{comment.userName || 'Unknown'}</p>
                                  <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-1.5 px-3">
                                  <button
                                    onClick={() => handleLikeComment(comment.id!, post.id!)}
                                    className={`text-xs font-bold transition-colors ${
                                      likedComments.has(comment.id!)
                                        ? 'text-red-500'
                                        : 'text-gray-500 hover:text-red-500'
                                    }`}
                                  >
                                    {likedComments.has(comment.id!) ? `❤️ ${t('groupComments.liked')}` : t('groupComments.like')}
                                    {comment.likeCount && comment.likeCount > 0 && ` · ${comment.likeCount}`}
                                  </button>
                                  <span className="text-gray-300 text-xs">·</span>
                                  <button
                                    onClick={() => handleReplyToComment(comment.id!)}
                                    className="text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors"
                                  >
                                    {t('groupComments.reply')}
                                  </button>
                                  {comment.replyCount && comment.replyCount > 0 && (
                                    <>
                                      <span className="text-gray-300 text-xs">·</span>
                                      <button
                                        onClick={() => toggleReplies(comment.id!)}
                                        className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                                      >
                                        {expandedReplies.has(comment.id!)
                                          ? t('groupComments.hide')
                                          : `${comment.replyCount} ${t('newsfeed.repliesNoun')}`}
                                      </button>
                                    </>
                                  )}
                                  <span className="text-gray-400 text-[11px] ml-auto">
                                    {comment.createdAt ? getTimeAgo(comment.createdAt) : t('watch.justNow')}
                                  </span>
                                </div>

                                {/* Reply Input */}
                                {replyingTo === comment.id && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-[11px] flex-shrink-0 overflow-hidden">
                                      {composerAvatarSrc && !composerAvatarFailed ? (
                                        <img
                                          src={composerAvatarSrc}
                                          alt={currentUser?.fullName || 'User'}
                                          className="w-full h-full object-cover"
                                          onError={() => setComposerAvatarFailed(true)}
                                        />
                                      ) : (
                                        <span>{currentUser?.fullName?.charAt(0) || 'U'}</span>
                                      )}
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
                                        placeholder={t('groupComments.replyTo', { name: comment.userName ?? '' })}
                                        disabled={isSubmittingComment[`reply-${comment.id}`]}
                                        className="w-full h-8 px-3 pr-9 rounded-full bg-gray-100 dark:bg-[#22263a] border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs dark:text-gray-200 placeholder:text-gray-400"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSendReply(comment.id!, post.id!)}
                                        disabled={!commentInputs[`reply-${comment.id}`]?.trim() || isSubmittingComment[`reply-${comment.id}`]}
                                        className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                          commentInputs[`reply-${comment.id}`]?.trim()
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'text-gray-300 cursor-not-allowed'
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
                                      className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
                                    >
                                      {t('groupComments.cancel')}
                                    </button>
                                  </div>
                                )}

                                {/* Replies List */}
                                {expandedReplies.has(comment.id!) && commentReplies[comment.id!] && commentReplies[comment.id!].length > 0 && (
                                  <div className="ml-2 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-white/10 pl-3">
                                    {commentReplies[comment.id!].map((reply) => (
                                      <div key={reply.id} className="flex items-start gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold text-[11px] flex-shrink-0 overflow-hidden">
                                          {reply.userAvatar ? (
                                            <img
                                              src={resolveMediaUrl(reply.userAvatar)}
                                              alt={reply.userName || 'User'}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                const parent = e.currentTarget.parentElement as HTMLElement;
                                                if (parent) parent.innerHTML = `<span class="text-[11px]">${reply.userName?.charAt(0) || 'U'}</span>`;
                                              }}
                                            />
                                          ) : (
                                            <span className="text-[11px]">{reply.userName?.charAt(0) || 'U'}</span>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="inline-block max-w-full bg-gray-50 dark:bg-[#1e2133] rounded-2xl rounded-tl-sm px-3 py-2">
                                            <p className="font-semibold text-[12px] text-gray-900 dark:text-gray-100 leading-none mb-0.5">{reply.userName || 'Unknown'}</p>
                                            <p className="text-gray-700 dark:text-gray-300 text-xs leading-snug">{reply.content}</p>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 px-1">
                                            <button
                                              onClick={() => handleLikeComment(reply.id!, post.id!)}
                                              className={`text-[11px] font-bold transition-colors ${
                                                likedComments.has(reply.id!)
                                                  ? 'text-red-500'
                                                  : 'text-gray-400 hover:text-red-500'
                                              }`}
                                            >
                                              {likedComments.has(reply.id!) ? `❤️ ${t('groupComments.liked')}` : t('groupComments.like')}
                                              {reply.likeCount && reply.likeCount > 0 && ` · ${reply.likeCount}`}
                                            </button>
                                            <span className="text-gray-400 text-[11px] ml-auto">
                                              {reply.createdAt ? getTimeAgo(reply.createdAt) : t('watch.justNow')}
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
