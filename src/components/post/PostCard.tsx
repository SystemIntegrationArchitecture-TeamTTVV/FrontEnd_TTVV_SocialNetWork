import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, Share2, Heart, MoreHorizontal, Send, Edit, Trash2, Bookmark, EyeOff, Flag, Loader2, Globe, UserCheck, Lock } from 'lucide-react';
import { LocationIcon } from '../../common/icons/IconComponents';
import { postsApi } from '../../apis/posts';
import type { PostData } from '../../apis/posts';
import { reactionsApi } from '../../apis/reactions';
import { commentsApi, type CommentData } from '../../apis/comments';
import { HttpError } from '../../apis/http';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/useToast';

export interface PostCardProps {
  post: PostData;
  currentUser: any;
  initialIsLiked?: boolean;
  initialIsSaved?: boolean;
  initialLikedComments?: Set<string>;
  onDeleteSuccess?: (postId: string) => void;
  onHide?: (postId: string) => void;
  onReport?: (post: PostData) => void;
  requestLogin: () => void;
}

export default function PostCard({
  post: initialPost,
  currentUser,
  initialIsLiked,
  initialIsSaved = false,
  initialLikedComments = new Set(),
  onDeleteSuccess,
  onHide,
  onReport,
  requestLogin
}: PostCardProps) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { showToast } = useToast();

  const [post, setPost] = useState(initialPost);
  
  // Update local post state if prop changes
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [likedComments, setLikedComments] = useState<Set<string>>(initialLikedComments);

  // Fetch initial likes if not provided (for SavedItems where we don't have Newsfeed's bulk fetch)
  useEffect(() => {
    if (initialIsLiked === undefined && currentUser?.id) {
      reactionsApi.getReactionsByPostId(post.id!).then(reactions => {
        setIsLiked(reactions.some(r => r.postId === post.id && r.userId === currentUser.id && r.type === 'LIKE'));
        setLikedComments(new Set(reactions.filter(r => r.commentId && r.userId === currentUser.id && r.type === 'LIKE').map(r => r.commentId!)));
      }).catch(console.error);
    }
  }, [initialIsLiked, post.id, currentUser]);

  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [replies, setReplies] = useState<Record<string, CommentData[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [isDeleting, setIsDeleting] = useState(false);

  const composerAvatarSrc = useMemo(() => {
    const raw = currentUser?.avatar?.trim();
    if (!raw) return '';
    return resolveMediaUrl(raw);
  }, [currentUser?.avatar]);
  const [composerAvatarFailed, setComposerAvatarFailed] = useState(false);

  useEffect(() => {
    setComposerAvatarFailed(false);
  }, [composerAvatarSrc]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

  // --- Handlers ---
  const handleLikePost = async () => {
    if (!currentUser) {
      requestLogin();
      return;
    }
    const currentlyLiked = isLiked;
    setIsLiked(!currentlyLiked);
    setPost(prev => ({ ...prev, likeCount: (prev.likeCount || 0) + (currentlyLiked ? -1 : 1) }));

    try {
      await reactionsApi.togglePostReaction(post.id!, currentUser.id, 'LIKE');
    } catch (error) {
      console.error('Failed to toggle reaction', error);
      setIsLiked(currentlyLiked);
      setPost(prev => ({ ...prev, likeCount: (prev.likeCount || 0) + (currentlyLiked ? 1 : -1) }));
    }
  };

  const toggleComments = async () => {
    if (!currentUser) {
      requestLogin();
      return;
    }
    const isExpanding = !commentsExpanded;
    setCommentsExpanded(isExpanding);

    if (isExpanding && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const data = await commentsApi.getCommentsByPostId(post.id!);
        setComments(data);
      } catch (error) {
        console.error('Failed to load comments', error);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || !currentUser) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await commentsApi.createComment({
        postId: post.id!,
        userId: currentUser.id,
        content: commentInput.trim()
      });
      setComments(prev => [...prev, newComment]);
      setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      setCommentInput('');
      if (!commentsExpanded) toggleComments();
    } catch (error) {
      const msg = error instanceof HttpError ? (error.data?.message || error.message) : t('newsfeed.commentSendFailed');
      showToast(msg, 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) {
      requestLogin();
      return;
    }
    const currentlyLiked = likedComments.has(commentId);
    
    setLikedComments(prev => {
      const next = new Set(prev);
      currentlyLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });

    // Update comment like count in state
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likeCount: (c.likeCount || 0) + (currentlyLiked ? -1 : 1) } : c
    ));
    setReplies(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(parentKey => {
        next[parentKey] = next[parentKey].map(r => 
          r.id === commentId ? { ...r, likeCount: (r.likeCount || 0) + (currentlyLiked ? -1 : 1) } : r
        );
      });
      return next;
    });

    try {
      await reactionsApi.toggleCommentReaction(commentId, currentUser.id, 'LIKE');
    } catch (error) {
      setLikedComments(prev => {
        const next = new Set(prev);
        currentlyLiked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likeCount: (c.likeCount || 0) + (currentlyLiked ? 1 : -1) } : c
      ));
    }
  };

  const handleSendReply = async (parentCommentId: string) => {
    const text = replyInputs[parentCommentId];
    if (!text?.trim() || !currentUser) return;
    
    setIsSubmittingReply(prev => ({ ...prev, [parentCommentId]: true }));
    try {
      const createdReply = await commentsApi.createComment({
        postId: post.id!,
        userId: currentUser.id,
        content: text.trim(),
        parentCommentId
      });
      
      const newReply = {
        ...createdReply,
        parentCommentId: createdReply.parentCommentId || parentCommentId,
        userName: createdReply.userName || currentUser.fullName,
        userAvatar: createdReply.userAvatar || currentUser.avatar,
      };

      setReplies(prev => ({
        ...prev,
        [parentCommentId]: [...(prev[parentCommentId] || []), newReply]
      }));

      setComments(prev => prev.map(c => 
        c.id === parentCommentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
      ));

      setReplyInputs(prev => ({ ...prev, [parentCommentId]: '' }));
      setReplyingTo(null);
      if (!expandedReplies.has(parentCommentId)) {
        setExpandedReplies(prev => new Set(prev).add(parentCommentId));
      }
    } catch (error) {
      showToast(t('newsfeed.replySendFailed'), 'error');
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [parentCommentId]: false }));
    }
  };

  const toggleReplies = async (commentId: string) => {
    const isExpanding = !expandedReplies.has(commentId);
    setExpandedReplies(prev => {
      const next = new Set(prev);
      isExpanding ? next.add(commentId) : next.delete(commentId);
      return next;
    });

    if (isExpanding && !replies[commentId]) {
      try {
        const data = await commentsApi.getRepliesByCommentId(commentId);
        setReplies(prev => ({ ...prev, [commentId]: data }));
      } catch (error) {
        console.error('Failed to load replies:', error);
      }
    }
  };

  const handlePostAction = async (action: string) => {
    setIsMenuOpen(false);
    if (action === 'edit') {
      setIsEditing(true);
      setEditContent(post.content);
      setEditVisibility(normalizeVisibility(post.visibility));
    } else if (action === 'delete') {
      if (window.confirm(t('newsfeed.confirmDeletePost'))) {
        setIsDeleting(true);
        try {
          await postsApi.deletePost(post.id!);
          onDeleteSuccess?.(post.id!);
        } catch (error) {
          showToast(t('newsfeed.deletePostFailed'), 'error');
          setIsDeleting(false);
        }
      }
    } else if (action === 'save') {
      try {
        if (isSaved) {
          await postsApi.unsavePost(post.id!);
          setIsSaved(false);
          showToast(t('newsfeed.postUnsaved', 'Đã bỏ lưu bài viết'), 'success');
        } else {
          await postsApi.savePost(post.id!);
          setIsSaved(true);
          showToast(t('newsfeed.postSaved', 'Đã lưu bài viết'), 'success');
        }
      } catch (error) {
        showToast(t('newsfeed.savePostFailed', 'Có lỗi xảy ra khi lưu bài viết'), 'error');
      }
    } else if (action === 'hide') {
      onHide?.(post.id!);
    } else if (action === 'report') {
      onReport?.(post);
    }
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim()) {
      showToast(t('newsfeed.postContentEmpty'), 'info');
      return;
    }
    try {
      const updatedPost = await postsApi.updatePost(post.id!, {
        content: editContent.trim(),
        images: post.images,
        videos: post.videos,
        location: post.location,
        visibility: editVisibility,
      });
      setPost(updatedPost);
      setIsEditing(false);
      showToast(t('newsfeed.updatePostSuccess', 'Đã cập nhật bài viết'), 'success');
    } catch (error) {
      showToast(t('newsfeed.updatePostFailed'), 'error');
    }
  };

  const visibilityMeta = getVisibilityMeta(post.visibility);
  const VisibilityIcon = visibilityMeta.Icon;

  return (
    <div className="bg-white dark:bg-[#1a1d28] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-none dark:hover:shadow-none relative group/card">
      {/* Post Header */}
      <div className="p-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3.5">
          <div 
            onClick={() => nav(`/profile/${post.authorId}`)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 bg-linear-to-br from-blue-500 to-blue-600 shadow-sm cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
          >
            {post.authorAvatar ? (
              <img src={resolveMediaUrl(post.authorAvatar)} alt={post.authorName} className="w-full h-full object-cover rounded-full" />
            ) : (
              getAuthorInitials(post.authorName)
            )}
          </div>
          <div>
            <p 
              onClick={() => nav(`/profile/${post.authorId}`)}
              className="font-semibold text-gray-900 text-base cursor-pointer hover:underline"
            >
              {post.authorName || 'Unknown User'}
            </p>
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
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-20">
              {currentUser?.id === post.authorId && (
                <>
                  <button
                    onClick={() => handlePostAction('edit')}
                    className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                  >
                    <Edit className="w-[18px] h-[18px] text-gray-500" />
                    <span className="text-gray-800 text-[15px] font-medium">{t('newsfeed.menuEdit')}</span>
                  </button>
                  <button
                    onClick={() => handlePostAction('delete')}
                    className="w-full px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                  >
                    <Trash2 className="w-[18px] h-[18px] text-red-500" />
                    <span className="text-red-500 text-[15px] font-medium">{t('newsfeed.menuDeletePost')}</span>
                  </button>
                  <div className="h-px bg-gray-100 my-1.5 mx-3" />
                </>
              )}
              <button
                onClick={() => handlePostAction('save')}
                className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
              >
                <Bookmark className={`w-[18px] h-[18px] ${isSaved ? 'text-blue-500 fill-current' : 'text-gray-500'}`} />
                <span className={`text-[15px] font-medium ${isSaved ? 'text-blue-600' : 'text-gray-800'}`}>
                  {isSaved ? t('newsfeed.menuUnsavePost', 'Bỏ lưu bài viết') : t('newsfeed.menuSavePost')}
                </span>
              </button>
              {currentUser?.id !== post.authorId && (
                <button
                  onClick={() => handlePostAction('hide')}
                  className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                >
                  <EyeOff className="w-[18px] h-[18px] text-gray-500" />
                  <span className="text-gray-800 text-[15px] font-medium">{t('newsfeed.menuHidePost')}</span>
                </button>
              )}
              {currentUser?.id !== post.authorId && (
                <button
                  onClick={() => handlePostAction('report')}
                  className="w-full px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-left transition-colors rounded-xl mx-auto"
                >
                  <Flag className="w-[18px] h-[18px] text-red-500" />
                  <span className="text-red-600 text-[15px] font-medium">{t('newsfeed.menuReport')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-5 pb-4">
        {isEditing ? (
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
                onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdatePost}
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
      {isDeleting && (
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
            onClick={handleLikePost}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all group ${isLiked ? 'text-red-500 bg-red-50/60' : 'hover:bg-gray-50'}`}
          >
            <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-500 group-hover:text-red-500 group-hover:fill-red-500'}`} />
            <span className={`text-[15px] font-medium ${isLiked ? 'text-red-500' : 'text-gray-600 group-hover:text-red-500'}`}>
              {isLiked ? t('groupComments.liked') : t('groupComments.like')}
            </span>
          </button>
          <button
            onClick={toggleComments}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all ${commentsExpanded ? 'bg-blue-50/70 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            <MessageCircle className={`w-5 h-5 ${commentsExpanded ? 'text-blue-600' : 'text-gray-500'}`} />
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
        {commentsExpanded && (
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
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                  placeholder={t('newsfeed.commentPlaceholder')}
                  disabled={isSubmittingComment}
                  className="w-full h-12 px-4 pr-14 rounded-xl bg-gray-100/50 dark:bg-[#22263a]/50 border-0 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#1e2133] text-base transition-all disabled:opacity-50 dark:text-gray-200"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentInput.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${commentInput.trim() ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLoadingComments && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="ml-2 text-sm text-gray-400">Đang tải bình luận...</span>
              </div>
            )}

            {!isLoadingComments && comments.length === 0 && (
              <div className="text-center py-3">
                <p className="text-sm text-gray-400">{t('newsfeed.statsComments', { count: 0 }).replace('0 ', '') || 'Chưa có bình luận nào'}</p>
              </div>
            )}

            {!isLoadingComments && comments.length > 0 && (
              <div className="space-y-3 mt-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-2">
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
                            onClick={() => handleLikeComment(comment.id!)}
                            className={`text-xs font-bold transition-colors ${likedComments.has(comment.id!) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                          >
                            {likedComments.has(comment.id!) ? `❤️ ${t('groupComments.liked')}` : t('groupComments.like')}
                            {(comment.likeCount ?? 0) > 0 ? ` · ${comment.likeCount}` : null}
                          </button>
                          <span className="text-gray-300 text-xs">·</span>
                          <button
                            onClick={() => { setReplyingTo(comment.id!); setReplyInputs(prev => ({...prev, [comment.id!]: ''})); }}
                            className="text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            {t('groupComments.reply')}
                          </button>
                          {(comment.replyCount ?? 0) > 0 ? (
                            <>
                              <span className="text-gray-300 text-xs">·</span>
                              <button
                                onClick={() => toggleReplies(comment.id!)}
                                className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                              >
                                {expandedReplies.has(comment.id!) ? t('groupComments.hide') : `${comment.replyCount} ${t('newsfeed.repliesNoun')}`}
                              </button>
                            </>
                          ) : null}
                          <span className="text-gray-400 text-[11px] ml-auto">
                            {comment.createdAt ? getTimeAgo(comment.createdAt) : t('watch.justNow')}
                          </span>
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-[11px] flex-shrink-0 overflow-hidden">
                              {composerAvatarSrc && !composerAvatarFailed ? (
                                <img src={composerAvatarSrc} alt="" className="w-full h-full object-cover" onError={() => setComposerAvatarFailed(true)} />
                              ) : (
                                <span>{currentUser?.fullName?.charAt(0) || 'U'}</span>
                              )}
                            </div>
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={replyInputs[comment.id] || ''}
                                onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id!]: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply(comment.id!)}
                                placeholder={t('groupComments.replyTo', { name: comment.userName ?? '' })}
                                disabled={isSubmittingReply[comment.id!]}
                                className="w-full h-8 px-3 pr-9 rounded-full bg-gray-100 dark:bg-[#22263a] border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs dark:text-gray-200 placeholder:text-gray-400"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSendReply(comment.id!)}
                                disabled={!replyInputs[comment.id]?.trim() || isSubmittingReply[comment.id!]}
                                className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${replyInputs[comment.id]?.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                              >
                                {isSubmittingReply[comment.id!] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              </button>
                            </div>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyInputs(prev => ({ ...prev, [comment.id!]: '' })); }}
                              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
                            >
                              {t('groupComments.cancel')}
                            </button>
                          </div>
                        )}

                        {/* Replies List */}
                        {expandedReplies.has(comment.id!) && replies[comment.id!] && replies[comment.id!].length > 0 && (
                          <div className="ml-2 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-white/10 pl-3">
                            {replies[comment.id!].map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold text-[11px] flex-shrink-0 overflow-hidden">
                                  {reply.userAvatar ? (
                                    <img src={resolveMediaUrl(reply.userAvatar)} alt="" className="w-full h-full object-cover" />
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
                                      onClick={() => handleLikeComment(reply.id!)}
                                      className={`text-[11px] font-bold transition-colors ${likedComments.has(reply.id!) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                    >
                                      {likedComments.has(reply.id!) ? `❤️ ${t('groupComments.liked')}` : t('groupComments.like')}
                                      {(reply.likeCount ?? 0) > 0 ? ` · ${reply.likeCount}` : null}
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
}
