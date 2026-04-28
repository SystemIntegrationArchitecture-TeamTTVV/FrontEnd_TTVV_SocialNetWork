import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "../components/layouts/MainLayout";
import AuthLayout from "../components/layouts/AuthLayout";
import AdminLayout from "../components/layouts/AdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import PageLoader from "../components/common/PageLoader";

// ─── Lazy-loaded pages (code splitting) ─────────────────────────────
// Each import() creates a separate JS chunk loaded on demand.
// This reduces the initial bundle from ~500KB to ~80KB.

// Auth Pages
const Login = lazy(() => import("../page/auth/Login"));
const Register = lazy(() => import("../page/auth/Register"));
const ForgotPassword = lazy(() => import("../page/auth/ForgotPassword"));
const ResetPasswordVerification = lazy(() => import("../page/auth/ResetPasswordVerification"));
const ResetPasswordNew = lazy(() => import("../page/auth/ResetPasswordNew"));
const PasswordResetSuccess = lazy(() => import("../page/auth/PasswordResetSuccess"));
const ResetPassword = lazy(() => import("../page/auth/ResetPassword"));

// Home Pages
const Newsfeed = lazy(() => import("../page/home/Newsfeed"));
const CreatePost = lazy(() => import("../page/home/CreatePost"));
const PostEdit = lazy(() => import("../page/home/PostEdit"));
const CommentDetail = lazy(() => import("../page/home/CommentDetail"));
const ShareDialog = lazy(() => import("../page/home/ShareDialog"));

// Profile Pages
const Profile = lazy(() => import("../page/profile/Profile"));
const ProfileEdit = lazy(() => import("../page/profile/ProfileEdit"));
const ActivityLog = lazy(() => import("../page/profile/ActivityLog"));
const PhotoViewer = lazy(() => import("../page/profile/PhotoViewer"));
const AlbumView = lazy(() => import("../page/profile/AlbumView"));
const CreateAlbum = lazy(() => import("../page/profile/CreateAlbum"));
const StoriesViewer = lazy(() => import("../page/profile/StoriesViewer"));
const Friends = lazy(() => import("../page/profile/Friends"));

// Messenger Pages
const Messenger = lazy(() => import("../page/messenger/Messenger"));
const NewMessage = lazy(() => import("../page/messenger/NewMessage"));
const GroupChat = lazy(() => import("../page/messenger/GroupChat"));
const ConversationSettings = lazy(() => import("../page/messenger/ConversationSettings"));
const SharedMedia = lazy(() => import("../page/messenger/SharedMedia"));
const MessengerSettings = lazy(() => import("../page/messenger/MessengerSettings"));
const MessengerSearch = lazy(() => import("../page/messenger/MessengerSearch"));
const Archive = lazy(() => import("../page/messenger/Archive"));
const MessageActions = lazy(() => import("../page/messenger/MessageActions"));
const VoiceCall = lazy(() => import("../page/messenger/features/VoiceCall"));
const VideoCall = lazy(() => import("../page/messenger/features/VideoCall"));
const FileSharing = lazy(() => import("../page/messenger/features/FileSharing"));
const PhotoSharing = lazy(() => import("../page/messenger/features/PhotoSharing"));
const EmojiPicker = lazy(() => import("../page/messenger/features/EmojiPicker"));
const StickerPicker = lazy(() => import("../page/messenger/features/StickerPicker"));
const PollCreation = lazy(() => import("../page/messenger/features/PollCreation"));
const ForwardMessage = lazy(() => import("../page/messenger/features/ForwardMessage"));
const DeleteMessage = lazy(() => import("../page/messenger/features/DeleteMessage"));
const ReactionDetails = lazy(() => import("../page/messenger/features/ReactionDetails"));
const ThemeCustomization = lazy(() => import("../page/messenger/features/ThemeCustomization"));

// Music Pages
const MusicEDM = lazy(() => import("../page/music/MusicEDM"));

// Games
const GamesPage = lazy(() => import("../page/games/GamesPage"));
const FlappyBird = lazy(() => import("../games/flappy-bord"));
const Bomberman = lazy(() => import("../games/bomberman"));
const BombermanMultiplayer = lazy(() => import("../games/bomberman/multiplayer"));

// Social Pages
const FriendRequests = lazy(() => import("../page/social/FriendRequests"));
const FindPeople = lazy(() => import("../page/social/FindPeople"));
const Groups = lazy(() => import("../page/social/Groups"));
const GroupDetail = lazy(() => import("../page/social/GroupDetail"));
const Events = lazy(() => import("../page/social/Events"));
const EventDetail = lazy(() => import("../page/social/EventDetail"));
const Pages = lazy(() => import("../page/social/Pages"));
const Notifications = lazy(() => import("../page/social/Notifications"));
const NotificationSettings = lazy(() => import("../page/social/NotificationSettings"));
const Search = lazy(() => import("../page/social/Search"));
const WatchVideo = lazy(() => import("../page/social/WatchVideo"));
const Marketplace = lazy(() => import("../page/social/Marketplace"));
const MyProducts = lazy(() => import("../page/social/MyProducts"));
const ProductDetail = lazy(() => import("../page/social/ProductDetail"));
const SavedItems = lazy(() => import("../page/social/SavedItems"));

// Settings Pages
const Settings = lazy(() => import("../page/settings/Settings"));
const PrivacySettings = lazy(() => import("../page/settings/PrivacySettings"));

// Admin Pages
const AdminUserManagement = lazy(() => import("../page/admin/AdminUserManagement"));
const AdminUserDetail = lazy(() => import("../page/admin/AdminUserDetail"));
const AdminPostManagement = lazy(() => import("../page/admin/AdminPostManagement"));
const AdminGroupManagement = lazy(() => import("../page/admin/AdminGroupManagement"));
const AdminEventManagement = lazy(() => import("../page/admin/AdminEventManagement"));
const AdminReports = lazy(() => import("../page/admin/AdminReports"));
const AdminMessages = lazy(() => import("../page/admin/AdminMessages"));
const AdminSettings = lazy(() => import("../page/admin/AdminSettings"));
const AdminDashboard = lazy(() => import("../page/admin/AdminDashboard"));
const NotFound = lazy(() => import("../page/NotFound"));

/** Wrap a lazy component with Suspense + PageLoader fallback */
function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // Auth Routes
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <S><Login /></S> },
      { path: "register", element: <S><Register /></S> },
      { path: "forgot-password", element: <S><ForgotPassword /></S> },
      { path: "reset-password", element: <S><ResetPassword /></S> },
      { path: "reset-verification", element: <S><ResetPasswordVerification /></S> },
      { path: "reset-new-password", element: <S><ResetPasswordNew /></S> },
      { path: "reset-success", element: <S><PasswordResetSuccess /></S> },
    ],
  },

  // Stories Viewer - Fullscreen (outside MainLayout, but still requires auth)
  {
    path: "/stories/:id",
    element: (
      <S><StoriesViewer /></S>
    ),
  },

  // Main App Routes - Public shell; protect only sensitive pages/actions
  {
    path: "/",
    element: (
      <MainLayout />
    ),
    children: [
      { index: true, element: <S><Newsfeed /></S> },
      // Home
      { path: "home", element: <S><Newsfeed /></S> },
      { path: "post/create", element: <ProtectedRoute requireAuth={true}><S><CreatePost /></S></ProtectedRoute> },
      { path: "post/:id/edit", element: <ProtectedRoute requireAuth={true}><S><PostEdit /></S></ProtectedRoute> },
      { path: "post/:id/comments", element: <ProtectedRoute requireAuth={true}><S><CommentDetail /></S></ProtectedRoute> },
      { path: "post/:id/share", element: <ProtectedRoute requireAuth={true}><S><ShareDialog /></S></ProtectedRoute> },

      // Profile
      { path: "profile/:id", element: <S><Profile /></S> },
      { path: "profile/edit", element: <ProtectedRoute requireAuth={true}><S><ProfileEdit /></S></ProtectedRoute> },
      { path: "profile/activity-log", element: <ProtectedRoute requireAuth={true}><S><ActivityLog /></S></ProtectedRoute> },
      { path: "photo/:id", element: <S><PhotoViewer /></S> },
      { path: "album/:id", element: <S><AlbumView /></S> },
      { path: "album/create", element: <ProtectedRoute requireAuth={true}><S><CreateAlbum /></S></ProtectedRoute> },
      { path: "friends", element: <ProtectedRoute requireAuth={true}><S><Friends /></S></ProtectedRoute> },
      { path: "friends/requests", element: <ProtectedRoute requireAuth={true}><S><FriendRequests /></S></ProtectedRoute> },

      // Messenger
      { path: "messenger", element: <ProtectedRoute requireAuth={true}><S><Messenger /></S></ProtectedRoute> },
      { path: "messenger/new", element: <ProtectedRoute requireAuth={true}><S><NewMessage /></S></ProtectedRoute> },
      { path: "messenger/group/:id", element: <ProtectedRoute requireAuth={true}><S><GroupChat /></S></ProtectedRoute> },
      { path: "messenger/:id/settings", element: <ProtectedRoute requireAuth={true}><S><ConversationSettings /></S></ProtectedRoute> },
      { path: "messenger/:id/media", element: <ProtectedRoute requireAuth={true}><S><SharedMedia /></S></ProtectedRoute> },
      { path: "messenger/settings", element: <ProtectedRoute requireAuth={true}><S><MessengerSettings /></S></ProtectedRoute> },
      { path: "messenger/search", element: <ProtectedRoute requireAuth={true}><S><MessengerSearch /></S></ProtectedRoute> },
      { path: "messenger/archive", element: <ProtectedRoute requireAuth={true}><S><Archive /></S></ProtectedRoute> },
      { path: "messenger/:id/actions", element: <ProtectedRoute requireAuth={true}><S><MessageActions /></S></ProtectedRoute> },
      { path: "messenger/:id/voice-call", element: <ProtectedRoute requireAuth={true}><S><VoiceCall /></S></ProtectedRoute> },
      { path: "messenger/:id/video-call", element: <ProtectedRoute requireAuth={true}><S><VideoCall /></S></ProtectedRoute> },
      { path: "messenger/file-share", element: <ProtectedRoute requireAuth={true}><S><FileSharing /></S></ProtectedRoute> },
      { path: "messenger/photo-share", element: <ProtectedRoute requireAuth={true}><S><PhotoSharing /></S></ProtectedRoute> },
      { path: "messenger/emoji", element: <ProtectedRoute requireAuth={true}><S><EmojiPicker /></S></ProtectedRoute> },
      { path: "messenger/stickers", element: <ProtectedRoute requireAuth={true}><S><StickerPicker /></S></ProtectedRoute> },
      { path: "messenger/poll", element: <ProtectedRoute requireAuth={true}><S><PollCreation /></S></ProtectedRoute> },
      { path: "messenger/forward", element: <ProtectedRoute requireAuth={true}><S><ForwardMessage /></S></ProtectedRoute> },
      { path: "messenger/:id/delete", element: <ProtectedRoute requireAuth={true}><S><DeleteMessage /></S></ProtectedRoute> },
      { path: "messenger/:id/reactions", element: <ProtectedRoute requireAuth={true}><S><ReactionDetails /></S></ProtectedRoute> },
      { path: "messenger/theme", element: <ProtectedRoute requireAuth={true}><S><ThemeCustomization /></S></ProtectedRoute> },

      // Music
      { path: "music", element: <S><MusicEDM /></S> },

      // Games
      { path: "games", element: <S><GamesPage /></S> },
      { path: "games/flappy", element: <S><FlappyBird /></S> },
      { path: "games/bomberman", element: <S><Bomberman /></S> },
      { path: "games/bomberman/friends", element: <S><BombermanMultiplayer /></S> },

      // Social
      { path: "find-people", element: <S><FindPeople /></S> },
      { path: "friends", element: <S><FriendRequests /></S> },
      { path: "groups", element: <S><Groups /></S> },
      { path: "groups/:id", element: <S><GroupDetail /></S> },
      { path: "events", element: <S><Events /></S> },
      { path: "events/:id", element: <S><EventDetail /></S> },
      { path: "pages", element: <S><Pages /></S> },
      { path: "notifications", element: <S><Notifications /></S> },
      { path: "notifications/settings", element: <S><NotificationSettings /></S> },
      { path: "search", element: <S><Search /></S> },
      { path: "watch", element: <S><WatchVideo /></S> },
      { path: "marketplace", element: <S><Marketplace /></S> },
      { path: "marketplace/my-products", element: <ProtectedRoute requireAuth={true}><S><MyProducts /></S></ProtectedRoute> },
      { path: "marketplace/product/:id", element: <S><ProductDetail /></S> },
      { path: "saved", element: <ProtectedRoute requireAuth={true}><S><SavedItems /></S></ProtectedRoute> },

      // Settings
      { path: "settings", element: <ProtectedRoute requireAuth={true}><S><Settings /></S></ProtectedRoute> },
      { path: "settings/privacy", element: <ProtectedRoute requireAuth={true}><S><PrivacySettings /></S></ProtectedRoute> },

      { path: "404", element: <S><NotFound /></S> },
      { path: "*", element: <S><NotFound /></S> },
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
      { index: true, element: <S><AdminDashboard /></S> },
      { path: "users", element: <S><AdminUserManagement /></S> },
      { path: "users/:id", element: <S><AdminUserDetail /></S> },
      { path: "posts", element: <S><AdminPostManagement /></S> },
      { path: "groups", element: <S><AdminGroupManagement /></S> },
      { path: "events", element: <S><AdminEventManagement /></S> },
      { path: "reports", element: <S><AdminReports /></S> },
      { path: "messages", element: <S><AdminMessages /></S> },
      { path: "settings", element: <S><AdminSettings /></S> },
    ],
  },
]);
