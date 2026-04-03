// src/pages/WatchVideo.tsx
import {
  Search,
  Settings,
  Play,
  ChevronRight,
  Globe,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Save,
  Flag,
  EyeOff,
  Heart,
  Laugh,
  Frown,
  Angry,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { videosApi, type VideoData } from "../../apis/video";
import { reactionsApi, type ReactionData } from "../../apis/reactions";
import { commentsApi, type CommentData } from "../../apis/comments";
import { HttpError } from "../../apis/http";
import { showAuthRequiredPrompt } from "../../utils/authPrompt";
import { useToast } from "../../contexts/useToast";
import { useTranslation } from "react-i18next";
import { getLocaleTag } from "../../i18n";

export default function WatchVideo() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openReactionId, setOpenReactionId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [, setReactions] = useState<Record<string, ReactionData[]>>({});
  const [userReactions, setUserReactions] = useState<
    Record<string, ReactionData>
  >({});
  const [comments, setComments] = useState<Record<string, CommentData[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [selectedVideoModal, setSelectedVideoModal] =
    useState<VideoData | null>(null);

  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reactionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reaction types với icons
  const reactionTypes = [
    {
      type: "LIKE",
      icon: ThumbsUp,
      color: "text-blue-500",
      bgColor: "hover:bg-blue-50",
    },
    {
      type: "LOVE",
      icon: Heart,
      color: "text-red-500",
      bgColor: "hover:bg-red-50",
    },
    {
      type: "HAHA",
      icon: Laugh,
      color: "text-yellow-500",
      bgColor: "hover:bg-yellow-50",
    },
    {
      type: "SAD",
      icon: Frown,
      color: "text-yellow-600",
      bgColor: "hover:bg-yellow-50",
    },
    {
      type: "ANGRY",
      icon: Angry,
      color: "text-orange-500",
      bgColor: "hover:bg-orange-50",
    },
  ];

  // Load videos
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const rawVideos = await videosApi.getAllVideos();
      const allVideos = Array.isArray(rawVideos) ? rawVideos : [];

      // Split into featured (first 2) and feed (rest)
      setFeaturedVideos(allVideos.slice(0, 2));
      setVideos(allVideos.slice(2));

      // Load reactions for all videos
      for (const video of allVideos) {
        if (video.id) {
          loadReactionsForVideo(video.id);
        }
      }
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load reactions for a video
  const loadReactionsForVideo = async (videoId: string) => {
    try {
      const videoReactions = await reactionsApi.getReactionsByVideoId(videoId);
      setReactions((prev) => ({ ...prev, [videoId]: videoReactions }));

      // Find user's reaction
      const userReaction = videoReactions.find((r) => r.userId === user?.id);
      if (userReaction) {
        setUserReactions((prev) => ({ ...prev, [videoId]: userReaction }));
      }
    } catch (error) {
      console.error(`Failed to load reactions for video ${videoId}:`, error);
    }
  };

  // Load comments for a video
  const loadCommentsForVideo = async (videoId: string) => {
    try {
      const videoComments = await commentsApi.getCommentsByVideoId(videoId);
      setComments((prev) => ({ ...prev, [videoId]: videoComments }));
    } catch (error) {
      console.error(`Failed to load comments for video ${videoId}:`, error);
    }
  };

  // Handle reaction
  const handleReaction = async (videoId: string, reactionType: string) => {
    if (!user?.id) {
      showAuthRequiredPrompt(window.location.pathname);
      return;
    }

    try {
      const existingReaction = userReactions[videoId];

      if (existingReaction) {
        if (existingReaction.type === reactionType) {
          // Remove reaction
          await reactionsApi.deleteReactionByVideoIdAndUserId(videoId, user.id);
          setUserReactions((prev) => {
            const newReactions = { ...prev };
            delete newReactions[videoId];
            return newReactions;
          });
        } else {
          // Update reaction
          await reactionsApi.createReaction({
            userId: user.id,
            type: reactionType as ReactionData["type"],
            videoId: videoId,
          });
        }
      } else {
        // Create new reaction
        await reactionsApi.createReaction({
          userId: user.id,
          type: reactionType as ReactionData["type"],
          videoId: videoId,
        });
      }

      // Reload reactions
      await loadReactionsForVideo(videoId);
      setOpenReactionId(null);
    } catch (error) {
      console.error("Failed to handle reaction:", error);
    }
  };

  // Handle comment
  const handleComment = async (videoId: string) => {
    if (!user?.id) {
      showAuthRequiredPrompt(window.location.pathname);
      return;
    }

    const content = commentText[videoId]?.trim();
    if (!content) return;

    try {
      await commentsApi.createComment({
        videoId: videoId,
        userId: user.id,
        content: content,
      });

      // Clear input
      setCommentText((prev) => ({ ...prev, [videoId]: "" }));

      // Reload comments
      await loadCommentsForVideo(videoId);
    } catch (error) {
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
          : error instanceof Error
            ? error.message
            : t("watch.commentSendFailed");
      showToast(msg, "error");
    }
  };

  // Toggle comments section
  const toggleComments = async (videoId: string) => {
    const isShowing = showComments[videoId];

    if (!isShowing) {
      // Load comments if not loaded yet
      if (!comments[videoId]) {
        await loadCommentsForVideo(videoId);
      }
    }

    setShowComments((prev) => ({ ...prev, [videoId]: !isShowing }));
  };

  // Handle video view
  const handleVideoView = async (videoId: string) => {
    try {
      await videosApi.incrementViewCount(videoId);
      // Optionally reload videos to update view count
      // await loadVideos();
    } catch (error) {
      console.error("Failed to increment view count:", error);
    }
  };

  // Format number
  const formatNumber = (num?: number): string => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format time
  const formatTime = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("watch.justNow");
    if (diffInSeconds < 3600)
      return t("watch.minutesAgo", { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400)
      return t("watch.hoursAgo", { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 2592000)
      return t("watch.daysAgo", { count: Math.floor(diffInSeconds / 86400) });
    return date.toLocaleDateString(getLocaleTag());
  };

  // Get reaction icon
  const getReactionIcon = (type: string) => {
    const reaction = reactionTypes.find((r) => r.type === type);
    if (!reaction) return ThumbsUp;
    return reaction.icon;
  };

  // Get reaction color
  const getReactionColor = (type: string) => {
    const reaction = reactionTypes.find((r) => r.type === type);
    return reaction?.color || "text-gray-600";
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(menuRefs.current).forEach(([, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      });

      Object.entries(reactionRefs.current).forEach(([, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenReactionId(null);
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("watch.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">{t("watch.title")}</h1>
            <button className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={t("watch.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Featured Section */}
        {featuredVideos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("watch.featuredTitle")}
              </h2>
              <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[15px] font-medium">
                {t("watch.viewAll")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featuredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => handleVideoView(video.id!)}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative group">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl">🎬</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-8 h-8 ml-1 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-1">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                        {video.authorAvatar ? (
                          <img
                            src={video.authorAvatar}
                            alt={video.authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          video.authorName?.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[13px] font-semibold text-gray-900">
                            {video.authorName}
                          </span>
                          <Globe className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-[12px] text-gray-500">
                          {formatTime(video.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[15px] line-clamp-2 text-gray-800 mt-1">
                      {video.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Feed */}
        <div className="space-y-4">
          {videos.map((video) => {
            const userReaction = userReactions[video.id!];
            const videoComments = comments[video.id!] || [];
            const showingComments = showComments[video.id!];
            const UserReactionIcon = userReaction
              ? getReactionIcon(userReaction.type)
              : ThumbsUp;

            return (
              <div
                key={video.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                      {video.authorAvatar ? (
                        <img
                          src={video.authorAvatar}
                          alt={video.authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        video.authorName?.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {video.authorName}
                        </span>
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <Globe className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{formatTime(video.createdAt)}</span>
                        <span>•</span>
                        <Globe className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  <div
                    className="relative"
                    ref={(el) => {
                      menuRefs.current[video.id!] = el;
                    }}
                  >
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === video.id ? null : video.id!,
                        )
                      }
                      className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5 text-gray-600" />
                    </button>

                    {openMenuId === video.id && (
                      <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]">
                        <button
                          onClick={() => {
                            console.log("Save video", video.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>{t("watch.saveVideo")}</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log("Hide video", video.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <EyeOff className="w-4 h-4" />
                          <span>{t("watch.hideVideo")}</span>
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            console.log("Report video", video.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          <span>{t("watch.report")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="px-4 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-[15px] text-gray-700">
                      {video.description}{" "}
                      <button className="text-gray-600 hover:text-gray-800 font-medium">
                        {t("watch.seeMore")}
                      </button>
                    </p>
                  )}
                </div>

                {/* Video Player */}
                <div
                  className="relative aspect-video bg-black group cursor-pointer"
                  onClick={() => {
                    handleVideoView(video.id!);
                    setSelectedVideoModal(video);
                  }}
                >
                  {video.videoUrl ? (
                    <video
                      src={video.videoUrl}
                      poster={video.thumbnailUrl}
                      className="w-full h-full"
                      controls
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center text-8xl">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "🎬"
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-10 h-10 ml-1 text-white" />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="absolute bottom-4 left-4 text-sm font-semibold text-white">
                    {t("watch.views", { value: formatNumber(video.viewCount) })}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2 flex items-center justify-around border-t border-gray-200">
                  {/* Reaction Button */}
                  <div
                    className="relative flex-1"
                    ref={(el) => {
                      reactionRefs.current[video.id!] = el;
                    }}
                  >
                    <button
                      onClick={() => {
                        if (!userReaction) {
                          setOpenReactionId(
                            openReactionId === video.id ? null : video.id!,
                          );
                        } else {
                          handleReaction(video.id!, userReaction.type);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <UserReactionIcon
                        className={`w-5 h-5 ${userReaction ? getReactionColor(userReaction.type) : "text-gray-600"}`}
                      />
                      <span
                        className={`text-sm font-semibold ${userReaction ? getReactionColor(userReaction.type) : "text-gray-700"}`}
                      >
                        {formatNumber(video.likeCount)}
                      </span>
                    </button>

                    {/* Reaction Picker */}
                    {openReactionId === video.id && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-2 flex gap-1 z-50">
                        {reactionTypes.map((reaction) => {
                          const Icon = reaction.icon;
                          return (
                            <button
                              key={reaction.type}
                              onClick={() =>
                                handleReaction(video.id!, reaction.type)
                              }
                              className={`w-10 h-10 rounded-full ${reaction.bgColor} flex items-center justify-center transition-all hover:scale-125`}
                              title={reaction.type}
                            >
                              <Icon className={`w-6 h-6 ${reaction.color}`} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Comment Button */}
                  <button
                    onClick={() => toggleComments(video.id!)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      {formatNumber(video.commentCount)}
                    </span>
                  </button>

                  {/* Share Button */}
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      {t("watch.share")}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {/* Add interactive comment section */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.fullName?.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder={t("watch.commentPlaceholder")}
                        value={commentText[video.id!] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [video.id!]: e.target.value,
                          }))
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleComment(video.id!);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleComment(video.id!)}
                        disabled={!commentText[video.id!]?.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t("watch.send")}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {videoComments.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm py-4">
                        {t("watch.noComments")}
                      </p>
                    ) : (
                      videoComments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                            {comment.userAvatar ? (
                              <img
                                src={comment.userAvatar}
                                alt={comment.userName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              comment.userName?.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-2xl px-4 py-2">
                              <p className="font-semibold text-sm text-gray-900">
                                {comment.userName}
                              </p>
                              <p className="text-sm text-gray-800">
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-1 px-4">
                              <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
                                {t("watch.like")}
                              </button>
                              <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
                                {t("watch.reply")}
                              </button>
                              <span className="text-xs text-gray-500">
                                {formatTime(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {showingComments && (
                  <div className="border-t border-gray-200 p-4">
                    {/* Comment Input */}
                    <div className="flex gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user?.fullName?.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder={t("watch.commentPlaceholder")}
                          value={commentText[video.id!] || ""}
                          onChange={(e) =>
                            setCommentText((prev) => ({
                              ...prev,
                              [video.id!]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleComment(video.id!);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleComment(video.id!)}
                          disabled={!commentText[video.id!]?.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t("watch.send")}
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {videoComments.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">
                          {t("watch.noComments")}
                        </p>
                      ) : (
                        videoComments.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                              {comment.userAvatar ? (
                                <img
                                  src={comment.userAvatar}
                                  alt={comment.userName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                comment.userName?.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                                <p className="font-semibold text-sm text-gray-900">
                                  {comment.userName}
                                </p>
                                <p className="text-sm text-gray-800">
                                  {comment.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 mt-1 px-4">
                                <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
                                  {t("watch.like")}
                                </button>
                                <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
                                  {t("watch.reply")}
                                </button>
                                <span className="text-xs text-gray-500">
                                  {formatTime(comment.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideoModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-200"
          onClick={() => setSelectedVideoModal(null)}
        >
          <div
            className="w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                  {selectedVideoModal.authorAvatar ? (
                    <img
                      src={selectedVideoModal.authorAvatar}
                      alt={selectedVideoModal.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedVideoModal.authorName?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-100">
                    {selectedVideoModal.authorName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(selectedVideoModal.createdAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideoModal(null)}
                className="text-gray-400 hover:text-gray-200 text-2xl font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Video Content */}
            <div className="flex flex-col lg:flex-row">
              {/* Video Player */}
              <div className="flex-1 bg-black">
                <div className="aspect-video bg-black flex items-center justify-center">
                  {selectedVideoModal.videoUrl ? (
                    <video
                      src={selectedVideoModal.videoUrl}
                      poster={selectedVideoModal.thumbnailUrl}
                      className="w-full h-full"
                      controls
                      autoPlay
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center text-8xl">
                        {selectedVideoModal.thumbnailUrl ? (
                          <img
                            src={selectedVideoModal.thumbnailUrl}
                            alt={selectedVideoModal.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "🎬"
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Sidebar - Comments & Info */}
              <div className="w-full lg:w-80 bg-gray-900 border-l border-gray-700 flex flex-col max-h-[600px] lg:max-h-none">
                {/* Video Info */}
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {selectedVideoModal.title}
                  </h3>
                  {selectedVideoModal.description && (
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {selectedVideoModal.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>
                      {t("watch.views", {
                        value: formatNumber(selectedVideoModal.viewCount),
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {t("watch.likes", {
                        value: formatNumber(selectedVideoModal.likeCount),
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-4 border-b border-gray-700">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-100">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(selectedVideoModal.likeCount)}</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-100">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(selectedVideoModal.commentCount)}</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-100">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Comments Section */}
                <div className="flex-1 overflow-y-auto">
                  {/* Comment Input */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user?.fullName?.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 flex gap-1">
                        <input
                          type="text"
                          placeholder={t("watch.commentPlaceholder")}
                          value={commentText[selectedVideoModal.id!] || ""}
                          onChange={(e) =>
                            setCommentText((prev) => ({
                              ...prev,
                              [selectedVideoModal.id!]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleComment(selectedVideoModal.id!);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gray-800 text-gray-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                        <button
                          onClick={() => handleComment(selectedVideoModal.id!)}
                          disabled={
                            !commentText[selectedVideoModal.id!]?.trim()
                          }
                          className="px-3 py-2 bg-blue-600 text-white rounded-full text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t("watch.send")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 p-4">
                    {(comments[selectedVideoModal.id!] || []).length === 0 ? (
                      <p className="text-center text-gray-500 text-xs py-4">
                        {t("watch.noComments")}
                      </p>
                    ) : (
                      (comments[selectedVideoModal.id!] || []).map(
                        (comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                              {comment.userAvatar ? (
                                <img
                                  src={comment.userAvatar}
                                  alt={comment.userName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                comment.userName?.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-800 rounded-xl px-3 py-2">
                                <p className="font-semibold text-xs text-gray-100">
                                  {comment.userName}
                                </p>
                                <p className="text-xs text-gray-300">
                                  {comment.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 px-2 text-xs text-gray-500">
                                <button className="hover:text-gray-400">
                                  {t("watch.like")}
                                </button>
                                <span>•</span>
                                <span>{formatTime(comment.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
