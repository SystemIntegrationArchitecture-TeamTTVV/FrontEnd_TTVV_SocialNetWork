/** Điểm & thống kê Flappy chỉ lưu local (giải trí, không gọi BE). */
export interface FlappyPersistedStats {
  totalPoints: number;
  highScore: number;
  gamesPlayed: number;
}

const STORAGE_PREFIX = 'ttvv_flappy_v1_';

function key(userId: string | undefined) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

export function loadFlappyStats(userId: string | undefined): FlappyPersistedStats {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { totalPoints: 0, highScore: 0, gamesPlayed: 0 };
    const p = JSON.parse(raw) as Partial<FlappyPersistedStats>;
    return {
      totalPoints: typeof p.totalPoints === 'number' ? p.totalPoints : 0,
      highScore: typeof p.highScore === 'number' ? p.highScore : 0,
      gamesPlayed: typeof p.gamesPlayed === 'number' ? p.gamesPlayed : 0,
    };
  } catch {
    return { totalPoints: 0, highScore: 0, gamesPlayed: 0 };
  }
}

export function saveFlappyStats(userId: string | undefined, stats: FlappyPersistedStats) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(stats));
  } catch {
    /* ignore quota */
  }
}
