import { useState } from 'react';
import {
  Music2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  ExternalLink,
  Minimize2,
} from 'lucide-react';
import { useMusic } from '../../contexts/MusicContext';
import { soundCloudWidgetSrc } from '../../utils/soundCloudPlayer';
import { useTranslation } from 'react-i18next';

export default function MusicEDM() {
  const { t } = useTranslation();
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    playlist,
    currentIndex,
    showMiniPlayer,
    togglePlay,
    next,
    previous,
    selectSong,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seek,
    setShowMiniPlayer,
    isSoundCloudOnly,
  } = useMusic();

  const [favorites, setFavorites] = useState<number[]>([]);
  const totalPlays = 1200;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFavorite = (songId: number) => {
    setFavorites(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  if (!currentSong) return null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('music.title')}</h1>
          <p className="text-gray-600">{t('music.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowMiniPlayer(!showMiniPlayer);
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showMiniPlayer 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={showMiniPlayer ? t('music.shortcut.disable') : t('music.shortcut.enable')}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showMiniPlayer ? t('music.shortcut.active') : t('music.shortcut.create')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Player */}
        <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2b2f45] p-6">
          <div className="w-full">
            {isSoundCloudOnly && currentSong.soundcloudUrl ? (
              showMiniPlayer ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-6 text-center dark:border-blue-500/30 dark:bg-blue-950/40">
                  <p className="text-sm text-gray-700 dark:text-[#c8d0e6]">
                    {t('music.miniModeDescription')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMiniPlayer(false)}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    {t('music.openFullPlayer')}
                  </button>
                </div>
              ) : (
                <>
                  <iframe
                    title={`SoundCloud: ${currentSong.title}`}
                    className="w-full rounded-2xl border border-gray-200 dark:border-[#2b2f45]"
                    height={400}
                    src={soundCloudWidgetSrc(currentSong.soundcloudUrl, true)}
                    allow="autoplay"
                  />
                  <div className="text-center mt-5 mb-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-[#edf0fa] mb-1 truncate">
                      {currentSong.title}
                    </h2>
                    <p className="text-gray-600 dark:text-[#93a0c0] truncate">{currentSong.artist}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={previous}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-[#2b2f45] dark:text-[#edf0fa] dark:hover:bg-[#252940]"
                    >
                      <SkipBack className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMiniPlayer(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                      title={t('music.pinPlayerTitle')}
                    >
                      <Minimize2 className="w-4 h-4 shrink-0" />
                      {t('music.minimizeWithScreen')}
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-[#2b2f45] dark:text-[#edf0fa] dark:hover:bg-[#252940]"
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-blue-100 to-purple-100">
                    {currentSong.cover ? (
                      <img
                        src={currentSong.cover}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-24 h-24 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-[#edf0fa] mb-1 truncate">
                    {currentSong.title}
                  </h2>
                  <p className="text-gray-600 dark:text-[#93a0c0] truncate">{currentSong.artist}</p>
                </div>
              </>
            )}

            {!isSoundCloudOnly && (
              <>
                <div className="mb-6">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={progress}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 ${(progress / duration) * 100}%, #E5E7EB ${(progress / duration) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <button
                    type="button"
                    onClick={toggleShuffle}
                    className={`transition-colors ${shuffle ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={previous}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleRepeat}
                    className={`transition-colors ${repeat ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Playlist */}
        <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2b2f45] p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('music.playlist')}</h3>
          
          {/* Playlist */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-6 max-h-125">
            {playlist.map((song, index) => (
              <div
                key={song.id}
                role="button"
                tabIndex={0}
                onClick={() => selectSong(index)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group cursor-pointer ${
                  index === currentIndex
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate text-sm ${
                    index === currentIndex ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {song.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                </div>
                <span className="text-xs text-gray-500">{song.duration}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(song.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${favorites.includes(song.id) ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Music2 className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{playlist.length}</div>
              <div className="text-xs text-gray-600">{t('music.stats.songs')}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{favorites.length}</div>
              <div className="text-xs text-gray-600">{t('music.stats.favorites')}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <Play className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{(totalPlays / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-600">{t('music.stats.plays')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
