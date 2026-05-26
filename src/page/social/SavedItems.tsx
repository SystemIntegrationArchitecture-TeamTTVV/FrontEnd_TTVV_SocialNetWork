import { useState, useEffect } from 'react';
import { Search, Bookmark, FileText, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { postsApi } from '../../apis/posts';
import type { PostData } from '../../apis/posts';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/useToast';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import PostCard from '../../components/post/PostCard';
import { useAuth } from '../../contexts/AuthContext';
import { showAuthRequiredPrompt } from '../../utils/authPrompt';

function demoAuthorInitials(name?: string): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name?: string): string {
  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#F97316'];
  const hash = (name || '?').split('').reduce((acc, c) => c.charCodeAt(0) + ((acc << 5) - acc), 0);
  return colors[Math.abs(hash) % colors.length];
}

export default function SavedItems() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const nav = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const requestLogin = () => showAuthRequiredPrompt(window.location.pathname);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setLoading(true);
        const data = await postsApi.getSavedPosts();
        setSavedPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
        showToast(t('saved.fetchError', 'Không thể tải danh sách đã lưu'), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSavedPosts();
  }, [t, showToast]);

  const handleUnsave = async (postId: string) => {
    try {
      await postsApi.unsavePost(postId);
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
      showToast(t('newsfeed.postUnsaved', 'Đã bỏ lưu bài viết'), 'success');
    } catch (error) {
      showToast(t('newsfeed.savePostFailed', 'Có lỗi xảy ra'), 'error');
    }
  };

  const filteredItems = savedPosts.filter((post) => {
    const query = searchQuery.toLowerCase();
    return (
      post.content?.toLowerCase().includes(query) ||
      post.authorName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('saved.title')}</h1>
        <p className="text-lg text-gray-600">{t('saved.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder={t('saved.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Saved Items List */}
      {!loading && (
        <div className="space-y-4">
          {filteredItems.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail/Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {post.images && post.images.length > 0 ? (
                    <img src={resolveMediaUrl(post.images[0])} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-4">
                      <p className="text-base text-gray-600 mb-3 line-clamp-2">
                        {post.content || t('newsfeed.noContent', 'Không có nội dung')}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnsave(post.id!);
                      }}
                      title={t('newsfeed.menuUnsavePost', 'Bỏ lưu bài viết')}
                      className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Bookmark className="w-5 h-5 text-blue-600 fill-current" />
                    </button>
                  </div>

                  {/* Author and Date */}
                  <div className="flex items-center gap-3 mt-4">
                    {post.authorAvatar ? (
                      <img src={resolveMediaUrl(post.authorAvatar)} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: getAvatarColor(post.authorName) }}
                      >
                        {demoAuthorInitials(post.authorName)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900" onClick={(e) => { e.stopPropagation(); nav(`/profile/${post.authorId}`); }}>
                        {post.authorName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('saved.emptyTitle')}</h3>
          <p className="text-base text-gray-600">{t('saved.emptySubtitle')}</p>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-2 text-gray-500 transition-colors bg-white/80 backdrop-blur-sm rounded-full hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PostCard
              post={selectedPost}
              currentUser={currentUser}
              initialIsSaved={true}
              onDeleteSuccess={(postId) => {
                setSavedPosts(prev => prev.filter(p => p.id !== postId));
                setSelectedPost(null);
              }}
              requestLogin={requestLogin}
            />
          </div>
        </div>
      )}
    </div>
  );
}
