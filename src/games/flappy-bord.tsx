"use client";

import type React from "react";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import "./loading.css";
import { loadFlappyStats, saveFlappyStats } from "./flappyStorage";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

const JUMP_STRENGTH = 8;
const SHIELD_DURATION = 5000; // 5 giây
const BOOST_DURATION = 3000; // 3 giây
const BOOST_SPEED_MULTIPLIER = 1.2; // Tăng sức nhảy
const BOOST_MULTIPLIER = 1.2;
const MAX_COMBO = 5;
const PARTICLE_COUNT = 8;
const MAGNET_RANGE = 80;
/** Kích thước viewport thực (mobile: visualViewport tránh lệch 100vh / thanh địa chỉ) */
function getViewportSize() {
  if (typeof window === "undefined") return { width: 288, height: 512 };
  const vv = window.visualViewport;
  return {
    width: Math.max(1, Math.round(vv?.width ?? window.innerWidth)),
    height: Math.max(1, Math.round(vv?.height ?? window.innerHeight)),
  };
}

const getGameConstants = () => {
  const { width, height } = getViewportSize();

  return {
    GRAVITY: 0.5,
    JUMP_STRENGTH: 5,
    PIPE_WIDTH: Math.max(40, width * 0.06), // Responsive pipe width
    PIPE_GAP: Math.max(120, height * 0.25), // Responsive gap
    PIPE_SPEED: Math.max(2, width * 0.003), // Responsive speed
    BIRD_WIDTH: Math.max(34, width * 0.04),
    BIRD_HEIGHT: Math.max(24, width * 0.03),
    ITEM_WIDTH: Math.max(30, width * 0.035),
    ITEM_HEIGHT: Math.max(30, width * 0.035),
    CANVAS_WIDTH: width,
    CANVAS_HEIGHT: height,
    BIRD_X: width * 0.15,// Bird position từ trái,
    PIPE_SPACING: Math.max(300, width * 0.35),
  };
};

interface Item {
  x: number;
  y: number;
  type: "shield" | "boost";
  collected: boolean;
}
interface Bird {
  y: number;
  velocity: number;
  frame: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

interface GameStats {
  currentScore: number;
  highScore: number;
  totalPoints: number;
  gamesPlayed: number;
  numberOfPlaysAllowed: number;
}
// Thêm vào sau các interface hiện có
interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: number;
  unlocked: boolean;
  progress: number;
  target: number;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  expiresAt: Date;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface PowerUpgrade {
  shieldDuration: number;
  boostPower: number;
  magnetRange: number;
  extraLife: number;
}

interface LeaderboardEntry {
  fullName: string;
  cumulativePoints: number;
  date: string;
}

export default function FlappyBird() {
  const { t } = useTranslation();

  const canvasUiRef = useRef({
    gameOver: "GAME OVER",
    scoreWord: "Score",
    bestWord: "Best",
    restart: "Restart",
    share: "Share",
    save: "Save",
    tapToStart: "Tap to Start",
    jumpMobile: "Tap to jump",
    jumpDesktop: "Press SPACE to jump",
    shieldOn: "Shield!",
    boostOn: "Boost!",
  });

  useEffect(() => {
    const c = canvasUiRef.current;
    c.gameOver = t("minigame.canvas.gameOver");
    c.scoreWord = t("minigame.canvas.score");
    c.bestWord = t("minigame.canvas.best");
    c.restart = t("minigame.canvas.restart");
    c.share = t("minigame.canvas.share");
    c.save = t("minigame.canvas.save");
    c.tapToStart = t("minigame.canvas.tapToStart");
    c.jumpMobile = t("minigame.canvas.jumpMobile");
    c.jumpDesktop = t("minigame.canvas.jumpDesktop");
    c.shieldOn = t("minigame.canvas.shieldOn");
    c.boostOn = t("minigame.canvas.boostOn");
  }, [t]);

  const [showPointsBoard, setShowPointsBoard] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  // Load currentMap from localStorage on mount, default to 0
  const [currentMap, setCurrentMap] = useState(() => {
    try {
      const savedMap = localStorage.getItem("currentMap");
      return savedMap ? parseInt(savedMap, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const [listDiscount, setListDiscount] = useState([])
  const [user, setUser] = useState<any>(null);



  // Game stats
  const [gameStats, setGameStats] = useState<GameStats>({
    currentScore: 0,
    highScore: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    numberOfPlaysAllowed: 999999,
  });
  const [_achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievement, _setShowAchievement] = useState<Achievement | null>(
    null
  );

  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);

  const [combo, setCombo] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [lastScoreTime, setLastScoreTime] = useState(0);
  const [shouldUpdatePoint, setShouldUpdatePoint] = useState(false);


  const [upgrades, setUpgrades] = useState<PowerUpgrade>({
    shieldDuration: 1,
    boostPower: 1,
    magnetRange: 0,
    extraLife: 0,
  });


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let uid: string | undefined;
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        uid = parsedUser.id;
      } catch (error) {
        console.error("❌ Lỗi khi parse user từ localStorage:", error);
      }
    }
    const persisted = loadFlappyStats(uid);
    setGameStats((prev) => ({
      ...prev,
      totalPoints: persisted.totalPoints,
      highScore: persisted.highScore,
      gamesPlayed: persisted.gamesPlayed,
      numberOfPlaysAllowed: 999999,
    }));
  }, []);

  // Save currentMap to localStorage when it changes (chỉ lưu khi thay đổi, không fetch)
  useEffect(() => {
    try {
      localStorage.setItem("currentMap", currentMap.toString());
    } catch (error) {
      console.error("Error saving currentMap to localStorage:", error);
    }
  }, [currentMap]);

  /* Đổi voucher qua BE — tắt cho bản giải trí chỉ UI */
  useEffect(() => {
    setListDiscount([]);
  }, []);



  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [_playerName, _setPlayerName] = useState("");
  const [_showNameInput, setShowNameInput] = useState(false);

  const [seasonalTheme, setSeasonalTheme] = useState("normal");

  // Analytics
  const [_sessionStats, setSessionStats] = useState({
    gamesThisSession: 0,
    totalTimeSpent: 0,
    itemsCollected: 0,
    achievementsUnlocked: 0,
  });
  // Flappy Bird game state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Trạng thái gameplay chỉ nằm trong ref — tránh setState ~60fps làm useEffect game loop restart liên tục → giật */
  const birdRef = useRef<Bird>({ y: 200, velocity: 0, frame: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const gameStatsRef = useRef(gameStats);
  const mapDecorCacheRef = useRef<{
    key: string;
    stars: { x: number; y: number }[];
    snow: { x: number; y: number; size: number }[];
  } | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!shouldUpdatePoint) return;
    const uid = user?.id;
    setGameStats((prev) => {
      const nextHigh = Math.max(prev.highScore, score);
      const next = { ...prev, highScore: nextHigh };
      saveFlappyStats(uid, {
        totalPoints: next.totalPoints,
        highScore: next.highScore,
        gamesPlayed: next.gamesPlayed,
      });
      return next;
    });
    setShouldUpdatePoint(false);
  }, [shouldUpdatePoint, score, user?.id]);

  useLayoutEffect(() => {
    gameStatsRef.current = gameStats;
  }, [gameStats]);

  useLayoutEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const birdSprites = useRef<HTMLImageElement[]>([]);
  const backgroundImage = useRef<HTMLImageElement | null>(null);
  const numberSprites = useRef<HTMLImageElement[]>([]);
  const gameOverImage = useRef<HTMLImageElement | null>(null);
  const messageImage = useRef<HTMLImageElement | null>(null);
  const pipeImage = useRef<HTMLImageElement | null>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  /** Tắt overlay loading sau fade — tránh nhảy layout khi spinner biến mất đột ngột */
  const [loadingOverlayMounted, setLoadingOverlayMounted] = useState(true);
  const [loadingOverlayOpaque, setLoadingOverlayOpaque] = useState(true);
  useEffect(() => {
    if (!assetsLoaded) return;
    setLoadingOverlayOpaque(false);
    const t = window.setTimeout(() => setLoadingOverlayMounted(false), 320);
    return () => window.clearTimeout(t);
  }, [assetsLoaded]);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const pointSound = useRef<HTMLAudioElement | null>(null);
  const hitSound = useRef<HTMLAudioElement | null>(null);
  const wingSound = useRef<HTMLAudioElement | null>(null);
  const [shieldActive, setShieldActive] = useState(false);
  const [boostActive, setBoostActive] = useState(false);

  const boostActiveRef = useRef(false);
  const shieldActiveRef = useRef(false);
  const comboRef = useRef(0);
  const comboMultiplierRef = useRef(1);
  const upgradesRef = useRef(upgrades);
  const seasonalThemeRef = useRef(seasonalTheme);
  const isMobileRef = useRef(false);

  useLayoutEffect(() => {
    boostActiveRef.current = boostActive;
    shieldActiveRef.current = shieldActive;
    comboRef.current = combo;
    comboMultiplierRef.current = comboMultiplier;
    upgradesRef.current = upgrades;
    seasonalThemeRef.current = seasonalTheme;
    isMobileRef.current = isMobile;
  }, [
    boostActive,
    shieldActive,
    combo,
    comboMultiplier,
    upgrades,
    seasonalTheme,
    isMobile,
  ]);

  const shieldImage = useRef<HTMLImageElement | null>(null);
  const boostImage = useRef<HTMLImageElement | null>(null);
  const itemSound = useRef<HTMLAudioElement | null>(null);
  const mapConfigs = [
    {
      name: "Map Ngày",
      bg: "from-sky-400 via-sky-300 to-green-400",
      unlocked: true,
      cost: 0,
    },
    {
      name: "Map Đêm",
      bg: "from-purple-900 via-indigo-800 to-blue-900",
      unlocked: false,
      cost: 100,
    },
    {
      name: "Map Hoàng Hôn",
      bg: "from-orange-400 via-red-400 to-pink-500",
      unlocked: false,
      cost: 200,
    },
    {
      name: "Map Tuyết",
      bg: "from-white via-blue-100 to-gray-300",
      unlocked: false,
      cost: 300,
    },
  ];

  // Cache translated map name (chỉ tính khi currentMap thay đổi)
  const translatedMapName = useMemo(() => {
    const mapName = mapConfigs[currentMap].name;
    // Map name to translation key mapping (direct mapping để đảm bảo khớp)
    const mapKeyMap: Record<string, string> = {
      "Map Ngày": "map_day",
      "Map Đêm": "map_night",
      "Map Hoàng Hôn": "map_sunset",
      "Map Tuyết": "map_snow",
    };
    const mapKey = mapKeyMap[mapName] ?? "map_day";
    return t(`minigame.maps.${mapKey}`, { defaultValue: mapName });
  }, [currentMap, t]);

  // Cache instruction template (chỉ tính khi isMobile thay đổi)
  const instructionTemplate = useMemo(() => {
    return isMobile ? 'minigame.instructions.mobile' : 'minigame.instructions.desktop';
  }, [isMobile]);

  // Cache instruction text (chỉ tính lại khi template hoặc map name thay đổi, score được inject vào)
  const instructionText = useMemo(() => {
    return t(instructionTemplate, { mapName: translatedMapName, score });
  }, [instructionTemplate, translatedMapName, score, t]);

  const getSeasonalTheme = () => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    if (month === 0 || (month === 1 && day <= 15)) return "tet";
    if (month === 1 && day === 14) return "valentine";
    if (month === 9 && day === 31) return "halloween";
    if (month === 11 && day === 25) return "christmas";

    return "normal";
  };

  // Initialize seasonal theme
  useEffect(() => {
    setSeasonalTheme(getSeasonalTheme());
    const savedUpgrades = localStorage.getItem("upgrades");
    if (savedUpgrades) {
      setUpgrades(JSON.parse(savedUpgrades));
    }
  }, []);
  /** Chỉ set kích thước buffer canvas ở đây — không gán width/height trên <canvas> trong JSX (mỗi lần React đổi prop là clear buffer → nhấp nháy/giật khi vào game hoặc khi viewport nhảy). */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let resizeT: ReturnType<typeof setTimeout> | undefined;
    const updateCanvasSize = () => {
      const { width, height } = getViewportSize();
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
    };
    /** Debounce: visualViewport scroll/resize khi thanh địa chỉ ẩn-hiện gây đổi kích thước liên tục → canvas bị reset → giật màn hình */
    const scheduleResize = () => {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(updateCanvasSize, 120);
    };

    updateCanvasSize();
    /** Sau 1–2 frame viewport (thanh URL mobile / visualViewport) mới ổn định — gọi lại để tránh nhảy kích thước lần đầu */
    requestAnimationFrame(() => {
      updateCanvasSize();
      requestAnimationFrame(() => updateCanvasSize());
    });
    window.addEventListener("resize", scheduleResize);
    window.visualViewport?.addEventListener("resize", scheduleResize);
    window.visualViewport?.addEventListener("scroll", scheduleResize);
    return () => {
      if (resizeT) clearTimeout(resizeT);
      window.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("scroll", scheduleResize);
    };
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const unlockMap = (mapIndex: number) => {
    const map = mapConfigs[mapIndex];
    if (gameStats.totalPoints >= map.cost && !map.unlocked) {
      const newCost = gameStats.totalPoints - map.cost;
      setGameStats((prev) => {
        const next = { ...prev, totalPoints: newCost };
        saveFlappyStats(user?.id, {
          totalPoints: next.totalPoints,
          highScore: next.highScore,
          gamesPlayed: next.gamesPlayed,
        });
        return next;
      });
      mapConfigs[mapIndex].unlocked = true;
      setCurrentMap(mapIndex);
      setShowMapSelector(false);
    }
  };

  const redeemVoucher = useCallback(
    (voucher: any, voucherName: string) => {
      if (gameStats.totalPoints >= voucher.point) {
        setGameStats((prev) => {
          const next = { ...prev, totalPoints: prev.totalPoints - voucher.point };
          saveFlappyStats(user?.id, {
            totalPoints: next.totalPoints,
            highScore: next.highScore,
            gamesPlayed: next.gamesPlayed,
          });
          return next;
        });
        alert(t('minigame.pointsBoard.exchangeSuccess', { voucherName }));
      } else {
        alert(t('minigame.pointsBoard.notEnoughPointsToExchange'));
      }
    },
    [user?.id, gameStats.totalPoints, t]
  );


  // useEffect(() => {
  //   const birdUrls = [
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yellowbird-downflap-ZExrg9YxRxwFfLXDu6JijpJUQgByX6.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yellowbird-midflap-8mBrx070GYsw2As4Ue9BfQJ5XNMUg3.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yellowbird-upflap-hMo7jE66Ar0TzdbAMTzTMWaEGpTNx2.png",
  //   ];
  //   const numberUrls = [
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0-n6uJmiEzXXFf0NDHejRxdna8JdqZ9P.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-2s71zdNWUSfnqIUbOABB2QJzzbG7fR.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-QNpaMYRZvP9MgObyqVbxo7wu0MyjYE.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-6yXb5a7IxZyl8kdXXBatpxq48enb2d.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-9beOrHBy4QSBLifUwqaLXqbNWfK4Hr.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-pgAY4wiTYa2Ppho9w3YXtLx3UHryJI.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6-5v6snji9HWY7UpBuqDkKDtck2zED4B.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7-zTxqP8uIOG4OYFtl8x6Dby0mqKfNYo.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8-gkhiN6iBVr2DY7SqrTZIEP7Q3doyo9.png",
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9-PxwOSLzHQAiMeneqctp2q5mzWAv0Kv.png",
  //   ];
  //   const backgroundUrl =
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background-day-rvpnF7CJRMdBNqqBc8Zfzz3QpIfkBG.png";
  //   const gameOverUrl =
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gameover-NwA13AFRtIFat9QoA12T3lpjK76Qza.png";
  //   const messageUrl =
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/message-g1ru4NKF3KrKoFmiVpzR8fwdeLhwNa.png";
  //   const pipeUrl =
  //     "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pipe-green-zrz2zTtoVXaLn6xDqgrNVF9luzjW1B.png";
  //   const shieldUrl =
  //     "https://icons.iconarchive.com/icons/pictogrammers/material-light/128/shield-icon.png"; // Thay bằng URL thật
  //   const boostUrl =
  //     "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyMS41IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTAuOSAzMC41Yy0uMi0uNS0uNC0uOS0uNi0xLjQiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtZGFzaGFycmF5PSIyLjk5IDIuOTkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTkuNSAyNi4zQTE0LjYyIDE0LjYyIDAgMSAxIDM4IDI4IiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMzcuNiAyOS40Yy0uMi41LS40LjktLjYgMS40TTI1LjkgMjRMMjQgMTIuMkwyMi4yIDI0YTEuOCAxLjggMCAwIDAgLjkgMS42YTIuMTIgMi4xMiAwIDAgMCAxLjkgMGExLjg5IDEuODkgMCAwIDAgLjktMS42bS03LjcgOS45aC42di42aC0uNnptMy43IDBoLjZ2LjZoLS42em0zLjYgMGguNnYuNmgtLjZ6bTMuNyAwaC42di42aC0uNnoiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg=="; // Thay bằng URL thật
  //   const loadImage = (url: string) =>
  //     new Promise<HTMLImageElement>((resolve, reject) => {
  //       const img = new Image();
  //       img.onload = () => resolve(img);
  //       img.onerror = reject;
  //       img.src = url;
  //     });

  //   const loadAudio = (url: string) =>
  //     new Promise<HTMLAudioElement>((resolve, reject) => {
  //       const audio = new Audio();
  //       audio.oncanplaythrough = () => resolve(audio);
  //       audio.onerror = reject;
  //       audio.src = url;
  //     });

  //   Promise.all([
  //     ...birdUrls.map(loadImage),
  //     ...numberUrls.map(loadImage),
  //     loadImage(backgroundUrl),
  //     loadImage(gameOverUrl),
  //     loadImage(messageUrl),
  //     loadImage(pipeUrl),
  //     loadImage(shieldUrl),
  //     loadImage(boostUrl),
  //     loadAudio(
  //       "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/point-SdTORahWMlxujnLCoDbujDLHI6KFeC.wav"
  //     ),
  //     loadAudio(
  //       "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hit-YVMFYQJEgZASG6O3xPWiyiqPtOLygb.wav"
  //     ),
  //     loadAudio(
  //       "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wing-oOSsspXpVMDc0enrWj4WWLaHVqs6Hk.wav"
  //     ),
  //   ])
  //     .then((loadedAssets) => {
  //       // birdSprites.current = loadedAssets.slice(0, 3) as HTMLImageElement[]
  //       // numberSprites.current = loadedAssets.slice(3, 13) as HTMLImageElement[]
  //       // backgroundImage.current = loadedAssets[13] as HTMLImageElement
  //       // gameOverImage.current = loadedAssets[14] as HTMLImageElement
  //       // messageImage.current = loadedAssets[15] as HTMLImageElement
  //       // pipeImage.current = loadedAssets[16] as HTMLImageElement
  //       // pointSound.current = loadedAssets[17] as HTMLAudioElement
  //       // hitSound.current = loadedAssets[18] as HTMLAudioElement
  //       // wingSound.current = loadedAssets[19] as HTMLAudioElement
  //       birdSprites.current = loadedAssets.slice(0, 3) as HTMLImageElement[];
  //       numberSprites.current = loadedAssets.slice(3, 13) as HTMLImageElement[];
  //       backgroundImage.current = loadedAssets[13] as HTMLImageElement;
  //       gameOverImage.current = loadedAssets[14] as HTMLImageElement;
  //       messageImage.current = loadedAssets[15] as HTMLImageElement;
  //       pipeImage.current = loadedAssets[16] as HTMLImageElement;
  //       shieldImage.current = loadedAssets[17] as HTMLImageElement;
  //       boostImage.current = loadedAssets[18] as HTMLImageElement;
  //       pointSound.current = loadedAssets[19] as HTMLAudioElement;
  //       hitSound.current = loadedAssets[20] as HTMLAudioElement;
  //       wingSound.current = loadedAssets[21] as HTMLAudioElement;
  //       itemSound.current = loadedAssets[22] as HTMLAudioElement;
  //       setAssetsLoaded(true);
  //       setTimeout(() => setAssetsLoaded(true), 20000);
  //     })
  //     .catch(() => {
  //       // Fallback if assets fail to load
  //       setTimeout(() => setAssetsLoaded(true), 20000);
  //       setAssetsLoaded(true);
  //     });
  // }, []);
  useEffect(() => {
    let cancelled = false;

    const birdUrls = [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yellowbird-downflap-ZExrg9YxRxwFfLXDu6JijpJUQgByX6.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yellowbird-midflap-8mBrx070GYsw2As4Ue9BfQJ5XNMUg3.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yellowbird-upflap-hMo7jE66Ar0TzdbAMTzTMWaEGpTNx2.png",
    ];
    const numberUrls = [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0-n6uJmiEzXXFf0NDHejRxdna8JdqZ9P.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-2s71zdNWUSfnqIUbOABB2QJzzbG7fR.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-QNpaMYRZvP9MgObyqVbxo7wu0MyjYE.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-6yXb5a7IxZyl8kdXXBatpxq48enb2d.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-9beOrHBy4QSBLifUwqaLXqbNWfK4Hr.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-pgAY4wiTYa2Ppho9w3YXtLx3UHryJI.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6-5v6snji9HWY7UpBuqDkKDtck2zED4B.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7-zTxqP8uIOG4OYFtl8x6Dby0mqKfNYo.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8-gkhiN6iBVr2DY7SqrTZIEP7Q3doyo9.png",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9-PxwOSLzHQAiMeneqctp2q5mzWAv0Kv.png",
    ];
    const backgroundUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background-day-rvpnF7CJRMdBNqqBc8Zfzz3QpIfkBG.png";
    const gameOverUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gameover-NwA13AFRtIFat9QoA12T3lpjK76Qza.png";
    const messageUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/message-g1ru4NKF3KrKoFmiVpzR8fwdeLhwNa.png";
    const pipeUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pipe-green-zrz2zTtoVXaLn6xDqgrNVF9luzjW1B.png";
    const shieldUrl =
      "https://icons.iconarchive.com/icons/pictogrammers/material-light/128/shield-icon.png";
    const boostUrl =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyMS41IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTAuOSAzMC41Yy0uMi0uNS0uNC0uOS0uNi0xLjQiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtZGFzaGFycmF5PSIyLjk5IDIuOTkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTkuNSAyNi4zQTE0LjYyIDE0LjYyIDAgMSAxIDM4IDI4IiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMzcuNiAyOS40Yy0uMi41LS40LjktLjYgMS40TTI1LjkgMjRMMjQgMTIuMkwyMi4yIDI0YTEuOCAxLjggMCAwIDAgLjkgMS42YTIuMTIgMi4xMiAwIDAgMCAxLjkgMGExLjg5IDEuODkgMCAwIDAgLjktMS42bS03LjcgOS45aC42di42aC0uNnptMy43IDBoLjZ2LjZoLS42em0zLjYgMGguNnYuNmgtLjZ6bTMuNyAwaC42di42aC0uNnoiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==";

    const loadImage = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    const loadAudio = (url: string) =>
      new Promise<HTMLAudioElement>((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = reject;
        audio.src = url;
      });

    const loadAssets = async () => {
      try {
        const loadedAssets = await Promise.all([
          ...birdUrls.map(loadImage),
          ...numberUrls.map(loadImage),
          loadImage(backgroundUrl),
          loadImage(gameOverUrl),
          loadImage(messageUrl),
          loadImage(pipeUrl),
          loadImage(shieldUrl),
          loadImage(boostUrl),
          loadAudio(
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/point-SdTORahWMlxujnLCoDbujDLHI6KFeC.wav"
          ),
          loadAudio(
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hit-YVMFYQJEgZASG6O3xPWiyiqPtOLygb.wav"
          ),
          loadAudio(
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wing-oOSsspXpVMDc0enrWj4WWLaHVqs6Hk.wav"
          ),
        ]);

        birdSprites.current = loadedAssets.slice(0, 3) as HTMLImageElement[];
        numberSprites.current = loadedAssets.slice(3, 13) as HTMLImageElement[];
        backgroundImage.current = loadedAssets[13] as HTMLImageElement;
        gameOverImage.current = loadedAssets[14] as HTMLImageElement;
        messageImage.current = loadedAssets[15] as HTMLImageElement;
        pipeImage.current = loadedAssets[16] as HTMLImageElement;
        shieldImage.current = loadedAssets[17] as HTMLImageElement;
        boostImage.current = loadedAssets[18] as HTMLImageElement;
        pointSound.current = loadedAssets[19] as HTMLAudioElement;
        hitSound.current = loadedAssets[20] as HTMLAudioElement;
        wingSound.current = loadedAssets[21] as HTMLAudioElement;
        itemSound.current = loadedAssets[22] as HTMLAudioElement;

        if (!cancelled) {
          setAssetsLoaded(true);
        }
      } catch (error) {
        console.error("Error loading assets:", error);
        if (!cancelled) {
          setAssetsLoaded(true);
        }
      }
    };

    loadAssets();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  const playSound = useCallback(
    (sound: HTMLAudioElement | null) => {
      if (sound && !gameOver) {
        sound.currentTime = 0;
        sound.play().catch(() => { });
      }
    },
    [gameOver]
  );
  const achievementDefinitions: Achievement[] = useMemo(
    () => [
      {
        id: "first_score",
        name: t("minigame.achievement.first_score.name"),
        description: t("minigame.achievement.first_score.description"),
        reward: 50,
        unlocked: false,
        progress: 0,
        target: 1,
      },
      {
        id: "score_5",
        name: t("minigame.achievement.score_5.name"),
        description: t("minigame.achievement.score_5.description"),
        reward: 100,
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: "score_10",
        name: t("minigame.achievement.score_10.name"),
        description: t("minigame.achievement.score_10.description"),
        reward: 200,
        unlocked: false,
        progress: 0,
        target: 10,
      },
      {
        id: "score_25",
        name: t("minigame.achievement.score_25.name"),
        description: t("minigame.achievement.score_25.description"),
        reward: 500,
        unlocked: false,
        progress: 0,
        target: 25,
      },
      {
        id: "collector",
        name: t("minigame.achievement.collector.name"),
        description: t("minigame.achievement.collector.description"),
        reward: 150,
        unlocked: false,
        progress: 0,
        target: 10,
      },
      {
        id: "survivor",
        name: t("minigame.achievement.survivor.name"),
        description: t("minigame.achievement.survivor.description"),
        reward: 300,
        unlocked: false,
        progress: 0,
        target: 60,
      },
      {
        id: "combo_master",
        name: t("minigame.achievement.combo_master.name"),
        description: t("minigame.achievement.combo_master.description"),
        reward: 400,
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: "all_maps",
        name: t("minigame.achievement.all_maps.name"),
        description: t("minigame.achievement.all_maps.description"),
        reward: 1000,
        unlocked: false,
        progress: 0,
        target: 4,
      },
    ],
    [t]
  );

  // Initialize achievements - thêm vào useEffect đầu tiên
  useEffect(() => {
    setAchievements(achievementDefinitions);
  }, [achievementDefinitions]);

  // Achievement checker function - thêm sau playSound function
  // const checkAchievements = useCallback((type: string, value: number) => {
  //   setAchievements((prev) => {
  //     const updated = [...prev];
  //     let hasNewAchievement = false;

  //     updated.forEach((achievement) => {
  //       if (achievement.unlocked) return;

  //       let shouldUpdate = false;
  //       let newProgress = achievement.progress;

  //       switch (achievement.id) {
  //         case "first_score":
  //           if (type === "score" && value >= 1) {
  //             newProgress = 1;
  //             shouldUpdate = true;
  //           }
  //           break;
  //         case "score_5":
  //         case "score_10":
  //         case "score_25":
  //           if (type === "score") {
  //             newProgress = Math.min(value, achievement.target);
  //             shouldUpdate = true;
  //           }
  //           break;
  //         case "collector":
  //           if (type === "item") {
  //             newProgress = Math.min(newProgress + 1, achievement.target);
  //             shouldUpdate = true;
  //           }
  //           break;
  //         case "combo_master":
  //           if (type === "combo") {
  //             newProgress = Math.max(newProgress, value);
  //             shouldUpdate = true;
  //           }
  //           break;
  //         case "all_maps":
  //           const unlockedMaps = mapConfigs.filter(
  //             (map) => map.unlocked
  //           ).length;
  //           newProgress = unlockedMaps;
  //           shouldUpdate = true;
  //           break;
  //       }

  //       if (shouldUpdate) {
  //         achievement.progress = newProgress;
  //         if (newProgress >= achievement.target && !achievement.unlocked) {
  //           achievement.unlocked = true;
  //           hasNewAchievement = true;
  //           setShowAchievement(achievement);
  //           setGameStats((prev) => ({
  //             ...prev,
  //             totalPoints: prev.totalPoints + achievement.reward,
  //           }));

  //           setTimeout(
  //             () => setShowAchievement(null),
  //             ACHIEVEMENT_DISPLAY_TIME
  //           );
  //         }
  //       }
  //     });

  //     return updated;
  //   });
  // }, []);
  // Daily challenges - thêm sau achievementDefinitions
  const generateDailyChallenges = (): Challenge[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const challengeTemplates = [
      {
        id: "daily_score_5",
        name: "Điểm Số Cơ Bản",
        description: "Đạt 5 điểm trong 1 lần chơi",
        target: 5,
        reward: 100,
      },
      {
        id: "daily_survive_30",
        name: "Sống Sót",
        description: "Sống sót 30 giây",
        target: 30,
        reward: 150,
      },
      {
        id: "daily_collect_3",
        name: "Thu Thập",
        description: "Nhặt 3 vật phẩm",
        target: 3,
        reward: 120,
      },
      {
        id: "daily_no_shield",
        name: "Thử Thách Khó",
        description: "Đạt 3 điểm không dùng shield",
        target: 3,
        reward: 200,
      },
      {
        id: "daily_combo_3",
        name: "Combo Streak",
        description: "Đạt combo x3",
        target: 3,
        reward: 180,
      },
    ];

    // Chọn 3 thử thách ngẫu nhiên cho ngày hôm nay
    const shuffled = [...challengeTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    return selected.map((template) => ({
      ...template,
      progress: 0,
      completed: false,
      expiresAt: tomorrow,
    }));
  };

  // Initialize daily challenges - thêm vào useEffect đầu tiên
  useEffect(() => {
    const stored = localStorage.getItem("dailyChallenges");
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = new Date();
      // Kiểm tra xem challenges có hết hạn chưa
      if (new Date(parsed[0]?.expiresAt) > now) {
        setDailyChallenges(parsed);
      } else {
        const newChallenges = generateDailyChallenges();
        setDailyChallenges(newChallenges);
        localStorage.setItem("dailyChallenges", JSON.stringify(newChallenges));
      }
    } else {
      const newChallenges = generateDailyChallenges();
      setDailyChallenges(newChallenges);
      localStorage.setItem("dailyChallenges", JSON.stringify(newChallenges));
    }
  }, []);

  // Challenge progress tracker - thêm sau checkAchievements
  const updateChallengeProgress = useCallback((type: string, value: number) => {
    setDailyChallenges((prev) => {
      const updated = prev.map((challenge) => {
        if (challenge.completed) return challenge;

        let shouldUpdate = false;
        let newProgress = challenge.progress;

        switch (challenge.id) {
          case "daily_score_5":
            if (type === "score" && value >= 5) {
              newProgress = 5;
              shouldUpdate = true;
            }
            break;
          case "daily_survive_30":
            if (type === "survival") {
              newProgress = Math.min(value, 30);
              shouldUpdate = true;
            }
            break;
          case "daily_collect_3":
            if (type === "item") {
              newProgress = Math.min(newProgress + 1, 3);
              shouldUpdate = true;
            }
            break;
          case "daily_combo_3":
            if (type === "combo") {
              newProgress = Math.max(newProgress, value);
              shouldUpdate = true;
            }
            break;
        }

        if (shouldUpdate) {
          const updated = { ...challenge, progress: newProgress };
          if (newProgress >= challenge.target && !challenge.completed) {
            updated.completed = true;
            setGameStats((prev) => ({
              ...prev,
              totalPoints: prev.totalPoints,
            }));
          }
          return updated;
        }

        return challenge;
      });

      localStorage.setItem("dailyChallenges", JSON.stringify(updated));
      return updated;
    });
  }, []);
  // Survival time tracker - thêm vào game loop
  const [gameStartTime, setGameStartTime] = useState(0);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      setGameStartTime(Date.now());
    }
  }, [gameStarted]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const interval = setInterval(() => {
        const survivalTime = Math.floor((Date.now() - gameStartTime) / 1000);
        // checkAchievements("survival", survivalTime);
        updateChallengeProgress("survival", survivalTime);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameStarted, gameOver, gameStartTime]);
  const jump = useCallback(() => {
    if (!gameOver && gameStarted && !isPaused) {
      const jumpStrength = boostActive
        ? JUMP_STRENGTH * BOOST_MULTIPLIER
        : JUMP_STRENGTH;
      birdRef.current = {
        ...birdRef.current,
        velocity: -jumpStrength,
      };
      playSound(wingSound.current);
    } else if (!gameStarted) {
      setGameStarted(true);
      birdRef.current = {
        ...birdRef.current,
        velocity: -JUMP_STRENGTH,
      };
      playSound(wingSound.current);
    }
  }, [gameOver, gameStarted, isPaused, boostActive, playSound]);
  const createParticles = useCallback(
    (x: number, y: number, color: string, count: number = PARTICLE_COUNT) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 2 + Math.random() * 3;
        newParticles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 30 + Math.random() * 20,
          maxLife: 50,
          color,
          size: 2 + Math.random() * 3,
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles];
    },
    []
  );

  // Update particles - thêm vào game loop (trong useEffect chính)
  const updateParticles = () => {
    particlesRef.current = particlesRef.current
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98,
        life: particle.life - 1,
      }))
      .filter((particle) => particle.life > 0);
  };

  // Draw particles - thêm vào phần render trong game loop
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };
  const updateCombo = useCallback(() => {
    const now = Date.now();
    if (now - lastScoreTime < 2000) {
      // 2 giây để duy trì combo
      setCombo((prev) => Math.min(prev + 1, MAX_COMBO));
    } else {
      setCombo(0);
    }
    setLastScoreTime(now);

    // Tính combo multiplier
    setComboMultiplier(1 + combo * 0.2); // Mỗi combo +20% điểm
  }, [lastScoreTime, combo]);

  const updateComboRef = useRef(updateCombo);
  useLayoutEffect(() => {
    updateComboRef.current = updateCombo;
  }, [updateCombo]);

  // Thêm vào chỗ score update trong game loop (thay thế logic ghi điểm cũ)

  const restartGame = useCallback(() => {
    setGameStats((prev) => {
      const next = {
        ...prev,
        currentScore: 0,
        highScore: Math.max(prev.highScore, score),
        totalPoints: prev.totalPoints,
        gamesPlayed: prev.gamesPlayed + 1,
      };
      saveFlappyStats(user?.id, {
        totalPoints: next.totalPoints,
        highScore: next.highScore,
        gamesPlayed: next.gamesPlayed,
      });
      return next;
    });

    birdRef.current = { y: 200, velocity: 0, frame: 0 };
    pipesRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    setGameKey((prev) => prev + 1);
  }, [score, user?.id]);
  const shareScore = useCallback(() => {
    const shareText = t("minigame.share.body", { score });
    const title = t("minigame.share.title");

    if (navigator.share) {
      navigator
        .share({
          title,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => { });
    } else {
      navigator.clipboard
        .writeText(`${shareText} ${window.location.href}`)
        .then(() => alert(t("minigame.share.copied")))
        .catch(() => { });
    }
  }, [score, t]);

  // Save to leaderboard
  // const saveToLeaderboard = useCallback(
  //   (playerName: string, finalScore: number) => {
  //     const newEntry = {
  //       fullName: playerName,
  //       cumulativePoints: finalScore,
  //       date: new Date().toISOString(),
  //     };

  //     setLeaderboard((prev) => {
  //       const updated = [...prev, newEntry]
  //         .sort((a, b) => b.cumulativePoints - a.cumulativePoints)
  //         .slice(0, 20);

  //       localStorage.setItem("leaderboard", JSON.stringify(updated));
  //       return updated;
  //     });
  //   },
  //   []
  // );

  useEffect(() => {
    if (!showLeaderboard) return;
    const uid = user?.id;
    const stats = loadFlappyStats(uid);
    const name =
      user?.fullName || user?.username || user?.name || "Guest";
    setLeaderboard([
      {
        fullName: name,
        cumulativePoints: stats.highScore,
        date: "",
      },
    ]);
  }, [showLeaderboard, user]);
  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        handlePause();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [jump]);

  // Handle touch events for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Khi thua, nút Restart/Share trên canvas chỉ xử lý qua onClick. preventDefault ở đây
      // chặn synthetic click trên iOS/Android → không bấm được Restart.
      if (gameOver) return;
      e.preventDefault();
      jump();
    };

    if (isMobile) {
      document.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      return () => document.removeEventListener("touchstart", handleTouchStart);
    }
  }, [jump, isMobile, gameOver]);

  // Main game loop — requestAnimationFrame + giới hạn ~60fps (tránh màn 120Hz chạy gấp đôi logic mỗi giây)
  useEffect(() => {
    if (!assetsLoaded || isPaused) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let rafId = 0;
    let lastTick = 0;
    const FRAME_MS = 1000 / 60;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (typeof document !== "undefined" && document.hidden) return;
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;
      const CONSTANTS = getGameConstants();
      // Clear canvas
      ctx.clearRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
      updateParticles();
      if (gameOver) {
        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        if (gameOverImage.current) {
          const gameOverWidth = 192;
          const gameOverHeight = 42;
          const gameOverX = (CONSTANTS.CANVAS_WIDTH - gameOverWidth) / 2;
          const gameOverY = (CONSTANTS.CANVAS_HEIGHT - gameOverHeight) / 2 - 50;
          ctx.drawImage(
            gameOverImage.current,
            gameOverX,
            gameOverY,
            gameOverWidth,
            gameOverHeight
          );
        } else {
          ctx.fillStyle = "white";
          ctx.font = "32px Arial";
          ctx.textAlign = "center";
          ctx.fillText(canvasUiRef.current.gameOver, CONSTANTS.CANVAS_WIDTH / 2, CONSTANTS.CANVAS_HEIGHT / 2 - 50);
        }

        // Score display
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText(
          `${canvasUiRef.current.scoreWord}: ${scoreRef.current}`,
          CONSTANTS.CANVAS_WIDTH / 2,
          CONSTANTS.CANVAS_HEIGHT / 2
        );
        ctx.fillText(
          `${canvasUiRef.current.bestWord}: ${Math.max(gameStatsRef.current.highScore, scoreRef.current)}`,
          CONSTANTS.CANVAS_WIDTH / 2,
          CONSTANTS.CANVAS_HEIGHT / 2 + 25
        );

        // Restart button
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(CONSTANTS.CANVAS_WIDTH / 2 - 50, CONSTANTS.CANVAS_HEIGHT / 2 + 50, 100, 40);
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(canvasUiRef.current.restart, CONSTANTS.CANVAS_WIDTH / 2, CONSTANTS.CANVAS_HEIGHT / 2 + 75);

        return; // Dừng vòng lặp ở đây, không update nữa
      }

      // Draw background based on current map with enhanced visuals
      const decorKey = `${CONSTANTS.CANVAS_WIDTH}x${CONSTANTS.CANVAS_HEIGHT}`;
      let mapDecor = mapDecorCacheRef.current;
      if (!mapDecor || mapDecor.key !== decorKey) {
        mapDecor = {
          key: decorKey,
          stars: Array.from({ length: 20 }, () => ({
            x: Math.random() * CONSTANTS.CANVAS_WIDTH,
            y: Math.random() * (CONSTANTS.CANVAS_HEIGHT * 0.6),
          })),
          snow: Array.from({ length: 30 }, () => ({
            x: Math.random() * CONSTANTS.CANVAS_WIDTH,
            y: Math.random() * CONSTANTS.CANVAS_HEIGHT,
            size: Math.random() * 3 + 1,
          })),
        };
        mapDecorCacheRef.current = mapDecor;
      }

      if (currentMap === 0) {
        // Day Map
        const gradient = ctx.createLinearGradient(0, 0, 0, CONSTANTS.CANVAS_HEIGHT);
        gradient.addColorStop(0, "#87CEEB"); // Sky blue
        gradient.addColorStop(0.7, "#98FB98"); // Light green
        gradient.addColorStop(1, "#90EE90"); // Darker green
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // Add clouds
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(CONSTANTS.CANVAS_WIDTH * 0.17, 80, 25, 0, Math.PI * 2);
        ctx.arc(CONSTANTS.CANVAS_WIDTH * 0.28, 80, 35, 0, Math.PI * 2);
        ctx.arc(CONSTANTS.CANVAS_WIDTH * 0.38, 80, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(CONSTANTS.CANVAS_WIDTH * 0.69, 120, 20, 0, Math.PI * 2);
        ctx.arc(CONSTANTS.CANVAS_WIDTH * 0.76, 120, 30, 0, Math.PI * 2);
        ctx.arc(CONSTANTS.CANVAS_WIDTH * 0.87, 120, 20, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMap === 1) {
        // Night Map
        const gradient = ctx.createLinearGradient(0, 0, 0, CONSTANTS.CANVAS_HEIGHT);
        gradient.addColorStop(0, "#1e1b4b"); // Dark purple
        gradient.addColorStop(0.5, "#1e3a8a"); // Dark blue
        gradient.addColorStop(1, "#000000"); // Black
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // Add stars (vị trí cố định theo kích thước canvas — tránh nhấp nháy mỗi frame)
        ctx.fillStyle = "white";
        for (const s of mapDecor.stars) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Add moon
        ctx.fillStyle = "#FFF8DC";
        ctx.beginPath();
        ctx.arc(CONSTANTS.CANVAS_WIDTH - 60, 60, 25, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMap === 2) {
        // Sunset Map
        const gradient = ctx.createLinearGradient(0, 0, 0, CONSTANTS.CANVAS_HEIGHT);
        gradient.addColorStop(0, "#fb923c"); // Orange
        gradient.addColorStop(0.4, "#f97316"); // Deeper orange
        gradient.addColorStop(0.7, "#dc2626"); // Red
        gradient.addColorStop(1, "#7c2d12"); // Dark red
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // Add sun
        ctx.fillStyle = "#FFA500";
        ctx.beginPath();
        ctx.arc(CONSTANTS.CANVAS_WIDTH - 50, CONSTANTS.CANVAS_HEIGHT - 100, 30, 0, Math.PI * 2);
        ctx.fill();

        // Add sun rays
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const startX = CONSTANTS.CANVAS_WIDTH - 50 + Math.cos(angle) * 35;
          const startY = CONSTANTS.CANVAS_HEIGHT - 100 + Math.sin(angle) * 35;
          const endX = CONSTANTS.CANVAS_WIDTH - 50 + Math.cos(angle) * 50;
          const endY = CONSTANTS.CANVAS_HEIGHT - 100 + Math.sin(angle) * 50;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      } else {
        // Snow Map
        const gradient = ctx.createLinearGradient(0, 0, 0, CONSTANTS.CANVAS_HEIGHT);
        gradient.addColorStop(0, "#f8fafc"); // Light gray
        gradient.addColorStop(0.5, "#e2e8f0"); // Gray
        gradient.addColorStop(1, "#cbd5e1"); // Darker gray
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // Add snowflakes
        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;

        for (const flake of mapDecor.snow) {
          const { x, y, size } = flake;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          if (size > 2.2) {
            ctx.beginPath();
            ctx.moveTo(x - size * 2, y);
            ctx.lineTo(x + size * 2, y);
            ctx.moveTo(x, y - size * 2);
            ctx.lineTo(x, y + size * 2);
            ctx.stroke();
          }
        }
      }
      // Seasonal effects - thêm sau phần vẽ background map
      const drawSeasonalEffects = (
        ctx: CanvasRenderingContext2D,
        _canvas: HTMLCanvasElement
      ) => {
        switch (seasonalThemeRef.current) {
          case "tet":
            // Red lanterns
            ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
            for (let i = 0; i < 3; i++) {
              const x = 80 + i * 120;
              const y = 60;
              ctx.beginPath();
              ctx.arc(x, y, 12, 0, Math.PI * 2);
              ctx.fill();
            }
            break;

          case "valentine":
            // Hearts
            ctx.fillStyle = "rgba(255, 192, 203, 0.7)";
            ctx.font = "16px Arial";
            for (let i = 0; i < 5; i++) {
              const x = Math.random() * CONSTANTS.CANVAS_WIDTH;
              const y = Math.random() * CONSTANTS.CANVAS_HEIGHT * 0.6;
              ctx.fillText("❤️", x, y);
            }
            break;

          case "christmas":
            // Extra snow
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            for (let i = 0; i < 10; i++) {
              const x = Math.random() * CONSTANTS.CANVAS_WIDTH;
              const y = Math.random() * CONSTANTS.CANVAS_HEIGHT;
              ctx.beginPath();
              ctx.arc(x, y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
            break;

          case "halloween":
            // Spooky bats
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            for (let i = 0; i < 4; i++) {
              const x = Math.random() * CONSTANTS.CANVAS_WIDTH;
              const y = Math.random() * CONSTANTS.CANVAS_HEIGHT * 0.4;
              ctx.font = "16px Arial";
              ctx.fillText("🦇", x, y);
            }
            break;
        }
      };

      // Gọi function này ngay sau đó
      drawSeasonalEffects(ctx, canvas);
      // Overlay original background with reduced opacity for texture
      if (backgroundImage.current) {
        ctx.globalAlpha = 0.15;
        ctx.drawImage(
          backgroundImage.current,
          0,
          0,
          CONSTANTS.CANVAS_WIDTH,
          CONSTANTS.CANVAS_HEIGHT
        );
        ctx.globalAlpha = 1.0;
      }

      if (!gameStarted) {
        // Draw message
        if (messageImage.current) {
          const messageWidth = 184;
          const messageHeight = 267;
          const messageX = (CONSTANTS.CANVAS_WIDTH - messageWidth) / 2;
          const messageY = (CONSTANTS.CANVAS_HEIGHT - messageHeight) / 2;
          ctx.drawImage(
            messageImage.current,
            messageX,
            messageY,
            messageWidth,
            messageHeight
          );
        } else {
          // Fallback text
          ctx.fillStyle = "white";
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.fillText(canvasUiRef.current.tapToStart, CONSTANTS.CANVAS_WIDTH / 2, CONSTANTS.CANVAS_HEIGHT / 2);
          ctx.font = "16px Arial";
          ctx.fillText(
            isMobileRef.current
              ? canvasUiRef.current.jumpMobile
              : canvasUiRef.current.jumpDesktop,
            CONSTANTS.CANVAS_WIDTH / 2,
            CONSTANTS.CANVAS_HEIGHT / 2 + 40
          );
        }

        // Draw bird in starting position
        if (birdSprites.current.length > 0) {
          ctx.save();
          ctx.translate(
            CONSTANTS.BIRD_X + CONSTANTS.BIRD_WIDTH / 2,
            birdRef.current.y + CONSTANTS.BIRD_HEIGHT / 2
          );
          ctx.drawImage(
            birdSprites.current[Math.floor(Date.now() / 200) % 3],
            -CONSTANTS.BIRD_WIDTH / 2,
            -CONSTANTS.BIRD_HEIGHT / 2,
            CONSTANTS.BIRD_WIDTH,
            CONSTANTS.BIRD_HEIGHT
          );
          ctx.restore();
        }
        return;
      }

      // Tính toán tốc độ dựa trên boost
      const dynamicSpeedIncrease = Math.floor(scoreRef.current / 5) * 0.3;
      const currentSpeed = boostActiveRef.current
        ? (CONSTANTS.PIPE_SPEED + dynamicSpeedIncrease) * BOOST_SPEED_MULTIPLIER
        : CONSTANTS.PIPE_SPEED + dynamicSpeedIncrease;
      const currentGravity = boostActiveRef.current
        ? CONSTANTS.GRAVITY * BOOST_SPEED_MULTIPLIER
        : CONSTANTS.GRAVITY;

      // Update bird physics (ref — cùng tick với va chạm, không chờ React render)
      {
        const prev = birdRef.current;
        const newY = prev.y + prev.velocity;
        const newVelocity = prev.velocity + currentGravity;
        const newFrame = (prev.frame + 1) % 3;
        birdRef.current = {
          y: newY,
          velocity: newVelocity,
          frame: newFrame,
        };
      }

      let newPipes = pipesRef.current.map((pipe) => ({
        ...pipe,
        x: pipe.x - currentSpeed,
      }));
      if (
        newPipes.length === 0 ||
        newPipes[newPipes.length - 1].x < CONSTANTS.CANVAS_WIDTH - CONSTANTS.PIPE_SPACING
      ) {
        const topHeight =
          Math.random() * (CONSTANTS.CANVAS_HEIGHT - CONSTANTS.PIPE_GAP - 200) + 50;
        newPipes.push({ x: CONSTANTS.CANVAS_WIDTH, topHeight, passed: false });
      }
      newPipes = newPipes.filter((pipe) => pipe.x + CONSTANTS.PIPE_WIDTH > 0);
      pipesRef.current = newPipes;

      let newItemsMove = itemsRef.current.map((item) => ({
        ...item,
        x: item.x - currentSpeed,
      }));
      if (Math.random() < 0.01 && newItemsMove.length < 2) {
        const y = Math.random() * (CONSTANTS.CANVAS_HEIGHT - CONSTANTS.ITEM_HEIGHT - 100) + 50;
        const type = Math.random() > 0.5 ? "shield" : "boost";
        newItemsMove.push({
          x: CONSTANTS.CANVAS_WIDTH,
          y,
          type,
          collected: false,
        });
      }
      newItemsMove = newItemsMove.filter(
        (item) => item.x + CONSTANTS.ITEM_WIDTH > 0 && !item.collected
      );
      itemsRef.current = newItemsMove;

      const bird = birdRef.current;
      const birdRect = {
        x: CONSTANTS.BIRD_X,
        y: bird.y,
        width: CONSTANTS.BIRD_WIDTH,
        height: CONSTANTS.BIRD_HEIGHT,
      };

      if (upgradesRef.current.magnetRange > 0) {
        itemsRef.current = itemsRef.current.map((item) => {
          if (item.collected) return item;

          const dx =
            CONSTANTS.BIRD_X + CONSTANTS.BIRD_WIDTH / 2 - (item.x + CONSTANTS.ITEM_WIDTH / 2);
          const dy =
            bird.y + CONSTANTS.BIRD_HEIGHT / 2 - (item.y + CONSTANTS.ITEM_HEIGHT / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MAGNET_RANGE * upgradesRef.current.magnetRange) {
            const pullForce = 0.3;
            return {
              ...item,
              x: item.x + (dx * pullForce) / distance,
              y: item.y + (dy * pullForce) / distance,
            };
          }

          return item;
        });
      }

      {
        const prevItems = itemsRef.current;
        const newItems = [...prevItems];
        for (let i = 0; i < newItems.length; i++) {
          const item = newItems[i];
          const itemRect = {
            x: item.x,
            y: item.y,
            width: CONSTANTS.ITEM_WIDTH,
            height: CONSTANTS.ITEM_HEIGHT,
          };
          if (
            !item.collected &&
            birdRect.x < itemRect.x + itemRect.width &&
            birdRect.x + birdRect.width > itemRect.x &&
            birdRect.y < itemRect.y + itemRect.height &&
            birdRect.y + birdRect.height > itemRect.y
          ) {
            newItems[i] = { ...item, collected: true };
            playSound(itemSound.current);

            createParticles(
              item.x + CONSTANTS.ITEM_WIDTH / 2,
              item.y + CONSTANTS.ITEM_HEIGHT / 2,
              item.type === "shield" ? "#3b82f6" : "#f59e0b",
              6
            );

            if (item.type === "shield") {
              setShieldActive(true);
              const duration = SHIELD_DURATION * upgradesRef.current.shieldDuration;
              setTimeout(() => setShieldActive(false), duration);
            } else if (item.type === "boost") {
              setBoostActive(true);
              const duration = BOOST_DURATION * upgradesRef.current.boostPower;
              setTimeout(() => setBoostActive(false), duration);
            }

            setSessionStats((prev) => ({
              ...prev,
              itemsCollected: prev.itemsCollected + 1,
            }));
            updateChallengeProgress("item", 1);
          }
        }
        itemsRef.current = newItems;
      }

      if (bird.y > CONSTANTS.CANVAS_HEIGHT - CONSTANTS.BIRD_HEIGHT || bird.y < 0) {
        if (!shieldActiveRef.current && !gameOver) {
          createParticles(
            CONSTANTS.BIRD_X + CONSTANTS.BIRD_WIDTH / 2,
            bird.y + CONSTANTS.BIRD_HEIGHT / 2,
            "#ff0000",
            8
          );
          setGameOver(true);

          setShouldUpdatePoint(true);
          playSound(hitSound.current);
        } else if (shieldActiveRef.current) {
          const b = birdRef.current;
          birdRef.current = {
            ...b,
            y: Math.max(0, Math.min(b.y, CONSTANTS.CANVAS_HEIGHT - CONSTANTS.BIRD_HEIGHT)),
          };
        }
      }

      const pipes = pipesRef.current;
      for (const pipe of pipes) {
        const topPipeRect = {
          x: pipe.x,
          y: 0,
          width: CONSTANTS.PIPE_WIDTH,
          height: pipe.topHeight,
        };
        const bottomPipeRect = {
          x: pipe.x,
          y: pipe.topHeight + CONSTANTS.PIPE_GAP,
          width: CONSTANTS.PIPE_WIDTH,
          height: CONSTANTS.CANVAS_HEIGHT - pipe.topHeight - CONSTANTS.PIPE_GAP,
        };

        if (
          (birdRect.x < topPipeRect.x + topPipeRect.width &&
            birdRect.x + birdRect.width > topPipeRect.x &&
            birdRect.y < topPipeRect.y + topPipeRect.height &&
            birdRect.y + birdRect.height > topPipeRect.y) ||
          (birdRect.x < bottomPipeRect.x + bottomPipeRect.width &&
            birdRect.x + birdRect.width > bottomPipeRect.x &&
            birdRect.y < bottomPipeRect.y + bottomPipeRect.height &&
            birdRect.y + birdRect.height > bottomPipeRect.y)
        ) {
          if (!shieldActiveRef.current && !gameOver) {
            createParticles(
              CONSTANTS.BIRD_X + CONSTANTS.BIRD_WIDTH / 2,
              bird.y + CONSTANTS.BIRD_HEIGHT / 2,
              "#ff4444",
              10
            );
            setGameOver(true);
            setShouldUpdatePoint(true); // 👈 kích hoạt update điểm
            playSound(hitSound.current);
          }
        }

        // Score update
        if (!pipe.passed && pipe.x + CONSTANTS.PIPE_WIDTH < CONSTANTS.BIRD_X) {
          pipe.passed = true;
          updateComboRef.current();

          const basePoints = 1;
          const comboPoints = Math.floor(basePoints * comboMultiplierRef.current);
          const totalPoints = basePoints + comboPoints;

          setScore((prev) => {
            const next = prev + totalPoints * 10;
            scoreRef.current = next;
            return next;
          });
          setGameStats((prev) => ({
            ...prev,
            totalPoints: prev.totalPoints + totalPoints * 10,
          }));

          // Create score particles
          createParticles(
            pipe.x + CONSTANTS.PIPE_WIDTH / 2,
            100,
            comboRef.current > 0 ? "#ffd700" : "#ffffff",
            4
          );

          // Check achievements
          // checkAchievements("score", score + totalPoints);
          // checkAchievements("combo", combo + 1);

          playSound(pointSound.current);
        }
      }

      // Draw pipes
      // Draw pipes
      pipes.forEach((pipe) => {
        if (pipeImage.current) {
          // Top pipe (flipped)
          ctx.save();
          ctx.scale(1, -1);
          ctx.drawImage(
            pipeImage.current,
            pipe.x,
            -pipe.topHeight,
            CONSTANTS.PIPE_WIDTH, // Sử dụng PIPE_WIDTH đã giảm
            CONSTANTS.PIPE_WIDTH * (320 / 52) // Điều chỉnh chiều cao tỷ lệ với chiều rộng mới (giả sử sprite gốc 52px)
          );
          ctx.restore();

          // Bottom pipe
          ctx.drawImage(
            pipeImage.current,
            pipe.x,
            pipe.topHeight + CONSTANTS.PIPE_GAP,
            CONSTANTS.PIPE_WIDTH, // Sử dụng PIPE_WIDTH đã giảm
            CONSTANTS.PIPE_WIDTH * (320 / 52) // Điều chỉnh chiều cao tỷ lệ
          );
        } else {
          // Fallback rectangles
          ctx.fillStyle = "#4ade80";
          ctx.fillRect(pipe.x, 0, CONSTANTS.PIPE_WIDTH, pipe.topHeight); // Sử dụng PIPE_WIDTH đã giảm
          ctx.fillRect(
            pipe.x,
            pipe.topHeight + CONSTANTS.PIPE_GAP,
            CONSTANTS.PIPE_WIDTH, // Sử dụng PIPE_WIDTH đã giảm
            CONSTANTS.CANVAS_HEIGHT - pipe.topHeight - CONSTANTS.PIPE_GAP
          );
        }
      });

      itemsRef.current.forEach((item) => {
        if (!item.collected) {
          const image =
            item.type === "shield" ? shieldImage.current : boostImage.current;
          if (image) {
            ctx.save();
            ctx.filter = "drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))";
            ctx.drawImage(image, item.x, item.y, CONSTANTS.ITEM_WIDTH, CONSTANTS.ITEM_HEIGHT);
            ctx.restore();
          } else {
            ctx.fillStyle = item.type === "shield" ? "#3b82f6" : "#f59e0b";
            ctx.fillRect(item.x, item.y, CONSTANTS.ITEM_WIDTH, CONSTANTS.ITEM_HEIGHT);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(item.x, item.y, CONSTANTS.ITEM_WIDTH, CONSTANTS.ITEM_HEIGHT);
          }
        }
      });

      // Draw bird
      if (birdSprites.current.length > 0) {
        ctx.save();
        ctx.translate(CONSTANTS.BIRD_X + CONSTANTS.BIRD_WIDTH / 2, bird.y + CONSTANTS.BIRD_HEIGHT / 2);
        ctx.rotate(
          Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1))
        );
        ctx.drawImage(
          birdSprites.current[bird.frame],
          -CONSTANTS.BIRD_WIDTH / 2,
          -CONSTANTS.BIRD_HEIGHT / 2,
          CONSTANTS.BIRD_WIDTH,
          CONSTANTS.BIRD_HEIGHT
        );
        ctx.restore();
      } else {
        // Fallback bird
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(CONSTANTS.BIRD_X, bird.y, CONSTANTS.BIRD_WIDTH, CONSTANTS.BIRD_HEIGHT);
      }

      // Draw score
      ctx.fillStyle = "white";
      ctx.font = "36px Arial";
      ctx.textAlign = "center";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.strokeText(scoreRef.current.toString(), CONSTANTS.CANVAS_WIDTH / 2, 50);
      ctx.fillText(scoreRef.current.toString(), CONSTANTS.CANVAS_WIDTH / 2, 50);

      // Draw game over screen (nhánh này khi gameOver đã true sau cùng frame vẽ — không dừng rAF, effect vẫn cleanup khi unmount)
      if (gameOver) {
        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        if (gameOverImage.current) {
          const gameOverWidth = 192;
          const gameOverHeight = 42;
          const gameOverX = (CONSTANTS.CANVAS_WIDTH - gameOverWidth) / 2;
          const gameOverY = (CONSTANTS.CANVAS_HEIGHT - gameOverHeight) / 2 - 50;
          ctx.drawImage(
            gameOverImage.current,
            gameOverX,
            gameOverY,
            gameOverWidth,
            gameOverHeight
          );
        } else {
          ctx.fillStyle = "white";
          ctx.font = "32px Arial";
          ctx.textAlign = "center";
          ctx.fillText(canvasUiRef.current.gameOver, CONSTANTS.CANVAS_WIDTH / 2, CONSTANTS.CANVAS_HEIGHT / 2 - 50);
        }

        // Score display
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText(
          `${canvasUiRef.current.scoreWord}: ${scoreRef.current}`,
          CONSTANTS.CANVAS_WIDTH / 2,
          CONSTANTS.CANVAS_HEIGHT / 2
        );
        ctx.fillText(
          `${canvasUiRef.current.bestWord}: ${Math.max(gameStatsRef.current.highScore, scoreRef.current)}`,
          CONSTANTS.CANVAS_WIDTH / 2,
          CONSTANTS.CANVAS_HEIGHT / 2 + 25
        );

        // Restart button
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(CONSTANTS.CANVAS_WIDTH / 2 - 50, CONSTANTS.CANVAS_HEIGHT / 2 + 50, 100, 40);
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(canvasUiRef.current.restart, CONSTANTS.CANVAS_WIDTH / 2, CONSTANTS.CANVAS_HEIGHT / 2 + 75);
        ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
        ctx.fillRect(CONSTANTS.CANVAS_WIDTH / 2 - 80, CONSTANTS.CANVAS_HEIGHT / 2 + 100, 70, 30);
        ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
        ctx.fillRect(CONSTANTS.CANVAS_WIDTH / 2 + 10, CONSTANTS.CANVAS_HEIGHT / 2 + 100, 70, 30);

        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText(canvasUiRef.current.share, CONSTANTS.CANVAS_WIDTH / 2 - 45, CONSTANTS.CANVAS_HEIGHT / 2 + 120);
        ctx.fillText(canvasUiRef.current.save, CONSTANTS.CANVAS_WIDTH / 2 + 45, CONSTANTS.CANVAS_HEIGHT / 2 + 120);
      }

      // Draw item status
      if (shieldActiveRef.current) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
        ctx.font = "16px Arial";
        ctx.fillText(canvasUiRef.current.shieldOn, CONSTANTS.CANVAS_WIDTH / 2, 80);
      }
      if (boostActiveRef.current) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
        ctx.font = "16px Arial";
        ctx.fillText(canvasUiRef.current.boostOn, CONSTANTS.CANVAS_WIDTH / 2, 100);
      }
      drawParticles(ctx);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
    // bird/pipes/items/score/boost/combo đọc qua ref trong loop — không đưa vào deps để tránh reset interval
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs + layout sync
  }, [
    assetsLoaded,
    isPaused,
    currentMap,
    gameKey,
    gameOver,
    gameStarted,
    playSound,
  ]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      if (gameOver) {
     
        if (
          x >= canvas.width / 2 - 50 &&
          x <= canvas.width / 2 + 50 &&
          y >= canvas.height / 2 + 50 &&
          y <= canvas.height / 2 + 90
        ) {
          
          restartGame();
        }

        // Share button
        else if (
          x >= canvas.width / 2 - 80 &&
          x <= canvas.width / 2 - 10 &&
          y >= canvas.height / 2 + 100 &&
          y <= canvas.height / 2 + 130
        ) {
          shareScore();
        }

        // Save button
        else if (
          x >= canvas.width / 2 + 10 &&
          x <= canvas.width / 2 + 80 &&
          y >= canvas.height / 2 + 100 &&
          y <= canvas.height / 2 + 130
        ) {
          setShowNameInput(true);
        }
      } else {
        jump();
      }
    },
    [gameOver, jump, restartGame]
  );
  /** Không sync score → gameStats mỗi lần cộng điểm (gây re-render cả component ~ vài chục KB JSX mỗi giây khi chơi lâu → lag). Hiển thị điểm hiện tại dùng `score` trực tiếp. */

  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden overscroll-none bg-gray-900 supports-[height:100svh]:h-[100svh]">
      <Link
        to="/home"
        className="fixed z-[70] flex max-w-[calc(100vw-1rem)] items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-2 text-sm font-medium text-white shadow-md backdrop-blur-sm transition hover:bg-black/60 active:scale-[0.98]"
        style={{
          top: "max(0.5rem, env(safe-area-inset-top))",
          left: "max(0.5rem, env(safe-area-inset-left))",
        }}
        title={t("gamesPage.backToHome")}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {t("gamesPage.backToHome")}
      </Link>
      {/* Game Container - Full screen with game background */}
      <div
        className={`relative flex min-h-0 flex-1 items-center justify-center bg-gradient-to-b ${mapConfigs[currentMap].bg} transition-all duration-500`}
      >
        {/* Game Canvas - full width như trước */}
        <div
          className={`relative min-h-0 w-full max-w-[100vw] flex-1 ${isPaused ? "opacity-50" : ""} ${showPointsBoard || showMapSelector ? "blur-sm scale-95" : ""
            } transition-all duration-300`}
        >
          <canvas
            ref={canvasRef}
            className="box-border block h-full min-h-0 w-full max-w-full border-4 border-white/30 shadow-2xl"
            style={{
              imageRendering: "pixelated",
              touchAction: "none",
              borderRadius: "0",
            }}
            onClick={handleCanvasClick}
          />
          {(shieldActive || boostActive) && (
            <div className="absolute left-3 top-[max(4.5rem,calc(env(safe-area-inset-top)+3rem))] max-w-[min(100%,18rem)] rounded-lg bg-black/50 p-2 text-sm font-semibold text-white animate-pulse sm:left-4 sm:top-16">
              {shieldActive && (
                <span className="text-blue-400">🛡️ {t("minigame.shieldActive")}</span>
              )}
              {boostActive && (
                <span className="ml-2 text-orange-400">🚀 {t("minigame.boostActive")}</span>
              )}
            </div>
          )}
          {/* Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-lg">
              <div className="text-white text-2xl font-bold animate-pulse">
                {t("minigame.paused")}
              </div>
            </div>
          )}
        </div>
        {showAchievement && (
          <div
            className="fixed left-1/2 z-50 max-w-[min(100vw-2rem,24rem)] -translate-x-1/2 transform animate-in slide-in-from-top duration-300 px-2"
            style={{ top: "max(3.5rem, calc(env(safe-area-inset-top) + 2.5rem))" }}
          >
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl p-4 shadow-2xl border-2 border-white">
              <div className="flex items-center gap-3 text-white">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="text-lg font-bold">{t("minigame.achievementTitle")}</div>
                  <div className="text-sm">{showAchievement.name}</div>
                  <div className="text-xs opacity-90">
                    {showAchievement.description}
                  </div>
                  <div className="text-sm font-bold mt-1">
                    +{showAchievement.reward} {t("minigame.pointsSuffix")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {combo > 0 && (
          <div className="absolute right-3 top-[max(4.5rem,calc(env(safe-area-inset-top)+0.75rem))] max-w-[min(100%,14rem)] rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 p-2 text-right text-sm font-bold text-white animate-pulse sm:right-4 sm:top-4">
            {t("minigame.comboLine", {
              combo,
              percent: Math.floor(comboMultiplier * 100 - 100),
            })}
          </div>
        )}
        {/* Control Buttons - Positioned over the game */}

        <div
          className={`fixed z-30 flex flex-col ${isMobile
            ? "bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] gap-2"
            : "right-8 top-1/2 -translate-y-1/2 gap-3"
            } ${showPointsBoard ||
              showMapSelector ||
              showUpgrades ||
              showLeaderboard ||
              showChallenges
              ? "opacity-50 pointer-events-none"
              : ""
            } transition-all duration-300`}
        >
          {/* Pause Button */}
          {gameStarted && !gameOver && (
            <button
              onClick={handlePause}
              className={`${isMobile ? "w-14 h-14 text-lg" : "w-16 h-16 text-xl"
                } rounded-full bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-black font-bold transition-all transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-sm border-2 border-white/30`}
            >
              {isPaused ? "▶" : "⏸"}
            </button>
          )}

          {/* Challenges */}
          <button
            type="button"
            title={t("minigame.buttons.challenge", { defaultValue: "Challenges" })}
            onClick={() => setShowChallenges(true)}
            className={`${isMobile ? "w-14 h-14 text-xs" : "w-16 h-16 text-xs"
              } shrink-0 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold transition-all transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-sm border-2 border-white/30 relative`}
          >
            {isMobile ? "🎯" : t("minigame.buttons.challenge", { defaultValue: "Challenges" })}
            {dailyChallenges.some((c) => !c.completed) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
          </button>

          {/* Map Change Button */}
          {/* <button
    onClick={handleMapChange}
    className={`${isMobile ? 'w-14 h-14 text-sm' : 'w-16 h-16 text-sm'} rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold transition-all transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-sm border-2 border-white/30`}
  >
    {isMobile ? "🔄" : "Map"}
  </button> */}

          {/* Points Button */}
          <button
            type="button"
            title={t("minigame.buttons.points", { defaultValue: "Points" })}
            onClick={() => setShowPointsBoard(true)}
            className={`${isMobile ? "w-14 h-14 text-sm" : "w-16 h-16 text-sm"
              } shrink-0 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold transition-all transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-sm border-2 border-white/30`}
          >
            {isMobile ? "🏆" : t("minigame.buttons.points", { defaultValue: "Points" })}
          </button>

          {/* Upgrades Button */}
          <button
            type="button"
            title={t("minigame.buttons.upgrade", { defaultValue: "Upgrades" })}
            onClick={() => setShowUpgrades(true)}
            className={`${isMobile ? "w-14 h-14 text-sm" : "w-16 h-16 text-sm"
              } shrink-0 rounded-full bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white font-bold transition-all transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-sm border-2 border-white/30`}
          >
            {isMobile ? "⬆️" : t("minigame.buttons.upgrade", { defaultValue: "Upgrades" })}
          </button>

          {/* Map Selector Button */}
          <button
            type="button"
            title={t("minigame.buttons.maps", { defaultValue: "Maps" })}
            onClick={() => setShowMapSelector(true)}
            className={`${isMobile ? "w-14 h-14 text-sm" : "w-16 h-16 text-sm"
              } shrink-0 rounded-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold transition-all transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-sm border-2 border-white/30`}
          >
            {isMobile ? "🗺️" : t("minigame.buttons.maps", { defaultValue: "Maps" })}
          </button>

          {/* Leaderboard Button */}
          <button
            type="button"
            title={t("minigame.buttons.top", { defaultValue: "Rank" })}
            onClick={() => setShowLeaderboard(true)}
            className={`${isMobile ? "w-14 h-14 text-sm" : "w-16 h-16 text-sm"
              } shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold transition-all transform hover:scale-110 active:scale-95 shadow-xl backdrop-blur-sm border-2 border-white/30`}
          >
            {isMobile ? "👑" : t("minigame.buttons.top", { defaultValue: "Rank" })}
          </button>
        </div>
      </div>
      {showUpgrades && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {t("minigame.upgrades.title")}
              </h2>
              <button
                onClick={() => setShowUpgrades(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Shield Duration Upgrade */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">
                      {t("minigame.upgrades.shieldTitle")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("minigame.upgrades.level", {
                        level: upgrades.shieldDuration,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const cost = 500 * upgrades.shieldDuration;
                      if (gameStats.totalPoints >= cost) {
                        setGameStats((prev) => ({
                          ...prev,
                          totalPoints: prev.totalPoints - cost,
                        }));
                        setUpgrades((prev) => {
                          const newUpgrades = {
                            ...prev,
                            shieldDuration: prev.shieldDuration + 1,
                          };
                          localStorage.setItem(
                            "upgrades",
                            JSON.stringify(newUpgrades)
                          ); // Thêm ở đây
                          return newUpgrades;
                        });
                      }
                    }}
                    disabled={
                      gameStats.totalPoints < 500 * upgrades.shieldDuration
                    }
                    className={`px-4 py-2 rounded-lg ${gameStats.totalPoints >= 500 * upgrades.shieldDuration
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                  >
                    {500 * upgrades.shieldDuration}{" "}
                    {t("minigame.pointsSuffix")}
                  </button>
                </div>
              </div>

              {/* Boost Power Upgrade */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">
                      {t("minigame.upgrades.boostTitle")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("minigame.upgrades.level", {
                        level: upgrades.boostPower,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const cost = 400 * upgrades.boostPower;
                      if (gameStats.totalPoints >= cost) {
                        setGameStats((prev) => ({
                          ...prev,
                          totalPoints: prev.totalPoints - cost,
                        }));
                        setUpgrades((prev) => {
                          const newUpgrades = {
                            ...prev,
                            boostPower: prev.boostPower + 1,
                          };
                          localStorage.setItem(
                            "upgrades",
                            JSON.stringify(newUpgrades)
                          ); // Thêm ở đây
                          return newUpgrades;
                        });
                      }
                    }}
                    disabled={gameStats.totalPoints < 400 * upgrades.boostPower}
                    className={`px-4 py-2 rounded-lg ${gameStats.totalPoints >= 400 * upgrades.boostPower
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                  >
                    {400 * upgrades.boostPower}{" "}
                    {t("minigame.pointsSuffix")}
                  </button>
                </div>
              </div>

              {/* Magnet Range */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">
                      {t("minigame.upgrades.magnetTitle")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("minigame.upgrades.level", {
                        level: upgrades.magnetRange,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const cost = 300 * (upgrades.magnetRange + 1);
                      if (gameStats.totalPoints >= cost) {
                        setGameStats((prev) => ({
                          ...prev,
                          totalPoints: prev.totalPoints - cost,
                        }));
                        setUpgrades((prev) => {
                          const newUpgrades = {
                            ...prev,
                            magnetRange: prev.magnetRange + 1,
                          };
                          localStorage.setItem(
                            "upgrades",
                            JSON.stringify(newUpgrades)
                          ); // Thêm ở đây
                          return newUpgrades;
                        });
                      }
                    }}
                    disabled={
                      gameStats.totalPoints < 300 * (upgrades.magnetRange + 1)
                    }
                    className={`px-4 py-2 rounded-lg ${gameStats.totalPoints >= 300 * (upgrades.magnetRange + 1)
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                  >
                    {300 * (upgrades.magnetRange + 1)}{" "}
                    {t("minigame.pointsSuffix")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* {showNameInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Nhập tên của bạn
            </h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Tên người chơi"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              maxLength={15}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (playerName.trim()) {
                    localStorage.setItem("playerName", playerName);
                    saveToLeaderboard(playerName, score);
                    setShowNameInput(false);
                  }
                }}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                Lưu
              </button>
              <button
                onClick={() => setShowNameInput(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )} */}
      {showChallenges && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {t("minigame.challengesTitle")}
              </h2>
              <button
                onClick={() => setShowChallenges(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {dailyChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className={`border rounded-lg p-4 ${challenge.completed
                    ? "bg-green-50 border-green-300"
                    : "bg-gray-50"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {t(`minigame.challenge.${challenge.id}.name`, {
                          defaultValue: challenge.name,
                        })}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {t(`minigame.challenge.${challenge.id}.description`, {
                          defaultValue: challenge.description,
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2 transition-all"
                            style={{
                              width: `${(challenge.progress / challenge.target) * 100
                                }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {challenge.progress}/{challenge.target}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">
                        +{challenge.reward}
                      </div>
                      {challenge.completed && (
                        <div className="text-green-600 text-sm">
                          ✓ {t("minigame.challengeDone")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Time remaining */}
            <div className="mt-4 text-center text-sm text-gray-500">
              {t("minigame.challengesRefresh")}
            </div>
          </div>
        </div>
      )}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{t("minigame.leaderboardTitle")}</h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg ${index < 3 ? "bg-yellow-50" : "bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0
                        ? "bg-yellow-400"
                        : index === 1
                          ? "bg-gray-400"
                          : index === 2
                            ? "bg-amber-600"
                            : "bg-blue-100"
                        }`}
                    >
                      {index + 1}
                    </div>
                    <span className="font-medium">{entry.fullName}</span>
                  </div>
                  <span className="font-bold text-lg">{entry.cumulativePoints}</span>
                </div>
              ))}
            </div>

            {/* Your best score */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">{t("minigame.leaderboardYourBest")}</p>
                <p className="text-xl font-bold text-blue-600">
                  {gameStats.highScore}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Points Board Modal */}
      {showPointsBoard && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[85vh] shadow-2xl transform animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {t('minigame.pointsBoard.title')}
              </h2>
              <button
                onClick={() => setShowPointsBoard(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
              {/* Left Column - Stats & How to earn */}
              <div className="lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
                {/* Current Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">{t('minigame.pointsBoard.statistics')}</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {score}
                      </div>
                      <p className="text-sm text-gray-600">{t('minigame.pointsBoard.currentPoints')}</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {gameStats.highScore}
                      </div>
                      <p className="text-sm text-gray-600">{t('minigame.pointsBoard.highestScore')}</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {gameStats.totalPoints}
                      </div>
                      <p className="text-sm text-gray-600">{t('minigame.pointsBoard.totalAccumulated')}</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {gameStats.gamesPlayed}
                      </div>
                      <p className="text-sm text-gray-600">{t('minigame.pointsBoard.gamesPlayed')}</p>
                    </div>
                  </div>
                </div>

                {/* How to earn points */}
                <div className="bg-yellow-50 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    💡 {t('minigame.pointsBoard.howToEarnPoints')}
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• {t('minigame.pointsBoard.eachPipePassed')}</li>
                    <li>• {t('minigame.pointsBoard.pickupItem')}</li>
                    <li>• {t('minigame.pointsBoard.gameCompleted')}</li>
                    <li>• {t('minigame.pointsBoard.newHighScore')}</li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Voucher Exchange */}
              <div className="lg:w-2/3 flex flex-col overflow-y-auto">
                <h3 className="font-semibold text-lg mb-3">{t('minigame.pointsBoard.exchangeVoucher')}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {listDiscount.length > 0 && listDiscount.map((discount: any) => {
                    return (
                      <button
                        key={discount.id || ""}
                        onClick={() => redeemVoucher(discount, t('minigame.pointsBoard.discount', { percent: discount.discountRate * 100 }))}
                        disabled={gameStats.totalPoints < discount.point}
                        className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all min-h-[140px] ${gameStats.totalPoints >= discount.point
                          ? "hover:bg-green-50 hover:border-green-300 cursor-pointer bg-white"
                          : "opacity-50 cursor-not-allowed bg-gray-50"
                          }`}
                      >
                        <div className="text-center mb-2">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {discount.discountRate * 100}%
                          </div>
                          <div className="text-xs font-medium text-gray-700 mb-2">
                            {t('minigame.pointsBoard.discountForOrder', { percent: discount.discountRate * 100 })}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">{t('minigame.pointsBoard.exchange', { points: discount.point })}</div>
                          <span
                            className={`text-xs font-semibold ${gameStats.totalPoints >= discount.point ? "text-green-600" : "text-gray-400"
                              }`}
                          >
                            {gameStats.totalPoints >= discount.point ? t('minigame.pointsBoard.exchangeButton') : t('minigame.pointsBoard.notEnoughPoints')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Map Selector Modal */}
      {showMapSelector && (
        <div className="fixed inset-0  bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {t("minigame.mapSelectTitle")}
              </h2>
              <button
                onClick={() => setShowMapSelector(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mapConfigs.map((map, index) => (
                <div
                  key={index}
                  onClick={() =>
                    map.unlocked
                      ? (setCurrentMap(index), setShowMapSelector(false))
                      : unlockMap(index)
                  }
                  className={`relative cursor-pointer transition-all duration-300 border-2 rounded-xl p-4 transform hover:scale-105 ${currentMap === index
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : map.unlocked
                      ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                      : "border-gray-200 opacity-75 hover:opacity-100 hover:shadow-md"
                    }`}
                >
                  <div
                    className={`w-full h-24 bg-gradient-to-b ${map.bg} rounded-lg mb-3 relative overflow-hidden shadow-inner`}
                  >
                    {/* Enhanced map preview effects */}
                    {index === 0 && ( // Day map - add sun and clouds
                      <div className="absolute inset-0">
                        <div className="absolute top-2 right-3 w-6 h-6 bg-yellow-300 rounded-full opacity-80"></div>
                        <div className="absolute top-4 left-2 w-3 h-2 bg-white rounded-full opacity-60"></div>
                        <div className="absolute top-3 left-4 w-4 h-3 bg-white rounded-full opacity-60"></div>
                      </div>
                    )}
                    {index === 1 && ( // Night map - add stars and moon
                      <div className="absolute inset-0">
                        <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        <div
                          className="absolute top-4 right-6 w-1 h-1 bg-white rounded-full animate-pulse"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div
                          className="absolute top-6 left-8 w-1 h-1 bg-white rounded-full animate-pulse"
                          style={{ animationDelay: "1s" }}
                        ></div>
                        <div className="absolute top-3 right-3 w-4 h-4 bg-yellow-100 rounded-full opacity-80"></div>
                      </div>
                    )}
                    {index === 2 && ( // Sunset map - add sun
                      <div className="absolute inset-0">
                        <div className="absolute bottom-2 right-4 w-5 h-5 bg-yellow-400 rounded-full opacity-90"></div>
                        <div className="absolute bottom-1 right-2 w-8 h-1 bg-yellow-300 opacity-50"></div>
                      </div>
                    )}
                    {index === 3 && ( // Snow map - add snowflakes
                      <div className="absolute inset-0">
                        <div className="absolute top-1 left-3 w-2 h-2 text-white text-xs opacity-80">
                          ❄
                        </div>
                        <div className="absolute top-3 right-4 w-2 h-2 text-white text-xs opacity-80">
                          ❄
                        </div>
                        <div className="absolute top-5 left-6 w-2 h-2 text-white text-xs opacity-80">
                          ❄
                        </div>
                        <div className="absolute bottom-2 right-2 w-2 h-2 text-white text-xs opacity-80">
                          ❄
                        </div>
                      </div>
                    )}

                    {currentMap === index && (
                      <div className="absolute inset-0 border-2 border-blue-400 rounded-lg animate-pulse bg-blue-200 bg-opacity-20"></div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="font-medium text-lg">{map.name}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {map.unlocked ? (
                        <span className="text-green-600 font-medium">
                          {currentMap === index
                            ? t("minigame.mapUsing")
                            : t("minigame.mapUnlocked")}
                        </span>
                      ) : (
                        <span className="text-orange-600 font-medium">
                          {t("minigame.mapUnlockCost", { cost: map.cost })}
                        </span>
                      )}
                    </div>

                    {!map.unlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockMap(index);
                        }}
                        disabled={gameStats.totalPoints < map.cost}
                        className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${gameStats.totalPoints >= map.cost
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                      >
                        {gameStats.totalPoints >= map.cost
                          ? t("minigame.mapUnlockCta")
                          : t("minigame.notEnoughPoints")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {t("minigame.mapPointsLine", {
                  points: gameStats.totalPoints,
                })}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Bottom Instructions - Fixed position */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-20 bg-black/60 px-4 pt-3 text-center text-white backdrop-blur-sm pb-[max(1rem,env(safe-area-inset-bottom))] ${showPointsBoard || showMapSelector ? "opacity-50" : ""
          } transition-all duration-300`}
      >
        <p
          className={`${isMobile ? "text-base" : "text-xl"
            } font-semibold drop-shadow-lg`}
        >
          {instructionText}
        </p>
      </div>
      {/* Loading: fade out khi xong — không unmount đột ngột (giật màn lần đầu) */}
      {loadingOverlayMounted && (
        <div
          className={`fixed inset-0 z-[10050] flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4 transition-opacity duration-300 ease-out ${loadingOverlayOpaque ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="flappy-loading-title"
            aria-busy="true"
            className="w-full max-w-[340px] rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl flex flex-col items-center text-center gap-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
              <Loader2
                className="h-9 w-9 animate-spin text-blue-600 dark:text-blue-400"
                aria-hidden
              />
            </div>
            <div className="space-y-1.5">
              <p
                id="flappy-loading-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {t("gamesPage.flappyLoading")}
              </p>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {t("gamesPage.flappyLoadingSub")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}