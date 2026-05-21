import React, { useEffect, useState } from "react";
import { X, Heart, MessageCircle, Share2, Loader2, User } from "lucide-react";
import { postsApi, type PostData } from "../../apis/posts";
import { commentsApi, type CommentData } from "../../apis/comments";

interface PostPreviewModalProps {
  postId: string | null;
  onClose: () => void;
}

export const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  postId,
  onClose,
}) => {
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postData, commentsData] = await Promise.all([
          postsApi.getPostById(postId),
          commentsApi.getCommentsByPostId(postId).catch(() => []), // Fallback to empty if comments fail
        ]);
        setPost(postData);
        setComments(commentsData || []);
      } catch (err: any) {
        console.error("Failed to load post details:", err);
        setError("Không thể tải chi tiết bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  if (!postId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all border border-slate-200/50 dark:border-slate-700/50">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Chi tiết Bài viết</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-500 font-medium">Đang tải dữ liệu bài viết...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <p className="font-medium text-lg">{error}</p>
              <button 
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          ) : post ? (
            <>
              {/* Post Content Section */}
              <div className="space-y-6">
                {/* Author Info */}
                <div className="flex items-center space-x-4">
                  {post.authorAvatar ? (
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName || "User avatar"}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-indigo-50 dark:ring-indigo-900/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-900/30">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {post.authorName || "Unknown User"}
                    </h3>
                    <div className="text-sm text-slate-500 flex items-center space-x-2">
                      <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown Date"}</span>
                      {post.visibility && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{post.visibility.toLowerCase()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>

                {/* Images Grid */}
                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
                    {post.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700">
                        <img src={img} alt={`Post image ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="flex items-center space-x-6 py-4 border-y border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2 text-rose-500">
                    <Heart className="w-5 h-5 fill-current" />
                    <span className="font-semibold text-lg">{post.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-500">
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span className="font-semibold text-lg">{post.commentCount || comments.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <Share2 className="w-5 h-5 fill-current" />
                    <span className="font-semibold text-lg">{post.shareCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-indigo-500" />
                  <span>Bình luận ({comments.length})</span>
                </h3>
                
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Chưa có bình luận nào cho bài viết này.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        {comment.userAvatar ? (
                          <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="font-semibold text-slate-900 dark:text-white">{comment.userName || "Unknown"}</span>
                              <span className="text-xs text-slate-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 break-words">{comment.content}</p>
                            
                            {/* Comment Images */}
                            {comment.images && comment.images.length > 0 && (
                              <div className="mt-3 grid gap-2 grid-cols-2 max-w-sm">
                                {comment.images.map((img, idx) => (
                                  <img key={idx} src={img} alt="Comment image" className="rounded-xl w-full h-auto border border-slate-200 dark:border-slate-700" />
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Comment Actions */}
                          <div className="flex items-center space-x-4 mt-2 ml-2 text-xs font-medium text-slate-500">
                            <button className="hover:text-indigo-600 transition-colors">Thích ({comment.likeCount || 0})</button>
                            <button className="hover:text-indigo-600 transition-colors">Trả lời</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
