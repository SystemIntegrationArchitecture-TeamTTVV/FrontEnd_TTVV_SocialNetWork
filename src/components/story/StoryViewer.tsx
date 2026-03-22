import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Story } from '../../types/story';

type StoryViewerProps = {
  storyGroups: Story[][];
  initialUserIndex: number;
  onClose: () => void;
};
import { API_CONFIG } from '../../apis/config';
export default function StoryViewer({
  storyGroups,
  initialUserIndex,
  onClose,
}: StoryViewerProps) {
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stories = storyGroups[userIndex];
  const story = stories?.[storyIndex];

  /* ================= AUTO PLAY ================= */
  useEffect(() => {
    setProgress(0);

    // VIDEO → handled by timeupdate
    if (story?.contentType === 'video') return;

    // IMAGE / TEXT → 5s
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 100));
    }, 50);

    const timeout = setTimeout(() => {
      next();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [userIndex, storyIndex]);

  /* ================= ESC ================= */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ================= NAV ================= */
  const next = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (userIndex < storyGroups.length - 1) {
      setUserIndex((u) => u + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (userIndex > 0) {
      const prevUser = userIndex - 1;
      setUserIndex(prevUser);
      setStoryIndex(storyGroups[prevUser].length - 1);
    }
  };

  if (!story) return null;

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

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 flex gap-1 px-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 bg-white/30 rounded">
              {i === storyIndex && (
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              )}
              {i < storyIndex && <div className="h-full bg-white w-full" />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-3 left-3 right-3 flex items-center gap-3 z-10">
          <img src={story.user.avatar} className="w-8 h-8 rounded-full" />
          <span className="text-white font-medium text-sm">
            {story.user.name}
          </span>
        </div>

        {/* Content */}
        <div className="relative flex h-full w-full items-center justify-center">
          {/* IMAGE */}
          {story.contentType === 'image' && (
            <>
              <img
                src={`${API_CONFIG.COMMON_SERVICE_URL}${story.content}`}
                className="h-full w-full object-cover"
                alt=""
              />
              {story.caption?.trim() ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-4 pb-8 pt-16 text-center text-base font-medium leading-snug text-white drop-shadow-lg">
                  {story.caption.trim()}
                </div>
              ) : null}
            </>
          )}

          {/* VIDEO */}
          {story.contentType === 'video' && (
            <>
              <video
                ref={videoRef}
                src={story.content}
                className="h-full w-full object-cover"
                autoPlay
                muted
                playsInline
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  const percent =
                    (video.currentTime / video.duration) * 100;
                  setProgress(percent || 0);
                }}
                onEnded={next}
              />
              {story.caption?.trim() ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-4 pb-8 pt-16 text-center text-base font-medium leading-snug text-white drop-shadow-lg">
                  {story.caption.trim()}
                </div>
              ) : null}
            </>
          )}

          {/* TEXT */}
          {story.contentType === 'text' && (
            <div
              className={`w-full h-full flex items-center justify-center text-white text-2xl font-semibold ${story.background}`}
            >
              {story.content}
            </div>
          )}
        </div>

        {/* Click zones */}
        <div className="absolute inset-0 flex z-20">
          <div className="w-1/2 cursor-pointer" onClick={prev} />
          <div className="w-1/2 cursor-pointer" onClick={next} />
        </div>
      </div>
    </div>
  );
}