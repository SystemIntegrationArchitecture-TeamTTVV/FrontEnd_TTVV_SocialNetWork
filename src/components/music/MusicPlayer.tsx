import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X, Shuffle, Repeat, Heart, Music2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { soundCloudWidgetSrc } from '../../utils/soundCloudPlayer';

interface Song {
  id: number;
  title: string;
  artist: string;
  url?: string;
  soundcloudUrl?: string;
  duration: string;
  cover?: string;
}

const defaultPlaylist: Song[] = [
  {
    id: 1,
    title: 'Nơi Này Có Anh',
    artist: 'Sơn Tùng M-TP',
    duration: '4:27',
    soundcloudUrl: 'https://soundcloud.com/trunghieumowo/noi-nao-co-anh-son-tung-mtp',
    cover: 'https://picsum.photos/seed/music1/400',
  },
  {
    id: 2,
    title: 'Em Của Ngày Hôm Qua',
    artist: 'Sơn Tùng M-TP',
    duration: '3:45',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/music2/400'
  },
  {
    id: 3,
    title: 'Lạc Trôi',
    artist: 'Sơn Tùng M-TP',
    duration: '4:01',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/music3/400'
  },
  {
    id: 4,
    title: 'Chúng Ta Của Hiện Tại',
    artist: 'Sơn Tùng M-TP',
    duration: '3:55',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/music4/400'
  }
];

export default function MusicPlayer() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSong = defaultPlaylist[currentSongIndex];
  const isSoundCloudOnly = Boolean(currentSong.soundcloudUrl && !currentSong.url);
  const totalPlays = 1200;

  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const isPlayingRef = useRef(isPlaying);

  useLayoutEffect(() => {
    shuffleRef.current = shuffle;
    repeatRef.current = repeat;
    isPlayingRef.current = isPlaying;
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const song = defaultPlaylist[currentSongIndex];
    const scOnly = Boolean(song.soundcloudUrl && !song.url);

    if (scOnly) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setProgress(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    if (!song.url) return;

    audio.src = song.url;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration);
    };

    const onEnded = () => {
      if (repeatRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setCurrentSongIndex((prev) => {
          if (shuffleRef.current) {
            return Math.floor(Math.random() * defaultPlaylist.length);
          }
          return (prev + 1) % defaultPlaylist.length;
        });
        setIsPlaying(true);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('ended', onEnded);

    if (isPlayingRef.current) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentSongIndex, repeat]);

  useEffect(() => {
    if (audioRef.current && !isSoundCloudOnly) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, isSoundCloudOnly]);

  const togglePlay = () => {
    if (isSoundCloudOnly) return;
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (shuffle) {
      setCurrentSongIndex(Math.floor(Math.random() * defaultPlaylist.length));
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % defaultPlaylist.length);
    }
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (shuffle) {
      setCurrentSongIndex(Math.floor(Math.random() * defaultPlaylist.length));
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + defaultPlaylist.length) % defaultPlaylist.length);
    }
    setIsPlaying(true);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSoundCloudOnly) return;
    const newTime = parseFloat(e.target.value);
    setProgress(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const selectSong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const toggleFavorite = (songId: number) => {
    setFavorites(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 w-full text-gray-700 hover:text-gray-900 group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center transition-all flex-shrink-0">
          <Music2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium">{t('music.title')}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('music.brandName')}</h1>
          <p className="text-purple-200 text-sm">{t('music.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="h-full pt-24 pb-6 px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Player */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            {/* Album Art */}
            <div className="relative mb-8">
              <div className="w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 shadow-2xl">
                {currentSong.cover ? (
                  <img
                    src={currentSong.cover}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-24 h-24 text-white/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Song Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 truncate">
                {currentSong.title}
              </h2>
              <p className="text-purple-200 text-lg truncate">{currentSong.artist}</p>
            </div>

            {isSoundCloudOnly && currentSong.soundcloudUrl ? (
              <div className="mb-6 space-y-4">
                <p className="text-center text-sm text-purple-200">{t('music.soundCloudHint')}</p>
                <iframe
                  title={`SoundCloud: ${currentSong.title}`}
                  className="w-full rounded-2xl border border-white/10"
                  height={360}
                  src={soundCloudWidgetSrc(currentSong.soundcloudUrl, true)}
                  allow="autoplay"
                />
                <div className="flex items-center justify-center gap-8">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="text-white hover:text-purple-200 transition-colors"
                  >
                    <SkipBack className="w-7 h-7" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-white hover:text-purple-200 transition-colors"
                  >
                    <SkipForward className="w-7 h-7" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.8) ${(progress / duration) * 100}%, rgba(255,255,255,0.1) ${(progress / duration) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-purple-200 mt-2">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <button
                    type="button"
                    onClick={() => setShuffle(!shuffle)}
                    className={`transition-colors ${shuffle ? 'text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="text-white hover:text-purple-200 transition-colors"
                  >
                    <SkipBack className="w-7 h-7" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-purple-900 hover:scale-105 transition-transform shadow-2xl"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-white hover:text-purple-200 transition-colors"
                  >
                    <SkipForward className="w-7 h-7" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeat(!repeat)}
                    className={`transition-colors ${repeat ? 'text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:text-purple-200 transition-colors"
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
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Playlist */}
        <div className="flex flex-col">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4">{t('music.playlist')}</h3>
            
            {/* Playlist */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {defaultPlaylist.map((song, index) => (
                <button
                  key={song.id}
                  onClick={() => selectSong(index)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group ${
                    index === currentSongIndex
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      index === currentSongIndex ? 'text-white' : 'text-purple-100'
                    }`}>
                      {song.title}
                    </p>
                    <p className="text-sm text-purple-300 truncate">{song.artist}</p>
                  </div>
                  <span className="text-sm text-purple-300">{song.duration}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(song.id);
                    }}
                    className="text-purple-300 hover:text-pink-400 transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${favorites.includes(song.id) ? 'fill-pink-400 text-pink-400' : ''}`}
                    />
                  </button>
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
                <Music2 className="w-5 h-5 text-purple-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{defaultPlaylist.length}</div>
                <div className="text-xs text-purple-300">{t('music.stats.songs')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
                <Heart className="w-5 h-5 text-pink-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{favorites.length}</div>
                <div className="text-xs text-purple-300">{t('music.stats.favorites')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
                <Play className="w-5 h-5 text-purple-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{(totalPlays / 1000).toFixed(1)}K</div>
                <div className="text-xs text-purple-300">{t('music.stats.plays')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={currentSong.url ?? undefined} />
    </div>
  );
}
