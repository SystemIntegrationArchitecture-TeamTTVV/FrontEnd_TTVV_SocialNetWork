import { useState, useEffect, useRef } from 'react';
import { Music2, Play, Pause, SkipForward, SkipBack, X, Maximize2 } from 'lucide-react';
import { useMusic } from '../../contexts/MusicContext';
import { useNavigate } from 'react-router-dom';
import { soundCloudWidgetSrc } from '../../utils/soundCloudPlayer';

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

  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 300)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100))
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
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
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

  if (!showMiniPlayer || !currentSong) return null;

  const scSrc =
    isSoundCloudOnly && currentSong.soundcloudUrl
      ? soundCloudWidgetSrc(currentSong.soundcloudUrl, false)
      : null;

  return (
    <div
      ref={playerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className={`${scSrc ? 'w-[320px]' : 'w-[300px]'} bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden`}
      onMouseDown={handleMouseDown}
    >
      {!scSrc && (
        <div className="h-1 bg-gray-200 relative">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="p-3">
        <div className={`flex items-center gap-3 ${scSrc ? 'flex-col' : ''}`}>
          <div className={`flex items-center gap-3 w-full ${scSrc ? '' : ''}`}>
            {/* Album Cover */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0">
              {currentSong.cover ? (
                <img
                  src={currentSong.cover}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-blue-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {currentSong.title}
              </h4>
              <p className="text-xs text-gray-500 truncate">{currentSong.artist}</p>
              {!scSrc && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatTime(progress)} / {formatTime(duration)}
                </p>
              )}
              {scSrc && (
                <p className="text-xs text-orange-600 mt-0.5">SoundCloud — phát trên thanh bên dưới</p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  previous();
                }}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              {!scSrc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/music');
                }}
                className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                title="Mở trang Music"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMiniPlayer(false);
                }}
                className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {scSrc && (
            <iframe
              title={`SoundCloud: ${currentSong.title}`}
              className="w-full rounded-lg border-0"
              height={166}
              src={scSrc}
              allow="autoplay"
            />
          )}
        </div>
      </div>
    </div>
  );
}
