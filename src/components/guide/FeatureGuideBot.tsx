// ── FeatureGuideBot — Cute mascot walks on floor to sidebar ──────────
import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import mascotPointSrc from '../../assets/Bot/mascot1.jpg';
import mascotNormalSrc from '../../assets/Bot/mascot2.jpg';

type Phase = 'idle' | 'dropping' | 'walking' | 'flyingUp' | 'pointing' | 'done';

/** Load image, strip white-ish pixels via Canvas, return transparent dataURL */
function removeWhiteBg(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        // If pixel is close to white, make transparent
        if (px[i] > 225 && px[i + 1] > 225 && px[i + 2] > 225) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(src); // fallback
    img.src = src;
  });
}

export default function FeatureGuideBot() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [botPos, setBotPos] = useState({ x: 0, y: 0 });
  const [showBubble, setShowBubble] = useState(false);
  const [mascotNormal, setMascotNormal] = useState(mascotNormalSrc);
  const [mascotPoint, setMascotPoint] = useState(mascotPointSrc);
  const animRef = useRef<number>(0);

  const findTarget = useCallback(() => {
    const el = document.querySelector('[data-sidebar-link="/livestream"]') as HTMLElement | null;
    if (!el) return null;
    el.style.transition = 'all 0.5s ease';
    el.style.boxShadow = '0 0 0 2px #1877F2, 0 0 16px rgba(24,119,242,0.35)';
    el.style.borderRadius = '12px';
    return el.getBoundingClientRect();
  }, []);

  const clearHL = useCallback(() => {
    const el = document.querySelector('[data-sidebar-link="/livestream"]') as HTMLElement | null;
    if (el) el.style.boxShadow = '';
  }, []);

  // Process images on mount: remove white background
  useEffect(() => {
    removeWhiteBg(mascotNormalSrc).then(setMascotNormal);
    removeWhiteBg(mascotPointSrc).then(setMascotPoint);
  }, []);

  const startGuide = useCallback(() => {
    if (phase !== 'idle' && phase !== 'done') return;
    const rect = findTarget();
    if (!rect) return;

    setShowBubble(false);
    setPhase('dropping');

    const floorY = window.innerHeight - 55; // sàn nhà
    const startX = window.innerWidth - 120;
    const endX = rect.right + 50; // đến bên phải nút "Phát trực tiếp"

    setBotPos({ x: startX, y: -50 });

    // ── Phase 1: Rơi xuống sàn (1s) ──
    let t0: number | null = null;
    const drop = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 1000, 1);
      // Gravity + 2 bounces
      let y: number;
      if (p < 0.6) {
        y = -50 + (floorY + 50) * (p / 0.6) ** 2;
      } else if (p < 0.78) {
        const bp = (p - 0.6) / 0.18;
        y = floorY - Math.sin(bp * Math.PI) * 18;
      } else if (p < 0.92) {
        const bp = (p - 0.78) / 0.14;
        y = floorY - Math.sin(bp * Math.PI) * 6;
      } else {
        y = floorY;
      }
      setBotPos({ x: startX, y });
      if (p < 1) animRef.current = requestAnimationFrame(drop);
      else {
        // ── Phase 2: ĐI trên sàn từ phải sang trái (3.5s CHẬM) ──
        setPhase('walking');
        let t1: number | null = null;
        const walk = (ts2: number) => {
          if (!t1) t1 = ts2;
          const p2 = Math.min((ts2 - t1) / 3500, 1);
          // ease in-out
          const ease = p2 < 0.5 ? 2 * p2 * p2 : -1 + (4 - 2 * p2) * p2;
          const x = startX + (endX - startX) * ease;
          // Bước chân nhẹ lên xuống khi đi
          const stepBounce = Math.abs(Math.sin(p2 * Math.PI * 14)) * 3;
          setBotPos({ x, y: floorY - stepBounce });
          if (p2 < 1) animRef.current = requestAnimationFrame(walk);
          else {
            // ── Phase 3: Bay từ từ lên vị trí Phát trực tiếp (1.8s CHẬM) ──
            setPhase('flyingUp');
            let t2: number | null = null;
            const endY = rect.top + rect.height / 2 + 15;
            const flyUp = (ts3: number) => {
              if (!t2) t2 = ts3;
              const p3 = Math.min((ts3 - t2) / 1800, 1);
              const easeUp = p3 < 0.5 ? 2 * p3 * p3 : -1 + (4 - 2 * p3) * p3; // ease in-out
              const y = floorY + (endY - floorY) * easeUp;
              // Floating effect on X while going up
              const floatX = endX + Math.sin(p3 * Math.PI * 6) * 6 * (1 - p3);
              setBotPos({ x: floatX, y });
              
              if (p3 < 1) animRef.current = requestAnimationFrame(flyUp);
              else {
                setPhase('pointing');
                setBotPos({ x: endX, y: endY });
                setTimeout(() => setShowBubble(true), 400);
              }
            };
            animRef.current = requestAnimationFrame(flyUp);
          }
        };
        animRef.current = requestAnimationFrame(walk);
      }
    };
    animRef.current = requestAnimationFrame(drop);
  }, [phase, findTarget]);

  const dismiss = useCallback(() => {
    setShowBubble(false);
    clearHL();
    setPhase('done');
    // Nhảy lên và biến mất
    const from = { ...botPos };
    let t0: number | null = null;
    const fly = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 600, 1);
      setBotPos({ x: from.x, y: from.y - p * 200 * (1 + p) });
      if (p < 1) animRef.current = requestAnimationFrame(fly);
      else setPhase('idle');
    };
    animRef.current = requestAnimationFrame(fly);
  }, [botPos, clearHL]);

  useEffect(() => () => { cancelAnimationFrame(animRef.current); clearHL(); }, [clearHL]);

  const active = phase !== 'idle' && phase !== 'done';
  const isWalking = phase === 'walking';

  return (
    <>
      {/* ── Trigger button ── */}
      {(phase === 'idle' || phase === 'done') && (
        <button
          onClick={startGuide}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all text-[12px] font-medium text-[#050505] dark:text-[#edf0fa] group"
        >
          <span className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
            <Zap className="w-2.5 h-2.5 text-white" fill="white" />
          </span>
          Có gì mới
        </button>
      )}

      {/* ── Mascot ── */}
      {active && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: `${botPos.x}px`, top: `${botPos.y}px`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="pointer-events-auto">
            {/* ── Character: image mascot ── */}
            <div className={`relative ${isWalking ? 'animate-[wobble_0.35s_ease-in-out_infinite]' : ''}`}>
              <img 
                src={phase === 'pointing' ? mascotPoint : mascotNormal} 
                alt="Bot mascot" 
                className="w-16 h-16 object-contain" 
              />
              {/* Shadow on floor - hides when flying up */}
              {phase !== 'flyingUp' && phase !== 'pointing' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-black/10 dark:bg-black/25 rounded-full blur-[1px]" />
              )}
            </div>
          </div>

          {/* ── Speech Bubble — above the mascot ── */}
          {showBubble && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-auto animate-[pop_0.3s_ease-out_forwards]">
              <div className="relative bg-white dark:bg-[#1a1d28] rounded-xl shadow-lg border border-[#e4e6eb] dark:border-[#2b2f45] px-3 py-2.5 w-[210px]">
                {/* Arrow down */}
                <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#e4e6eb] dark:border-t-[#2b2f45]" />
                <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-white dark:border-t-[#1a1d28]" />

                <div className="flex items-start gap-1.5">
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-[#050505] dark:text-[#edf0fa]">🎉 Tính năng mới!</p>
                    <p className="text-[11px] text-[#65676b] dark:text-[#7e89a6] mt-0.5 leading-relaxed">
                      ← <strong className="text-[#1877F2]">Phát trực tiếp</strong> đã có! Stream với OBS ngay 🎬
                    </p>
                  </div>
                  <button onClick={dismiss} className="w-4 h-4 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-2.5 h-2.5 text-[#65676b]" />
                  </button>
                </div>
                <button
                  onClick={() => { dismiss(); window.location.href = '/livestream'; }}
                  className="mt-1.5 w-full py-1 bg-[#1877F2] hover:bg-[#1664d9] text-white text-[11px] font-medium rounded-md transition-colors"
                >
                  Khám phá ngay →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes wobble {
          0%,100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes pop {
          0% { opacity:0; transform: translate(-50%, 6px) scale(0.9); }
          100% { opacity:1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </>
  );
}
