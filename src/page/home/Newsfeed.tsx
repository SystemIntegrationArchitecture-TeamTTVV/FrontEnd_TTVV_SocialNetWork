import { Link } from 'react-router-dom';
import { Image, Smile, Activity, MessageCircle, Share2, Heart, MoreHorizontal, Plus, Send, Edit, Trash2, Bookmark, EyeOff, Flag, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LocationIcon, LargeMountainPlaceholder, HeartIcon, ThumbsUpIcon, SmileIcon } from '../../common/icons/IconComponents';
import { authApi } from '../../apis/auth';
import { postsApi } from '../../apis/posts';
import type { PostData } from '../../apis/posts';

export default function Newsfeed() {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
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

  // Load posts from API
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoadingPosts(true);
        setError(null);
        const data = await postsApi.getAllPosts();
        setPosts(data);
        console.log('✅ Loaded posts:', data.length);
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
  }, []);

  const stories = [
    { name: 'Sarah', gradient: 'from-pink-500 to-cyan-400', avatar: 'SJ' },
    { name: 'Mike', gradient: 'from-green-400 to-yellow-300', avatar: 'MC' },
    { name: 'Emma', gradient: 'from-purple-400 to-pink-300', avatar: 'ED' },
    { name: 'Alex', gradient: 'from-blue-400 to-indigo-500', avatar: 'AP' },
  ];

  const toggleComments = (postId: string) => {
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
      <div className="bg-white rounded-2xl p-5 border border-gray-200">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-1">
          {/* Your Story */}
          <div className="shrink-0 w-32">
            <div className="w-32 h-48 rounded-2xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors group">
              <div className="w-14 h-14 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center mb-2 overflow-hidden">
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
              <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center -mt-3">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-base text-gray-600 text-center mt-3 font-medium">Your story</p>
          </div>

          {/* Friends Stories */}
          {stories.map((story, index) => (
            <Link
              key={index}
              to={`/stories/${index + 1}`}
              className="shrink-0 w-32 cursor-pointer group"
            >
              <div className={`w-32 h-48 rounded-2xl bg-gradient-to-b ${story.gradient} p-[2px] group-hover:opacity-90 transition-opacity`}>
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                    <span className="text-white text-base font-semibold">{story.avatar}</span>
                  </div>
                </div>
              </div>
              <p className="text-base text-gray-600 text-center mt-3 font-medium truncate">{story.name}</p>
            </Link>
          ))}
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
                    onClick={() => toggleComments(post.id!)}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg transition-colors ${
                      isCommentsExpanded 
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
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                            commentInput.trim()
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
    </div>
  );
}
