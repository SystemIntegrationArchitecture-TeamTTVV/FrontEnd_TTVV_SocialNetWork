import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import AuthLayout from "../components/layouts/AuthLayout";
import AdminLayout from "../components/layouts/AdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";

// Auth Pages
import Login from "../page/auth/Login";
import Register from "../page/auth/Register";
import ForgotPassword from "../page/auth/ForgotPassword";
import ResetPasswordVerification from "../page/auth/ResetPasswordVerification";
import ResetPasswordNew from "../page/auth/ResetPasswordNew";
import PasswordResetSuccess from "../page/auth/PasswordResetSuccess";
import ResetPassword from "../page/auth/ResetPassword";

// Home Pages
import Newsfeed from "../page/home/Newsfeed";
import CreatePost from "../page/home/CreatePost";
import PostEdit from "../page/home/PostEdit";
import CommentDetail from "../page/home/CommentDetail";
import ShareDialog from "../page/home/ShareDialog";

// Profile Pages
import Profile from "../page/profile/Profile";
import ProfileEdit from "../page/profile/ProfileEdit";
import ActivityLog from "../page/profile/ActivityLog";
import PhotoViewer from "../page/profile/PhotoViewer";
import AlbumView from "../page/profile/AlbumView";
import CreateAlbum from "../page/profile/CreateAlbum";
import StoriesViewer from "../page/profile/StoriesViewer";
import Friends from "../page/profile/Friends";

// Messenger Pages
import Messenger from "../page/messenger/Messenger";
import NewMessage from "../page/messenger/NewMessage";
import GroupChat from "../page/messenger/GroupChat";
import ConversationSettings from "../page/messenger/ConversationSettings";
import SharedMedia from "../page/messenger/SharedMedia";
import MessengerSettings from "../page/messenger/MessengerSettings";
import MessengerSearch from "../page/messenger/MessengerSearch";
import Archive from "../page/messenger/Archive";
import MessageActions from "../page/messenger/MessageActions";
import VoiceCall from "../page/messenger/features/VoiceCall";
import VideoCall from "../page/messenger/features/VideoCall";
import FileSharing from "../page/messenger/features/FileSharing";
import PhotoSharing from "../page/messenger/features/PhotoSharing";
import EmojiPicker from "../page/messenger/features/EmojiPicker";
import StickerPicker from "../page/messenger/features/StickerPicker";
import PollCreation from "../page/messenger/features/PollCreation";
import ForwardMessage from "../page/messenger/features/ForwardMessage";
import DeleteMessage from "../page/messenger/features/DeleteMessage";
import ReactionDetails from "../page/messenger/features/ReactionDetails";
import ThemeCustomization from "../page/messenger/features/ThemeCustomization";

// Music Pages
import MusicEDM from "../page/music/MusicEDM";

// Social Pages
import FriendRequests from "../page/social/FriendRequests";
import FindPeople from "../page/social/FindPeople";
import Groups from "../page/social/Groups";
import GroupDetail from "../page/social/GroupDetail";
import Events from "../page/social/Events";
import EventDetail from "../page/social/EventDetail";
import Pages from "../page/social/Pages";
import Notifications from "../page/social/Notifications";
import NotificationSettings from "../page/social/NotificationSettings";
import Search from "../page/social/Search";
import WatchVideo from "../page/social/WatchVideo";
import Marketplace from "../page/social/Marketplace";
import ProductDetail from "../page/social/ProductDetail";
import SavedItems from "../page/social/SavedItems";

// Settings Pages
import Settings from "../page/settings/Settings";
import PrivacySettings from "../page/settings/PrivacySettings";

// Admin Pages

import AdminUserManagement from "../page/admin/AdminUserManagement";
import AdminUserDetail from "../page/admin/AdminUserDetail";
import AdminPostManagement from "../page/admin/AdminPostManagement";
import AdminGroupManagement from "../page/admin/AdminGroupManagement";
import AdminEventManagement from "../page/admin/AdminEventManagement";
import AdminReports from "../page/admin/AdminReports";
import AdminMessages from "../page/admin/AdminMessages";
import AdminSettings from "../page/admin/AdminSettings";
import AdminDashboard from "../page/admin/AdminDashboard";

export const router = createBrowserRouter([
  // Auth Routes
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "reset-verification", element: <ResetPasswordVerification /> },
      { path: "reset-new-password", element: <ResetPasswordNew /> },
      { path: "reset-success", element: <PasswordResetSuccess /> },
    ],
  },

  // Stories Viewer - Fullscreen (outside MainLayout, but still requires auth)
  {
    path: "/stories/:id",
    element: (
      <StoriesViewer />
    ),
  },

  // Main App Routes - Public shell; protect only sensitive pages/actions
  {
    path: "/",
    element: (
      <MainLayout />
    ),
    children: [
      { index: true, element: <Newsfeed /> },
      // Home
      { path: "home", element: <Newsfeed /> },
      { path: "post/create", element: <ProtectedRoute requireAuth={true}><CreatePost /></ProtectedRoute> },
      { path: "post/:id/edit", element: <ProtectedRoute requireAuth={true}><PostEdit /></ProtectedRoute> },
      { path: "post/:id/comments", element: <ProtectedRoute requireAuth={true}><CommentDetail /></ProtectedRoute> },
      { path: "post/:id/share", element: <ProtectedRoute requireAuth={true}><ShareDialog /></ProtectedRoute> },

      // Profile
      { path: "profile/:id", element: <Profile /> },
      { path: "profile/edit", element: <ProtectedRoute requireAuth={true}><ProfileEdit /></ProtectedRoute> },
      { path: "profile/activity-log", element: <ProtectedRoute requireAuth={true}><ActivityLog /></ProtectedRoute> },
      { path: "photo/:id", element: <PhotoViewer /> },
      { path: "album/:id", element: <AlbumView /> },
      { path: "album/create", element: <ProtectedRoute requireAuth={true}><CreateAlbum /></ProtectedRoute> },
      { path: "friends", element: <ProtectedRoute requireAuth={true}><Friends /></ProtectedRoute> },
      { path: "friends/requests", element: <ProtectedRoute requireAuth={true}><FriendRequests /></ProtectedRoute> },

      // Messenger
      { path: "messenger", element: <ProtectedRoute requireAuth={true}><Messenger /></ProtectedRoute> },
      { path: "messenger/new", element: <ProtectedRoute requireAuth={true}><NewMessage /></ProtectedRoute> },
      { path: "messenger/group/:id", element: <ProtectedRoute requireAuth={true}><GroupChat /></ProtectedRoute> },
      { path: "messenger/:id/settings", element: <ProtectedRoute requireAuth={true}><ConversationSettings /></ProtectedRoute> },
      { path: "messenger/:id/media", element: <ProtectedRoute requireAuth={true}><SharedMedia /></ProtectedRoute> },
      { path: "messenger/settings", element: <ProtectedRoute requireAuth={true}><MessengerSettings /></ProtectedRoute> },
      { path: "messenger/search", element: <ProtectedRoute requireAuth={true}><MessengerSearch /></ProtectedRoute> },
      { path: "messenger/archive", element: <ProtectedRoute requireAuth={true}><Archive /></ProtectedRoute> },
      { path: "messenger/:id/actions", element: <ProtectedRoute requireAuth={true}><MessageActions /></ProtectedRoute> },
      { path: "messenger/:id/voice-call", element: <ProtectedRoute requireAuth={true}><VoiceCall /></ProtectedRoute> },
      { path: "messenger/:id/video-call", element: <ProtectedRoute requireAuth={true}><VideoCall /></ProtectedRoute> },
      { path: "messenger/file-share", element: <ProtectedRoute requireAuth={true}><FileSharing /></ProtectedRoute> },
      { path: "messenger/photo-share", element: <ProtectedRoute requireAuth={true}><PhotoSharing /></ProtectedRoute> },
      { path: "messenger/emoji", element: <ProtectedRoute requireAuth={true}><EmojiPicker /></ProtectedRoute> },
      { path: "messenger/stickers", element: <ProtectedRoute requireAuth={true}><StickerPicker /></ProtectedRoute> },
      { path: "messenger/poll", element: <ProtectedRoute requireAuth={true}><PollCreation /></ProtectedRoute> },
      { path: "messenger/forward", element: <ProtectedRoute requireAuth={true}><ForwardMessage /></ProtectedRoute> },
      { path: "messenger/:id/delete", element: <ProtectedRoute requireAuth={true}><DeleteMessage /></ProtectedRoute> },
      { path: "messenger/:id/reactions", element: <ProtectedRoute requireAuth={true}><ReactionDetails /></ProtectedRoute> },
      { path: "messenger/theme", element: <ProtectedRoute requireAuth={true}><ThemeCustomization /></ProtectedRoute> },

      // Music
      { path: "music", element: <MusicEDM /> },

      // Social
      { path: "find-people", element: <FindPeople /> },
      { path: "friends", element: <FriendRequests /> },
      { path: "groups", element: <Groups /> },
      { path: "groups/:id", element: <GroupDetail /> },
      { path: "events", element: <Events /> },
      { path: "events/:id", element: <EventDetail /> },
      { path: "pages", element: <Pages /> },
      { path: "notifications", element: <Notifications /> },
      { path: "notifications/settings", element: <NotificationSettings /> },
      { path: "search", element: <Search /> },
      { path: "watch", element: <WatchVideo /> },
      { path: "marketplace", element: <Marketplace /> },
      { path: "marketplace/product/:id", element: <ProductDetail /> },
      { path: "saved", element: <ProtectedRoute requireAuth={true}><SavedItems /></ProtectedRoute> },

      // Settings
      { path: "settings", element: <ProtectedRoute requireAuth={true}><Settings /></ProtectedRoute> },
      { path: "settings/privacy", element: <ProtectedRoute requireAuth={true}><PrivacySettings /></ProtectedRoute> },
    ],
  },

  // Admin Routes - Separate Layout (Protected with Admin Role)
  {
    path: "/admin",
    element: (
      <ProtectedRoute requireAuth={true} requireAdmin={true}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <AdminUserManagement /> },
      { path: "users/:id", element: <AdminUserDetail /> },
      { path: "posts", element: <AdminPostManagement /> },
      { path: "groups", element: <AdminGroupManagement /> },
      { path: "events", element: <AdminEventManagement /> },
      { path: "reports", element: <AdminReports /> },
      { path: "messages", element: <AdminMessages /> },
      { path: "settings", element: <AdminSettings /> },
    ],
  },
]);
