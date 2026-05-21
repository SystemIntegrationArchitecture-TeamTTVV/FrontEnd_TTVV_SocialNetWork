import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Eye, Trash2, X, AlertCircle, Heart, MessageSquare, Share2 } from 'lucide-react';
import { postsApi, type PostData, type AdminPostFilter } from '../../apis/posts';
import { commentsApi, type CommentData } from '../../apis/comments';
import { getLocaleTag } from '../../i18n';

export default function AdminPostManagement() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [adminFilters, setAdminFilters] = useState<AdminPostFilter>({
    status: 'ALL',
    sortBy: 'NEWEST',
  });
  // Pending filters: local UI state, only applied on "Lọc" click
  const [pendingFilters, setPendingFilters] = useState<AdminPostFilter>({
    status: 'ALL',
    sortBy: 'NEWEST',
  });
  
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replies, setReplies] = useState<Record<string, CommentData[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPosts();
  }, [adminFilters]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postsApi.getAdminPosts(adminFilters);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t('adminPanel.posts.loadError'));
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      setReplies({}); // Reset replies when loading new post
      const data = await commentsApi.getCommentsByPostId(postId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    if (replies[commentId]) {
      // Toggle off if already loaded
      const newReplies = { ...replies };
      delete newReplies[commentId];
      setReplies(newReplies);
      return;
    }

    try {
      setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
      const data = await commentsApi.getRepliesByCommentId(commentId);
      setReplies(prev => ({ ...prev, [commentId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleToggleHide = async (postId: string) => {
    try {
      setProcessingId(postId);
      const updatedPost = await postsApi.hidePost(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
      if (selectedPost?.id === postId) setSelectedPost(updatedPost);
    } catch (err: any) {
      alert(t('adminPanel.posts.actionError', { message: err.message }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleLockComments = async (postId: string) => {
    try {
      setProcessingId(postId);
      const updatedPost = await postsApi.lockComments(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
      if (selectedPost?.id === postId) setSelectedPost(updatedPost);
    } catch (err: any) {
      alert(t('adminPanel.posts.actionError', { message: err.message }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestorePost = async (postId: string) => {
    try {
      setProcessingId(postId);
      const updatedPost = await postsApi.restorePost(postId);
      setPosts(posts.map(p => p.id === postId ? updatedPost : p));
      if (selectedPost?.id === postId) setSelectedPost(updatedPost);
      alert(t('adminPanel.posts.restoreSuccess', 'Khôi phục bài viết thành công'));
    } catch (err: any) {
      alert(t('adminPanel.posts.actionError', { message: err.message }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleHardDeletePost = async (postId: string) => {
    if (!confirm('Hành động này sẽ XÓA VĨNH VIỄN bài viết khỏi cơ sở dữ liệu. Bạn có chắc chắn không?')) return;
    try {
      setProcessingId(postId);
      await postsApi.hardDeletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      alert('Đã xóa vĩnh viễn bài viết');
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (err: any) {
      alert(t('adminPanel.posts.actionError', { message: err.message }));
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    if (!deleteReason.trim()) {
      alert(t('adminPanel.posts.reasonRequired'));
      return;
    }

    try {
      setProcessingId(postToDelete);
      const updatedPost = await postsApi.softDeletePost(postToDelete, deleteReason);
      // Cập nhật trạng thái bài viết trong danh sách (giữ lại, đổi badge sang "Đã xóa")
      setPosts(prev => prev.map(p => p.id === postToDelete ? updatedPost : p));
      if (selectedPost?.id === postToDelete) setSelectedPost(updatedPost);
      alert(t('adminPanel.posts.deleteSuccess'));
      setShowDeleteModal(false);
      setDeleteReason('');
    } catch (err: any) {
      alert(t('adminPanel.posts.deleteError', { message: err.message || 'Unknown error' }));
      console.error('Failed to delete post:', err);
    } finally {
      setProcessingId(null);
      setPostToDelete(null);
    }
  };

  // Mở modal xóa từ Detail modal
  const handleOpenDeleteModal = (postId: string) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const handleViewDetail = (post: PostData) => {
    setSelectedPost(post);
    setShowDetailModal(true);
    if (post.id) {
      loadComments(post.id);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">{t('adminPanel.posts.loadingList')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">{t('adminPanel.posts.errorDataTitle')}</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
        <button
          onClick={loadPosts}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          {t('adminPanel.dashboard.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('adminPanel.posts.pageTitle')}</h1>
          <p className="text-sm text-gray-500">{t('adminPanel.posts.pageSubtitle')}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('adminPanel.posts.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <input 
              type="date"
              value={pendingFilters.startDate || ''}
              onChange={(e) => setPendingFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
              title="Từ ngày"
            />
            <input 
              type="date"
              value={pendingFilters.endDate || ''}
              onChange={(e) => setPendingFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
              title="Đến ngày"
            />
            <select
              value={pendingFilters.status}
              onChange={(e) => setPendingFilters(prev => ({ ...prev, status: e.target.value }))}
              className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium cursor-pointer text-gray-700"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hợp lệ</option>
              <option value="HIDDEN">Bị ẩn (Shadowban)</option>
              <option value="DELETED">Đã xóa mềm</option>
              <option value="REPORTED">Bị báo cáo</option>
            </select>
            <select
              value={pendingFilters.sortBy}
              onChange={(e) => setPendingFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium cursor-pointer text-gray-700"
            >
              <option value="NEWEST">Mới nhất</option>
              <option value="INTERACTION">Tương tác nhiều nhất</option>
            </select>
            <button 
              onClick={() => { setAdminFilters({ ...pendingFilters }); setCurrentPage(1); }}
              type="button" 
              className="h-10 px-4 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-2 transition-colors font-semibold text-sm"
            >
              <Filter className="w-4 h-4" />
              Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedPosts.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm">{t('adminPanel.posts.emptyList')}</p>
          </div>
        ) : (
          paginatedPosts.map((post) => (
            <div key={post.id} className={`bg-white rounded-xl shadow-sm border flex flex-col hover:shadow-md transition-all ${post.isDeleted ? 'border-red-300 opacity-75 grayscale-[50%]' : post.isHidden ? 'border-yellow-300 opacity-90' : post.allowComments === false ? 'border-gray-300' : 'border-gray-100'}`}>
              <div className="p-4 flex items-start gap-3 border-b border-gray-50">
                <div
                  className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm bg-blue-600"
                >
                  {getAuthorInitials(post.authorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{post.authorName || t('adminPanel.posts.authorUnknown')}</p>
                  <p className="text-xs text-gray-500 truncate">{formatDate(post.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {post.isDeleted ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-md font-medium text-[11px] bg-red-50 text-red-700 border border-red-100">Đã xóa</span>
                  ) : post.isHidden ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-md font-medium text-[11px] bg-yellow-50 text-yellow-700 border border-yellow-100">Đã ẩn</span>
                  ) : (
                    <span className="shrink-0 px-2.5 py-1 rounded-md font-medium text-[11px] bg-green-50 text-green-700 border border-green-100">Hợp lệ</span>
                  )}
                  {post.allowComments === false && (
                    <span className="shrink-0 px-2.5 py-1 rounded-md font-medium text-[11px] bg-gray-100 text-gray-600 border border-gray-200">🔒 Khóa BL</span>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex-1">
                <p className="text-sm text-gray-800 mb-3 leading-relaxed line-clamp-4">{post.content}</p>

                {/* Lý do xóa mềm */}
                {post.isDeleted && post.deleteReason && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 shrink-0">⚠️</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-red-700 mb-0.5">Lý do xóa</p>
                      <p className="text-[11px] text-red-600 leading-relaxed line-clamp-2">{post.deleteReason}</p>
                    </div>
                  </div>
                )}

                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-1 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.slice(0, 2).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Post image ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image';
                        }}
                      />
                    ))}
                    {post.images.length > 2 && (
                      <div className="col-span-2 text-xs text-center text-gray-500 font-medium">
                        + {post.images.length - 2} more images
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-medium inline-flex items-center gap-1"><Heart className="w-4 h-4 text-red-500" /> {post.likeCount || 0}</span>
                  <span className="font-medium inline-flex items-center gap-1"><MessageSquare className="w-4 h-4 text-blue-500" /> {post.commentCount || 0}</span>
                  <span className="font-medium inline-flex items-center gap-1"><Share2 className="w-4 h-4 text-green-500" /> {post.shareCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleViewDetail(post)}
                    title={t('adminPanel.posts.viewDetail')}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {post.isDeleted ? (
                    <>
                      <button
                        onClick={() => post.id && handleRestorePost(post.id)}
                        disabled={processingId === post.id}
                        title="Khôi phục bài viết"
                        className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        {processingId === post.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                        ) : (
                          <span className="text-xs font-semibold px-1">Khôi phục</span>
                        )}
                      </button>
                      <button
                        onClick={() => post.id && handleHardDeletePost(post.id)}
                        disabled={processingId === post.id}
                        title="Xóa vĩnh viễn"
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {processingId === post.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => post.id && handleToggleHide(post.id)}
                        disabled={processingId === post.id}
                        title={post.isHidden ? "Bỏ ẩn bài viết" : "Ẩn bài viết (Shadowban)"}
                        className="p-2 rounded-lg text-yellow-600 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                      >
                        {processingId === post.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                        ) : (
                          <span className="text-xs font-semibold px-1">{post.isHidden ? "Hiện" : "Ẩn"}</span>
                        )}
                      </button>
                      <button
                        onClick={() => post.id && handleToggleLockComments(post.id)}
                        disabled={processingId === post.id}
                        title={post.allowComments === false ? "Mở khóa bình luận" : "Khóa bình luận"}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {processingId === post.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                        ) : (
                          <span className="text-xs font-semibold px-1">{post.allowComments === false ? "Mở BL" : "Khóa BL"}</span>
                        )}
                      </button>
                      <button
                        onClick={() => { setPostToDelete(post.id!); setShowDeleteModal(true); }}
                        disabled={processingId === post.id}
                        title={t('adminPanel.posts.deleteTitle')}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {processingId === post.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredPosts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t('adminPanel.posts.paginationRange', {
              from: (currentPage - 1) * itemsPerPage + 1,
              to: Math.min(currentPage * itemsPerPage, filteredPosts.length),
              total: filteredPosts.length,
            })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t('adminPanel.posts.prev')}
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t('adminPanel.posts.next')}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-gray-900">{t('adminPanel.posts.detailModalTitle')}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-5 flex flex-col lg:flex-row gap-6">
              {/* Post Details Side */}
              <div className="flex-1 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm bg-blue-600 shadow-sm">
                      {getAuthorInitials(selectedPost.authorName)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedPost.authorName || t('adminPanel.posts.authorUnknown')}</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedPost.createdAt)}</p>
                    </div>
                    <div className="ml-auto">
                      {selectedPost.isDeleted ? (
                        <span className="px-2.5 py-1 rounded-md font-medium text-[11px] bg-red-50 text-red-700 border border-red-100">
                          Đã xóa
                        </span>
                      ) : selectedPost.isHidden ? (
                        <span className="px-2.5 py-1 rounded-md font-medium text-[11px] bg-yellow-50 text-yellow-700 border border-yellow-100">
                          Đã ẩn
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md font-medium text-[11px] bg-green-50 text-green-700 border border-green-100">
                          Hợp lệ
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">{selectedPost.content}</p>

                  {/* Thông tin xóa mềm trong Detail Modal */}
                  {selectedPost.isDeleted && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-600">🗑️</span>
                        <p className="text-sm font-bold text-red-800">Bài viết đã bị xóa mềm</p>
                      </div>
                      {selectedPost.deletedAt && (
                        <p className="text-xs text-red-600 mb-1">
                          <span className="font-semibold">Thời gian xóa:</span> {formatDate(selectedPost.deletedAt)}
                        </p>
                      )}
                      {selectedPost.deleteReason ? (
                        <p className="text-xs text-red-700">
                          <span className="font-semibold">Lý do:</span> {selectedPost.deleteReason}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 italic">Không có lý do được ghi nhận.</p>
                      )}
                    </div>
                  )}

                  {selectedPost.images && selectedPost.images.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {selectedPost.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="w-full rounded-lg border border-gray-100 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image';
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {selectedPost.videos && selectedPost.videos.length > 0 && (
                    <div className="mb-4">
                      {selectedPost.videos.map((video, idx) => (
                        <video
                          key={idx}
                          src={video}
                          controls
                          className="w-full rounded-lg border border-gray-100 mb-2 bg-black"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-sm">{selectedPost.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-sm">{selectedPost.commentCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Share2 className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-sm">{selectedPost.shareCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Side */}
              <div className="w-full lg:w-96 flex flex-col h-[500px] lg:h-auto bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">{t('adminPanel.posts.statComments')} ({comments.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">No comments yet.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex flex-col gap-2">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-white font-bold text-xs bg-gray-400">
                            {getAuthorInitials(comment.userName || 'U')}
                          </div>
                          <div className="flex-1 bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="font-semibold text-xs text-gray-900 truncate">{comment.userName || 'Unknown'}</span>
                              <span className="text-[10px] text-gray-500 shrink-0">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                            {comment.images && comment.images.length > 0 && (
                              <div className="mt-2 flex gap-2 overflow-x-auto">
                                {comment.images.map((img, idx) => (
                                  <img key={idx} src={img} className="h-16 rounded border border-gray-200" alt="comment img" />
                                ))}
                              </div>
                            )}
                            {comment.replyCount !== undefined && comment.replyCount > 0 && (
                              <button 
                                onClick={() => comment.id && loadReplies(comment.id)}
                                className="text-xs text-blue-600 font-semibold mt-2 hover:underline focus:outline-none flex items-center gap-1"
                              >
                                {loadingReplies[comment.id!] ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                                ) : (
                                  replies[comment.id!] ? 'Ẩn phản hồi' : `Xem ${comment.replyCount} phản hồi`
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Replies Section */}
                        {comment.id && replies[comment.id] && (
                          <div className="ml-11 flex flex-col gap-3 mt-1 border-l-2 border-gray-100 pl-3">
                            {replies[comment.id].map(reply => (
                              <div key={reply.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full flex shrink-0 items-center justify-center text-white font-bold text-[10px] bg-gray-300">
                                  {getAuthorInitials(reply.userName || 'U')}
                                </div>
                                <div className="flex-1 bg-gray-50 p-2 rounded-xl rounded-tl-none border border-gray-100">
                                  <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className="font-semibold text-xs text-gray-900 truncate">{reply.userName || 'Unknown'}</span>
                                    <span className="text-[10px] text-gray-500 shrink-0">{formatDate(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                                  {reply.images && reply.images.length > 0 && (
                                    <div className="mt-2 flex gap-2 overflow-x-auto">
                                      {reply.images.map((img, idx) => (
                                        <img key={idx} src={img} className="h-12 rounded border border-gray-200" alt="reply img" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                {t('common.close')}
              </button>
              {!selectedPost.isDeleted && (
                <button
                  onClick={() => {
                    if (selectedPost.id) {
                      setShowDetailModal(false);
                      handleOpenDeleteModal(selectedPost.id);
                    }
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('adminPanel.posts.deletePost')}
                </button>
              )}
              {selectedPost.isDeleted && (
                <button
                  onClick={() => selectedPost.id && handleRestorePost(selectedPost.id)}
                  disabled={processingId === selectedPost.id}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Khôi phục bài viết
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Reason Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Xóa bài viết</h2>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteReason(''); setPostToDelete(null); }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <p className="text-sm text-gray-600">
                Vui lòng cung cấp lý do xóa bài viết. Hệ thống sẽ tự động gửi thông báo cho người đăng.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do xóa <span className="text-red-500">*</span></label>
                <select
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm mb-3"
                  onChange={(e) => {
                    if (e.target.value !== 'other') {
                      setDeleteReason(e.target.value);
                    } else {
                      setDeleteReason('');
                    }
                  }}
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Bài viết chứa nội dung spam, lừa đảo">Nội dung spam, lừa đảo</option>
                  <option value="Bài viết chứa ngôn từ thô tục, đả kích">Ngôn từ thô tục, đả kích</option>
                  <option value="Bài viết chứa thông tin sai lệch, tin giả">Thông tin sai lệch (Fake news)</option>
                  <option value="Bài viết vi phạm bản quyền">Vi phạm bản quyền</option>
                  <option value="other">Lý do khác...</option>
                </select>
                <textarea
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full h-24 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteReason(''); setPostToDelete(null); }}
                className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeletePost}
                disabled={!deleteReason.trim() || processingId === postToDelete}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingId === postToDelete ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
