import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Eye, Trash2, X, AlertCircle, Heart, MessageSquare, Share2 } from 'lucide-react';
import { postsApi, type PostData } from '../../apis/posts';
import { getLocaleTag } from '../../i18n';

export default function AdminPostManagement() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postsApi.getAllPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t('adminPanel.posts.loadError'));
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t('adminPanel.posts.confirmDelete'))) return;
    
    try {
      setDeleting(postId);
      await postsApi.deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
      alert(t('adminPanel.posts.deleteSuccess'));
    } catch (err: any) {
      alert(t('adminPanel.posts.deleteError', { message: err.message || 'Unknown error' }));
      console.error('Failed to delete post:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleViewDetail = (post: PostData) => {
    setSelectedPost(post);
    setShowDetailModal(true);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, treat all posts as 'approved' since we don't have status field
    const matchesFilter = filterStatus === 'all' || filterStatus === 'approved';
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.notAvailable');
    try {
      return new Date(dateString).toLocaleString(getLocaleTag());
    } catch {
      return dateString;
    }
  };

  const getAuthorInitials = (name?: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[words.length - 1][0];
    }
    return name.substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('adminPanel.posts.loadingList')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-red-800">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">{t('adminPanel.posts.errorDataTitle')}</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={loadPosts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          {t('adminPanel.dashboard.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminPanel.posts.pageTitle')}</h1>
          <p className="text-lg text-gray-600">{t('adminPanel.posts.pageSubtitle')}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder={t('adminPanel.posts.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium cursor-pointer"
            >
              <option value="all">{t('adminPanel.posts.filterStatusAll')}</option>
              <option value="approved">{t('adminPanel.posts.filterStatusApproved')}</option>
              <option value="pending">{t('adminPanel.posts.filterStatusPending')}</option>
              <option value="reported">{t('adminPanel.posts.filterStatusReported')}</option>
            </select>
            <button type="button" className="h-14 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-lg">
              <Filter className="w-6 h-6" />
              {t('adminPanel.posts.filterButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {paginatedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">{t('adminPanel.posts.emptyList')}</p>
          </div>
        ) : (
          paginatedPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm bg-blue-600"
                  >
                    {getAuthorInitials(post.authorName)}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900">{post.authorName || t('adminPanel.posts.authorUnknown')}</p>
                    <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 rounded-xl font-semibold text-base bg-green-50 text-green-700">
                    {t('adminPanel.posts.badgeApproved')}
                  </span>
                </div>
              </div>

              <p className="text-base text-gray-900 mb-4 leading-relaxed line-clamp-3">{post.content}</p>

              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {post.images.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Post image ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image';
                      }}
                    />
                  ))}
                  {post.images.length > 4 && (
                    <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">+{post.images.length - 4}</span>
                    </div>
                  )}
                </div>
              )}

              {post.videos && post.videos.length > 0 && (
                <div className="mb-4">
                  <video
                    src={post.videos[0]}
                    controls
                    className="w-full max-h-96 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-6 text-base text-gray-600">
                  <span className="font-semibold inline-flex items-center gap-1"><Heart className="w-4 h-4 text-red-500" /> {post.likeCount || 0}</span>
                  <span className="font-semibold inline-flex items-center gap-1"><MessageSquare className="w-4 h-4 text-blue-500" /> {post.commentCount || 0}</span>
                  <span className="font-semibold inline-flex items-center gap-1"><Share2 className="w-4 h-4 text-green-500" /> {post.shareCount || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetail(post)}
                    title={t('adminPanel.posts.viewDetail')}
                    className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => post.id && handleDeletePost(post.id)}
                    disabled={deleting === post.id}
                    title={t('adminPanel.posts.deleteTitle')}
                    className="w-11 h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {deleting === post.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredPosts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between">
          <p className="text-base text-gray-600">
            {t('adminPanel.posts.paginationRange', {
              from: (currentPage - 1) * itemsPerPage + 1,
              to: Math.min(currentPage * itemsPerPage, filteredPosts.length),
              total: filteredPosts.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('adminPanel.posts.prev')}
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-5 py-2 rounded-xl font-semibold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('adminPanel.posts.next')}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('adminPanel.posts.detailModalTitle')}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm bg-blue-600">
                  {getAuthorInitials(selectedPost.authorName)}
                </div>
                <div>
                  <p className="font-bold text-lg">{selectedPost.authorName || t('adminPanel.posts.authorUnknown')}</p>
                  <p className="text-sm text-gray-500">{formatDate(selectedPost.createdAt)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mb-6 grid grid-cols-2 gap-3">
                  {selectedPost.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-full rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image';
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedPost.videos && selectedPost.videos.length > 0 && (
                <div className="mb-6">
                  {selectedPost.videos.map((video, idx) => (
                    <video
                      key={idx}
                      src={video}
                      controls
                      className="w-full rounded-xl mb-3"
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPost.likeCount || 0}</p>
                  <p className="text-sm text-gray-600">{t('adminPanel.posts.statLikes')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPost.commentCount || 0}</p>
                  <p className="text-sm text-gray-600">{t('adminPanel.posts.statComments')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPost.shareCount || 0}</p>
                  <p className="text-sm text-gray-600">{t('adminPanel.posts.statShares')}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => {
                    if (selectedPost.id) {
                      handleDeletePost(selectedPost.id);
                      setShowDetailModal(false);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {t('adminPanel.posts.deletePost')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
