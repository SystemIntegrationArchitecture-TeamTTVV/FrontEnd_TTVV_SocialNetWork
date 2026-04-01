import { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Song {
  id: number;
  title: string;
  artist: string;
  /** Direct MP3/stream URL for the HTML audio element (omit if only SoundCloud). */
  url?: string;
  /** SoundCloud track page URL; playback uses the official embed widget. */
  soundcloudUrl?: string;
  duration: string;
  cover?: string;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: boolean;
  playlist: Song[];
  currentIndex: number;
  showMiniPlayer: boolean;
  /** Tracks with only SoundCloud use the iframe player; HTML5 controls are skipped. */
  isSoundCloudOnly: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  selectSong: (index: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seek: (time: number) => void;
  setShowMiniPlayer: (show: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

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
  },
  {
    id: 5,
    title: 'Hãy Trao Cho Anh',
    artist: 'Sơn Tùng M-TP',
    duration: '4:15',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/music5/400'
  }
];

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = defaultPlaylist[currentIndex];
  const isSoundCloudOnly = Boolean(currentSong.soundcloudUrl && !currentSong.url);

  useEffect(() => {
    const song = defaultPlaylist[currentIndex];
    const scOnly = Boolean(song.soundcloudUrl && !song.url);

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

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
    audio.volume = isMuted ? 0 : volume;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        next();
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      audio.play().catch(err => console.error('Play error:', err));
    }

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, repeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const play = () => {
    if (isSoundCloudOnly) return;
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (isSoundCloudOnly) return;
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isSoundCloudOnly) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const next = () => {
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * defaultPlaylist.length);
      setCurrentIndex(randomIndex);
    } else {
      setCurrentIndex((prev) => (prev + 1) % defaultPlaylist.length);
    }
    setIsPlaying(true);
  };

  const previous = () => {
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * defaultPlaylist.length);
      setCurrentIndex(randomIndex);
    } else {
      setCurrentIndex((prev) => (prev - 1 + defaultPlaylist.length) % defaultPlaylist.length);
    }
    setIsPlaying(true);
  };

  const selectSong = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const toggleRepeat = () => {
    setRepeat(!repeat);
  };

  const seek = (time: number) => {
    if (isSoundCloudOnly) return;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        isMuted,
        shuffle,
        repeat,
        playlist: defaultPlaylist,
        currentIndex,
        showMiniPlayer,
        isSoundCloudOnly,
        play,
        pause,
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
