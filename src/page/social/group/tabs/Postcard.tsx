import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  Edit, Trash2, Bookmark, EyeOff, Flag, Loader2, Globe, Lock
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PostGroupData } from "../../../../apis/postsGroup";

interface PostCardProps {
  post: PostGroupData;
  currentUserId?: string;
  isLiked: boolean;
  isExpanded: boolean;
  isDeleting: boolean;
  editingPostId: string | null;
  editContent: string;
  editVisibility: 'PUBLIC' | 'PRIVATE';
  openMenuId: string | null;
  menuRef: (el: HTMLDivElement | null) => void;
  onLike: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  onOpenMenu: (postId: string) => void;
  onEditChange: (value: string) => void;
  onEditVisibilityChange: (value: 'PUBLIC' | 'PRIVATE') => void;
  onEditSave: (postId: string) => void;
  onEditCancel: () => void;
  onMenuAction: (postId: string, action: string) => void;
  children?: React.ReactNode; // CommentSection slot
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function PostCard({
  post, currentUserId, isLiked, isExpanded, isDeleting,
  editingPostId, editContent, editVisibility, openMenuId, menuRef,
  onLike, onToggleComments, onOpenMenu,
  onEditChange, onEditVisibilityChange, onEditSave, onEditCancel, onMenuAction,
  children,
}: PostCardProps) {
  const { t } = useTranslation();

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return t("sharePost.justNow");
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return t("sharePost.justNow");
    if (mins < 60) return t("sharePost.timeMinutes", { count: mins });
    if (hours < 24) return t("sharePost.timeHours", { count: hours });
    return t("sharePost.timeDays", { count: days });
  };

  const isEditing = editingPostId === post.id;
  const isMenuOpen = openMenuId === post.id;

  const normalizedVisibility = (() => {
    const visibility = (post.visibility || 'PUBLIC').toUpperCase();
    return visibility === 'ONLY_ME' ? 'PRIVATE' : visibility;
  })();
  const isPrivate = normalizedVisibility === 'PRIVATE';
  const isAnonymousToViewer = isPrivate && currentUserId !== post.authorId;
  const displayName = isAnonymousToViewer ? t("groupTabs.postAnonymous") : (post.authorName || t("groupTabs.postUserFallback"));
  const displayAvatar = isAnonymousToViewer ? undefined : post.authorAvatar;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors relative">

      {/* Header */}
      <div className="p-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-base flex-shrink-0 overflow-hidden">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-full h-full object-cover rounded-full"
                onError={e => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = "none";
                  const p = t.parentElement;
                  if (p) p.innerHTML = `<span class="text-white font-semibold text-base">${getInitials(displayName)}</span>`;
                }}
              />
            ) : (
              <span className="text-white font-semibold text-base">{getInitials(displayName)}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-base">{displayName}</p>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>{getTimeAgo(post.createdAt)}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                {isPrivate ? t("groupTabs.postPrivacyPrivate") : t("groupTabs.postPrivacyPublic")}
              </span>
            </div>
          </div>
        </div>

        {/* 3-dot Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onOpenMenu(post.id!); }}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-20">
              {currentUserId === post.authorId && (
                <>
                  <button
                    type="button"
                    onClick={() => onMenuAction(post.id!, "edit")}
                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900 font-medium">{t("groupTabs.menuEditPost")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMenuAction(post.id!, "delete")}
                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="text-red-600 font-medium">{t("groupTabs.menuDeletePost")}</span>
                  </button>
                  <div className="h-px bg-gray-200 my-2" />
                </>
              )}
              <button
                type="button"
                onClick={() => onMenuAction(post.id!, "save")}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
              >
                <Bookmark className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">{t("groupTabs.menuSavePost")}</span>
              </button>
              <button
                type="button"
                onClick={() => onMenuAction(post.id!, "hide")}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
              >
                <EyeOff className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">{t("groupTabs.menuHidePost")}</span>
              </button>
              <button
                type="button"
                onClick={() => onMenuAction(post.id!, "report")}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
              >
                <Flag className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">{t("groupTabs.menuReport")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-end">
              <select
                value={editVisibility}
                onChange={e => onEditVisibilityChange(e.target.value as 'PUBLIC' | 'PRIVATE')}
                className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">{t("groupTabs.postPrivacyPublic")}</option>
                <option value="PRIVATE">{t("groupTabs.postPrivacyPrivate")}</option>
              </select>
            </div>
            <textarea
              value={editContent}
              onChange={e => onEditChange(e.target.value)}
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder={t("groupTabs.editPlaceholder")}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onEditCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                {t("groupTabs.cancel")}
              </button>
              <button
                type="button"
                onClick={() => onEditSave(post.id!)}
                disabled={!editContent.trim()}
                className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("groupTabs.saveChanges")}
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
            <p className="text-gray-700 font-medium">{t("groupTabs.deletingPost")}</p>
          </div>
        </div>
      )}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="mb-4">
          {post.images.length === 1 ? (
            <img src={post.images[0]} alt={t("groupTabs.postImageAlt")} className="w-full max-h-[600px] object-cover" />
          ) : post.images.length === 2 ? (
            <div className="grid grid-cols-2 gap-1">
              {post.images.map((url, i) => (
                <img key={i} src={url} alt={t("groupTabs.postImageAltN", { n: i + 1 })} className="w-full h-[300px] object-cover" />
              ))}
            </div>
          ) : post.images.length === 3 ? (
            <div className="grid grid-cols-2 gap-1">
              <img src={post.images[0]} alt={t("groupTabs.postImageAltN", { n: 1 })} className="w-full h-[400px] object-cover row-span-2" />
              <img src={post.images[1]} alt={t("groupTabs.postImageAltN", { n: 2 })} className="w-full h-[199px] object-cover" />
              <img src={post.images[2]} alt={t("groupTabs.postImageAltN", { n: 3 })} className="w-full h-[199px] object-cover" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {post.images.slice(0, 4).map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt={t("groupTabs.postImageAltN", { n: i + 1 })} className="w-full h-[250px] object-cover" />
                  {i === 3 && post.images!.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">+{post.images!.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Videos */}
      {post.videos && post.videos.length > 0 && (
        <div className="mb-4 space-y-2">
          {post.videos.map((url, i) => (
            <video key={i} src={url} controls className="w-full max-h-[600px] bg-black" preload="metadata" />
          ))}
        </div>
      )}

      {/* Stats & Actions */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="font-semibold">{t("groupTabs.statsLikes", { count: post.likeCount || 0 })}</span>
          <div className="flex items-center gap-4">
            <span className="font-medium">{t("groupTabs.statsComments", { count: post.commentCount || 0 })}</span>
            <span>·</span>
            <span className="font-medium">{t("groupTabs.statsShares", { count: post.shareCount || 0 })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-3 flex items-center">
          <button
            type="button"
            onClick={() => onLike(post.id!)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg transition-colors group ${isLiked ? "text-red-500" : "hover:bg-gray-50"}`}
          >
            <Heart className={`w-6 h-6 transition-colors ${isLiked ? "text-red-500 fill-red-500" : "text-gray-500 group-hover:text-red-500"}`} />
            <span className={`text-base font-medium ${isLiked ? "text-red-500" : "text-gray-700 group-hover:text-red-500"}`}>
              {isLiked ? t("groupTabs.actionLiked") : t("groupTabs.actionLike")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleComments(post.id!)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg transition-colors ${isExpanded ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700"}`}
          >
            <MessageCircle className={`w-6 h-6 ${isExpanded ? "text-blue-600" : "text-gray-500"}`} />
            <span className="text-base font-medium">{t("groupTabs.actionComment")}</span>
          </button>

          <button type="button" className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <Share2 className="w-6 h-6 text-gray-500 group-hover:text-green-600 transition-colors" />
            <span className="text-base text-gray-700 font-medium group-hover:text-green-600">{t("groupTabs.actionShare")}</span>
          </button>
        </div>

        {/* CommentSection injected here */}
        {children}
      </div>
    </div>
  );
}