import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Mail, Calendar, FileText, Users, Shield, Ban, CheckCircle2, Edit, ArrowLeft, Loader2, Heart, Lock, Unlock } from 'lucide-react';
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
      setUser({
        ...userData,
        status: userData.isActive ? 'ACTIVE' : 'BANNED',
      });
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              getInitials(user.fullName || user.username)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.fullName || user.username || user.id}</h1>
              <span className={`px-2.5 py-1 rounded-md font-medium text-xs border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {isActive ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('adminPanel.userDetail.statusActive')}
                  </span>
                ) : (
                  t('adminPanel.userDetail.statusLocked')
                )}
              </span>
              {user.role === 'ADMIN' && (
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-200">
                  {t('adminPanel.userDetail.roleAdmin')}
                </span>
              )}
            </div>
            {user.bio && <p className="text-sm text-gray-600 mb-3">{user.bio}</p>}
            <div className="flex items-center gap-5 text-sm text-gray-600">
              {user.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
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
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 border ${
                isActive ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
              } disabled:opacity-50`}
            >
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {isActive ? t('adminPanel.userDetail.lockAccount') : t('adminPanel.userDetail.unlockAccount')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('adminPanel.userDetail.statPosts')}</p>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('adminPanel.userDetail.statFriends')}</p>
              <p className="text-2xl font-bold text-gray-900">{friendCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('adminPanel.userDetail.statRole')}</p>
              <p className="text-lg font-bold text-gray-900">
                {user.role === 'ADMIN' ? t('adminPanel.userDetail.roleAdmin') : t('adminPanel.userDetail.roleUser')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('adminPanel.userDetail.recentPosts')}</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">Chưa có bài viết nào</p>
        ) : (
          <div className="space-y-3">
            {posts.slice(0, 10).map((post) => (
              <div key={post.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100/50 transition-colors">
                <p className="text-sm text-gray-900 mb-2 line-clamp-2">{post.content || '(Không có nội dung)'}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                  <span className="text-xs font-semibold text-gray-600 inline-flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
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
