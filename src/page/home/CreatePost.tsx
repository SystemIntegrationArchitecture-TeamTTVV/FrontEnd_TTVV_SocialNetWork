import { useNavigate } from 'react-router-dom';
import { Image, X, Globe, UserCheck, Lock } from 'lucide-react';
import { useState } from 'react';

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');

  const handlePost = () => {
    console.log('Create post:', { content, privacy });
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-[#E4E6EB] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#050505]">Create Post</h2>
          <button
            onClick={() => navigate('/home')}
            className="w-9 h-9 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#050505]" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-[#E4E6EB] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">JD</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#050505]">John Doe</p>
            <button
              onClick={() => setPrivacy(privacy === 'public' ? 'friends' : privacy === 'friends' ? 'private' : 'public')}
              className="flex items-center gap-1 text-sm text-[#65676B] hover:text-[#050505] transition-colors"
            >
              {privacy === 'public' && (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </>
              )}
              {privacy === 'friends' && (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Friends</span>
                </>
              )}
              {privacy === 'private' && (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Only me</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Input */}
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind, John?"
            className="w-full min-h-[200px] p-2 border-none focus:outline-none resize-none text-lg"
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[#E4E6EB] space-y-3">
          <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#E4E6EB] hover:bg-[#F0F2F5] transition-colors">
            <span className="text-[#050505] font-medium">Add to your post</span>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors">
                <Image className="w-5 h-5 text-[#42B72A]" />
              </button>
            </div>
          </button>

          <button
            onClick={handlePost}
            disabled={!content.trim()}
            className={`w-full h-11 rounded-md font-semibold transition-colors ${
              content.trim()
                ? 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
                : 'bg-[#E4E6EB] text-[#BCC0C4] cursor-not-allowed'
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

