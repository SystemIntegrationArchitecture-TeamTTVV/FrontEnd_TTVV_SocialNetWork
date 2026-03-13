import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Eye } from 'lucide-react';
import { storiesApi, type StoryData } from '../../apis/stories';
import { authApi } from '../../apis/auth';

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialStoryId?: string;
  stories: StoryData[];
}

export default function StoryViewer({ isOpen, onClose, initialStoryId, stories }: StoryViewerProps) {
  const currentUser = authApi.getCurrentUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (initialStoryId) {
      const index = stories.findIndex(s => s.id === initialStoryId);
      if (index >= 0) setCurrentIndex(index);
    }
  }, [initialStoryId, stories]);

  useEffect(() => {
    if (!isOpen || isPaused || stories.length === 0) return;

    const currentStory = stories[currentIndex];
    
    // Mark story as viewed
    if (currentStory && currentUser?.id) {
      storiesApi.incrementViewCount(currentStory.id).catch(console.error);
    }

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
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 px-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStory.authorAvatar ? (
              <img
                src={currentStory.authorAvatar}
                alt={currentStory.authorName}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                {getInitials(currentStory.authorName)}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{currentStory.authorName}</p>
              <p className="text-gray-300 text-xs">
                {new Date(currentStory.createdAt).toLocaleTimeString('en-US', {
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
      >
        {currentStory.type === 'IMAGE' && currentStory.mediaUrl ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="w-full h-auto max-h-full object-contain"
          />
        ) : currentStory.type === 'VIDEO' && currentStory.mediaUrl ? (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            muted
            className="w-full h-auto max-h-full object-contain"
          />
        ) : currentStory.text ? (
          <div
            className="w-full h-96 flex items-center justify-center p-8"
            style={{ background: currentStory.backgroundColor || undefined }}
          >
            <p className="text-white text-3xl font-bold text-center">{currentStory.text}</p>
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
      </div>

      {/* Footer Stats */}
      <div className="absolute bottom-8 left-0 right-0 px-4 z-10">
        <div className="flex items-center justify-center gap-6 text-white">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="font-medium">{currentStory.viewCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            <span className="font-medium">{currentStory.reactionCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
