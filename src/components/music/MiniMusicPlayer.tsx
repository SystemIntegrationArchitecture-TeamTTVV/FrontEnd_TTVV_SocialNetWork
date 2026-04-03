import { useState, useEffect, useRef, useMemo } from 'react';
import { Music2, Play, Pause, SkipForward, SkipBack, X, Maximize2, GripHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMusic } from '../../contexts/MusicContext';
import { useNavigate } from 'react-router-dom';
import { soundCloudWidgetSrc } from '../../utils/soundCloudPlayer';

const SC_WIDTH = 336;
const SC_IFRAME_H = 180;
const SC_TOTAL_H = 290;
const SC_IFRAME_H_COMPACT = 120;
/** Toolbar + iframe + control row (approx, for clamping) */
const SC_TOTAL_H_COMPACT = 200;
const MP3_WIDTH = 300;
const MP3_TOTAL_H = 100;
const MP3_TOTAL_H_COMPACT = 88;

export default function MiniMusicPlayer() {
  const { t } = useTranslation();
  const [winW, setWinW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const compact = winW < 640;

  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
  const sideMargin = 12;
  const maxUsableW = Math.max(220, winW - sideMargin * 2);
  const playerW = isSc
    ? compact
      ? Math.min(maxUsableW, 300)
      : SC_WIDTH
    : compact
      ? Math.min(maxUsableW, 280)
      : MP3_WIDTH;
  const scIframeH = compact ? SC_IFRAME_H_COMPACT : SC_IFRAME_H;
  const playerH = isSc
    ? compact
      ? SC_TOTAL_H_COMPACT
      : SC_TOTAL_H
    : compact
      ? MP3_TOTAL_H_COMPACT
      : MP3_TOTAL_H;

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
      className="max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden dark:border-[#2b2f45] dark:bg-[#1a1d28]"
    >
      <div
        role="toolbar"
        aria-label={t('music.miniPlayer.dragAria')}
        onMouseDown={startDrag}
        className={`flex cursor-grab items-center gap-1.5 border-b border-gray-100 bg-gray-50 select-none active:cursor-grabbing dark:border-[#2b2f45] dark:bg-[#13151f] ${
          compact ? 'px-1.5 py-1' : 'px-2 py-1.5'
        }`}
      >
        <GripHorizontal className={`shrink-0 text-gray-400 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} aria-hidden />
        <span
          className={`min-w-0 flex-1 font-medium text-gray-500 dark:text-[#7e89a6] ${
            compact ? 'truncate text-[10px]' : 'text-[11px]'
          }`}
        >
          {t('music.miniPlayer.dragHint')}
        </span>
      </div>

      {scSrc ? (
        <>
          <iframe
            title={`SoundCloud: ${currentSong.title}`}
            className="w-full border-0 bg-black"
            height={scIframeH}
            src={scSrc}
            allow="autoplay"
          />
          <div
            className={`flex items-center border-t border-gray-100 dark:border-[#2b2f45] ${
              compact ? 'gap-1 p-1.5' : 'gap-2 p-2'
            }`}
          >
            <div className="min-w-0 flex-1 px-0.5">
              <p
                className={`truncate font-semibold text-gray-900 dark:text-[#edf0fa] ${
                  compact ? 'text-[11px] leading-tight' : 'text-xs'
                }`}
              >
                {currentSong.title}
              </p>
              <p className={`truncate text-gray-500 dark:text-[#7e89a6] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                {currentSong.artist}
              </p>
            </div>
            <button
              type="button"
              onClick={() => previous()}
              className={`shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940] ${
                compact ? 'flex h-7 w-7' : 'flex h-8 w-8'
              }`}
            >
              <SkipBack className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </button>
            <button
              type="button"
              onClick={() => next()}
              className={`shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940] ${
                compact ? 'flex h-7 w-7' : 'flex h-8 w-8'
              }`}
            >
              <SkipForward className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/music')}
              className={`shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940] ${
                compact ? 'flex h-7 w-7' : 'flex h-8 w-8'
              }`}
              title={t('music.miniPlayer.openMusicPage')}
            >
              <Maximize2 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            </button>
            <button
              type="button"
              onClick={() => setShowMiniPlayer(false)}
              className={`shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940] ${
                compact ? 'flex h-7 w-7' : 'flex h-8 w-8'
              }`}
              title={t('music.miniPlayer.closeFloating')}
            >
              <X className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
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
          <div className={compact ? 'p-2' : 'p-3'}>
            <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
              <div
                className={`shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 ${
                  compact ? 'h-10 w-10' : 'h-12 w-12'
                }`}
              >
                {currentSong.cover ? (
                  <img
                    src={currentSong.cover}
                    alt={currentSong.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music2 className={compact ? 'h-5 w-5 text-blue-400' : 'h-6 w-6 text-blue-400'} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`truncate font-semibold text-gray-900 dark:text-[#edf0fa] ${compact ? 'text-xs' : 'text-sm'}`}>
                  {currentSong.title}
                </h4>
                <p className={`truncate text-gray-500 dark:text-[#7e89a6] ${compact ? 'text-[11px]' : 'text-xs'}`}>
                  {currentSong.artist}
                </p>
                <p className={`text-gray-400 dark:text-[#5a6278] ${compact ? 'mt-0 text-[10px]' : 'mt-0.5 text-xs'}`}>
                  {formatTime(progress)} / {formatTime(duration)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => previous()}
                  className={`flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940] ${
                    compact ? 'h-6 w-6' : 'h-7 w-7'
                  }`}
                >
                  <SkipBack className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </button>
                <button
                  type="button"
                  onClick={() => togglePlay()}
                  className={`flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 ${
                    compact ? 'h-7 w-7' : 'h-8 w-8'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                  ) : (
                    <Play className={compact ? 'ml-0.5 h-3.5 w-3.5' : 'ml-0.5 h-4 w-4'} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => next()}
                  className={`flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-[#c8d0e6] dark:hover:bg-[#252940] ${
                    compact ? 'h-6 w-6' : 'h-7 w-7'
                  }`}
                >
                  <SkipForward className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </button>
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => navigate('/music')}
                  className={`flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940] ${
                    compact ? 'h-5 w-5' : 'h-6 w-6'
                  }`}
                  title={t('music.miniPlayer.openMusicPage')}
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowMiniPlayer(false)}
                  className={`flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252940] ${
                    compact ? 'h-5 w-5' : 'h-6 w-6'
                  }`}
                  title={t('music.miniPlayer.close')}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
