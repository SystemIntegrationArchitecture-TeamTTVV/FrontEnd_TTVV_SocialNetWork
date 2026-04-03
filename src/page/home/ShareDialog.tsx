import { useNavigate, useParams } from 'react-router-dom';
import { X, Globe, UserCheck, Lock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { postsApi, type PostData } from '../../apis/posts';
import { authApi } from '../../apis/auth';
import { HttpError } from '../../apis/http';
import { useToast } from '../../contexts/useToast';
import { useTranslation } from 'react-i18next';

export default function ShareDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'ONLY_ME'>('PUBLIC');
  const [originalPost, setOriginalPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const currentUser = authApi.getCurrentUser();
  const { showToast } = useToast();

  useEffect(() => {
    const loadOriginalPost = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const post = await postsApi.getPostById(id);
        setOriginalPost(post);
      } catch (error) {
        console.error('Failed to load post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOriginalPost();
  }, [id]);

  const handleShare = async () => {
    if (!id || !currentUser) return;

    setIsSharing(true);
    try {
      await postsApi.sharePost(id, currentUser.id, content, visibility);
      console.log('✅ Post shared successfully');
      navigate('/home');
    } catch (error) {
      console.error('Failed to share post:', error);
      const msg =
        error instanceof HttpError
          ? error.data?.message || error.message
          : error instanceof Error
            ? error.message
            : t('sharePost.errorGeneric');
      showToast(msg, 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const cycleVisibility = () => {
    if (visibility === 'PUBLIC') setVisibility('FRIENDS');
    else if (visibility === 'FRIENDS') setVisibility('ONLY_ME');
    else setVisibility('PUBLIC');
  };

  const getVisibilityIcon = () => {
    if (visibility === 'PUBLIC') return <Globe className="w-4 h-4" />;
    if (visibility === 'FRIENDS') return <UserCheck className="w-4 h-4" />;
    return <Lock className="w-4 h-4" />;
  };

  const getVisibilityText = () => {
    if (visibility === 'PUBLIC') return t('sharePost.visibilityPublic');
    if (visibility === 'FRIENDS') return t('sharePost.visibilityFriends');
    return t('sharePost.visibilityOnlyMe');
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return t('sharePost.justNow');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('sharePost.justNow');
    if (diffMins < 60) return t('sharePost.timeMinutes', { count: diffMins });
    if (diffHours < 24) return t('sharePost.timeHours', { count: diffHours });
    return t('sharePost.timeDays', { count: diffDays });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{t('sharePost.title')}</h2>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{currentUser?.fullName || t('sharePost.unknownUser')}</p>
              <button
                type="button"
                onClick={cycleVisibility}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {getVisibilityIcon()}
                <span>{getVisibilityText()}</span>
              </button>
            </div>
          </div>

          {/* Content Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('sharePost.placeholder')}
            className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
            disabled={isSharing}
          />

          {/* Original Post Preview */}
          {isLoading ? (
            <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : originalPost ? (
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                  {originalPost.authorName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{originalPost.authorName || t('sharePost.unknownAuthor')}</p>
                  <p className="text-xs text-gray-500">{getTimeAgo(originalPost.createdAt)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{originalPost.content}</p>
              {originalPost.images && originalPost.images.length > 0 && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img 
                    src={originalPost.images[0]} 
                    alt={t('sharePost.postImageAlt')} 
                    className="w-full max-h-[300px] object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 rounded-lg p-4 text-center text-red-600">
              {t('sharePost.loadFailed')}
            </div>
          )}

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing || isLoading || !originalPost}
            className="w-full h-11 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('sharePost.sharing')}</span>
              </>
            ) : (
              t('sharePost.shareNow')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

