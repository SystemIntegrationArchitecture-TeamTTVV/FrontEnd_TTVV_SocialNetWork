import { Link, useParams } from "react-router-dom";
import {
  Camera,
  Plus,
  UserPlus,
  Check,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { authApi } from "../../apis/auth";
import { usersApi, type User } from "../../apis/users";
import { uploadApi } from "../../apis/upload";
import {
  friendRequestsApi,
  type FriendRequest,
} from "../../apis/friendRequests";
import { useSocket } from "../../contexts/SocketContext";
import { useChatBox } from "../../contexts/ChatBoxContext";
import About from "./tabs/About";

export default function Profile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("posts");
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loadingFriendRequest, setLoadingFriendRequest] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const currentUser = authApi.getCurrentUser();
  const { subscribe } = useSocket();
  const { openChatBoxByUserId } = useChatBox();
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!id) {
        return;
      }

      try {
        console.log("🔍 Loading user profile for ID:", id);
        const user = await usersApi.getUserById(id);
        console.log("✅ User profile loaded:", user);
        setProfileUser(user);
      } catch (error) {
        console.error("❌ Failed to load user profile:", error);
        setProfileUser(null);
      }
    };

    loadUserProfile();
  }, [id]);

  // Subscribe to socket notifications for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribe("NOTIFICATION", (event) => {
      if (event.type === "NOTIFICATION" && event.data) {
        const notification = event.data;

        if (
          notification.type === "FRIEND_REQUEST" ||
          notification.type === "FRIEND_ACCEPTED" ||
          notification.type === "FRIEND_REJECTED"
        ) {
          // Reload friend requests when notification arrives
          if (profileUser?.id) {
            loadFriendRequests();
          }
        }
      }
    });

    return unsubscribe;
  }, [currentUser?.id, profileUser?.id, subscribe]);

  const loadFriendRequests = async () => {
    if (!currentUser?.id || !profileUser?.id) return;

    try {
      const sent = await friendRequestsApi.getFriendRequestsBySenderId(
        currentUser.id,
      );
      const received = await friendRequestsApi.getFriendRequestsByReceiverId(
        currentUser.id,
      );
      const all = [...sent, ...received];
      setFriendRequests(all);
    } catch (error) {
      console.error("Failed to load friend requests:", error);
    }
  };

  // Load friend requests when profile user changes
  useEffect(() => {
    if (currentUser?.id && profileUser?.id) {
      loadFriendRequests();
    }
  }, [currentUser?.id, profileUser?.id]);

  const getFriendRequestStatus = (
    userId: string,
  ): "none" | "pending" | "sent" | "received" | "accepted" => {
    if (!currentUser?.id) return "none";

    const request = friendRequests.find(
      (req) =>
        (req.senderId === currentUser.id && req.receiverId === userId) ||
        (req.receiverId === currentUser.id && req.senderId === userId),
    );

    if (!request) return "none";

    if (request.status === "ACTIVE") return "accepted";
    if (request.status === "PENDING") {
      return request.senderId === currentUser.id ? "sent" : "received";
    }
    return "none";
  };

  const getRequestId = (userId: string): string | null => {
    if (!currentUser?.id) return null;

    const request = friendRequests.find(
      (req) =>
        (req.senderId === currentUser.id && req.receiverId === userId) ||
        (req.receiverId === currentUser.id && req.senderId === userId),
    );

    return request?.id || null;
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUser?.id) return;

    setLoadingFriendRequest(true);
    try {
      console.log("📤 Sending friend request to user:", userId);
      const friendRequest = await friendRequestsApi.createFriendRequest({
        senderId: currentUser.id,
        receiverId: userId,
      });
      console.log("✅ Friend request sent successfully:", friendRequest);

      await loadFriendRequests();
      console.log("✅ Friend requests reloaded, status should be updated now");
    } catch (error) {
      console.error("❌ Failed to send friend request:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send friend request";
      alert(message);
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    setLoadingFriendRequest(true);
    try {
      await friendRequestsApi.acceptFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to accept friend request";
      alert(message);
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    setLoadingFriendRequest(true);
    try {
      await friendRequestsApi.rejectFriendRequest(requestId);
      await loadFriendRequests();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reject friend request";
      alert(message);
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const handleMessageClick = async () => {
    if (!displayUser || !displayUser.id) return;
    try {
      const displayName =
        displayUser.fullName || displayUser.username || "Unknown User";
      await openChatBoxByUserId(
        displayUser.id,
        displayName,
        displayUser.avatar,
      );
    } catch (error) {
      console.error("Failed to open chatbox:", error);
    }
  };

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setUploadingCover(true);
    try {
      const uploadResponse = await uploadApi.uploadFile(file);
      await usersApi.updateUserProfile(currentUser.id, {
        coverPhoto: uploadResponse.url,
      });

      // Update local state
      setProfileUser((prev) =>
        prev ? { ...prev, coverPhoto: uploadResponse.url } : null,
      );

      // Update localStorage
      const updatedUser = { ...currentUser, coverPhoto: uploadResponse.url };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Cập nhật ảnh bìa thành công!");
    } catch (error) {
      console.error("Failed to upload cover photo:", error);
      alert("Không thể tải ảnh bìa lên");
    } finally {
      setUploadingCover(false);
    }
  };

  const displayUser = profileUser;
  const displayName = displayUser?.fullName || "Loading...";
  const displayAvatar = displayUser?.avatar || null;
  const displayInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4 pb-8">
      {/* Cover Photo */}
      <div className="relative h-[280px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden">
        {displayUser?.coverPhoto && (
          <img
            src={displayUser.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        {currentUser && currentUser.id === id && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute bottom-3 right-3 bg-white/95 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              {uploadingCover ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span>{uploadingCover ? "Đang tải..." : "Sửa ảnh bìa"}</span>
            </button>
          </>
        )}
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl p-4 -mt-16 relative border border-gray-200">
        <div className="flex items-end justify-between mb-4 pt-12">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center overflow-hidden">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-white font-semibold text-2xl">${displayInitials}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-white font-semibold text-2xl">
                    {displayInitials}
                  </span>
                )}
              </div>
              {/* {currentUser && currentUser.id === id && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center shadow-sm transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-gray-700" />
                    )}
                  </button>
                </>
              )} */}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {displayName}
              </h1>
              <p className="text-sm text-gray-600">1,234 friends</p>
            </div>
          </div>
          {currentUser && currentUser.id === id && (
            <div className="flex gap-2 pb-1">
              <button className="h-10 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                <span>Add Story</span>
              </button>
              <Link
                to="/profile/edit"
                className="h-10 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                <span>Edit Profile</span>
              </Link>
            </div>
          )}
          {currentUser &&
            currentUser.id !== id &&
            displayUser &&
            (() => {
              if (!displayUser.id) return null;
              const safeId = displayUser.id;
              const status = getFriendRequestStatus(safeId);
              const requestId = getRequestId(safeId);

              return (
                <div className="flex gap-2 pb-1">
                  <button
                    onClick={handleMessageClick}
                    className="h-10 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>

                  {status === "none" && (
                    <button
                      onClick={() => handleSendFriendRequest(safeId)}
                      disabled={loadingFriendRequest}
                      className="h-10 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingFriendRequest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>Add Friend</span>
                    </button>
                  )}

                  {status === "sent" && (
                    <button
                      disabled
                      className="h-10 px-4 bg-gray-200 text-gray-600 font-medium rounded-lg cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <span>Pending</span>
                    </button>
                  )}

                  {status === "received" && requestId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptFriendRequest(requestId)}
                        disabled={loadingFriendRequest}
                        className="h-10 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectFriendRequest(requestId)}
                        disabled={loadingFriendRequest}
                        className="h-10 px-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {status === "accepted" && (
                    <button
                      disabled
                      className="h-10 px-4 bg-green-100 text-green-700 font-medium rounded-lg cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Friends</span>
                    </button>
                  )}
                </div>
              );
            })()}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-t border-gray-200 pt-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "posts", label: "Posts" },
            { id: "about", label: "About" },
            { id: "friends", label: "Friends" },
            { id: "photos", label: "Photos" },
            { id: "videos", label: "Videos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium text-base relative transition-all duration-200 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "posts" && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 text-center py-6">
                No posts to show
              </p>
            </div>
          )}

          {activeTab === "about" && displayUser && (
            <About displayUser={displayUser} />
          )}

          {activeTab === "friends" && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 text-center py-6">
                Friends list coming soon
              </p>
            </div>
          )}

          {activeTab === "photos" && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 text-center py-6">
                Photos coming soon
              </p>
            </div>
          )}

          {activeTab === "videos" && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 text-center py-6">
                Videos coming soon
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Intro Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Intro</h3>
            <div className="space-y-2 text-xs text-gray-600">
              {displayUser?.bio && (
                <p className="text-sm mb-3">{displayUser.bio}</p>
              )}

              {displayUser?.workPlace && (
                <p className="flex items-center gap-2">
                  <span className="text-base">💼</span>
                  <span>
                    Làm việc tại <strong>{displayUser.workPlace}</strong>
                  </span>
                </p>
              )}

              {displayUser?.education && (
                <p className="flex items-center gap-2">
                  <span className="text-base">🎓</span>
                  <span>
                    Học tại <strong>{displayUser.education}</strong>
                  </span>
                </p>
              )}

              {(displayUser?.city || displayUser?.country) && (
                <p className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <span>
                    Sống tại{" "}
                    <strong>
                      {[displayUser.city, displayUser.country]
                        .filter(Boolean)
                        .join(", ")}
                    </strong>
                  </span>
                </p>
              )}

              {displayUser?.dateOfBirth && (
                <p className="flex items-center gap-2">
                  <span className="text-base">🎂</span>
                  <span>
                    Sinh ngày{" "}
                    <strong>
                      {new Date(displayUser.dateOfBirth).toLocaleDateString(
                        "vi-VN",
                      )}
                    </strong>
                  </span>
                </p>
              )}

              {displayUser?.gender && (
                <p className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <span>{displayUser.gender}</span>
                </p>
              )}

              {displayUser?.showPhone && displayUser?.phoneNumber && (
                <p className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <span>{displayUser.phoneNumber}</span>
                </p>
              )}

              {displayUser?.showEmail && displayUser?.email && (
                <p className="flex items-center gap-2">
                  <span className="text-base">📧</span>
                  <span>{displayUser.email}</span>
                </p>
              )}

              {displayUser?.interests && displayUser.interests.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="flex items-center gap-2 mb-2">
                    <span className="text-base">⭐</span>
                    <strong>Sở thích:</strong>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {displayUser.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {currentUser && currentUser.id === id && (
              <Link
                to="/profile/edit"
                className="w-full h-9 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm mt-3 flex items-center justify-center"
              >
                Edit Details
              </Link>
            )}
          </div>

          {/* Photos Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Photos</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                ></div>
              ))}
            </div>
            <Link
              to={`/profile/${id}/photos`}
              className="block text-center text-blue-600 text-xs font-medium hover:underline"
            >
              See All Photos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
