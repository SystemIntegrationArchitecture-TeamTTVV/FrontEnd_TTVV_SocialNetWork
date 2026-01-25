import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import  type { Story }  from '../../types/story';
type Props = {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
};

export default function StoryViewer({ stories, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const story = stories[index];

  // Auto progress (5s / story)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => p + 1);
    }, 50);

    const timeout = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [index]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const prev = () => index > 0 && setIndex(index - 1);
  const next = () => index < stories.length - 1 && setIndex(index + 1);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white opacity-80 hover:opacity-100"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Viewer */}
      <div className="relative w-[420px] h-[720px] bg-black rounded-2xl overflow-hidden">

        {/* Progress */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="absolute top-3 left-3 right-3 flex items-center gap-3 z-10">
          <img
            src={story.user.avatar}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-white font-medium text-sm">
            {story.user.name}
          </span>
        </div>

        {/* Content */}
        <div className="w-full h-full flex items-center justify-center">
          {story.contentType === 'image' ? (
            <img
              src={story.content}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-white text-2xl font-semibold ${story.background}`}
            >
              {story.content}
            </div>
          )}
        </div>

        {/* Navigation zones */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 cursor-pointer" onClick={prev} />
          <div className="w-1/2 cursor-pointer" onClick={next} />
        </div>
      </div>
    </div>
  );
}
