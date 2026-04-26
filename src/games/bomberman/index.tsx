// ─── Boom V2 — React Component ─────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createGameState, MAP_TEMPLATES } from './engine/map';
import { updateGame, movePlayer, placeBomb } from './engine/game';
import { updateBot, resetBotStates } from './engine/ai';
import { render, invalidateMapCache, preloadSprites, getCanvasSize } from './renderer';
import { Direction, CHARACTERS, MAP_SIZES, type GameState } from './engine/types';

// Import character avatars
import nv1 from '../../assets/game/Boom-Mobile-NV-1.jpg';
import nv2 from '../../assets/game/Boom-Mobile-NV-2.jpg';
import nv3 from '../../assets/game/Boom-Mobile-NV-3.jpg';
import nv4 from '../../assets/game/Boom-Mobile-NV-4.jpg';
import nv5 from '../../assets/game/Boom-Mobile-NV-5.jpg';
import nv6 from '../../assets/game/Boom-Mobile-NV-6.jpg';

const CHARACTER_AVATARS = [nv1, nv2, nv3, nv4, nv5, nv6];

const HUD_HEIGHT = 32;

export default function Bomberman() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const stateRef = useRef<GameState>(createGameState(3));
  const keysRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const moveTimerRef = useRef<number>(0);
  const bombQueueRef = useRef(false); // queued bomb placement from keydown

  const [status, setStatus] = useState<GameState['status']>('menu');
  const [winner, setWinner] = useState<number | null>(null);
  const [botCount, setBotCount] = useState(3);
  const [selectedMap, setSelectedMap] = useState('classic');
  const [selectedChar, setSelectedChar] = useState(0);
  const [gameMode, setGameMode] = useState<'bot' | 'friends'>('bot');
  const [selectedSize, setSelectedSize] = useState('small');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameWrapperRef = useRef<HTMLDivElement>(null);

  // ─── Refs for stable closures (avoids stale callback bugs) ─────────
  const botCountRef = useRef(botCount);
  const selectedMapRef = useRef(selectedMap);
  const selectedCharRef = useRef(selectedChar);
  const selectedSizeRef = useRef(selectedSize);
  botCountRef.current = botCount;
  selectedMapRef.current = selectedMap;
  selectedCharRef.current = selectedChar;
  selectedSizeRef.current = selectedSize;

  // ─── Input Handling (all zero-dependency = never swapped) ──────────

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      gameWrapperRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const startGameRef = useRef<(bots: number, mapId: string, charId: number, sizeId?: string) => void>(null!);
  startGameRef.current = useCallback((bots: number, mapId: string, charId: number, sizeId?: string) => {
    resetBotStates();
    invalidateMapCache();
    stateRef.current = createGameState(bots, mapId, charId, sizeId || selectedSizeRef.current);
    stateRef.current.status = 'playing';
    lastTimeRef.current = 0;
    moveTimerRef.current = 0;
    ctxRef.current = null; // force re-acquire context (canvas may have resized)
    keysRef.current.clear();
    setStatus('playing');
    setWinner(null);
  }, []);

  // Stable keydown — NEVER recreated, reads from refs
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keysRef.current.set(key, performance.now()); // timestamp for auto-expiry

    const state = stateRef.current;

    // Prevent browser default for game keys (scrolling, etc.)
    const GAME_KEYS = ['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'p', 'f', 'r'];
    if (GAME_KEYS.includes(key)) {
      e.preventDefault();
    }

    if (key === 'f' && state.status !== 'menu') {
      toggleFullscreen();
      return;
    }

    if (key === 'p' && (state.status === 'playing' || state.status === 'paused')) {
      state.status = state.status === 'playing' ? 'paused' : 'playing';
      setStatus(state.status);
      return;
    }

    if (key === 'r' && state.status === 'gameover') {
      startGameRef.current(
        botCountRef.current,
        selectedMapRef.current,
        selectedCharRef.current,
        selectedSizeRef.current,
      );
      return;
    }

    if (e.key === ' ' && state.status === 'playing') {
      bombQueueRef.current = true;
    }
  }, [toggleFullscreen]); // toggleFullscreen is also stable ([])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  // ─── Game Loop ─────────────────────────────────────────────────────

  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Lazily acquire and cache the 2D context (avoid calling getContext 60fps)
    if (!ctxRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
    }

    try {
      const dt = lastTimeRef.current === 0 ? 16 : Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      const state = stateRef.current;

      if (state.status === 'playing') {
        // ── Inline movement processing (avoids stale closure) ──
        const keys = keysRef.current;
        const MOVE_COOLDOWN = 80;
        const KEY_EXPIRE = 2000;
        const now = performance.now();

        for (const [k, t] of keys) {
          if (now - t > KEY_EXPIRE) keys.delete(k);
        }

        moveTimerRef.current += dt;
        if (moveTimerRef.current >= MOVE_COOLDOWN) {
          let dir: Direction | null = null;
          if (keys.has('arrowup') || keys.has('w')) dir = Direction.UP;
          else if (keys.has('arrowdown') || keys.has('s')) dir = Direction.DOWN;
          else if (keys.has('arrowleft') || keys.has('a')) dir = Direction.LEFT;
          else if (keys.has('arrowright') || keys.has('d')) dir = Direction.RIGHT;

          if (dir !== null) {
            movePlayer(state, 0, dir);
            moveTimerRef.current = 0;
          }
        }

        // ── Bomb placement (queued from keydown or held Space) ──
        if (bombQueueRef.current || keys.has(' ')) {
          placeBomb(state, 0);
          bombQueueRef.current = false;
        }

        // ── Safety: re-sync activeBombs from actual bomb array ──
        // Prevents counter drift from chain reactions or edge cases
        for (const player of state.players) {
          const actual = state.bombs.filter((b) => b.ownerId === player.id).length;
          if (player.activeBombs !== actual) player.activeBombs = actual;
        }

        for (const player of state.players) {
          if (player.isBot && player.alive) {
            updateBot(state, player, dt);
          }
        }

        updateGame(state, dt);

        if (state.status === 'gameover') {
          setStatus('gameover');
          setWinner(state.winner);
        }
      }

      if (ctxRef.current) {
        render(ctxRef.current, state);
      }
    } catch (err) {
      console.error('[Boom V2] Game loop error:', err);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ─── Game Start (public for UI buttons) ────────────────────────────

  const startGame = startGameRef.current;

  // ─── Lifecycle (stable deps = listeners never swapped) ─────────────

  useEffect(() => {
    // Preload character sprites (one-time, removes black background)
    preloadSprites(CHARACTER_AVATARS);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    rafRef.current = requestAnimationFrame(gameLoop);

    // Safety: clear stuck keys AND reset timestamp on focus loss
    const onBlur = () => {
      keysRef.current.clear();
    };
    const onVisChange = () => {
      keysRef.current.clear();
      // Reset time tracking so dt doesn't spike when returning to tab
      lastTimeRef.current = 0;
    };
    // Re-attach listeners on focus as a safety net against lost handlers
    const onFocus = () => {
      keysRef.current.clear();
      lastTimeRef.current = 0;
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisChange);

    // Track fullscreen changes
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisChange);
      document.removeEventListener('fullscreenchange', onFsChange);
      // Clear cached context on unmount
      ctxRef.current = null;
    };
  }, [handleKeyDown, handleKeyUp, gameLoop]);

  // ─── Canvas Scaling ────────────────────────────────────────────────

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Compute canvas dimensions from current game state
  const { w: CANVAS_W, h: CANVAS_H } = getCanvasSize(stateRef.current);

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const { w: cw, h: ch } = getCanvasSize(stateRef.current);
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      const totalH = ch + HUD_HEIGHT;
      const maxScale = isFullscreen ? 10 : 1.5;
      const s = Math.min(containerW / cw, containerH / totalH, maxScale);
      setScale(Math.max(0.3, s));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [status, isFullscreen]);

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div ref={gameWrapperRef} className={`flex flex-col items-center w-full select-none ${
      isFullscreen
        ? 'h-screen bg-black'
        : 'min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-[#0a0a0a]'
    }`}>
      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 py-2">
        <Link
          to="/games"
          className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {t('boom.backToGames')}
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('boom.title')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-500 font-mono">
            {status === 'playing' && t('boom.hintPlaying')}
            {status === 'paused' && t('boom.hintPaused')}
            {status === 'gameover' && t('boom.hintGameover')}
          </span>
          {status !== 'menu' && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              title={isFullscreen ? t('boom.fullscreenExit') : t('boom.fullscreenEnter')}
            >
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Game Container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center w-full px-4 pb-4">
        <div className="relative" style={{ width: CANVAS_W * scale, height: (CANVAS_H + HUD_HEIGHT) * scale }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H + HUD_HEIGHT}
            className="block rounded-lg shadow-lg dark:shadow-none"
            style={{
              width: CANVAS_W * scale,
              height: (CANVAS_H + HUD_HEIGHT) * scale,
              imageRendering: 'pixelated',
            }}
          />

          {/* ─── Menu Overlay ─── */}
          {status === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center bg-white/95 dark:bg-black/90 rounded-lg overflow-y-auto py-4 px-2">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-0.5 tracking-tighter">{t('boom.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">{t('boom.subtitle')}</p>

              {/* Game Mode Selection */}
              <div className="w-full max-w-xs mb-3">
                <label className="text-gray-600 dark:text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-center">
                  {t('boom.gameMode')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setGameMode('bot')}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg transition-all ${
                      gameMode === 'bot'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-500'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                      <circle cx="9" cy="16" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="16" r="1.5" fill="currentColor" />
                      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase">{t('boom.modeBot')}</span>
                  </button>
                  <button
                    onClick={() => setGameMode('friends')}
                    className={`relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg transition-all ${
                      gameMode === 'friends'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-500'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase">{t('boom.modeFriends')}</span>
                  </button>
                </div>
              </div>

              {/* Character Selection */}
              <div className="w-full max-w-sm mb-3">
                <label className="text-gray-600 dark:text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-center">
                  {t('boom.chooseCharacter')}
                </label>
                <div className="grid grid-cols-6 gap-1.5 px-2">
                  {CHARACTERS.map((char, i) => (
                    <button
                      key={char.id}
                      onClick={() => setSelectedChar(i)}
                      className={`relative flex flex-col items-center p-1 rounded-lg transition-all ${
                        selectedChar === i
                          ? 'ring-2 bg-gray-200 dark:bg-white/10'
                          : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8'
                      }`}
                      style={{
                        ringColor: selectedChar === i ? char.color : undefined,
                        borderColor: selectedChar === i ? char.color : 'transparent',
                      }}
                    >
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden"
                        style={{
                          boxShadow: selectedChar === i ? `0 0 12px ${char.color}40` : 'none',
                        }}
                      >
                        <img
                          src={CHARACTER_AVATARS[i]}
                          alt={char.name}
                          className="w-full h-full object-cover object-top"
                          loading="eager"
                          style={{
                            // Crop out the black background by zooming into the character
                            transform: 'scale(1.6)',
                            transformOrigin: '50% 35%',
                          }}
                        />
                      </div>
                      <span className={`text-[9px] mt-0.5 font-bold ${
                        selectedChar === i ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {char.name}
                      </span>
                      {selectedChar === i && (
                        <div
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                          style={{ backgroundColor: char.color }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Selection */}
              <div className="w-full max-w-xs mb-3">
                <label className="text-gray-600 dark:text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1 text-center">
                  {t('boom.selectMap')}
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {MAP_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedMap(tmpl.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                        selectedMap === tmpl.id
                          ? 'bg-gray-200 dark:bg-white/10 ring-1 ring-gray-300 dark:ring-white/20'
                          : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tmpl.color }}
                      />
                      <div className="min-w-0 flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          selectedMap === tmpl.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {t(`boom.maps.${tmpl.id}.name`, { defaultValue: tmpl.name })}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">{t(`boom.maps.${tmpl.id}.desc`, { defaultValue: tmpl.description })}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Size */}
              <div className="w-full max-w-xs mb-3">
                <label className="text-gray-600 dark:text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1 text-center">
                  {t('boom.mapSize')}
                </label>
                <div className="flex gap-1.5 justify-center">
                  {MAP_SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`flex-1 h-9 rounded-lg font-bold text-xs transition-all ${
                        selectedSize === size.id
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {size.label}
                      <span className="block text-[8px] font-normal opacity-70">{size.cols}×{size.rows}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Count — only in bot mode */}
              {gameMode === 'bot' && (
                <div className="mb-3">
                  <label className="text-gray-600 dark:text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1 text-center">
                    {t('boom.opponents')}
                  </label>
                  <div className="flex gap-1.5 justify-center">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setBotCount(n)}
                        className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                          botCount === n
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends Mode — Coming Soon */}
              {gameMode === 'friends' && (
                <div className="mb-3 flex flex-col items-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t('boom.comingSoon')}</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400/70 text-center leading-relaxed whitespace-pre-line">
                    {t('boom.comingSoonDesc')}
                  </p>
                </div>
              )}

              {/* Start */}
              <button
                onClick={() => gameMode === 'bot' && startGame(botCount, selectedMap, selectedChar, selectedSize)}
                disabled={gameMode === 'friends'}
                className={`w-44 h-10 font-bold rounded-lg transition-all active:scale-95 text-sm ${
                  gameMode === 'friends'
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                }`}
              >
                {gameMode === 'friends' ? t('boom.comingSoonBtn') : t('boom.startGame')}
              </button>

              {/* Controls */}
              <div className="mt-3 text-gray-400 dark:text-gray-500 text-[10px] space-y-0 text-center">
                <p>{t('boom.controls')}</p>
              </div>
            </div>
          )}

          {/* ─── Pause Overlay ─── */}
          {status === 'paused' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/70 rounded-lg">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{t('boom.paused')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('boom.pauseHint')}</p>
            </div>
          )}

          {/* ─── Game Over Overlay ─── */}
          {status === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-black/80 rounded-lg">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('boom.gameOver')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                {winner !== null
                  ? winner === 0
                    ? t('boom.youWin')
                    : t('boom.botWins', { id: winner })
                  : t('boom.draw')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => startGame(botCount, selectedMap, selectedChar, selectedSize)}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all active:scale-95"
                >
                  {t('boom.playAgain')}
                </button>
                <Link
                  to="/games"
                  className="h-11 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-all active:scale-95 flex items-center"
                >
                  {t('boom.exit')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
