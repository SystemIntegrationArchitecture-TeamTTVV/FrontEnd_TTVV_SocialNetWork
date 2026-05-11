import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useChatBox } from '../../contexts/ChatBoxContext';
import mascotPointSrc from '../../assets/Bot/mascot1.jpg';
import mascotNormalSrc from '../../assets/Bot/mascot2.jpg';
import mascotSmileSrc from '../../assets/Bot/mascot3.jpg';

type Phase = 'idle' | 'dropping' | 'walking' | 'flyingUp' | 'pointing' | 'done';
type MascotEmotion = 'normal' | 'smile' | 'cry';

type GuideFeature = {
  id: string;
  selector: string;
  route?: string;
  labelKey: string;
  titleKey: string;
  messageKey: string;
};

const GUIDE_FEATURES: GuideFeature[] = [
  { id: 'friends', selector: '[data-sidebar-link="/friends"]', route: '/friends', labelKey: 'guideNpc.features.friends', titleKey: 'guideNpc.dialog.friends.title', messageKey: 'guideNpc.dialog.friends.message' },
  { id: 'groups', selector: '[data-sidebar-link="/groups"]', route: '/groups', labelKey: 'guideNpc.features.groups', titleKey: 'guideNpc.dialog.groups.title', messageKey: 'guideNpc.dialog.groups.message' },
  { id: 'marketplace', selector: '[data-sidebar-link="/marketplace"]', route: '/marketplace', labelKey: 'guideNpc.features.marketplace', titleKey: 'guideNpc.dialog.marketplace.title', messageKey: 'guideNpc.dialog.marketplace.message' },
  { id: 'watch', selector: '[data-sidebar-link="/watch"]', route: '/watch', labelKey: 'guideNpc.features.watch', titleKey: 'guideNpc.dialog.watch.title', messageKey: 'guideNpc.dialog.watch.message' },
  { id: 'music', selector: '[data-sidebar-link="/music"]', route: '/music', labelKey: 'guideNpc.features.music', titleKey: 'guideNpc.dialog.music.title', messageKey: 'guideNpc.dialog.music.message' },
  { id: 'games', selector: '[data-sidebar-link="/games"]', route: '/games', labelKey: 'guideNpc.features.games', titleKey: 'guideNpc.dialog.games.title', messageKey: 'guideNpc.dialog.games.message' },
  { id: 'livestream', selector: '[data-sidebar-link="/livestream"]', route: '/livestream', labelKey: 'guideNpc.features.livestream', titleKey: 'guideNpc.dialog.livestream.title', messageKey: 'guideNpc.dialog.livestream.message' },
  { id: 'saved', selector: '[data-sidebar-link="/saved"]', route: '/saved', labelKey: 'guideNpc.features.saved', titleKey: 'guideNpc.dialog.saved.title', messageKey: 'guideNpc.dialog.saved.message' },
];

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
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        const avg = (r + g + b) / 3;
        const isNearWhiteGray = avg > 205 && diff < 20;

        if (isNearWhiteGray) {
          // Remove bright/gray studio background and soften edges
          const alpha = Math.max(0, Math.min(255, (220 - avg) * 8));
          px[i + 3] = alpha;
        }
      }
      ctx.putImageData(data, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export default function FeatureGuideBot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const isMessengerPage = location.pathname.startsWith('/messages') || location.pathname.startsWith('/messenger');
  const { openChatBoxes } = useChatBox();
  const hasChatBoxOpen = openChatBoxes.length > 0;
  const [phase, setPhase] = useState<Phase>('idle');
  const [botPos, setBotPos] = useState({ x: 0, y: 0 });
  const [showBubble, setShowBubble] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [interactionText, setInteractionText] = useState<string | null>(null);
  const [isReacting, setIsReacting] = useState(false);
  const [emotion, setEmotion] = useState<MascotEmotion>('normal');
  const [activeFeature, setActiveFeature] = useState<GuideFeature | null>(null);
  const [mascotNormal, setMascotNormal] = useState(mascotNormalSrc);
  const [mascotPoint, setMascotPoint] = useState(mascotPointSrc);
  const [mascotSmile, setMascotSmile] = useState(mascotSmileSrc);
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const animRef = useRef<number>(0);
  const highlightedElRef = useRef<HTMLElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; ts: number } | null>(null);
  const pokeTimestampsRef = useRef<number[]>([]);

  const storageSuffix = user?.id || 'guest';
  const autoPromptSeenKey = `onboarding:npc:autoPromptSeen:${storageSuffix}`;
  const completedKey = `onboarding:npc:completed:${storageSuffix}`;
  const lastFeatureKey = `onboarding:npc:lastFeature:${storageSuffix}`;

  const clearHighlight = useCallback(() => {
    const target = highlightedElRef.current;
    if (target) {
      target.style.boxShadow = '';
      target.style.borderRadius = '';
    }
    highlightedElRef.current = null;
  }, []);

  const findTargetRect = useCallback((selector: string) => {
    const target = document.querySelector(selector) as HTMLElement | null;
    if (!target) return null;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.style.transition = 'all 0.35s ease';
    target.style.boxShadow = '0 0 0 2px #1877F2, 0 0 16px rgba(24,119,242,0.35)';
    target.style.borderRadius = '12px';
    highlightedElRef.current = target;
    return target.getBoundingClientRect();
  }, []);

  useEffect(() => {
    removeWhiteBg(mascotNormalSrc).then(setMascotNormal);
    removeWhiteBg(mascotPointSrc).then(setMascotPoint);
    removeWhiteBg(mascotSmileSrc).then(setMascotSmile);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const seen = window.localStorage.getItem(autoPromptSeenKey);
    if (!seen) {
      setShowAutoPrompt(true);
      window.localStorage.setItem(autoPromptSeenKey, '1');
    }
  }, [autoPromptSeenKey, user?.id]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const runGuideAnimation = useCallback((rect: DOMRect) => {
    setShowBubble(false);
    setMenuOpen(false);
    setPhase('dropping');

    const floorY = window.innerHeight - 55;
    const startX = window.innerWidth - 120;
    const endX = rect.right + 50;
    setBotPos({ x: startX, y: -50 });

    let t0: number | null = null;
    const drop = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 1000, 1);
      let y: number;
      if (p < 0.6) y = -50 + (floorY + 50) * (p / 0.6) ** 2;
      else if (p < 0.78) y = floorY - Math.sin(((p - 0.6) / 0.18) * Math.PI) * 18;
      else if (p < 0.92) y = floorY - Math.sin(((p - 0.78) / 0.14) * Math.PI) * 6;
      else y = floorY;
      setBotPos({ x: startX, y });
      if (p < 1) animRef.current = requestAnimationFrame(drop);
      else {
        setPhase('walking');
        let t1: number | null = null;
        const walk = (ts2: number) => {
          if (!t1) t1 = ts2;
          const p2 = Math.min((ts2 - t1) / 2200, 1);
          const ease = p2 < 0.5 ? 2 * p2 * p2 : -1 + (4 - 2 * p2) * p2;
          const x = startX + (endX - startX) * ease;
          const stepBounce = Math.abs(Math.sin(p2 * Math.PI * 12)) * 3;
          setBotPos({ x, y: floorY - stepBounce });
          if (p2 < 1) animRef.current = requestAnimationFrame(walk);
          else {
            setPhase('flyingUp');
            let t2: number | null = null;
            const endY = rect.top + rect.height / 2 + 15;
            const flyUp = (ts3: number) => {
              if (!t2) t2 = ts3;
              const p3 = Math.min((ts3 - t2) / 1300, 1);
              const easeUp = p3 < 0.5 ? 2 * p3 * p3 : -1 + (4 - 2 * p3) * p3;
              const y2 = floorY + (endY - floorY) * easeUp;
              const floatX = endX + Math.sin(p3 * Math.PI * 6) * 6 * (1 - p3);
              setBotPos({ x: floatX, y: y2 });
              if (p3 < 1) animRef.current = requestAnimationFrame(flyUp);
              else {
                setPhase('pointing');
                setBotPos({ x: endX, y: endY });
                setTimeout(() => setShowBubble(true), 300);
              }
            };
            animRef.current = requestAnimationFrame(flyUp);
          }
        };
        animRef.current = requestAnimationFrame(walk);
      }
    };
    animRef.current = requestAnimationFrame(drop);
  }, []);

  const triggerReaction = useCallback((mode: 'poke' | 'swipe') => {
    if (mode === 'poke') {
      const now = Date.now();
      const recent = pokeTimestampsRef.current.filter((ts) => now - ts <= 5000);
      recent.push(now);
      pokeTimestampsRef.current = recent;

      const isPain = recent.length >= 3;
      if (isPain) {
        setEmotion('cry');
        setInteractionText(t('guideNpc.interactions.pokeCry', { defaultValue: 'Ui da, nhe tay thoi... minh khoc day :(' }));
      } else {
        setEmotion('smile');
        setInteractionText(t('guideNpc.interactions.pokeSmile', { defaultValue: 'Hehe, chot nhe thi minh cuoi ne!' }));
      }
    } else {
      setEmotion('smile');
      setInteractionText(t('guideNpc.interactions.swipeSmile', { defaultValue: 'Hehe, duoc vuot nen minh vui qua! ^_^' }));
    }
    setIsReacting(true);
    window.setTimeout(() => setIsReacting(false), 500);
    window.setTimeout(() => setEmotion('normal'), 900);
    window.setTimeout(() => setInteractionText(null), 2200);
  }, [t]);

  const startGuide = useCallback((feature: GuideFeature) => {
    if (phase !== 'idle' && phase !== 'done') return;
    const rect = findTargetRect(feature.selector);
    if (!rect) return;
    setActiveFeature(feature);
    window.localStorage.setItem(lastFeatureKey, feature.id);
    setTimeout(() => runGuideAnimation(rect), 300);
  }, [findTargetRect, lastFeatureKey, phase, runGuideAnimation]);

  const dismiss = useCallback(() => {
    setShowBubble(false);
    clearHighlight();
    setEmotion('normal');
    setPhase('done');
    if (activeFeature?.id) {
      const completedMap = JSON.parse(window.localStorage.getItem(completedKey) || '{}') as Record<string, boolean>;
      completedMap[activeFeature.id] = true;
      window.localStorage.setItem(completedKey, JSON.stringify(completedMap));
    }
    const from = { ...botPos };
    let t0: number | null = null;
    const fly = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 500, 1);
      setBotPos({ x: from.x, y: from.y - p * 190 * (1 + p) });
      if (p < 1) animRef.current = requestAnimationFrame(fly);
      else setPhase('idle');
    };
    animRef.current = requestAnimationFrame(fly);
  }, [activeFeature?.id, botPos, clearHighlight, completedKey]);

  useEffect(() => () => {
    cancelAnimationFrame(animRef.current);
    clearHighlight();
  }, [clearHighlight]);

  const active = phase !== 'idle' && phase !== 'done';
  const isWalking = phase === 'walking';
  const isMobile = viewportWidth < 768;
  const desktopPanelRightSide = botPos.x < viewportWidth * 0.42;
  const mascotSrc =
    emotion === 'cry'
      ? mascotPoint
      : emotion === 'smile'
      ? mascotSmile
      : phase === 'pointing'
      ? mascotPoint
      : mascotNormal;

  return (
    <>
      {!isMessengerPage && !hasChatBoxOpen && (phase === 'idle' || phase === 'done') && (
        <div className="fixed bottom-5 right-5 z-60">
          {menuOpen && (
            <div className="mb-2 w-65 rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] shadow-xl p-2.5">
              <p className="text-xs font-semibold text-[#050505] dark:text-[#edf0fa] px-1 pb-2">
                {t('guideNpc.menuTitle', { defaultValue: 'Chon chuc nang can huong dan' })}
              </p>
              <div className="space-y-1">
                {GUIDE_FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => startGuide(feature)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] text-[12px] text-[#050505] dark:text-[#edf0fa] transition-colors"
                  >
                    {t(feature.labelKey, { defaultValue: feature.id })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAutoPrompt && (
            <div className="mb-2 rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] shadow-lg px-3 py-2 text-[11px] text-[#050505] dark:text-[#edf0fa] flex items-start gap-2 w-65">
              <div className="flex-1">
                {t('guideNpc.autoPrompt', { defaultValue: 'Ban moi? Bam mascot de duoc huong dan nhanh tung chuc nang.' })}
              </div>
              <button onClick={() => setShowAutoPrompt(false)} className="mt-0.5">
                <X className="w-3.5 h-3.5 text-[#65676b]" />
              </button>
            </div>
          )}

          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all text-[12px] font-medium text-[#050505] dark:text-[#edf0fa]"
          >
            <span className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
              <Zap className="w-2.5 h-2.5 text-white" fill="white" />
            </span>
            {t('guideNpc.trigger', { defaultValue: 'Huong dan su dung' })}
          </button>
        </div>
      )}

      {active && (
        <div
          className="fixed z-9999 pointer-events-none"
          style={{ left: `${botPos.x}px`, top: `${botPos.y}px`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="pointer-events-auto">
            <div
              role="button"
              tabIndex={0}
              onPointerDown={(e) => {
                pointerStartRef.current = { x: e.clientX, y: e.clientY, ts: Date.now() };
              }}
              onPointerUp={(e) => {
                const start = pointerStartRef.current;
                pointerStartRef.current = null;
                if (!start) return;
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                const dt = Date.now() - start.ts;
                if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy) && dt < 700) {
                  triggerReaction('swipe');
                } else {
                  triggerReaction('poke');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerReaction('poke');
                }
              }}
              className={`relative cursor-pointer ${isWalking ? 'animate-[wobble_0.35s_ease-in-out_infinite]' : ''} ${isReacting ? 'animate-[npcNod_0.55s_ease-out]' : ''}`}
            >
              <img src={mascotSrc} alt="Bot mascot" className="w-16 h-16 object-contain" />
              {phase !== 'flyingUp' && phase !== 'pointing' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-black/10 dark:bg-black/25 rounded-full blur-[1px]" />
              )}
            </div>
          </div>

        </div>
      )}

      {(interactionText || (showBubble && activeFeature)) && (
        <div
          className={`z-10000 w-67.5 pointer-events-auto animate-[fadeInUp_0.2s_ease-out_forwards] ${
            isMobile ? 'fixed right-5 bottom-22' : 'fixed'
          }`}
          style={
            isMobile
              ? undefined
              : desktopPanelRightSide
              ? { left: `${botPos.x + 52}px`, top: `${botPos.y - 70}px` }
              : { left: `${botPos.x - 322}px`, top: `${botPos.y - 70}px` }
          }
        >
          {interactionText && (
            <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-[#1877F2] text-white text-[11px] shadow-lg">
              {interactionText}
            </div>
          )}

          {showBubble && activeFeature && (
            <div className="bg-white dark:bg-[#1a1d28] rounded-xl shadow-lg border border-[#e4e6eb] dark:border-[#2b2f45] px-3 py-2.5">
              <div className="flex items-start gap-1.5">
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-[#050505] dark:text-[#edf0fa]">
                    {t(activeFeature.titleKey, { defaultValue: 'Huong dan nhanh' })}
                  </p>
                  <p className="text-[11px] text-[#65676b] dark:text-[#7e89a6] mt-0.5 leading-relaxed">
                    {t(activeFeature.messageKey, { defaultValue: 'Ban bam vao muc dang duoc to sang de su dung tinh nang nay.' })}
                  </p>
                </div>
                <button onClick={dismiss} className="w-4 h-4 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#22263a] flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-2.5 h-2.5 text-[#65676b]" />
                </button>
              </div>
              <div className="mt-2 flex gap-1.5">
                {activeFeature.route && (
                  <button
                    onClick={() => { dismiss(); window.location.href = activeFeature.route!; }}
                    className="flex-1 py-1 bg-[#1877F2] hover:bg-[#1664d9] text-white text-[11px] font-medium rounded-md transition-colors"
                  >
                    {t('guideNpc.goNow', { defaultValue: 'Di toi ngay' })}
                  </button>
                )}
                <button
                  onClick={dismiss}
                  className="px-2.5 py-1 bg-[#f0f2f5] hover:bg-[#e4e6eb] dark:bg-[#22263a] dark:hover:bg-[#2b2f45] text-[#050505] dark:text-[#edf0fa] text-[11px] font-medium rounded-md transition-colors"
                >
                  {t('guideNpc.gotIt', { defaultValue: 'Da hieu' })}
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
        @keyframes npcNod {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-4deg); }
          50% { transform: translateY(0) rotate(3deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
