import { useNavigate, useParams } from 'react-router-dom';
import { X, Globe, UserCheck, Lock, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

export default function ShareDialog() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');

  const handleShare = () => {
    console.log('Share post:', id, content, privacy);
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[#E4E6EB] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#050505]">Share Post</h2>
          <button
            onClick={() => navigate('/home')}
            className="w-9 h-9 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#050505]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#050505]">John Doe</p>
              <button
                onClick={() => setPrivacy(privacy === 'public' ? 'friends' : 'public')}
                className="flex items-center gap-1 text-sm text-[#65676B] hover:text-[#050505] transition-colors"
              >
                {privacy === 'public' ? (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Friends</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something..."
            className="w-full min-h-[100px] p-2 border border-[#E4E6EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] resize-none"
          />

          {/* Original Post Preview */}
          <div className="bg-[#F0F2F5] rounded-lg p-4 border-l-4 border-[#1877F2]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#42B72A] flex items-center justify-center text-white text-xs font-semibold">
                SJ
              </div>
              <div>
                <p className="font-semibold text-sm text-[#050505]">Sarah Johnson</p>
                <p className="text-xs text-[#65676B]">2 hours ago</p>
              </div>
            </div>
            <p className="text-sm text-[#050505]">Just finished an amazing hike! The view was breathtaking 🏔️</p>
          </div>

          <button
            onClick={handleShare}
            className="w-full h-11 bg-[#1877F2] text-white font-semibold rounded-md hover:bg-[#166FE5] transition-colors"
          >
            Share Now
          </button>
        </div>
      </div>
    </div>
  );
}

