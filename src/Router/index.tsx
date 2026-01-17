import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import AuthLayout from '../components/layouts/AuthLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import RootRedirect from '../components/RootRedirect';

// Auth Pages
import Login from '../page/auth/Login';
import Register from '../page/auth/Register';
import ForgotPassword from '../page/auth/ForgotPassword';
import ResetPasswordVerification from '../page/auth/ResetPasswordVerification';
import ResetPasswordNew from '../page/auth/ResetPasswordNew';
import PasswordResetSuccess from '../page/auth/PasswordResetSuccess';

// Home Pages
import Newsfeed from '../page/home/Newsfeed';
import CreatePost from '../page/home/CreatePost';
import PostEdit from '../page/home/PostEdit';
import CommentDetail from '../page/home/CommentDetail';
import ShareDialog from '../page/home/ShareDialog';

// Profile Pages
import Profile from '../page/profile/Profile';
import ProfileEdit from '../page/profile/ProfileEdit';
import ActivityLog from '../page/profile/ActivityLog';
import PhotoViewer from '../page/profile/PhotoViewer';
import AlbumView from '../page/profile/AlbumView';
import CreateAlbum from '../page/profile/CreateAlbum';
import StoriesViewer from '../page/profile/StoriesViewer';
import Friends from '../page/profile/Friends';

// Messenger Pages
import Messenger from '../page/messenger/Messenger';
import NewMessage from '../page/messenger/NewMessage';
import GroupChat from '../page/messenger/GroupChat';
import ConversationSettings from '../page/messenger/ConversationSettings';
import SharedMedia from '../page/messenger/SharedMedia';
import MessengerSettings from '../page/messenger/MessengerSettings';
import MessengerSearch from '../page/messenger/MessengerSearch';
import Archive from '../page/messenger/Archive';
import MessageActions from '../page/messenger/MessageActions';
import VoiceCall from '../page/messenger/features/VoiceCall';
import VideoCall from '../page/messenger/features/VideoCall';
import FileSharing from '../page/messenger/features/FileSharing';
import PhotoSharing from '../page/messenger/features/PhotoSharing';
import EmojiPicker from '../page/messenger/features/EmojiPicker';
import StickerPicker from '../page/messenger/features/StickerPicker';
import PollCreation from '../page/messenger/features/PollCreation';
import ForwardMessage from '../page/messenger/features/ForwardMessage';
import DeleteMessage from '../page/messenger/features/DeleteMessage';
import ReactionDetails from '../page/messenger/features/ReactionDetails';
import ThemeCustomization from '../page/messenger/features/ThemeCustomization';

// Social Pages
import FriendRequests from '../page/social/FriendRequests';
import FindPeople from '../page/social/FindPeople';
import Groups from '../page/social/Groups';
import GroupDetail from '../page/social/GroupDetail';
import Events from '../page/social/Events';
import EventDetail from '../page/social/EventDetail';
import Pages from '../page/social/Pages';
import Notifications from '../page/social/Notifications';
import NotificationSettings from '../page/social/NotificationSettings';
import Search from '../page/social/Search';
import WatchVideo from '../page/social/WatchVideo';
import Marketplace from '../page/social/Marketplace';
import ProductDetail from '../page/social/ProductDetail';
import SavedItems from '../page/social/SavedItems';

// Settings Pages
import Settings from '../page/settings/Settings';
import PrivacySettings from '../page/settings/PrivacySettings';

// Admin Pages
import AdminDashboard from '../page/admin/AdminDashboard';
import AdminUserManagement from '../page/admin/AdminUserManagement';
import AdminUserDetail from '../page/admin/AdminUserDetail';
import AdminPostManagement from '../page/admin/AdminPostManagement';
import AdminGroupManagement from '../page/admin/AdminGroupManagement';
import AdminEventManagement from '../page/admin/AdminEventManagement';
import AdminReports from '../page/admin/AdminReports';
import AdminStatistics from '../page/admin/AdminStatistics';
import AdminMessages from '../page/admin/AdminMessages';
import AdminSettings from '../page/admin/AdminSettings';

export const router = createBrowserRouter([
  // Auth Routes
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-verification', element: <ResetPasswordVerification /> },
      { path: 'reset-new-password', element: <ResetPasswordNew /> },
      { path: 'reset-success', element: <PasswordResetSuccess /> },
    ],
  },

  // Stories Viewer - Fullscreen (outside MainLayout)
  { path: '/stories/:id', element: <StoriesViewer /> },

  // Main App Routes
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <RootRedirect /> },
      // Home
      { path: 'home', element: <Newsfeed /> },
      { path: 'post/create', element: <CreatePost /> },
      { path: 'post/:id/edit', element: <PostEdit /> },
      { path: 'post/:id/comments', element: <CommentDetail /> },
      { path: 'post/:id/share', element: <ShareDialog /> },

      // Profile
      { path: 'profile/:id', element: <Profile /> },
      { path: 'profile/edit', element: <ProfileEdit /> },
      { path: 'profile/activity-log', element: <ActivityLog /> },
      { path: 'photo/:id', element: <PhotoViewer /> },
      { path: 'album/:id', element: <AlbumView /> },
      { path: 'album/create', element: <CreateAlbum /> },
      { path: 'friends', element: <Friends /> },
      { path: 'friends/requests', element: <FriendRequests /> },

      // Messenger
      { path: 'messenger', element: <Messenger /> },
      { path: 'messenger/new', element: <NewMessage /> },
      { path: 'messenger/group/:id', element: <GroupChat /> },
      { path: 'messenger/:id/settings', element: <ConversationSettings /> },
      { path: 'messenger/:id/media', element: <SharedMedia /> },
      { path: 'messenger/settings', element: <MessengerSettings /> },
      { path: 'messenger/search', element: <MessengerSearch /> },
      { path: 'messenger/archive', element: <Archive /> },
      { path: 'messenger/:id/actions', element: <MessageActions /> },
      { path: 'messenger/:id/voice-call', element: <VoiceCall /> },
      { path: 'messenger/:id/video-call', element: <VideoCall /> },
      { path: 'messenger/file-share', element: <FileSharing /> },
      { path: 'messenger/photo-share', element: <PhotoSharing /> },
      { path: 'messenger/emoji', element: <EmojiPicker /> },
      { path: 'messenger/stickers', element: <StickerPicker /> },
      { path: 'messenger/poll', element: <PollCreation /> },
      { path: 'messenger/forward', element: <ForwardMessage /> },
      { path: 'messenger/:id/delete', element: <DeleteMessage /> },
      { path: 'messenger/:id/reactions', element: <ReactionDetails /> },
      { path: 'messenger/theme', element: <ThemeCustomization /> },

      // Social
      { path: 'find-people', element: <FindPeople /> },
      { path: 'friends', element: <FriendRequests /> },
      { path: 'groups', element: <Groups /> },
      { path: 'groups/:id', element: <GroupDetail /> },
      { path: 'events', element: <Events /> },
      { path: 'events/:id', element: <EventDetail /> },
      { path: 'pages', element: <Pages /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'notifications/settings', element: <NotificationSettings /> },
      { path: 'search', element: <Search /> },
      { path: 'watch', element: <WatchVideo /> },
      { path: 'marketplace', element: <Marketplace /> },
      { path: 'marketplace/product/:id', element: <ProductDetail /> },
      { path: 'saved', element: <SavedItems /> },

      // Settings
      { path: 'settings', element: <Settings /> },
      { path: 'settings/privacy', element: <PrivacySettings /> },
    ],
  },

  // Admin Routes - Separate Layout
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUserManagement /> },
      { path: 'users/:id', element: <AdminUserDetail /> },
      { path: 'posts', element: <AdminPostManagement /> },
      { path: 'groups', element: <AdminGroupManagement /> },
      { path: 'events', element: <AdminEventManagement /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'statistics', element: <AdminStatistics /> },
      { path: 'messages', element: <AdminMessages /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
]);
