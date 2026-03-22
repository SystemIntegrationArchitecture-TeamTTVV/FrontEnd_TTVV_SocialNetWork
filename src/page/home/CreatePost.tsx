import { useNavigate } from 'react-router-dom';
import { Image, X, Globe, UserCheck, Lock, Loader2, Video, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import Newsfeed from './Newsfeed';
import { postsApi } from '../../apis/posts';
import type { CreatePostRequest } from '../../apis/posts';
import { authApi } from '../../apis/auth';
import { uploadApi } from '../../apis/upload';

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const currentUser = authApi.getCurrentUser();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const preview = URL.createObjectURL(file);
        setImagePreviews(prev => [...prev, preview]);
        const result = await uploadApi.uploadFile(file);
        return result.url;
      });

      const urls = await Promise.all(uploadPromises);
      setImageUrls(prev => [...prev, ...urls]);
      console.log('✅ Images uploaded:', urls);
    } catch (err: any) {
      console.error('❌ Image upload failed:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const preview = URL.createObjectURL(file);
        setVideoPreviews(prev => [...prev, preview]);
        const result = await uploadApi.uploadFile(file);
        return result.url;
      });

      const urls = await Promise.all(uploadPromises);
      setVideoUrls(prev => [...prev, ...urls]);
      console.log('✅ Videos uploaded:', urls);
    } catch (err: any) {
      console.error('❌ Video upload failed:', err);
      setError('Failed to upload videos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeVideo = (index: number) => {
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePost = async () => {
    if (!content.trim() && imageUrls.length === 0 && videoUrls.length === 0) {
      setError('Please add some content, images, or videos');
      return;
    }
    
    if (!currentUser) {
      setError('Please login to create a post');
      console.log('⚠️ User not logged in, cannot create post');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const postData: CreatePostRequest = {
        content: content.trim(),
        visibility: privacy,
        allowComments: true,
        allowSharing: true,
        images: imageUrls,
        videos: videoUrls,
      };

      await postsApi.createPost(postData);
      console.log('✅ Post created successfully');
      
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      videoPreviews.forEach(url => URL.revokeObjectURL(url));
      
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('❌ Failed to create post:', err);
      
      if (err.message?.includes('Forbidden') || err.message?.includes('403')) {
        setError('You need to login to create posts. Please login and try again.');
      } else if (err.message?.includes('Bad Request') || err.message?.includes('400')) {
        setError('Invalid post data. Please check your content and try again.');
      } else {
        setError(err.message || 'Failed to create post. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivacyDisplay = () => {
    switch (privacy) {
      case 'PUBLIC':
        return { icon: Globe, text: 'Public' };
      case 'FRIENDS':
        return { icon: UserCheck, text: 'Friends' };
      case 'PRIVATE':
        return { icon: Lock, text: 'Private' };
    }
  };

  const cyclePrivacy = () => {
    if (privacy === 'PUBLIC') setPrivacy('FRIENDS');
    else if (privacy === 'FRIENDS') setPrivacy('PRIVATE');
    else setPrivacy('PUBLIC');
  };

  const privacyDisplay = getPrivacyDisplay();
  const PrivacyIcon = privacyDisplay.icon;

  return (
    <>
      <Newsfeed />
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-125 max-h-[90vh] overflow-y-auto border border-gray-200 pointer-events-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-sm">{currentUser?.fullName?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{currentUser?.fullName || 'User'}</p>
              <button onClick={cyclePrivacy} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors">
                <PrivacyIcon className="w-3.5 h-3.5" />
                <span>{privacyDisplay.text}</span>
              </button>
            </div>
          </div>
          <div className="p-4">
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder={`What's on your mind, ${currentUser?.fullName || 'there'}?`}
              className="w-full min-h-30 p-3 border-none focus:outline-none resize-none text-sm placeholder:text-gray-400"
              disabled={isLoading || isUploading} 
            />
            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                    <button onClick={() => removeImage(index)} className="absolute top-2 right-2 w-8 h-8 bg-gray-900/70 hover:bg-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" disabled={isLoading || isUploading}>
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {videoPreviews.length > 0 && (
              <div className="mt-3 space-y-2">
                {videoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <video src={preview} controls className="w-full rounded-lg" style={{ maxHeight: '300px' }} />
                    <button onClick={() => removeVideo(index)} className="absolute top-2 right-2 w-8 h-8 bg-gray-900/70 hover:bg-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" disabled={isLoading || isUploading}>
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {isUploading && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-600">Uploading files...</p>
              </div>
            )}
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-700 font-medium">Add to your post</span>
              <div className="flex items-center gap-2">
                <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" disabled={isLoading || isUploading} />
                <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={handleVideoSelect} className="hidden" disabled={isLoading || isUploading} />
                <button onClick={() => imageInputRef.current?.click()} disabled={isLoading || isUploading} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Add photos">
                  <Image className="w-5 h-5 text-green-600" />
                </button>
                <button onClick={() => videoInputRef.current?.click()} disabled={isLoading || isUploading} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Add videos">
                  <Video className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
            <button 
              onClick={handlePost} 
              disabled={(!content.trim() && imageUrls.length === 0 && videoUrls.length === 0) || isLoading || isUploading} 
              className={`w-full h-11 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                (content.trim() || imageUrls.length > 0 || videoUrls.length > 0) && !isLoading && !isUploading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
