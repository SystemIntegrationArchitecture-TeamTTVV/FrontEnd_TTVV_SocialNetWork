import { useNavigate, useParams } from 'react-router-dom';
import { X, Save, Image as ImageIcon, Globe, Users, Lock } from 'lucide-react';
import { useState } from 'react';

export default function PostEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [content, setContent] = useState('Just finished an amazing hike! The view was breathtaking 🏔️');
  const [privacy, setPrivacy] = useState('public');

  const handleSave = () => {
    console.log('Save post:', id, content, privacy);
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa bài viết</h2>
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">
            JD
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg text-gray-900">John Doe</p>
            <button
              onClick={() =>
                setPrivacy(privacy === 'public' ? 'friends' : privacy === 'friends' ? 'onlyMe' : 'public')
              }
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors mt-1"
            >
              {privacy === 'public' && (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Công khai</span>
                </>
              )}
              {privacy === 'friends' && (
                <>
                  <Users className="w-4 h-4" />
                  <span>Bạn bè</span>
                </>
              )}
              {privacy === 'onlyMe' && (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Chỉ mình tôi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-64 p-4 border-none focus:outline-none resize-none text-lg text-gray-900"
            placeholder="Bạn đang nghĩ gì?"
          />
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          <button className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors">
            <span className="text-base font-semibold text-gray-900">Thêm vào bài viết</span>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <ImageIcon className="w-5 h-5 text-green-600" />
              </button>
            </div>
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/home')}
              className="flex-1 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className={`flex-1 h-14 rounded-xl font-semibold text-lg transition-colors ${
                content.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                Lưu thay đổi
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
