import { Link } from 'react-router-dom';
import { Image, Smile, Activity, MessageCircle, Share2, Heart, MoreHorizontal, Plus, Send, Edit, Trash2, Bookmark, EyeOff, Flag, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LocationIcon, LargeMountainPlaceholder, HeartIcon, ThumbsUpIcon, SmileIcon } from '../../common/icons/IconComponents';
import { authApi } from '../../apis/auth';
import AddStoryCard from '../../components/story/AddStoryCard';
import StoryViewer from '../../components/story/StoryViewer';
import type { Story } from '../../types/story';
import CreateStoryModal from '../../components/story/CreateStoryModal';
import { storiesApi } from '../../apis/storiesApi';
import { API_CONFIG } from '../../apis/config';
export default function Newsfeed() {
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [viewerUserIndex, setViewerUserIndex] = useState<number | null>(null);

  const [showCreateStory, setShowCreateStory] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);

  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());
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
  const [posts] = useState([
    {
      id: 1,
      author: { name: 'Sarah Johnson', avatar: 'SJ', color: '#42B72A' },
      time: '2h',
      location: 'location',
      content: 'Just finished an amazing hike! The view was breathtaking',
      image: 'mountain',
      likes: 124,
      comments: 3,
      shares: 12,
      reactions: ['heart', 'thumbsup', 'smile'],
      commentsList: [
        {
          id: 1,
          author: { name: 'Mike Chen', avatar: 'MC', color: '#1877F2' },
          content: 'Amazing view! Where is this?',
          time: '1 giờ trước',
          likes: 5,
        },
        {
          id: 2,
          author: { name: 'David Kim', avatar: 'DK', color: '#FF6B6B' },
          content: 'Looks beautiful!',
          time: '2 giờ trước',
          likes: 3,
        },
        {
          id: 3,
          author: { name: 'Emma Davis', avatar: 'ED', color: '#4ECDC4' },
          content: 'I want to visit this place too!',
          time: '3 giờ trước',
          likes: 8,
        },
      ],
    },
    {
      id: 2,
      author: { name: 'Mike Chen', avatar: 'MC', color: '#FF6B6B' },
      time: '5h',
      location: '',
      content: 'Working on a new project. Excited to share it soon!',
      image: '',
      likes: 89,
      comments: 2,
      shares: 5,
      reactions: ['thumbsup', 'smile'],
      commentsList: [
        {
          id: 1,
          author: { name: 'Sarah Johnson', avatar: 'SJ', color: '#42B72A' },
          content: 'Can\'t wait to see it!',
          time: '4 giờ trước',
          likes: 2,
        },
        {
          id: 2,
          author: { name: 'Alex Park', avatar: 'AP', color: '#FFD93D' },
          content: 'Looking forward!',
          time: '5 giờ trước',
          likes: 1,
        },
      ],
    },
  ]);

  // const [stories, setStories] = useState<Story[]>([
  //   {
  //     id: '1',
  //     user: {
  //       id: 2,
  //       name: 'Sarah',
  //       avatar: 'https://i.pravatar.cc/150?img=1',
  //     },
  //     contentType: 'text',
  //     content: 'Lovely day 🌸',
  //     background: 'bg-gradient-to-br from-pink-500 to-purple-500',
  //     duration: 5,
  //     createdAt: '2026-01-25T08:30:00Z',
  //     expiresAt: '2026-01-26T08:30:00Z',
  //     isViewed: false,
  //     viewCount: 12,
  //     isActive: true,
  //   },
  //   {
  //     id: '2',
  //     user: {
  //       id: 3,
  //       name: 'Mike',
  //       avatar: 'https://i.pravatar.cc/150?img=2',
  //     },
  //     contentType: 'image',
  //     content: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
  //     duration: 5,
  //     createdAt: '2026-01-25T09:00:00Z',
  //     expiresAt: '2026-01-26T09:00:00Z',
  //     isViewed: false,
  //     viewCount: 30,
  //     isActive: true,
  //   },
  //   {
  //     id: '3',
  //     user: {
  //       id: 4,
  //       name: 'Emma',
  //       avatar: 'https://i.pravatar.cc/150?img=3',
  //     },
  //     contentType: 'text',
  //     content: 'Weekend vibes ✨',
  //     background: 'bg-gradient-to-br from-indigo-500 to-cyan-400',
  //     duration: 5,
  //     createdAt: '2026-01-25T10:15:00Z',
  //     expiresAt: '2026-01-26T10:15:00Z',
  //     isViewed: true,
  //     viewCount: 8,
  //     isActive: true,
  //   },
  // ]);



  const storiesByUser = stories.reduce<Record<string, Story[]>>((acc, story) => {
    const userId = story.user.id;

    if (!acc[userId]) {
      acc[userId] = [];
    }

    acc[userId].push(story);
    return acc;
  }, {});
  const storyGroups = Object.values(storiesByUser);
  const toggleComments = (postId: number) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSendComment = (postId: string) => {
    const comment = commentInputs[postId];
    if (comment?.trim()) {
      console.log('Send comment for post', postId, ':', comment);
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      // Expand comments if not already expanded
      if (!expandedComments.has(postId)) {
        toggleComments(postId);
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

  const handlePostAction = (postId: string, action: string) => {
    console.log(`Post action ${action} for post ${postId}`);
    setOpenMenuId(null);
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
            <div key={post.id} className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
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
                <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

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
                  <button className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <Heart className="w-6 h-6 text-gray-500 group-hover:text-red-500 group-hover:fill-red-500 transition-colors" />
                    <span className="text-base text-gray-700 font-medium group-hover:text-red-500">Like</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
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
                          onKeyPress={(e) => e.key === 'Enter' && handleSendComment(post.id!)}
                          placeholder="Viết bình luận..."
                          className="w-full h-12 px-4 pr-14 rounded-lg bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
                        />
                        <button
                          onClick={() => handleSendComment(post.id!)}
                          disabled={!commentInput.trim()}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${commentInput.trim()
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {viewerUserIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialUserIndex={viewerUserIndex}
          onClose={() => setViewerUserIndex(null)}
        />
      )}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onCreate={(story: Story) => {
            setStories((prev) => [story, ...prev]);
            setShowCreateStory(false);
          }}
        />
      )}
    </div>
  );
}
