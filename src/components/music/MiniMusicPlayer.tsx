import { useState, useEffect, useRef, useMemo } from 'react';
import { Music2, Play, Pause, SkipForward, SkipBack, X, Maximize2, GripHorizontal } from 'lucide-react';
import { useMusic } from '../../contexts/MusicContext';
import { useNavigate } from 'react-router-dom';
import { soundCloudWidgetSrc } from '../../utils/soundCloudPlayer';

const SC_WIDTH = 336;
const SC_IFRAME_H = 180;
const SC_TOTAL_H = 290;
const MP3_WIDTH = 300;
const MP3_TOTAL_H = 100;

export default function MiniMusicPlayer() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    togglePlay,
    next,
    previous,
    showMiniPlayer,
    setShowMiniPlayer,
    isSoundCloudOnly,
  } = useMusic();

  const isSc = Boolean(isSoundCloudOnly && currentSong?.soundcloudUrl);
  const playerW = isSc ? SC_WIDTH : MP3_WIDTH;
  const playerH = isSc ? SC_TOTAL_H : MP3_TOTAL_H;

  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? Math.max(8, window.innerWidth - playerW - 16) : 0,
    y: typeof window !== 'undefined' ? Math.max(8, window.innerHeight - playerH - 24) : 0,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPosition((prev) => ({
      x: Math.min(prev.x, Math.max(0, window.innerWidth - playerW)),
      y: Math.min(prev.y, Math.max(0, window.innerHeight - playerH)),
    }));
  }, [playerW, playerH]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - playerW)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - playerH)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, playerW, playerH]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const scSrc = useMemo(() => {
    if (!isSc || !currentSong?.soundcloudUrl) return null;
    return soundCloudWidgetSrc(currentSong.soundcloudUrl, true);
  }, [isSc, currentSong?.soundcloudUrl]);

  if (!showMiniPlayer || !currentSong) return null;

  return (
    <div
      ref={playerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        width: playerW,
      }}
      className="rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden dark:border-[#2b2f45] dark:bg-[#1a1d28]"
    >
      <div
        role="toolbar"
        aria-label="Di chuyển player"
        onMouseDown={startDrag}
        className="flex cursor-grab items-center gap-2 border-b border-gray-100 bg-gray-50 px-2 py-1.5 select-none active:cursor-grabbing dark:border-[#2b2f45] dark:bg-[#13151f]"
      >
        <GripHorizontal className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <span className="text-[11px] font-medium text-gray-500 dark:text-[#7e89a6]">
          Kéo để di chuyển · Theo các trang
        </span>
      </div>

      {scSrc ? (
        <>
          <iframe
            title={`SoundCloud: ${currentSong.title}`}
            className="w-full border-0 bg-black"
            height={SC_IFRAME_H}
            src={scSrc}
            allow="autoplay"
          />
          <div className="flex items-center gap-2 border-t border-gray-100 p-2 dark:border-[#2b2f45]">
            <div className="min-w-0 flex-1 px-1">
              <p className="truncate text-xs font-semibold text-gray-900 dark:text-[#edf0fa]">
                {currentSong.title}
              </p>
              <p className="truncate text-[11px] text-gray-500 dark:text-[#7e89a6]">{currentSong.artist}</p>
            </div>
            <button
              type="button"
              onClick={() => previous()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940]"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => next()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940]"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/music')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940]"
              title="Mở trang Nhạc"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowMiniPlayer(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940]"
              title="Đóng cửa sổ nổi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="h-1 bg-gray-200 dark:bg-[#2b2f45]">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                {currentSong.cover ? (
                  <img
                    src={currentSong.cover}
                    alt={currentSong.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music2 className="h-6 w-6 text-blue-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-[#edf0fa]">
                  {currentSong.title}
                </h4>
                <p className="truncate text-xs text-gray-500 dark:text-[#7e89a6]">{currentSong.artist}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-[#5a6278]">
                  {formatTime(progress)} / {formatTime(duration)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => previous()}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940]"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => togglePlay()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => next()}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940]"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => navigate('/music')}
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940]"
                  title="Mở trang Music"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowMiniPlayer(false)}
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940]"
                  title="Đóng"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
