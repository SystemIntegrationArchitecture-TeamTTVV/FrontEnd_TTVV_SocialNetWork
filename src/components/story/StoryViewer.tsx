import { X, Heart, Laugh, ThumbsUp, Frown, Angry, Zap, Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Story } from '../../types/story';
import StoryAvatar from './StoryAvatar';
import { resolveStoryContentUrl } from '../../utils/mediaUrl';
import { storiesApi } from '../../apis/stories';
import { useAuth } from '../../contexts/AuthContext';

type StoryViewerProps = {
  storyGroups: Story[][];
  initialUserIndex: number;
  onClose: () => void;
};

export default function StoryViewer({
  storyGroups,
  initialUserIndex,
  onClose,
}: StoryViewerProps) {
  const { user } = useAuth();
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [storyMeta, setStoryMeta] = useState<Record<string, Story>>({});

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

  /* ================= VIEW TRACKING ================= */
  useEffect(() => {
    if (!story?.id || !user?.id) return;
    storiesApi.viewStory(story.id, user.id)
      .then(updated => setStoryMeta(prev => ({ ...prev, [story.id]: updated })))
      .catch(() => {}); // silent — not critical
  }, [story?.id, user?.id]);

  const handleReact = async (emoji: string) => {
    if (!story?.id || !user?.id) return;
    try {
      const updated = await storiesApi.reactStory(story.id, user.id, emoji);
      setStoryMeta(prev => ({ ...prev, [story.id]: updated }));
    } catch { /* silent */ }
  };

  const currentMeta = story?.id ? storyMeta[story.id] : undefined;
  const isOwner = story?.user?.id === user?.id;

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

  const mediaSrc = resolveStoryContentUrl(story.content);

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
      <div className="relative w-105 h-180 bg-black rounded-2xl overflow-hidden">

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
          <StoryAvatar
            name={story.user.name}
            avatar={story.user.avatar}
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="text-white font-medium text-sm">
            {story.user.name}
          </span>
        </div>

        {/* Content */}
        <div className="relative flex h-full w-full items-center justify-center">
          {/* IMAGE */}
          {story.contentType === 'image' && (
            <>
              {mediaSrc ? (
                <img
                  src={mediaSrc}
                  className="h-full w-full object-cover"
                  alt=""
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm text-white/70">
                  Media unavailable
                </div>
              )}
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
              {mediaSrc ? (
                <video
                  ref={videoRef}
                  src={mediaSrc}
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
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm text-white/70">
                  Media unavailable
                </div>
              )}
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

        {/* Reaction bar + seen count */}
        <div className="absolute bottom-4 left-0 right-0 z-30 flex flex-col items-center gap-2 px-4 pointer-events-none">
          {/* Seen count — only visible to story owner */}
          {isOwner && (
            <div className="flex items-center gap-1.5 bg-black/50 rounded-full px-3 py-1 pointer-events-auto">
              <Eye className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white text-xs font-medium">
                {currentMeta?.viewCount ?? story.viewCount ?? 0}
              </span>
            </div>
          )}

          {/* Quick reactions */}
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2 pointer-events-auto">
            {([
              { emoji: 'like',  icon: ThumbsUp, color: 'text-blue-400' },
              { emoji: 'love',  icon: Heart,    color: 'text-red-400' },
              { emoji: 'haha',  icon: Laugh,    color: 'text-yellow-400' },
              { emoji: 'wow',   icon: Zap,      color: 'text-yellow-300' },
              { emoji: 'sad',   icon: Frown,    color: 'text-blue-300' },
              { emoji: 'angry', icon: Angry,    color: 'text-orange-400' },
            ] as const).map(({ emoji, icon: Icon, color }) => {
              const count = (currentMeta?.reactions ?? story.reactions)?.[emoji] ?? 0;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  className="flex flex-col items-center gap-0.5 hover:scale-125 transition-transform"
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                  {count > 0 && (
                    <span className="text-white text-[10px] leading-none">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}