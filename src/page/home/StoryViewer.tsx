import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Eye, ThumbsUp, Laugh, Frown, Angry, Zap } from 'lucide-react';
import type { Story } from '../../types/story';
import { authApi } from '../../apis/auth';
import { getLocaleTag } from '../../i18n';
import { useTranslation } from 'react-i18next';
import { storiesApi } from '../../apis/stories';

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialStoryId?: string;
  stories: Story[];
}

export default function StoryViewer({ isOpen, onClose, initialStoryId, stories }: StoryViewerProps) {
  const { t } = useTranslation();
  const currentUser = authApi.getCurrentUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [storyMeta, setStoryMeta] = useState<Record<string, Story>>({});

  // Track view when story changes
  useEffect(() => {
    const story = stories[currentIndex];
    if (!story?.id || !currentUser?.id) return;
    storiesApi.viewStory(story.id, currentUser.id)
      .then(updated => setStoryMeta(prev => ({ ...prev, [story.id]: updated })))
      .catch(() => {});
  }, [currentIndex, currentUser?.id, stories]);

  const handleReact = async (emoji: string) => {
    const story = stories[currentIndex];
    if (!story?.id || !currentUser?.id) return;
    try {
      const updated = await storiesApi.reactStory(story.id, currentUser.id, emoji);
      setStoryMeta(prev => ({ ...prev, [story.id]: updated }));
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (initialStoryId) {
      const index = stories.findIndex(s => s.id === initialStoryId);
      if (index >= 0) setCurrentIndex(index);
    }
  }, [initialStoryId, stories]);  useEffect(() => {
    if (!isOpen || isPaused || stories.length === 0) return;

    // Auto-advance progress
    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            // Close viewer when done
            onClose();
            return 0;
          }
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, isPaused, stories, onClose, currentUser?.id]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 bg-opacity-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>      {/* Header */}
      <div className="absolute top-4 left-0 right-0 px-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStory.user.avatar ? (
              <img
                src={currentStory.user.avatar}
                alt={currentStory.user.name}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                {getInitials(currentStory.user.name)}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{currentStory.user.name}</p>
              <p className="text-gray-300 text-xs">
                {new Date(currentStory.createdAt).toLocaleTimeString(getLocaleTag(), {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div
        className="relative w-full max-w-lg h-full max-h-[90vh] flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >        {currentStory.contentType === 'image' && currentStory.content ? (
          <img
            src={currentStory.content}
            alt={t('storyViewer.imageAlt')}
            className="w-full h-auto max-h-full object-contain"
          />
        ) : currentStory.contentType === 'video' && currentStory.content ? (
          <video
            src={currentStory.content}
            autoPlay
            muted
            className="w-full h-auto max-h-full object-contain"
          />
        ) : currentStory.contentType === 'text' ? (
          <div
            className="w-full h-96 flex items-center justify-center p-8"
            style={{ background: currentStory.background || undefined }}
          >
            <p className="text-white text-3xl font-bold text-center">{currentStory.content}</p>
          </div>
        ) : null}

        {/* Navigation */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {currentIndex < stories.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full transition-all"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>      {/* Footer Stats + Reactions */}
      <div className="absolute bottom-8 left-0 right-0 px-4 z-10 flex flex-col items-center gap-3">
        {/* Reaction bar */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
          {([
            { emoji: 'like',  icon: ThumbsUp, color: 'text-blue-400' },
            { emoji: 'love',  icon: Heart,    color: 'text-red-400' },
            { emoji: 'haha',  icon: Laugh,    color: 'text-yellow-400' },
            { emoji: 'wow',   icon: Zap,      color: 'text-yellow-300' },
            { emoji: 'sad',   icon: Frown,    color: 'text-blue-300' },
            { emoji: 'angry', icon: Angry,    color: 'text-orange-400' },
          ] as const).map(({ emoji, icon: Icon, color }) => {
            const meta = storyMeta[currentStory?.id];
            const count = (meta?.reactions ?? currentStory?.reactions)?.[emoji] ?? 0;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="flex flex-col items-center gap-0.5 hover:scale-125 transition-transform"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                {count > 0 && <span className="text-white text-[10px] leading-none">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Stats row (owner: seen count; all: total reactions) */}
        <div className="flex items-center justify-center gap-6 text-white">
          {(() => {
            const meta = storyMeta[currentStory?.id];
            const viewCount = meta?.viewCount ?? currentStory?.viewCount;
            return viewCount !== undefined && currentStory?.user?.id === currentUser?.id ? (
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="font-medium">{viewCount}</span>
              </div>
            ) : null;
          })()}
          {(() => {
            const meta = storyMeta[currentStory?.id];
            const reacts = meta?.reactions ?? currentStory?.reactions;
            const total = reacts ? Object.values(reacts).reduce((a, b) => (a || 0) + (b || 0), 0) : 0;
            return total > 0 ? (
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="font-medium">{total}</span>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
