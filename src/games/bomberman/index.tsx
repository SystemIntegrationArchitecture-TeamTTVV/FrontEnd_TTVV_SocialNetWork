// ─── Bomberman Game — React Component ──────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { createGameState, MAP_TEMPLATES } from './engine/map';
import { updateGame, movePlayer, placeBomb } from './engine/game';
import { updateBot, resetBotStates } from './engine/ai';
import { render, invalidateMapCache, preloadSprites, CANVAS_W, CANVAS_H } from './renderer';
import { Direction, CHARACTERS, type GameState } from './engine/types';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createGameState(3));
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const moveTimerRef = useRef<number>(0);

  const [status, setStatus] = useState<GameState['status']>('menu');
  const [winner, setWinner] = useState<number | null>(null);
  const [botCount, setBotCount] = useState(3);
  const [selectedMap, setSelectedMap] = useState('classic');
  const [selectedChar, setSelectedChar] = useState(0);

  // ─── Input Handling ────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());

    const state = stateRef.current;

    if (e.key.toLowerCase() === 'p' && (state.status === 'playing' || state.status === 'paused')) {
      state.status = state.status === 'playing' ? 'paused' : 'playing';
      setStatus(state.status);
      return;
    }

    if (e.key.toLowerCase() === 'r' && state.status === 'gameover') {
      startGame(botCount, selectedMap, selectedChar);
      return;
    }

    if (e.key === ' ' && state.status === 'playing') {
      e.preventDefault();
      placeBomb(state, 0);
    }
  }, [botCount, selectedMap, selectedChar]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  // ─── Movement Processing ───────────────────────────────────────────

  function processMovement(state: GameState, dt: number): void {
    const keys = keysRef.current;
    const MOVE_COOLDOWN = 120;

    moveTimerRef.current += dt;
    if (moveTimerRef.current < MOVE_COOLDOWN) return;

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

  // ─── Game Loop ─────────────────────────────────────────────────────

  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;

    const dt = lastTimeRef.current === 0 ? 16 : Math.min(timestamp - lastTimeRef.current, 50);
    lastTimeRef.current = timestamp;

    const state = stateRef.current;

    if (state.status === 'playing') {
      processMovement(state, dt);

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

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      render(ctx, state);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ─── Game Start ────────────────────────────────────────────────────

  const startGame = useCallback((bots: number, mapId: string, charId: number) => {
    resetBotStates();
    invalidateMapCache();
    stateRef.current = createGameState(bots, mapId, charId);
    stateRef.current.status = 'playing';
    lastTimeRef.current = 0;
    moveTimerRef.current = 0;
    setStatus('playing');
    setWinner(null);
  }, []);

  // ─── Lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    // Preload character sprites (one-time, removes black background)
    preloadSprites(CHARACTER_AVATARS);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleKeyDown, handleKeyUp, gameLoop]);

  // ─── Canvas Scaling ────────────────────────────────────────────────

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      const totalH = CANVAS_H + HUD_HEIGHT;
      const s = Math.min(containerW / CANVAS_W, containerH / totalH, 1.5);
      setScale(Math.max(0.4, s));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center w-full min-h-[calc(100vh-4rem)] bg-[#0a0a0a] select-none">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-3">
        <Link
          to="/games"
          className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back to Games
        </Link>
        <h1 className="text-lg font-bold text-white tracking-tight">BOMBERMAN</h1>
        <div className="text-sm text-gray-500 font-mono">
          {status === 'playing' && 'P: Pause'}
          {status === 'paused' && 'P: Resume'}
          {status === 'gameover' && 'R: Restart'}
        </div>
      </div>

      {/* Game Container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center w-full px-4 pb-4">
        <div className="relative" style={{ width: CANVAS_W * scale, height: (CANVAS_H + HUD_HEIGHT) * scale }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H + HUD_HEIGHT}
            className="block rounded-lg"
            style={{
              width: CANVAS_W * scale,
              height: (CANVAS_H + HUD_HEIGHT) * scale,
              imageRendering: 'pixelated',
            }}
          />

          {/* ─── Menu Overlay ─── */}
          {status === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center bg-black/90 rounded-lg overflow-y-auto py-4 px-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-0.5 tracking-tighter">BOMBERMAN</h2>
              <p className="text-gray-400 text-xs mb-3">Place bombs. Destroy blocks. Survive.</p>

              {/* Character Selection */}
              <div className="w-full max-w-sm mb-3">
                <label className="text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-center">
                  Choose Character
                </label>
                <div className="grid grid-cols-6 gap-1.5 px-2">
                  {CHARACTERS.map((char, i) => (
                    <button
                      key={char.id}
                      onClick={() => setSelectedChar(i)}
                      className={`relative flex flex-col items-center p-1 rounded-lg transition-all ${
                        selectedChar === i
                          ? 'ring-2 bg-white/10'
                          : 'bg-white/5 hover:bg-white/8'
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
                        selectedChar === i ? 'text-white' : 'text-gray-400'
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
                <label className="text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1 text-center">
                  Select Map
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {MAP_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedMap(tmpl.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                        selectedMap === tmpl.id
                          ? 'bg-white/10 ring-1 ring-white/20'
                          : 'bg-white/5 hover:bg-white/8'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tmpl.color }}
                      />
                      <div className="min-w-0 flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          selectedMap === tmpl.id ? 'text-white' : 'text-gray-300'
                        }`}>
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">{tmpl.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Count */}
              <div className="mb-3">
                <label className="text-gray-300 text-[10px] font-semibold uppercase tracking-wider block mb-1 text-center">
                  Opponents
                </label>
                <div className="flex gap-1.5 justify-center">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBotCount(n)}
                      className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                        botCount === n
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start */}
              <button
                onClick={() => startGame(botCount, selectedMap, selectedChar)}
                className="w-44 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-600/25 text-sm"
              >
                START GAME
              </button>

              {/* Controls */}
              <div className="mt-3 text-gray-500 text-[10px] space-y-0 text-center">
                <p>Move: Arrow Keys / WASD | Bomb: Space | Pause: P</p>
              </div>
            </div>
          )}

          {/* ─── Pause Overlay ─── */}
          {status === 'paused' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
              <h2 className="text-3xl font-black text-white mb-4">PAUSED</h2>
              <p className="text-gray-400 text-sm">Press P to resume</p>
            </div>
          )}

          {/* ─── Game Over Overlay ─── */}
          {status === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
              <h2 className="text-3xl font-black text-white mb-2">GAME OVER</h2>
              <p className="text-lg text-gray-300 mb-6">
                {winner !== null
                  ? winner === 0
                    ? 'You Win!'
                    : `Bot ${winner} Wins!`
                  : 'Draw!'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => startGame(botCount, selectedMap, selectedChar)}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all active:scale-95"
                >
                  PLAY AGAIN
                </button>
                <Link
                  to="/games"
                  className="h-11 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all active:scale-95 flex items-center"
                >
                  EXIT
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
