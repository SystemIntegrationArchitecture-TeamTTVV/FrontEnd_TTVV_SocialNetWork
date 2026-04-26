// ─── Bomberman Game — Core Engine ──────────────────────────────────────

import {
  TileType,
  Direction,
  DIRECTION_DELTA,
  BOMB_TIMER,
  EXPLOSION_DURATION,
  MAP_COLS,
  MAP_ROWS,
  type GameState,
  type Player,
  type Bomb,
  type Explosion,
  type PowerUp,
  PowerUpType,
} from './types';

// ─── Movement ──────────────────────────────────────────────────────────

/** Check if a grid cell is walkable (empty, no bomb on it) */
function isWalkable(state: GameState, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= MAP_COLS || gy < 0 || gy >= MAP_ROWS) return false;
  const tile = state.map[gy][gx];
  if (tile === TileType.WALL || tile === TileType.BREAKABLE) return false;
  // Cannot walk through bombs
  if (state.bombs.some((b) => b.x === gx && b.y === gy)) return false;
  return true;
}

/** Attempt to move a player in a direction */
export function movePlayer(state: GameState, playerId: number, dir: Direction): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.alive || player.moving) return state;

  const delta = DIRECTION_DELTA[dir];
  const nx = player.x + delta.x;
  const ny = player.y + delta.y;

  // Update direction regardless of movement success
  player.direction = dir;

  if (!isWalkable(state, nx, ny)) return state;

  // Start movement interpolation
  player.x = nx;
  player.y = ny;
  player.moving = true;
  player.moveProgress = 0;

  // Check power-up collection
  collectPowerUp(state, player);

  return state;
}

/** Collect power-up at player position */
function collectPowerUp(state: GameState, player: Player): void {
  const idx = state.powerUps.findIndex(
    (p) => p.x === player.x && p.y === player.y && p.revealed,
  );
  if (idx === -1) return;

  const pu = state.powerUps[idx];
  switch (pu.type) {
    case PowerUpType.BOMB_COUNT:
      player.maxBombs = Math.min(player.maxBombs + 1, 8);
      break;
    case PowerUpType.BOMB_RANGE:
      player.bombRange = Math.min(player.bombRange + 1, 6);
      break;
    case PowerUpType.SPEED:
      player.speed = Math.min(player.speed + 1, 3);
      break;
  }
  state.powerUps.splice(idx, 1);
}

// ─── Bombs ─────────────────────────────────────────────────────────────

/** Place a bomb at the player position */
export function placeBomb(state: GameState, playerId: number): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.alive) return state;
  if (player.activeBombs >= player.maxBombs) return state;

  // Don't place if bomb already exists at this position
  if (state.bombs.some((b) => b.x === player.x && b.y === player.y)) return state;

  state.bombs.push({
    x: player.x,
    y: player.y,
    ownerId: playerId,
    timer: BOMB_TIMER,
    range: player.bombRange,
    placed: Date.now(),
  });
  player.activeBombs++;

  return state;
}

// ─── Explosions ────────────────────────────────────────────────────────

/** Detonate a bomb and create explosion tiles */
function detonateBomb(state: GameState, bomb: Bomb): void {
  // Center explosion
  state.explosions.push({ x: bomb.x, y: bomb.y, timer: EXPLOSION_DURATION });

  // Propagate in 4 directions
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  for (const { dx, dy } of dirs) {
    for (let i = 1; i <= bomb.range; i++) {
      const ex = bomb.x + dx * i;
      const ey = bomb.y + dy * i;

      if (ex < 0 || ex >= MAP_COLS || ey < 0 || ey >= MAP_ROWS) break;

      const tile = state.map[ey][ex];

      // Indestructible wall stops propagation
      if (tile === TileType.WALL) break;

      // Breakable block: destroy it, add explosion, stop propagation
      if (tile === TileType.BREAKABLE) {
        state.map[ey][ex] = TileType.EMPTY;
        state.explosions.push({ x: ex, y: ey, timer: EXPLOSION_DURATION });

        // Reveal hidden power-up
        const pu = state.powerUps.find((p) => p.x === ex && p.y === ey && !p.revealed);
        if (pu) pu.revealed = true;

        break;
      }

      // Empty tile: add explosion and continue
      state.explosions.push({ x: ex, y: ey, timer: EXPLOSION_DURATION });

      // Chain reaction: detonate other bombs caught in blast
      const chainBomb = state.bombs.find((b) => b.x === ex && b.y === ey);
      if (chainBomb) {
        chainBomb.timer = 0;
      }
    }
  }

  // Return bomb slot to owner
  const owner = state.players.find((p) => p.id === bomb.ownerId);
  if (owner) owner.activeBombs = Math.max(0, owner.activeBombs - 1);
}

// ─── Player Elimination ────────────────────────────────────────────────

/** Check if any player is caught in an explosion */
function checkPlayerHits(state: GameState): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    if (state.explosions.some((e) => e.x === player.x && e.y === player.y)) {
      player.alive = false;
    }
  }
}

/** Check win condition — human death = instant game over */
function checkWinCondition(state: GameState): void {
  const human = state.players.find((p) => p.id === 0);

  // Human player died -> game over immediately
  if (human && !human.alive) {
    state.status = 'gameover';
    // Check if any bot is still alive to be the winner
    const aliveBot = state.players.find((p) => p.isBot && p.alive);
    state.winner = aliveBot ? aliveBot.id : null;
    return;
  }

  // All bots eliminated -> human wins
  const aliveBots = state.players.filter((p) => p.isBot && p.alive);
  if (aliveBots.length === 0 && human && human.alive) {
    state.status = 'gameover';
    state.winner = 0;
  }
}

// ─── Main Update Loop ──────────────────────────────────────────────────

/** Update game state by deltaTime (ms) */
export function updateGame(state: GameState, dt: number): GameState {
  if (state.status !== 'playing') return state;

  state.elapsed += dt;

  // Update movement interpolation
  const moveSpeed = 0.008; // base interpolation speed
  for (const player of state.players) {
    if (!player.alive) continue;
    if (player.moving) {
      player.moveProgress += dt * moveSpeed * player.speed;
      if (player.moveProgress >= 1) {
        player.moveProgress = 1;
        player.moving = false;
        player.visualX = player.x;
        player.visualY = player.y;
      } else {
        // Interpolate visual position
        const prevX = player.x - DIRECTION_DELTA[player.direction].x;
        const prevY = player.y - DIRECTION_DELTA[player.direction].y;
        player.visualX = prevX + (player.x - prevX) * player.moveProgress;
        player.visualY = prevY + (player.y - prevY) * player.moveProgress;
      }
    } else {
      player.visualX = player.x;
      player.visualY = player.y;
    }
  }

  // Update bomb timers
  const detonated: Bomb[] = [];
  for (const bomb of state.bombs) {
    bomb.timer -= dt;
    if (bomb.timer <= 0) {
      detonated.push(bomb);
    }
  }

  // Detonate expired bombs
  for (const bomb of detonated) {
    detonateBomb(state, bomb);
  }
  state.bombs = state.bombs.filter((b) => b.timer > 0);

  // Update explosion timers
  for (const exp of state.explosions) {
    exp.timer -= dt;
  }

  // Check player hits BEFORE removing expired explosions
  checkPlayerHits(state);

  // Now remove expired explosions
  state.explosions = state.explosions.filter((e) => e.timer > 0);

  // Check win
  checkWinCondition(state);

  return state;
}

// ─── Utility for AI ────────────────────────────────────────────────────

/** Check if a position is in danger (bomb blast radius) */
export function isPositionDangerous(state: GameState, gx: number, gy: number): boolean {
  // Currently exploding
  if (state.explosions.some((e) => e.x === gx && e.y === gy)) return true;

  // In bomb blast range
  for (const bomb of state.bombs) {
    if (bomb.x === gx && bomb.y === gy) return true;

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (const { dx, dy } of dirs) {
      for (let i = 1; i <= bomb.range; i++) {
        const bx = bomb.x + dx * i;
        const by = bomb.y + dy * i;
        if (bx < 0 || bx >= MAP_COLS || by < 0 || by >= MAP_ROWS) break;
        const tile = state.map[by][bx];
        if (tile === TileType.WALL || tile === TileType.BREAKABLE) break;
        if (bx === gx && by === gy) return true;
      }
    }
  }

  return false;
}

/** Check if a cell can be walked on (no wall, no breakable) */
export function isCellFree(state: GameState, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= MAP_COLS || gy < 0 || gy >= MAP_ROWS) return false;
  return state.map[gy][gx] === TileType.EMPTY;
}
