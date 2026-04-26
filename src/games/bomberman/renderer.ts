// ─── Bomberman Game — Canvas Renderer ──────────────────────────────────
//
// Performance: Static tiles (walls, floor) are drawn ONCE to an offscreen
// canvas and blitted each frame. Only dynamic entities (players, bombs,
// explosions, power-ups) are redrawn per frame.

import {
  TileType,
  PowerUpType,
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  BOMB_TIMER,
  Direction,
  type GameState,
  type Player,
  type Bomb,
  type Explosion,
  type PowerUp,
} from './engine/types';

const CANVAS_W = MAP_COLS * TILE_SIZE;
const CANVAS_H = MAP_ROWS * TILE_SIZE;

// ─── Offscreen Cache ───────────────────────────────────────────────────

let cachedMapCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
let cachedMapHash = '';

/** Invalidate cache when map changes (block destroyed) */
function getMapHash(map: TileType[][]): string {
  let hash = '';
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      hash += map[r][c];
    }
  }
  return hash;
}

function rebuildStaticCache(map: TileType[][]): void {
  if (typeof OffscreenCanvas !== 'undefined') {
    cachedMapCanvas = new OffscreenCanvas(CANVAS_W, CANVAS_H);
  } else {
    cachedMapCanvas = document.createElement('canvas');
    cachedMapCanvas.width = CANVAS_W;
    cachedMapCanvas.height = CANVAS_H;
  }

  const ctx = cachedMapCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) return;

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const px = col * TILE_SIZE;
      const py = row * TILE_SIZE;
      const tile = map[row][col];
      const alt = (row + col) % 2 === 0;

      drawFloor(ctx as CanvasRenderingContext2D, px, py, alt);

      if (tile === TileType.WALL) {
        drawWall(ctx as CanvasRenderingContext2D, px, py);
      } else if (tile === TileType.BREAKABLE) {
        drawBreakable(ctx as CanvasRenderingContext2D, px, py);
      }
    }
  }

  cachedMapHash = getMapHash(map);
}

// ─── Character Sprite Cache ────────────────────────────────────────────

const spriteCache = new Map<number, HTMLCanvasElement>();
let spritesLoaded = false;

/**
 * Preload character sprites: load each JPG, remove black background
 * by setting near-black pixels to transparent, cache as canvas.
 * Called ONCE at startup. Each sprite is ~48x48 pixels after resize.
 */
export function preloadSprites(imageSources: string[]): Promise<void> {
  if (spritesLoaded) return Promise.resolve();

  const spriteSize = TILE_SIZE; // 48px

  return Promise.all(
    imageSources.map((src, index) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw to offscreen canvas
          const canvas = document.createElement('canvas');
          canvas.width = spriteSize;
          canvas.height = spriteSize;
          const ctx = canvas.getContext('2d')!;

          // Crop: zoom into center-top where the character is
          const srcSize = Math.min(img.width, img.height) * 0.6;
          const srcX = (img.width - srcSize) / 2;
          const srcY = img.height * 0.05;
          ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, spriteSize, spriteSize);

          // Remove black background via pixel manipulation
          const imageData = ctx.getImageData(0, 0, spriteSize, spriteSize);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // If pixel is near-black, make it transparent
            const brightness = r * 0.299 + g * 0.587 + b * 0.114;
            if (brightness < 35) {
              data[i + 3] = 0; // fully transparent
            } else if (brightness < 55) {
              // Semi-transparent edge for smoother blending
              data[i + 3] = Math.floor((brightness - 35) / 20 * 255);
            }
          }
          ctx.putImageData(imageData, 0, 0);

          spriteCache.set(index, canvas);
          resolve();
        };
        img.onerror = () => resolve(); // Fallback: will use canvas-drawn character
        img.src = src;
      });
    }),
  ).then(() => {
    spritesLoaded = true;
  });
}

// ─── Map Color Themes ──────────────────────────────────────────────────

interface MapTheme {
  floor: string;
  floorAlt: string;
  wall: string;
  wallHighlight: string;
  wallShadow: string;
  breakable: string;
  breakableHighlight: string;
  breakableShadow: string;
  breakableCrack: string;
}

const MAP_THEMES: Record<string, MapTheme> = {
  classic: {
    floor: '#2d2d2d', floorAlt: '#333333',
    wall: '#555555', wallHighlight: '#6a6a6a', wallShadow: '#3a3a3a',
    breakable: '#8b6914', breakableHighlight: '#a07818', breakableShadow: '#6d530f', breakableCrack: '#5a4210',
  },
  arena: {
    floor: '#1a2332', floorAlt: '#1e2838',
    wall: '#4a5568', wallHighlight: '#5a6578', wallShadow: '#2d3748',
    breakable: '#c53030', breakableHighlight: '#e53e3e', breakableShadow: '#9b2c2c', breakableCrack: '#742a2a',
  },
  maze: {
    floor: '#1a2e1a', floorAlt: '#1f351f',
    wall: '#2f5b2f', wallHighlight: '#3a7a3a', wallShadow: '#1a3a1a',
    breakable: '#6b4e0a', breakableHighlight: '#7d5c0e', breakableShadow: '#4a3507', breakableCrack: '#3a2a05',
  },
  cross: {
    floor: '#201a2e', floorAlt: '#251f35',
    wall: '#5b2f8b', wallHighlight: '#7a3aaa', wallShadow: '#3a1a5a',
    breakable: '#7b5ea7', breakableHighlight: '#9070bb', breakableShadow: '#5a4080', breakableCrack: '#4a3068',
  },
  fortress: {
    floor: '#2e2a1a', floorAlt: '#353020',
    wall: '#8b7355', wallHighlight: '#a08a6a', wallShadow: '#5a4a35',
    breakable: '#b8860b', breakableHighlight: '#d4a017', breakableShadow: '#8b6508', breakableCrack: '#6b4e06',
  },
};

let activeTheme: MapTheme = MAP_THEMES.classic;

const COLORS = {
  bombBody: '#1a1a1a',
  bombFuse: '#ff6600',
  bombHighlight: '#444444',
  shadow: 'rgba(0,0,0,0.3)',
};

// ─── Tile Drawing (used for offscreen cache) ───────────────────────────

function drawFloor(ctx: CanvasRenderingContext2D, px: number, py: number, alt: boolean): void {
  ctx.fillStyle = alt ? activeTheme.floorAlt : activeTheme.floor;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
}

function drawWall(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const s = TILE_SIZE;
  const inset = 2;

  ctx.fillStyle = activeTheme.wall;
  ctx.fillRect(px, py, s, s);

  ctx.fillStyle = activeTheme.wallHighlight;
  ctx.fillRect(px + inset, py + inset, s - inset * 2, 4);
  ctx.fillRect(px + inset, py + inset, 4, s - inset * 2);

  ctx.fillStyle = activeTheme.wallShadow;
  ctx.fillRect(px + inset, py + s - inset - 4, s - inset * 2, 4);
  ctx.fillRect(px + s - inset - 4, py + inset, 4, s - inset * 2);

  ctx.strokeStyle = activeTheme.wallShadow;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + s / 2, py + inset);
  ctx.lineTo(px + s / 2, py + s - inset);
  ctx.moveTo(px + inset, py + s / 2);
  ctx.lineTo(px + s - inset, py + s / 2);
  ctx.stroke();
}

function drawBreakable(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const s = TILE_SIZE;
  const inset = 1;

  ctx.fillStyle = activeTheme.breakable;
  ctx.fillRect(px + inset, py + inset, s - inset * 2, s - inset * 2);

  ctx.strokeStyle = activeTheme.breakableShadow;
  ctx.lineWidth = 1;

  const brickH = (s - inset * 2) / 3;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(px + inset, py + inset + brickH * i);
    ctx.lineTo(px + s - inset, py + inset + brickH * i);
    ctx.stroke();
  }

  const brickW = (s - inset * 2) / 2;
  for (let row = 0; row < 3; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let i = 1; i < 3; i++) {
      const lx = px + inset + brickW * i - brickW + offset;
      if (lx > px + inset && lx < px + s - inset) {
        ctx.beginPath();
        ctx.moveTo(lx, py + inset + brickH * row);
        ctx.lineTo(lx, py + inset + brickH * (row + 1));
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = activeTheme.breakableHighlight;
  ctx.fillRect(px + inset, py + inset, s - inset * 2, 2);

  ctx.strokeStyle = activeTheme.breakableCrack;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + s * 0.3, py + s * 0.4);
  ctx.lineTo(px + s * 0.45, py + s * 0.55);
  ctx.lineTo(px + s * 0.35, py + s * 0.7);
  ctx.stroke();
}

// ─── Dynamic Entity Drawing ────────────────────────────────────────────

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, now: number): void {
  if (!player.alive) return;

  const cx = player.visualX * TILE_SIZE + TILE_SIZE / 2;
  const cy = player.visualY * TILE_SIZE + TILE_SIZE / 2;
  const baseR = TILE_SIZE * 0.35;
  const spriteSize = TILE_SIZE * 0.9;

  // Movement animation
  const isMoving = player.moving;
  const bouncePhase = isMoving ? Math.sin(player.moveProgress * Math.PI * 2) : 0;
  const bounceY = bouncePhase * -5;
  const scaleX = isMoving ? 1 + Math.sin(player.moveProgress * Math.PI * 2) * 0.08 : 1;
  const scaleY = isMoving ? 1 - Math.sin(player.moveProgress * Math.PI * 2) * 0.08 : 1;

  // Idle bob
  const idleBob = isMoving ? 0 : Math.sin(now * 0.003 + player.id * 1.5) * 1.5;

  // Shadow
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + baseR + 6, baseR * 0.9, baseR * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glow ring for human player
  if (!player.isBot) {
    ctx.save();
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.35 + Math.sin(now * 0.005) * 0.15;
    ctx.beginPath();
    ctx.arc(cx, cy + bounceY + idleBob, baseR + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy + bounceY + idleBob);
  ctx.scale(scaleX, scaleY);

  // Try to draw sprite from cache
  const sprite = spriteCache.get(player.characterIndex);
  if (sprite) {
    // Draw the preprocessed sprite (black bg already removed)
    ctx.drawImage(
      sprite,
      -spriteSize / 2,
      -spriteSize / 2,
      spriteSize,
      spriteSize,
    );
  } else {
    // Fallback: draw a simple colored circle if sprite not loaded
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, baseR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-baseR * 0.2, -baseR * 0.25, baseR * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Label below
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.isBot ? `B${player.id}` : 'YOU', cx, cy + baseR + 16);
}

function drawBomb(ctx: CanvasRenderingContext2D, bomb: Bomb, now: number): void {
  const cx = bomb.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = bomb.y * TILE_SIZE + TILE_SIZE / 2;

  const elapsed = now - bomb.placed;
  const progress = elapsed / BOMB_TIMER;
  const pulse = 1 + Math.sin(progress * Math.PI * 8) * 0.08 * (1 + progress);
  const r = TILE_SIZE * 0.3 * pulse;

  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r + 2, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.bombBody;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.bombHighlight;
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.bombFuse;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + 6, cy - r - 8, cx + 4, cy - r - 12);
  ctx.stroke();

  if (Math.sin(elapsed * 0.02) > 0) {
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(cx + 4, cy - r - 12, 3 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExplosion(ctx: CanvasRenderingContext2D, exp: Explosion): void {
  const cx = exp.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = exp.y * TILE_SIZE + TILE_SIZE / 2;
  const maxR = TILE_SIZE * 0.5;
  const alpha = Math.min(1, exp.timer / 200);

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  gradient.addColorStop(0, `rgba(255,255,200,${alpha})`);
  gradient.addColorStop(0.3, `rgba(255,136,0,${alpha * 0.9})`);
  gradient.addColorStop(0.6, `rgba(255,68,0,${alpha * 0.7})`);
  gradient.addColorStop(1, `rgba(255,0,0,${alpha * 0.2})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(exp.x * TILE_SIZE, exp.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, now: number): void {
  if (!pu.revealed) return;

  const cx = pu.x * TILE_SIZE + TILE_SIZE / 2;
  const cy = pu.y * TILE_SIZE + TILE_SIZE / 2;
  const bounce = Math.sin(now * 0.004) * 2;

  ctx.fillStyle = 'rgba(255,255,100,0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy + bounce, TILE_SIZE * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy + bounce);
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  switch (pu.type) {
    case PowerUpType.BOMB_COUNT:
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('+', 0, -1);
      break;
    case PowerUpType.BOMB_RANGE:
      ctx.fillStyle = '#ff2200';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(8, -4, 5, 4);
      ctx.quadraticCurveTo(0, 0, 0, 10);
      ctx.quadraticCurveTo(0, 0, -5, 4);
      ctx.quadraticCurveTo(-8, -4, 0, -10);
      ctx.fill();
      break;
    case PowerUpType.SPEED:
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(2, -10);
      ctx.lineTo(-4, -1);
      ctx.lineTo(0, -1);
      ctx.lineTo(-2, 10);
      ctx.lineTo(4, 1);
      ctx.lineTo(0, 1);
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
}

// ─── HUD ───────────────────────────────────────────────────────────────

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  const barH = 32;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, CANVAS_H, CANVAS_W, barH);

  ctx.font = '12px monospace';
  ctx.textBaseline = 'middle';

  const spacing = CANVAS_W / state.players.length;

  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    const x = spacing * i + 12;
    const y = CANVAS_H + barH / 2;

    ctx.fillStyle = p.alive ? p.color : '#555555';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.alive ? '#ffffff' : '#666666';
    ctx.textAlign = 'left';
    const label = p.isBot ? `BOT${p.id}` : 'YOU';
    const stats = `${label}  B:${p.maxBombs} R:${p.bombRange} S:${p.speed}`;
    ctx.fillText(stats, x + 10, y);

    if (!p.alive) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText(' [X]', x + 10 + ctx.measureText(stats).width, y);
    }
  }
}

// ─── Main Render ───────────────────────────────────────────────────────

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const now = Date.now();

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H + 32);

  // Set active theme from map ID
  activeTheme = MAP_THEMES[state.mapId] || MAP_THEMES.classic;

  // Rebuild static tile cache only when map changes (block destroyed)
  const currentHash = getMapHash(state.map);
  if (!cachedMapCanvas || cachedMapHash !== currentHash) {
    rebuildStaticCache(state.map);
  }

  // Blit cached static tiles (single drawImage call = instant)
  if (cachedMapCanvas) {
    ctx.drawImage(cachedMapCanvas as CanvasImageSource, 0, 0);
  }

  // Draw only dynamic entities below
  for (const pu of state.powerUps) {
    drawPowerUp(ctx, pu, now);
  }

  for (const bomb of state.bombs) {
    drawBomb(ctx, bomb, now);
  }

  for (const exp of state.explosions) {
    drawExplosion(ctx, exp);
  }

  const sortedPlayers = [...state.players].sort((a, b) => a.visualY - b.visualY);
  for (const player of sortedPlayers) {
    drawPlayer(ctx, player, now);
  }

  drawHUD(ctx, state);
}

/** Force cache invalidation (call on game restart) */
export function invalidateMapCache(): void {
  cachedMapCanvas = null;
  cachedMapHash = '';
}

export { CANVAS_W, CANVAS_H };
