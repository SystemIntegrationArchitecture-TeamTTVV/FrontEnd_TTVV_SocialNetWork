import { Send, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CommentData } from "../../../../apis/comments";
import { getLocaleTag } from "../../../../i18n";

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  currentUserInitials: string;
  isLiked: boolean;
  isReplyingTo: boolean;
  replyInput: string;
  isSubmittingReply: boolean;
  expandedReplies: boolean;
  replies: CommentData[];
  likedReplies: Set<string>;
  onLike: (commentId: string, postId: string) => void;
  onReply: (commentId: string) => void;
  onReplyCancel: () => void;
  onReplyChange: (commentId: string, value: string) => void;
  onReplySend: (commentId: string, postId: string) => void;
  onToggleReplies: (commentId: string) => void;
  onLikeReply: (replyId: string, postId: string) => void;
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function CommentItem({
  comment, postId, currentUserInitials,
  isLiked, isReplyingTo, replyInput, isSubmittingReply,
  expandedReplies, replies, likedReplies,
  onLike, onReply, onReplyCancel, onReplyChange, onReplySend,
  onToggleReplies, onLikeReply,
}: CommentItemProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {getInitials(comment.userName)}
        </div>

        <div className="flex-1">
          {/* Bubble */}
          <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
            <p className="font-semibold text-sm text-gray-900">{comment.userName || t("groupComments.anonymous")}</p>
            <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-4 mt-1.5 px-3">
            <button
              onClick={() => onLike(comment.id!, postId)}
              className={`text-xs font-semibold transition-colors ${isLiked ? "text-red-600" : "text-gray-600 hover:text-blue-600"}`}
            >
              {isLiked ? t("groupComments.liked") : t("groupComments.like")}
              {(comment.likeCount || 0) > 0 && ` (${comment.likeCount})`}
            </button>

            <button
              onClick={() => onReply(comment.id!)}
              className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              {t("groupComments.reply")}
            </button>

            {(comment.replyCount || 0) > 0 && (
              <button
                onClick={() => onToggleReplies(comment.id!)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {expandedReplies ? t("groupComments.hide") : t("groupComments.show")} {comment.replyCount}{" "}
                {t("groupComments.replies")}
              </button>
            )}

            <span className="text-xs text-gray-500">
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleString(getLocaleTag())
                : t("watch.justNow")}
            </span>
          </div>

          {/* Reply Input */}
          {isReplyingTo && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                {currentUserInitials}
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={replyInput}
                  onChange={e => onReplyChange(comment.id!, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && onReplySend(comment.id!, postId)}
                  placeholder={t("groupComments.replyTo", { name: comment.userName ?? "" })}
                  disabled={isSubmittingReply}
                  className="w-full h-9 px-3 pr-10 rounded-full bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                <button
                  onClick={() => onReplySend(comment.id!, postId)}
                  disabled={!replyInput.trim() || isSubmittingReply}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${replyInput.trim() ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                >
                  {isSubmittingReply
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
              <button
                onClick={onReplyCancel}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t("groupComments.cancel")}
              </button>
            </div>
          )}

          {/* Replies List */}
          {expandedReplies && replies.length > 0 && (
            <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
              {replies.map(reply => (
                <div key={reply.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                    {getInitials(reply.userName)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl px-3 py-2">
                      <p className="font-semibold text-sm text-gray-900">{reply.userName || t("groupComments.anonymous")}</p>
                      <p className="text-gray-700 text-sm mt-0.5">{reply.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-2">
                      <button
                        onClick={() => onLikeReply(reply.id!, postId)}
                        className={`text-xs font-semibold transition-colors ${likedReplies.has(reply.id!) ? "text-red-600" : "text-gray-600 hover:text-blue-600"}`}
                      >
                        {likedReplies.has(reply.id!) ? t("groupComments.liked") : t("groupComments.like")}
                        {(reply.likeCount || 0) > 0 && ` (${reply.likeCount})`}
                      </button>
                      <span className="text-xs text-gray-500">
                        {reply.createdAt
                          ? new Date(reply.createdAt).toLocaleString(getLocaleTag())
                          : t("watch.justNow")}
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
  );
}