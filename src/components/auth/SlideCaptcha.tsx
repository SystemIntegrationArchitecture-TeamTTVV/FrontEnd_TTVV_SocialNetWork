import { useRef, useState } from 'react';
import { CheckCircle2, ChevronsRight } from 'lucide-react';

interface SlideCaptchaProps {
  onVerify: (verified: boolean) => void;
  error?: boolean;
  label?: string;
  successLabel?: string;
}

export default function SlideCaptcha({
  onVerify,
  error = false,
  label = 'Kéo để xác nhận bạn không phải robot',
  successLabel = 'Đã xác nhận',
}: SlideCaptchaProps) {
  const [dragging, setDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sliderX, setSliderX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const THUMB = 48;

  const getMaxX = () => {
    const track = trackRef.current;
    if (!track) return 0;
    return track.offsetWidth - THUMB - 8; // 8 = padding
  };

  const beginDrag = (clientX: number) => {
    if (verified) return;
    setDragging(true);
    startXRef.current = clientX - sliderX;
  };

  const moveDrag = (clientX: number) => {
    if (!dragging || verified) return;
    const maxX = getMaxX();
    const newX = Math.min(Math.max(0, clientX - startXRef.current), maxX);
    setSliderX(newX);
    if (newX >= maxX * 0.92) {
      setVerified(true);
      setSliderX(maxX);
      setDragging(false);
      onVerify(true);
    }
  };

  const endDrag = () => {
    if (dragging && !verified) {
      setDragging(false);
      setSliderX(0);
    }
  };

  return (
    <div
      ref={trackRef}
      role="group"
      aria-label="Slide to verify"
      className={[
        'relative h-12 rounded-xl select-none overflow-hidden transition-all duration-200',
        'border',
        verified
          ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500/50'
          : error
            ? 'bg-[#f4f5f7] dark:bg-[#1f2230] border-red-400 dark:border-red-500/50 ring-2 ring-red-400/30 dark:ring-red-500/20'
            : 'bg-[#f4f5f7] dark:bg-[#1f2230] border-[#e2e5ea] dark:border-[#272c3d]',
      ].join(' ')}
      onMouseMove={(e) => moveDrag(e.clientX)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={(e) => { e.preventDefault(); moveDrag(e.touches[0].clientX); }}
      onTouchEnd={endDrag}
    >
      {/* Fill bar */}
      <div
        className={`absolute left-0 top-0 h-full transition-colors ${verified ? 'bg-green-400/25' : 'bg-blue-500/10'}`}
        style={{ width: sliderX + THUMB + 8, transition: dragging ? 'none' : 'width 0.2s ease' }}
      />

      {/* Center label — fades out as thumb moves */}
      <div
        className={`absolute inset-0 flex items-center justify-center gap-2 text-sm pointer-events-none transition-opacity duration-200 ${
          verified
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-400 dark:text-[#555f78]'
        }`}
        style={{ opacity: verified ? 1 : sliderX > 30 ? 0 : 1 }}
      >
        {verified ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>{successLabel}</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </div>

      {/* Thumb */}
      <div
        className={[
          'absolute top-1 h-10 w-10 rounded-lg shadow-md flex items-center justify-center z-10',
          'transition-colors duration-200',
          verified
            ? 'bg-green-500 text-white cursor-default'
            : 'bg-white dark:bg-[#272c3d] text-blue-500 dark:text-blue-400 cursor-grab active:cursor-grabbing hover:bg-blue-50 dark:hover:bg-[#313752]',
        ].join(' ')}
        style={{
          left: sliderX + 4,
          transition: dragging ? 'none' : 'left 0.25s cubic-bezier(.4,0,.2,1)',
        }}
        onMouseDown={(e) => { e.preventDefault(); beginDrag(e.clientX); }}
        onTouchStart={(e) => { beginDrag(e.touches[0].clientX); }}
      >
        {verified
          ? <CheckCircle2 className="w-5 h-5" />
          : <ChevronsRight className="w-5 h-5" />
        }
      </div>
    </div>
  );
}
