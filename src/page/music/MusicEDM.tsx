import { useState } from 'react';
import { Music2, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, Repeat, Heart, ExternalLink } from 'lucide-react';
import { useMusic } from '../../contexts/MusicContext';

export default function MusicEDM() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nhạc</h1>
          <p className="text-gray-600">Thư viện nhạc của bạn</p>
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
            title={showMiniPlayer ? 'Tắt shortcut' : 'Bật shortcut'}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showMiniPlayer ? 'Đang hiện shortcut' : 'Tạo shortcut'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Player */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="w-full">
            {/* Album Art */}
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

            {/* Song Info */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
                {currentSong.title}
              </h2>
              <p className="text-gray-600 truncate">{currentSong.artist}</p>
            </div>

            {/* Progress Bar */}
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

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${shuffle ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                onClick={previous}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>
              <button
                onClick={next}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`transition-colors ${repeat ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-3">
              <button
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
          </div>
        </div>

        {/* Right Side - Playlist */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Danh sách phát</h3>
          
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
              <div className="text-xs text-gray-600">Bài hát</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{favorites.length}</div>
              <div className="text-xs text-gray-600">Yêu thích</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <Play className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{(totalPlays / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-600">Lượt nghe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
