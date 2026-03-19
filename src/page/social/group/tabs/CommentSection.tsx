import { Send, Loader2 } from "lucide-react";
import type { CommentData } from "../../../../apis/comments";
import CommentItem from "./Commentitem";

interface CommentSectionProps {
  postId: string;
  comments: CommentData[];
  commentInput: string;
  isSubmitting: boolean;
  currentUserInitials: string;
  likedComments: Set<string>;
  replyingTo: string | null;
  commentInputs: Record<string, string>;
  isSubmittingComment: Record<string, boolean>;
  expandedReplies: Set<string>;
  commentReplies: Record<string, CommentData[]>;
  onCommentChange: (postId: string, value: string) => void;
  onCommentSend: (postId: string) => void;
  onLikeComment: (commentId: string, postId: string) => void;
  onReply: (commentId: string) => void;
  onReplyCancel: () => void;
  onReplyChange: (commentId: string, value: string) => void;
  onReplySend: (commentId: string, postId: string) => void;
  onToggleReplies: (commentId: string) => void;
}

export default function CommentSection({
  postId, comments, commentInput, isSubmitting, currentUserInitials,
  likedComments, replyingTo, commentInputs, isSubmittingComment,
  expandedReplies, commentReplies,
  onCommentChange, onCommentSend, onLikeComment,
  onReply, onReplyCancel, onReplyChange, onReplySend, onToggleReplies,
}: CommentSectionProps) {
  return (
    <div className="border-t border-gray-200 pt-5 mt-3 space-y-4">

      {/* Comment Input */}
      <div className="flex items-center gap-4 pt-2">
        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {currentUserInitials}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={commentInput}
            onChange={e => onCommentChange(postId, e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && onCommentSend(postId)}
            placeholder="Viết bình luận..."
            disabled={isSubmitting}
            className="w-full h-12 px-4 pr-14 rounded-lg bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all disabled:opacity-50"
          />
          <button
            onClick={() => onCommentSend(postId)}
            disabled={!commentInput.trim() || isSubmitting}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${commentInput.trim() ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            {isSubmitting
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />
            }
          </button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-3 mt-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserInitials={currentUserInitials}
              isLiked={likedComments.has(comment.id!)}
              isReplyingTo={replyingTo === comment.id}
              replyInput={commentInputs[`reply-${comment.id}`] || ""}
              isSubmittingReply={!!isSubmittingComment[`reply-${comment.id}`]}
              expandedReplies={expandedReplies.has(comment.id!)}
              replies={commentReplies[comment.id!] || []}
              likedReplies={likedComments}
              onLike={onLikeComment}
              onReply={onReply}
              onReplyCancel={onReplyCancel}
              onReplyChange={onReplyChange}
              onReplySend={onReplySend}
              onToggleReplies={onToggleReplies}
              onLikeReply={onLikeComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}