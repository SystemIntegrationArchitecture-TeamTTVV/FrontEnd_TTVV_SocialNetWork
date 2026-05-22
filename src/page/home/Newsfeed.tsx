import { Link, useNavigate } from 'react-router-dom';
import { Image, Smile, Activity, Radio, Eye } from 'lucide-react';
import { livestreamApi, type LiveStreamData } from '../../apis/livestream';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { postsApi } from '../../apis/posts';
import type { PostData } from '../../apis/posts';
import type { Story } from '../../types/story';
import { reactionsApi } from '../../apis/reactions';
import PostCard from '../../components/post/PostCard';
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
import CreatePost from './CreatePost';
import { showAuthRequiredPrompt } from '../../utils/authPrompt';
import { useToast } from '../../contexts/useToast';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n';
import { resolveMediaUrl, resolveStoryContentUrl } from '../../utils/mediaUrl';
import { getUserInitials } from '../../utils/userDisplay';
import ReportModal from '../../components/common/ReportModal';

/** Module-level cache — survives component unmount so returning to Newsfeed is instant */
const _postCache: {
  posts: PostData[];
  likedPosts: Set<string> | null;
  likedComments: Set<string> | null;
} = { posts: [], likedPosts: null, likedComments: null };

export default function Newsfeed() {
  const { t } = useTranslation();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [reportingPost, setReportingPost] = useState<PostData | null>(null);
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
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const nav = useNavigate();
  const { showToast } = useToast();
  const requestLogin = () => showAuthRequiredPrompt(window.location.pathname);

  // ── Live Stream Banner State ──
  const [activeStreams, setActiveStreams] = useState<LiveStreamData[]>([]);

  useEffect(() => {
    if (!currentUser?.id) {
      setActiveStreams([]);
      return;
    }
    livestreamApi.getActiveStreams().then(setActiveStreams).catch(() => { });
  }, [currentUser?.id]);

  // Realtime: reload when someone goes live / ends
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubs = [
      subscribe('LIVE_STARTED', () => {
        livestreamApi.getActiveStreams().then(setActiveStreams).catch(() => { });
      }),
      subscribe('LIVE_ENDED', () => {
        livestreamApi.getActiveStreams().then(setActiveStreams).catch(() => { });
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [currentUser?.id, subscribe]);

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
        const [data, userReactions, savedIds] = await Promise.all([
          postsApi.getAllPosts(currentUser?.id),
          currentUser?.id
            ? reactionsApi.getReactionsByUserId(currentUser.id)
            : Promise.resolve([]),
          currentUser?.id
            ? postsApi.getSavedPostIds().catch(() => [])
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

        if (Array.isArray(savedIds)) {
          setSavedPostIds(new Set(savedIds));
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

  // Sort each group so the oldest story is first (chronological order)
  const storyGroups: Story[][] = Object.values(storiesByUser).map(group =>
    group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
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
            const displayStory = group[group.length - 1]; // Use newest story for thumbnail
            const storyMediaUrl =
              displayStory.contentType !== 'text'
                ? resolveStoryContentUrl(displayStory.content)
                : '';

            return (
              <button
                key={displayStory.user.id}
                onClick={() => setViewerUserIndex(index)}
                className="shrink-0 w-32 text-left"
              >
                <div className="w-32 h-48 rounded-2xl bg-gradient-to-b from-blue-500 to-purple-500 p-[2px] relative overflow-hidden">
                  {/* Story Content Background */}
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    {/* Story preview */}
                    {displayStory.contentType === 'image' && (
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
                        {displayStory.caption?.trim() ? (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pb-8 pt-10 text-center text-[10px] font-semibold leading-tight text-white line-clamp-3">
                            {displayStory.caption.trim()}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {displayStory.contentType === 'text' && (
                      <div
                        className={`w-full h-full ${displayStory.background} flex items-center justify-center p-3`}
                      >
                        <p className="text-white text-sm font-semibold text-center line-clamp-4">
                          {displayStory.content}
                        </p>
                      </div>
                    )}

                    {displayStory.contentType === 'video' && (
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
                        {displayStory.caption?.trim() ? (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pb-8 pt-10 text-center text-[10px] font-semibold leading-tight text-white line-clamp-3">
                            {displayStory.caption.trim()}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Author Avatar & Name */}
                  <div className="absolute top-2 left-2 ring-2 ring-blue-500 rounded-full">
                    <StoryAvatar
                      name={displayStory.user.name}
                      avatar={displayStory.user.avatar}
                      className="w-8 h-8 border-2 border-white rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <p className="text-white text-xs font-medium truncate drop-shadow-md">
                      {displayStory.user.name}
                    </p>
                  </div>
                </div>
                <p className="text-center mt-3 font-medium truncate text-sm">
                  {displayStory.user.name}
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
            <button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="flex-1 h-10 px-4 rounded-full bg-[#f0f2f5] dark:bg-[#22263a] hover:bg-[#e4e6eb] dark:hover:bg-[#2b2f45] border-0 text-left flex items-center text-[#65676b] dark:text-[#7e89a6] hover:text-[#050505] dark:hover:text-[#c8ccde] cursor-pointer text-[15px] transition-colors"
            >
              {t('newsfeed.createPostPlaceholder', { name: (currentUser.fullName || '').split(' ').filter(Boolean)[0] ?? '' })}
            </button>
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
              <button
                onClick={() => setIsCreatePostModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-green-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f3ff] dark:bg-green-500/15">
                  <Image className="w-[18px] h-[18px] text-[#1877F2] dark:text-green-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.photoVideo')}</span>
              </button>
              <button
                onClick={() => setIsCreatePostModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-amber-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff4d6] dark:bg-amber-500/15">
                  <Smile className="w-[18px] h-[18px] text-[#f7b928] dark:text-amber-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.feeling')}</span>
              </button>
              <button
                onClick={() => setIsCreatePostModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-rose-500/10 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe8ec] dark:bg-rose-500/15">
                  <Activity className="w-[18px] h-[18px] text-[#f3425f] dark:text-rose-400" />
                </span>
                <span className="text-[15px] text-[#65676b] dark:text-[#c8ccde] font-semibold">{t('newsfeed.activity')}</span>
              </button>
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
              <button
                onClick={() => setIsCreatePostModalOpen(true)}
                className="mt-5 inline-block px-5 py-2.5 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors text-[15px] font-semibold"
              >
                {t('newsfeed.createPost')}
              </button>
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
          if (hiddenPostIds.has(post.id!)) return null;

          return (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              initialIsLiked={likedPosts.has(post.id!)}
              initialIsSaved={savedPostIds.has(post.id!)}
              initialLikedComments={likedComments}
              onDeleteSuccess={(postId) => setPosts(prev => prev.filter(p => p.id !== postId))}
              onHide={(postId) => {
                setHiddenPostIds(prev => new Set(prev).add(postId));
                showToast(t('newsfeed.postHidden', 'Đã ẩn bài viết'), 'success');
              }}
              onReport={(postData) => setReportingPost(postData)}
              requestLogin={requestLogin}
            />
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

      {/* Create Post Modal */}
      {isCreatePostModalOpen && (
        <CreatePost
          onClose={() => setIsCreatePostModalOpen(false)}
          onSuccess={(createdPost) => {
            setIsCreatePostModalOpen(false);
            if (!createdPost?.id) return;

            setPosts(prev => {
              if (prev.some(post => post.id === createdPost.id)) {
                return prev;
              }
              const nextPosts = [createdPost, ...prev];
              _postCache.posts = nextPosts;
              return nextPosts;
            });
          }}
        />
      )}

      {reportingPost && (
        <ReportModal
          isOpen={!!reportingPost}
          onClose={() => setReportingPost(null)}
          targetId={reportingPost.id}
          targetType="post"
          targetName={reportingPost.authorName || t('newsfeed.authorUnknown', 'Không rõ')}
        />
      )}
    </div>
  );
}
