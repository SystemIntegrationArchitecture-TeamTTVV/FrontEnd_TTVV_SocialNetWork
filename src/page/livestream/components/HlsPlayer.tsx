// ── HlsPlayer — HLS video player using hls.js ─────────────────────────
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HlsPlayerProps {
  src: string;
  autoPlay?: boolean;
  className?: string;
  onError?: (message: string) => void;
}

export default function HlsPlayer({ src, autoPlay = true, className = '', onError }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);

    // Case 1: Native HLS support (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
      if (autoPlay) video.play().catch(() => {});
      return;
    }

    // Case 2: Use hls.js (Chrome, Firefox, Edge)
    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 10,
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setHasError(true);
          setIsLoading(false);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover from network error
              console.warn('🔄 HLS network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('🔄 HLS media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('❌ HLS fatal error:', data);
              onError?.('Không thể phát video stream');
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      setHasError(true);
      setIsLoading(false);
      onError?.('Trình duyệt không hỗ trợ phát HLS');
    }
  }, [src, autoPlay, onError]);

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        muted={autoPlay} // Muted for autoplay policy
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white/80 text-sm">Đang tải stream...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-lg font-medium">Stream chưa sẵn sàng</p>
            <p className="text-sm text-white/60 mt-1">Đang chờ streamer bắt đầu phát...</p>
          </div>
        </div>
      )}
    </div>
  );
}
