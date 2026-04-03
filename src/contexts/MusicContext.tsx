import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
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

const MINI_PLAYER_SESSION_KEY = 'ttvv-music-mini-player';

function readMiniPlayerOpen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(MINI_PLAYER_SESSION_KEY) === '1';
  } catch {
    return false;
  }
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
  },
  {
    id: 5,
    title: 'Hãy Trao Cho Anh',
    artist: 'Sơn Tùng M-TP',
    duration: '4:15',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/music5/400'
  },
  {
    id: 6,
    title: 'Nonstop Thang 4 La Loi Noi Doi Cua Em',
    artist: 'Tho Melody',
    duration: '--:--',
    soundcloudUrl:
      'https://soundcloud.com/user-532255930/nonstop-thang-4-la-loi-noi-doi-cua-em-dj-tho-melody',
    cover: 'https://picsum.photos/seed/music6/400',
  },
  {
    id: 7,
    title: 'Thang Tu La Loi Noi Doi Cua Em Piano',
    artist: 'mr.tien',
    duration: '--:--',
    soundcloudUrl:
      'https://soundcloud.com/user-500641686-238881760/thang-tu-la-loi-noi-doi-cua-em-piano',
    cover: 'https://picsum.photos/seed/music7/400',
  },
  {
    id: 8,
    title: 'May Lang Thang',
    artist: 'Tung TeA & PC ft. New$oulZ',
    duration: '--:--',
    soundcloudUrl:
      'https://soundcloud.com/taynguyensoundofficial/may-lang-thang-tung-tea-pc-ft-newoulz',
    cover: 'https://picsum.photos/seed/music8/400',
  },
  {
    id: 9,
    title: 'Ghe Qua',
    artist: 'Dick & Tofu & PC',
    duration: '--:--',
    soundcloudUrl: 'https://soundcloud.com/taynguyensound/ghe-qua-dick-tofu-pc',
    cover: 'https://picsum.photos/seed/music9/400',
  },
  {
    id: 10,
    title: 'Co Mot Nguoi, Luon Cuoi Khi Anh Den',
    artist: 'Tofu & PC & D.Blue',
    duration: '--:--',
    soundcloudUrl:
      'https://soundcloud.com/taynguyensound/co-mot-nguoi-luon-cuoi-khi-anh-den-tofu-pc-dblue',
    cover: 'https://picsum.photos/seed/music10/400',
  },
  {
    id: 11,
    title: 'Mat Biec',
    artist: 'TeA ft PCGL',
    duration: '--:--',
    soundcloudUrl: 'https://soundcloud.com/taynguyensoundofficial/mat-biec-tea-ft-pcgl',
    cover: 'https://picsum.photos/seed/music11/400',
  },
  {
    id: 12,
    title: 'Con Mua Bang Gia',
    artist: 'Noo Phuoc Thinh',
    duration: '--:--',
    soundcloudUrl: 'https://soundcloud.com/b-o-tr-n-972237721/co-n-mu-a-ba-ng-gia-noo-phu-o',
    cover: 'https://picsum.photos/seed/music12/400',
  },
  {
    id: 13,
    title: 'Yeu Mot Nguoi Sao Buon Den The',
    artist: "Noo Phuoc Thinh (Live @ Noo's Chill Night EP.02)",
    duration: '--:--',
    soundcloudUrl:
      'https://soundcloud.com/nguyenkimthien/y-u-m-t-ng-i-sao-bu-n-n-th-1',
    cover: 'https://picsum.photos/seed/music13/400',
  },
  {
    id: 14,
    title: 'Gat Di Nuoc Mat (Hieu Tran Remix)',
    artist: 'Noo Phuoc Thinh, Tonny Viet',
    duration: '--:--',
    soundcloudUrl:
      'https://soundcloud.com/hieutranmusicproducer/gat-di-nuoc-mat-noo-phuoc-thinh-tonny-viet-hieu-tran-funk-remix',
    cover: 'https://picsum.photos/seed/music14/400',
  },
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
  const [showMiniPlayer, setShowMiniPlayerState] = useState(readMiniPlayerOpen);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setShowMiniPlayer = useCallback((show: boolean) => {
    setShowMiniPlayerState(show);
    try {
      if (show) {
        sessionStorage.setItem(MINI_PLAYER_SESSION_KEY, '1');
      } else {
        sessionStorage.removeItem(MINI_PLAYER_SESSION_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

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
