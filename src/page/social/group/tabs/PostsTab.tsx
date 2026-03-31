import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { postGroupApi, type PostGroupData } from "../../../../apis/postsGroup";
import { reactionsApi } from "../../../../apis/reactions";
import { commentsApi, type CommentData } from "../../../../apis/comments";
import { HttpError } from "../../../../apis/http";
import { authApi } from "../../../../apis/auth";
import { useToast } from "../../../../contexts/useToast";
import CreatePostGroup from "./CreatePostGroup";
import PostCard from "./Postcard";
import CommentSection from "./CommentSection";

export default function PostsTab({ groupId }: { groupId: string }) {
  const [currentUser] = useState(() => authApi.getCurrentUser());

  // ── Posts ──────────────────────────────────────────────
  const [posts, setPosts] = useState<PostGroupData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Reactions ─────────────────────────────────────────
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  // ── Comments ──────────────────────────────────────────
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [postComments, setPostComments] = useState<Record<string, CommentData[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  // ── Replies ───────────────────────────────────────────
  const [commentReplies, setCommentReplies] = useState<Record<string, CommentData[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // ── Post Menu / Edit / Delete ─────────────────────────
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { showToast } = useToast();

  const normalizeVisibility = (visibility?: string): 'PUBLIC' | 'PRIVATE' => {
    if (!visibility) return 'PUBLIC';
    const normalized = visibility.toUpperCase();
    if (normalized === 'PRIVATE' || normalized === 'ONLY_ME') return 'PRIVATE';
    return 'PUBLIC';
  };

  // ── Fetch Posts + Role ────────────────────────────────
  const fetchPosts = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) {
        setIsLoadingPosts(true);
      }
      setError(null);
      const data = await postGroupApi.getPostsByGroupId(groupId, currentUser?.id);
      setPosts(data);

      if (currentUser?.id) {
        const [reactions] = await Promise.allSettled([
          reactionsApi.getReactionsByUserId(currentUser.id),
        ]);

        if (reactions.status === "fulfilled") {
          setLikedPosts(new Set(reactions.value.filter(r => r.postId).map(r => r.postId!)));
          setLikedComments(new Set(reactions.value.filter(r => r.commentId).map(r => r.commentId!)));
        }
      }
    } catch {
      setError("Không thể tải bài viết. Vui lòng thử lại.");
    } finally {
      if (!opts?.silent) {
        setIsLoadingPosts(false);
      }
    }
  };

  useEffect(() => { fetchPosts(); }, [groupId]);

  // ── Close menu on outside click ───────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inside = Object.values(menuRefs.current).some(ref => ref?.contains(target));
      if (!inside) setOpenMenuId(null);
    };
    if (openMenuId !== null) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  // ── Like Post ─────────────────────────────────────────
  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev => { const s = new Set(prev); isLiked ? s.delete(postId) : s.add(postId); return s; });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount: (p.likeCount || 0) + (isLiked ? -1 : 1) } : p));
    try {
      await reactionsApi.togglePostReaction(postId, currentUser.id, "LIKE");
    } catch {
      setLikedPosts(prev => { const s = new Set(prev); isLiked ? s.add(postId) : s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount: (p.likeCount || 0) + (isLiked ? 1 : -1) } : p));
    }
  };

  // ── Toggle Comments ───────────────────────────────────
  const toggleComments = async (postId: string) => {
    const isExpanding = !expandedComments.has(postId);
    setExpandedComments(prev => { const s = new Set(prev); s.has(postId) ? s.delete(postId) : s.add(postId); return s; });
    if (isExpanding && !postComments[postId]) {
      try {
        const comments = await commentsApi.getCommentsByPostId(postId);
        setPostComments(prev => ({ ...prev, [postId]: comments }));
      } catch { /* ignore */ }
    }
  };

  // ── Send Comment ──────────────────────────────────────
  const handleSendComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !currentUser) return;
    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const newComment = await commentsApi.createComment({ postId, userId: currentUser.id, content: text });
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      if (!expandedComments.has(postId)) toggleComments(postId);
    } catch (error) {
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Gửi bình luận thất bại. Vui lòng thử lại.";
      showToast(msg, "error");
    }
    finally { setIsSubmittingComment(prev => ({ ...prev, [postId]: false })); }
  };

  // ── Like Comment ──────────────────────────────────────
  const handleLikeComment = async (commentId: string, postId: string) => {
    if (!currentUser) return;
    const isLiked = likedComments.has(commentId);
    setLikedComments(prev => { const s = new Set(prev); isLiked ? s.delete(commentId) : s.add(commentId); return s; });
    setPostComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(c =>
        c.id === commentId ? { ...c, likeCount: (c.likeCount || 0) + (isLiked ? -1 : 1) } : c
      ),
    }));
    try {
      await reactionsApi.toggleCommentReaction(commentId, currentUser.id, "LIKE");
    } catch {
      setLikedComments(prev => { const s = new Set(prev); isLiked ? s.add(commentId) : s.delete(commentId); return s; });
    }
  };

  // ── Replies ───────────────────────────────────────────
  const toggleReplies = async (commentId: string) => {
    const isExpanding = !expandedReplies.has(commentId);
    setExpandedReplies(prev => { const s = new Set(prev); s.has(commentId) ? s.delete(commentId) : s.add(commentId); return s; });
    if (isExpanding && !commentReplies[commentId]) {
      try {
        const replies = await commentsApi.getRepliesByCommentId(commentId);
        setCommentReplies(prev => ({ ...prev, [commentId]: replies }));
      } catch { /* ignore */ }
    }
  };

  const handleSendReply = async (parentCommentId: string, postId: string) => {
    const text = commentInputs[`reply-${parentCommentId}`]?.trim();
    if (!text || !currentUser) return;
    setIsSubmittingComment(prev => ({ ...prev, [`reply-${parentCommentId}`]: true }));
    try {
      const newReply = await commentsApi.createComment({ postId, userId: currentUser.id, content: text, parentCommentId });
      setCommentReplies(prev => ({ ...prev, [parentCommentId]: [...(prev[parentCommentId] || []), newReply] }));
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c =>
          c.id === parentCommentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
        ),
      }));
      setCommentInputs(prev => ({ ...prev, [`reply-${parentCommentId}`]: "" }));
      setReplyingTo(null);
      if (!expandedReplies.has(parentCommentId)) setExpandedReplies(prev => new Set(prev).add(parentCommentId));
    } catch (error) {
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Gửi phản hồi thất bại. Vui lòng thử lại.";
      showToast(msg, "error");
    }
    finally { setIsSubmittingComment(prev => ({ ...prev, [`reply-${parentCommentId}`]: false })); }
  };

  // ── Post Menu Actions ─────────────────────────────────
  const handleMenuAction = async (postId: string, action: string) => {
    setOpenMenuId(null);
    if (action === "edit") {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setEditingPostId(postId);
        setEditContent(post.content || "");
        setEditVisibility(normalizeVisibility(post.visibility));
      }
    } else if (action === "delete") {
      if (window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
        try {
          setIsDeleting(postId);
          await postGroupApi.deletePost(postId);
          setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
          const msg =
            error instanceof HttpError
              ? error.data?.message || error.message
              : "Xóa bài viết thất bại. Vui lòng thử lại.";
          showToast(msg, "error");
        } finally {
          setIsDeleting(null);
        }
      }
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;
    try {
      const current = posts.find(p => p.id === postId);
      const updated = await postGroupApi.updatePost(postId, {
        content: editContent.trim(),
        images: current?.images,
        videos: current?.videos,
        visibility: editVisibility,
      });
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      setEditingPostId(null);
      setEditContent("");
      setEditVisibility('PUBLIC');
    } catch (error) {
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Cập nhật thất bại. Vui lòng thử lại.";
      showToast(msg, "error");
    }
  };

  const currentUserInitials = (() => {
    if (!currentUser?.fullName) return "U";
    return currentUser.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  })();

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      <CreatePostGroup
        groupId={groupId}
        onPostCreated={(post) => {
          if (post?.id) {
            setPosts((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
          } else {
            void fetchPosts({ silent: true });
          }
        }}
      />

      {isLoadingPosts && (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-gray-500">Đang tải bài viết...</p>
        </div>
      )}

      {error && !isLoadingPosts && (
        <div className="bg-white rounded-2xl p-8 border border-red-200 text-center">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void fetchPosts()}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isLoadingPosts && !error && posts.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">Chưa có bài viết nào trong nhóm.</p>
        </div>
      )}

      {!isLoadingPosts && !error && posts.map(post => {
        if (!post.id) return null;
        const isExpanded = expandedComments.has(post.id);

        return (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUser?.id}
            isLiked={likedPosts.has(post.id)}
            isExpanded={isExpanded}
            isDeleting={isDeleting === post.id}
            editingPostId={editingPostId}
            editContent={editContent}
            editVisibility={editVisibility}
            openMenuId={openMenuId}
            menuRef={el => { if (post.id) menuRefs.current[post.id] = el; }}
            onLike={handleLikePost}
            onToggleComments={toggleComments}
            onOpenMenu={id => setOpenMenuId(openMenuId === id ? null : id)}
            onEditChange={setEditContent}
            onEditVisibilityChange={setEditVisibility}
            onEditSave={handleUpdatePost}
            onEditCancel={() => {
              setEditingPostId(null);
              setEditContent("");
              setEditVisibility('PUBLIC');
            }}
            onMenuAction={handleMenuAction}
          >
            {isExpanded && (
              <CommentSection
                postId={post.id}
                comments={postComments[post.id] || []}
                commentInput={commentInputs[post.id] || ""}
                isSubmitting={!!isSubmittingComment[post.id]}
                currentUserInitials={currentUserInitials}
                likedComments={likedComments}
                replyingTo={replyingTo}
                commentInputs={commentInputs}
                isSubmittingComment={isSubmittingComment}
                expandedReplies={expandedReplies}
                commentReplies={commentReplies}
                onCommentChange={(id, val) => setCommentInputs(prev => ({ ...prev, [id]: val }))}
                onCommentSend={handleSendComment}
                onLikeComment={handleLikeComment}
                onReply={id => { setReplyingTo(id); setCommentInputs(prev => ({ ...prev, [`reply-${id}`]: "" })); }}
                onReplyCancel={() => setReplyingTo(null)}
                onReplyChange={(id, val) => setCommentInputs(prev => ({ ...prev, [`reply-${id}`]: val }))}
                onReplySend={handleSendReply}
                onToggleReplies={toggleReplies}
              />
            )}
          </PostCard>
        );
      })}
    </div>
  );
}