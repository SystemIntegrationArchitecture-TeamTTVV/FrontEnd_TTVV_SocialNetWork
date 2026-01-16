import { useNavigate } from 'react-router-dom';
import { Image, X, Globe, UserCheck, Lock } from 'lucide-react';
import { useState } from 'react';
import Newsfeed from './Newsfeed';

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');

  const handlePost = () => {
    console.log('Create post:', { content, privacy });
    navigate(-1);
  };

  return (
    <>
      {/* Background - same as Newsfeed page */}
      <Newsfeed />
      
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto border border-gray-200 pointer-events-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">JD</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">John Doe</p>
            <button
              onClick={() => setPrivacy(privacy === 'public' ? 'friends' : privacy === 'friends' ? 'private' : 'public')}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              {privacy === 'public' && (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public</span>
                </>
              )}
              {privacy === 'friends' && (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Friends</span>
                </>
              )}
              {privacy === 'private' && (
                <>
                  <Lock className="w-3.5 h-3.5" />
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
            className="w-full min-h-[180px] p-3 border-none focus:outline-none resize-none text-sm placeholder:text-gray-400"
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-700 font-medium">Add to your post</span>
            <button className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Image className="w-5 h-5 text-green-600" />
            </button>
          </div>

          <button
            onClick={handlePost}
            disabled={!content.trim()}
            className={`w-full h-11 rounded-lg font-semibold text-sm transition-colors ${
              content.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

