import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Mail, Calendar, FileText, Users, Shield, Ban, CheckCircle2, Edit, ArrowLeft, Loader2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersApi, type User } from '../../apis/users';
import { postsApi, type PostData } from '../../apis/posts';
import { getLocaleTag } from '../../i18n';

export default function AdminUserDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadUser(id);
  }, [id]);

  const loadUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [userData, userPosts] = await Promise.all([
        usersApi.getUserById(userId),
        postsApi.getPostsByUserId(userId).catch(() => [] as PostData[]),
      ]);
      setUser(userData);
      setPosts(Array.isArray(userPosts) ? userPosts : []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user?.id || toggling) return;
    const newStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    const msg = newStatus === 'BANNED'
      ? t('adminPanel.users.confirmBan')
      : t('adminPanel.users.confirmUnban');
    if (!window.confirm(msg)) return;
    try {
      setToggling(true);
      await usersApi.updateUserStatus(user.id, newStatus);
      setUser((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err: any) {
      setError(err?.message || 'Thao tác thất bại');
    } finally {
      setToggling(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(getLocaleTag()); }
    catch { return d; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 text-lg mb-4">{error || 'Không tìm thấy người dùng'}</p>
        <Link to="/admin/users" className="text-blue-600 hover:underline">← Quay lại danh sách</Link>
      </div>
    );
  }

  const isActive = user.status === 'ACTIVE';
  const friendCount = user.friendIds?.length || 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      {/* User header */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              getInitials(user.fullName || user.username)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{user.fullName || user.username || user.id}</h1>
              <span className={`px-4 py-2 rounded-xl font-semibold text-base ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isActive ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {t('adminPanel.userDetail.statusActive')}
                  </span>
                ) : (
                  t('adminPanel.userDetail.statusLocked')
                )}
              </span>
              {user.role === 'ADMIN' && (
                <span className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-base">
                  {t('adminPanel.userDetail.roleAdmin')}
                </span>
              )}
            </div>
            {user.bio && <p className="text-base text-gray-600 mb-4">{user.bio}</p>}
            <div className="flex items-center gap-6 text-base text-gray-600">
              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {t('adminPanel.userDetail.joinPrefix')} {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-colors flex items-center gap-2 ${
                isActive ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'bg-green-50 hover:bg-green-100 text-green-700'
              } disabled:opacity-50`}
            >
              {toggling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ban className="w-5 h-5" />}
              {isActive ? t('adminPanel.userDetail.lockAccount') : t('adminPanel.userDetail.unlockAccount')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-base text-gray-600 font-medium">{t('adminPanel.userDetail.statPosts')}</p>
              <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-base text-gray-600 font-medium">{t('adminPanel.userDetail.statFriends')}</p>
              <p className="text-3xl font-bold text-gray-900">{friendCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
              <Shield className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <p className="text-base text-gray-600 font-medium">{t('adminPanel.userDetail.statRole')}</p>
              <p className="text-xl font-bold text-gray-900">
                {user.role === 'ADMIN' ? t('adminPanel.userDetail.roleAdmin') : t('adminPanel.userDetail.roleUser')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('adminPanel.userDetail.recentPosts')}</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có bài viết nào</p>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 10).map((post) => (
              <div key={post.id} className="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <p className="text-base text-gray-900 mb-2 line-clamp-2">{post.content || '(Không có nội dung)'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                  <span className="text-sm font-semibold text-gray-700 inline-flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    {post.likeCount ?? post.likes?.length ?? 0} {t('adminPanel.userDetail.likesSuffix')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
