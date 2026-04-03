import { useParams } from 'react-router-dom';
import { Mail, Calendar, FileText, Users, Shield, Ban, CheckCircle2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminUserDetail() {
  const { t } = useTranslation();
  const { id } = useParams();

  const user = {
    id: id,
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    avatar: 'NA',
    color: '#1877F2',
    status: 'active',
    joinDate: '15/01/2024',
    lastActive: 'Vừa xong',
    posts: 125,
    friends: 456,
    role: 'user',
    phone: '+84 123 456 789',
    bio: 'Yêu thích công nghệ và du lịch',
  };

  const recentPosts = [
    { id: 1, content: 'Bài viết về du lịch...', date: 'Hôm qua', likes: 125 },
    { id: 2, content: 'Chia sẻ kinh nghiệm...', date: '2 ngày trước', likes: 89 },
  ];

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-start gap-6">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
            style={{ backgroundColor: user.color }}
          >
            {user.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <span
                className={`px-4 py-2 rounded-xl font-semibold text-base ${
                  user.status === 'active'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {user.status === 'active' ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {t('adminPanel.userDetail.statusActive')}
                  </span>
                ) : (
                  t('adminPanel.userDetail.statusLocked')
                )}
              </span>
              {user.role === 'admin' && (
                <span className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-base">
                  {t('adminPanel.userDetail.roleAdmin')}
                </span>
              )}
            </div>
            <p className="text-base text-gray-600 mb-4">{user.bio}</p>
            <div className="flex items-center gap-6 text-base text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {t('adminPanel.userDetail.joinPrefix')} {user.joinDate}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-base transition-colors flex items-center gap-2">
              <Edit className="w-5 h-5" />
              {t('adminPanel.userDetail.edit')}
            </button>
            <button type="button" className="px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-base transition-colors flex items-center gap-2">
              <Ban className="w-5 h-5" />
              {user.status === 'active' ? t('adminPanel.userDetail.lockAccount') : t('adminPanel.userDetail.unlockAccount')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-base text-gray-600 font-medium">{t('adminPanel.userDetail.statPosts')}</p>
              <p className="text-3xl font-bold text-gray-900">{user.posts}</p>
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
              <p className="text-3xl font-bold text-gray-900">{user.friends}</p>
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
                {user.role === 'admin' ? t('adminPanel.userDetail.roleAdmin') : t('adminPanel.userDetail.roleUser')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('adminPanel.userDetail.recentPosts')}</h3>
        <div className="space-y-4">
          {recentPosts.map((post) => (
            <div key={post.id} className="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="text-base text-gray-900 mb-2">{post.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{post.date}</span>
                <span className="text-sm font-semibold text-gray-700">
                  ❤️ {post.likes} {t('adminPanel.userDetail.likesSuffix')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
