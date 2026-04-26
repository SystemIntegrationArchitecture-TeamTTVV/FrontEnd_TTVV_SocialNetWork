// ─── Bomberman Game — Map Generator ────────────────────────────────────

import {
  TileType,
  PowerUpType,
  MAP_COLS,
  MAP_ROWS,
  CHARACTERS,
  Direction,
  type Player,
  type PowerUp,
  type GameState,
} from './types';

// ─── Map Templates ─────────────────────────────────────────────────────

export interface MapTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  generate: () => TileType[][];
}

/** Get the 3 cells around each spawn corner that must stay clear */
function getSpawnZones(): { x: number; y: number }[][] {
  return [
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: MAP_COLS - 2, y: 1 }, { x: MAP_COLS - 3, y: 1 }, { x: MAP_COLS - 2, y: 2 }],
    [{ x: 1, y: MAP_ROWS - 2 }, { x: 2, y: MAP_ROWS - 2 }, { x: 1, y: MAP_ROWS - 3 }],
    [{ x: MAP_COLS - 2, y: MAP_ROWS - 2 }, { x: MAP_COLS - 3, y: MAP_ROWS - 2 }, { x: MAP_COLS - 2, y: MAP_ROWS - 3 }],
  ];
}

/** Build clear-set from spawn zones */
function buildClearSet(): Set<string> {
  const clearSet = new Set<string>();
  for (const zone of getSpawnZones()) {
    for (const pos of zone) {
      clearSet.add(`${pos.x},${pos.y}`);
    }
  }
  return clearSet;
}

/** Create empty bordered map with pillar pattern */
function createBaseMap(usePillars: boolean): TileType[][] {
  const map: TileType[][] = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    const line: TileType[] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      if (row === 0 || row === MAP_ROWS - 1 || col === 0 || col === MAP_COLS - 1) {
        line.push(TileType.WALL);
      } else if (usePillars && row % 2 === 0 && col % 2 === 0) {
        line.push(TileType.WALL);
      } else {
        line.push(TileType.EMPTY);
      }
    }
    map.push(line);
  }
  return map;
}

/** Fill breakable blocks at given density, respecting spawn zones */
function fillBreakable(map: TileType[][], density: number): void {
  const clearSet = buildClearSet();
  for (let row = 1; row < MAP_ROWS - 1; row++) {
    for (let col = 1; col < MAP_COLS - 1; col++) {
      if (map[row][col] !== TileType.EMPTY) continue;
      if (clearSet.has(`${col},${row}`)) continue;
      if (Math.random() < density) {
        map[row][col] = TileType.BREAKABLE;
      }
    }
  }
}

// ─── Map 1: Classic ────────────────────────────────────────────────────
function generateClassic(): TileType[][] {
  const map = createBaseMap(true);
  fillBreakable(map, 0.4);
  return map;
}

// ─── Map 2: Arena (open center, walls around edges) ────────────────────
function generateArena(): TileType[][] {
  const map = createBaseMap(false);

  // Ring of walls inside border (2 tiles from edge)
  for (let row = 2; row < MAP_ROWS - 2; row++) {
    for (let col = 2; col < MAP_COLS - 2; col++) {
      if (row === 2 || row === MAP_ROWS - 3 || col === 2 || col === MAP_COLS - 3) {
        // Leave gaps at midpoints for access
        const midCol = Math.floor(MAP_COLS / 2);
        const midRow = Math.floor(MAP_ROWS / 2);
        if (col === midCol || row === midRow) continue;
        map[row][col] = TileType.BREAKABLE;
      }
    }
  }

  // Scattered pillars in center
  for (let row = 4; row < MAP_ROWS - 4; row += 3) {
    for (let col = 4; col < MAP_COLS - 4; col += 3) {
      map[row][col] = TileType.WALL;
    }
  }

  fillBreakable(map, 0.2);
  return map;
}

// ─── Map 3: Maze (dense corridors) ─────────────────────────────────────
function generateMaze(): TileType[][] {
  const map = createBaseMap(true);
  const clearSet = buildClearSet();

  // Extra wall corridors
  for (let row = 1; row < MAP_ROWS - 1; row++) {
    for (let col = 1; col < MAP_COLS - 1; col++) {
      if (map[row][col] !== TileType.EMPTY) continue;
      if (clearSet.has(`${col},${row}`)) continue;

      // Create long horizontal and vertical wall segments
      if (row % 4 === 0 && col > 2 && col < MAP_COLS - 3 && Math.random() < 0.5) {
        map[row][col] = TileType.WALL;
      }
    }
  }

  fillBreakable(map, 0.55);
  return map;
}

// ─── Map 4: Cross (X-shaped open paths) ────────────────────────────────
function generateCross(): TileType[][] {
  const map = createBaseMap(false);
  const midCol = Math.floor(MAP_COLS / 2);
  const midRow = Math.floor(MAP_ROWS / 2);
  const clearSet = buildClearSet();

  // Fill everything as breakable first
  for (let row = 1; row < MAP_ROWS - 1; row++) {
    for (let col = 1; col < MAP_COLS - 1; col++) {
      if (map[row][col] !== TileType.EMPTY) continue;
      if (clearSet.has(`${col},${row}`)) continue;
      map[row][col] = TileType.BREAKABLE;
    }
  }

  // Carve cross paths (horizontal + vertical corridors)
  for (let col = 1; col < MAP_COLS - 1; col++) {
    map[midRow][col] = TileType.EMPTY;
    if (midRow - 1 > 0) map[midRow - 1][col] = TileType.EMPTY;
  }
  for (let row = 1; row < MAP_ROWS - 1; row++) {
    map[row][midCol] = TileType.EMPTY;
    if (midCol - 1 > 0) map[row][midCol - 1] = TileType.EMPTY;
  }

  // Diagonal paths from corners toward center
  for (let i = 0; i < Math.min(midRow, midCol) - 1; i++) {
    const positions = [
      { r: 1 + i, c: 1 + i },
      { r: MAP_ROWS - 2 - i, c: MAP_COLS - 2 - i },
      { r: 1 + i, c: MAP_COLS - 2 - i },
      { r: MAP_ROWS - 2 - i, c: 1 + i },
    ];
    for (const { r, c } of positions) {
      if (r > 0 && r < MAP_ROWS - 1 && c > 0 && c < MAP_COLS - 1) {
        map[r][c] = TileType.EMPTY;
      }
    }
  }

  // Add some pillars for cover
  for (let row = 3; row < MAP_ROWS - 3; row += 4) {
    for (let col = 3; col < MAP_COLS - 3; col += 4) {
      if (row === midRow || col === midCol) continue;
      map[row][col] = TileType.WALL;
    }
  }

  return map;
}

// ─── Map 5: Fortress (rooms connected by corridors) ────────────────────
function generateFortress(): TileType[][] {
  const map = createBaseMap(false);
  const clearSet = buildClearSet();

  // Create 4 "rooms" as wall outlines
  const rooms = [
    { r1: 2, c1: 2, r2: 5, c2: 5 },
    { r1: 2, c1: MAP_COLS - 6, r2: 5, c2: MAP_COLS - 3 },
    { r1: MAP_ROWS - 6, c1: 2, r2: MAP_ROWS - 3, c2: 5 },
    { r1: MAP_ROWS - 6, c1: MAP_COLS - 6, r2: MAP_ROWS - 3, c2: MAP_COLS - 3 },
  ];

  for (const room of rooms) {
    for (let row = room.r1; row <= room.r2; row++) {
      for (let col = room.c1; col <= room.c2; col++) {
        if (row === room.r1 || row === room.r2 || col === room.c1 || col === room.c2) {
          if (!clearSet.has(`${col},${row}`)) {
            map[row][col] = TileType.BREAKABLE;
          }
        }
      }
    }
  }

  // Central pillar cluster
  const midR = Math.floor(MAP_ROWS / 2);
  const midC = Math.floor(MAP_COLS / 2);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      map[midR + dr][midC + dc] = TileType.WALL;
    }
  }

  fillBreakable(map, 0.25);
  return map;
}

// ─── Map Registry ──────────────────────────────────────────────────────

export const MAP_TEMPLATES: MapTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Standard Bomberman grid with pillars',
    color: '#3b82f6',
    generate: generateClassic,
  },
  {
    id: 'arena',
    name: 'Arena',
    description: 'Open center with ring walls',
    color: '#ef4444',
    generate: generateArena,
  },
  {
    id: 'maze',
    name: 'Maze',
    description: 'Dense corridors and tight spaces',
    color: '#22c55e',
    generate: generateMaze,
  },
  {
    id: 'cross',
    name: 'Cross',
    description: 'X-shaped paths from corners to center',
    color: '#a855f7',
    generate: generateCross,
  },
  {
    id: 'fortress',
    name: 'Fortress',
    description: 'Four rooms connected by hallways',
    color: '#eab308',
    generate: generateFortress,
  },
];

// ─── Spawn + Power-ups + State Creation ────────────────────────────────

const SPAWN_POSITIONS = [
  { x: 1, y: 1 },
  { x: MAP_COLS - 2, y: MAP_ROWS - 2 },
  { x: MAP_COLS - 2, y: 1 },
  { x: 1, y: MAP_ROWS - 2 },
];

function generatePowerUps(map: TileType[][]): PowerUp[] {
  const powerUps: PowerUp[] = [];
  const types = [PowerUpType.BOMB_COUNT, PowerUpType.BOMB_RANGE, PowerUpType.SPEED];

  for (let row = 1; row < MAP_ROWS - 1; row++) {
    for (let col = 1; col < MAP_COLS - 1; col++) {
      if (map[row][col] === TileType.BREAKABLE && Math.random() < 0.25) {
        powerUps.push({
          x: col,
          y: row,
          type: types[Math.floor(Math.random() * types.length)],
          revealed: false,
        });
      }
    }
  }

  return powerUps;
}

/** Create the initial game state with a specific map template and character */
export function createGameState(botCount: number, mapId?: string, characterId?: number): GameState {
  const template = MAP_TEMPLATES.find((t) => t.id === mapId) || MAP_TEMPLATES[0];
  const map = template.generate();
  const powerUps = generatePowerUps(map);

  // Human gets selected character, bots get remaining characters
  const humanCharIdx = characterId ?? 0;
  const availableBotChars = CHARACTERS.filter((c) => c.id !== humanCharIdx);
  // Shuffle bot characters
  for (let i = availableBotChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableBotChars[i], availableBotChars[j]] = [availableBotChars[j], availableBotChars[i]];
  }

  const players: Player[] = [];
  for (let i = 0; i <= botCount; i++) {
    const spawn = SPAWN_POSITIONS[i];
    const charDef = i === 0
      ? CHARACTERS[humanCharIdx]
      : availableBotChars[(i - 1) % availableBotChars.length];
    players.push({
      id: i,
      characterIndex: charDef.id,
      x: spawn.x,
      y: spawn.y,
      alive: true,
      maxBombs: 1,
      activeBombs: 0,
      bombRange: 1,
      speed: 1,
      isBot: i > 0,
      color: charDef.color,
      direction: Direction.DOWN,
      visualX: spawn.x,
      visualY: spawn.y,
      moveProgress: 1,
      moving: false,
    });
  }

  return {
    map,
    mapId: template.id,
    players,
    bombs: [],
    explosions: [],
    powerUps,
    status: 'menu',
    winner: null,
    elapsed: 0,
  };
}
