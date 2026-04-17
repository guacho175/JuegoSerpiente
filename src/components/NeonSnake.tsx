import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Play, Pause, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, Save, User, Zap, Shield
} from 'lucide-react';

/* ──────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────── */
const GRID = 25;
const CS   = 480;               // internal canvas px
const CELL = CS / GRID;         // 19.2 px per cell
const FOOD = 3;
const INIT_SNAKE = [{ x: 12, y: 12 }, { x: 12, y: 13 }, { x: 12, y: 14 }];
const INIT_DIR   = { x: 0, y: -1 };

/* ──────────────────────────────────────────
   OBSTACLE BUILDER HELPERS
────────────────────────────────────────── */
const H = (y: number, x1: number, x2: number) =>
  Array.from({ length: x2 - x1 + 1 }, (_, i) => ({ x: x1 + i, y }));
const V = (x: number, y1: number, y2: number) =>
  Array.from({ length: y2 - y1 + 1 }, (_, i) => ({ x, y: y1 + i }));
const uniq = (arr: { x: number; y: number }[]) => {
  const s = new Set<string>();
  return arr.filter(({ x, y }) => {
    const k = `${x},${y}`;
    return s.has(k) ? false : (s.add(k), true);
  });
};

/* ──────────────────────────────────────────
   LEVEL DEFINITIONS
────────────────────────────────────────── */
interface LevelDef {
  id: number;
  name: string;
  label: string;
  threshold: number;
  speed: number;
  snake: string;
  snakeDim: string;
  food: string;
  wall: string;
  gridLine: string;
  bg: string;
  obstacles: { x: number; y: number }[];
}

// Corner 2×2 pillars used by all levels ≥ 2
const CORNERS = uniq([
  ...H(3, 3, 4), ...H(4, 3, 4),       // TL
  ...H(3, 20, 21), ...H(4, 20, 21),   // TR
  ...H(20, 3, 4), ...H(21, 3, 4),     // BL
  ...H(20, 20, 21), ...H(21, 20, 21), // BR
]);

// Outer ring with gaps at x=12 (top/bottom) and y=12 (left/right)
const OUTER_RING = uniq([
  ...H(6, 5, 11), ...H(6, 13, 19),
  ...H(18, 5, 11), ...H(18, 13, 19),
  ...V(6, 7, 11), ...V(6, 13, 17),
  ...V(18, 7, 11), ...V(18, 13, 17),
]);

// Tighter inner ring
const INNER_RING = uniq([
  ...H(9, 8, 10), ...H(9, 14, 16),
  ...H(15, 8, 10), ...H(15, 14, 16),
  ...V(8, 10, 14), ...V(16, 10, 14),
]);

// Dense inner structures
const DEEP_WALLS = uniq([
  ...H(11, 10, 11), ...H(11, 13, 14),
  ...H(13, 10, 11), ...H(13, 13, 14),
  ...V(10, 10, 14), ...V(14, 10, 14),
  // extra L-walls
  ...H(7, 9, 12), ...V(9, 7, 10),
  ...H(7, 13, 16), ...V(15, 7, 10),
  ...H(17, 9, 12), ...V(9, 14, 17),
  ...H(17, 13, 16), ...V(15, 14, 17),
]);

const LEVELS: LevelDef[] = [
  {
    id: 1, name: 'CIUDAD NEÓN', label: 'Nivel 1', threshold: 0, speed: 200,
    snake: '#00ffff', snakeDim: '#006666', food: '#ff00ff',
    wall: '#1e3a4a', gridLine: '#0a1825', bg: '#04080f',
    obstacles: [],
  },
  {
    id: 2, name: 'BLOQUES CORRUPTOS', label: 'Nivel 2', threshold: 50, speed: 182,
    snake: '#e879f9', snakeDim: '#7c2d8f', food: '#a3e635',
    wall: '#4a1d5e', gridLine: '#130920', bg: '#0d0614',
    obstacles: CORNERS,
  },
  {
    id: 3, name: 'LABERINTO CYBER', label: 'Nivel 3', threshold: 150, speed: 164,
    snake: '#818cf8', snakeDim: '#3730a3', food: '#fb923c',
    wall: '#1e1b4b', gridLine: '#0c0a1e', bg: '#060612',
    obstacles: uniq([...CORNERS, ...OUTER_RING]),
  },
  {
    id: 4, name: 'NÚCLEO INFECTADO', label: 'Nivel 4', threshold: 300, speed: 146,
    snake: '#fb923c', snakeDim: '#9a3412', food: '#4ade80',
    wall: '#431407', gridLine: '#1a0c00', bg: '#0d0600',
    obstacles: uniq([...CORNERS, ...OUTER_RING, ...INNER_RING]),
  },
  {
    id: 5, name: 'ABISMO DIGITAL', label: 'Nivel 5', threshold: 500, speed: 128,
    snake: '#f43f5e', snakeDim: '#9f1239', food: '#06b6d4',
    wall: '#4c0519', gridLine: '#1a0008', bg: '#0d0003',
    obstacles: uniq([...CORNERS, ...OUTER_RING, ...INNER_RING, ...DEEP_WALLS]),
  },
];

/* ──────────────────────────────────────────
   COMPONENT
────────────────────────────────────────── */
interface Pt { x: number; y: number }
interface ScoreEntry { name: string; score: number; date: string }
interface Props { onGameOver?: () => void; onReset?: () => void; onStart?: () => void }

export default function NeonSnake({ onGameOver, onReset, onStart }: Props) {
  // ── React state (drives UI overlays + level logic)
  const [snake,       setSnake]       = useState<Pt[]>(INIT_SNAKE);
  const [direction,   setDirection]   = useState<Pt>(INIT_DIR);
  const [foods,       setFoods]       = useState<Pt[]>([]);
  const [score,       setScore]       = useState(0);
  const [levelIdx,    setLevelIdx]    = useState(0);
  const [obstacles,   setObstacles]   = useState<Pt[]>([]);
  const [gameOver,    setGameOver]    = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused,    setIsPaused]    = useState(false);
  const [playerName,  setPlayerName]  = useState('');
  const [hasSaved,    setHasSaved]    = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // ── Refs that shadow state (safe inside setInterval / rAF)
  const snakeR      = useRef(snake);
  const dirR        = useRef(direction);
  const foodsR      = useRef(foods);
  const obsR        = useRef(obstacles);
  const scoreR      = useRef(score);
  const goR         = useRef(gameOver);
  const startedR    = useRef(gameStarted);
  const pausedR     = useRef(isPaused);
  const levelIdxR   = useRef(levelIdx);

  useEffect(() => { snakeR.current    = snake; },       [snake]);
  useEffect(() => { dirR.current      = direction; },   [direction]);
  useEffect(() => { foodsR.current    = foods; },       [foods]);
  useEffect(() => { obsR.current      = obstacles; },   [obstacles]);
  useEffect(() => { scoreR.current    = score; },       [score]);
  useEffect(() => { goR.current       = gameOver; },    [gameOver]);
  useEffect(() => { startedR.current  = gameStarted; }, [gameStarted]);
  useEffect(() => { pausedR.current   = isPaused; },    [isPaused]);
  useEffect(() => { levelIdxR.current = levelIdx; },    [levelIdx]);

  // ── Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const loopRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── DRAW ─────────────────────────────── */
  const draw = useCallback((t = 0) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const lv  = LEVELS[levelIdxR.current];
    const sn  = snakeR.current;
    const fs  = foodsR.current;
    const obs = obsR.current;
    const dir = dirR.current;

    // Background
    ctx.fillStyle = lv.bg;
    ctx.fillRect(0, 0, CS, CS);

    // Grid lines
    ctx.strokeStyle = lv.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(CS, i * CELL); ctx.stroke();
    }

    // Obstacles
    ctx.shadowBlur = 0;
    obs.forEach(({ x, y }) => {
      const px = x * CELL + 1, py = y * CELL + 1, sz = CELL - 2;
      ctx.fillStyle = lv.wall;
      ctx.fillRect(px, py, sz, sz);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(px + 1, py + 1, sz - 2, 2);
    });

    // Food (radial glow + pulsing core)
    fs.forEach(({ x, y }) => {
      const cx = x * CELL + CELL / 2;
      const cy = y * CELL + CELL / 2;
      const pulse = Math.sin(t * 0.003 + x * 0.7 + y * 1.3) * 0.25 + 0.75;
      const r     = (CELL / 2 - 1) * pulse;

      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
      gr.addColorStop(0, lv.food + 'aa');
      gr.addColorStop(1, lv.food + '00');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2); ctx.fill();

      ctx.shadowBlur = 18; ctx.shadowColor = lv.food;
      ctx.fillStyle = lv.food;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Snake body (tail → head so head renders on top)
    const revSnake = [...sn].reverse();
    revSnake.forEach(({ x, y }, ri) => {
      const i  = sn.length - 1 - ri;
      const px = x * CELL + 1, py = y * CELL + 1, sz = CELL - 2;
      const isH = i === 0;
      const alpha = isH ? 1 : Math.max(0.1, 1 - (i / sn.length) * 0.75);
      ctx.globalAlpha = alpha;

      if (isH) {
        ctx.shadowBlur  = 22; ctx.shadowColor = lv.snake;
        ctx.fillStyle   = lv.snake;
        ctx.fillRect(px, py, sz, sz);
        ctx.shadowBlur  = 0;
        // direction dot "eye"
        ctx.fillStyle = '#000000cc';
        const ex = px + sz / 2 + dir.x * sz * 0.28;
        const ey = py + sz / 2 + dir.y * sz * 0.28;
        ctx.beginPath(); ctx.arc(ex, ey, sz * 0.15, 0, Math.PI * 2); ctx.fill();
      } else if (i < 5) {
        ctx.fillStyle = lv.snake;
        ctx.fillRect(px + 1, py + 1, sz - 2, sz - 2);
      } else {
        ctx.fillStyle = lv.snakeDim;
        ctx.fillRect(px + 2, py + 2, sz - 4, sz - 4);
      }
      ctx.globalAlpha = 1;
    });

    // Scanlines
    for (let sy = 0; sy < CS; sy += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, sy, CS, 2);
    }

    // Vignette
    const vig = ctx.createRadialGradient(CS / 2, CS / 2, CS * 0.35, CS / 2, CS / 2, CS * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CS, CS);
  }, []);

  // Animation loop
  useEffect(() => {
    const loop = (t: number) => {
      draw(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  /* ── FOOD GENERATOR ───────────────────── */
  const makeFoods = useCallback((n: number, sn: Pt[], obs: Pt[]) => {
    const result: Pt[] = [];
    while (result.length < n) {
      const f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
      if (!sn.some(s => s.x === f.x && s.y === f.y) &&
          !obs.some(o => o.x === f.x && o.y === f.y) &&
          !result.some(r => r.x === f.x && r.y === f.y))
        result.push(f);
    }
    return result;
  }, []);

  /* ── LEVEL-UP WATCHER ─────────────────── */
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    let newIdx = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (score >= LEVELS[i].threshold) { newIdx = i; break; }
    }
    if (newIdx > levelIdx) {
      // Safe obstacles: skip cells currently occupied by snake
      const raw      = LEVELS[newIdx].obstacles;
      const safeObs  = raw.filter(o => !snakeR.current.some(s => s.x === o.x && s.y === o.y));
      setLevelIdx(newIdx);
      setObstacles(safeObs);
      setFoods(makeFoods(FOOD, snakeR.current, safeObs));
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2200);
    }
  }, [score, gameStarted, gameOver, levelIdx, makeFoods]);

  /* ── MOVE SNAKE ───────────────────────── */
  const moveSnake = useCallback(() => {
    if (goR.current || !startedR.current || pausedR.current) return;

    setSnake(cur => {
      const head = cur[0];
      const dir  = dirR.current;
      const nx   = head.x + dir.x;
      const ny   = head.y + dir.y;

      const die = () => {
        setGameOver(true);
        setGameStarted(false);
        if (onGameOver) onGameOver();
        return cur;
      };

      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) return die();
      if (obsR.current.some(o => o.x === nx && o.y === ny))  return die();
      if (cur.some(s => s.x === nx && s.y === ny))           return die();

      const newHead = { x: nx, y: ny };
      const newSnake = [newHead, ...cur];
      const fi = foodsR.current.findIndex(f => f.x === nx && f.y === ny);

      if (fi !== -1) {
        setScore(s => s + 10);
        const upFoods = [...foodsR.current];
        upFoods.splice(fi, 1);
        let nf: Pt;
        while (true) {
          nf = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
          if (!newSnake.some(s => s.x === nf.x && s.y === nf.y) &&
              !obsR.current.some(o => o.x === nf.x && o.y === nf.y) &&
              !upFoods.some(f => f.x === nf.x && f.y === nf.y)) break;
        }
        setFoods([...upFoods, nf]);
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [onGameOver]);

  /* ── GAME LOOP INTERVAL ───────────────── */
  useEffect(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    if (gameStarted && !gameOver && !isPaused) {
      loopRef.current = setInterval(moveSnake, LEVELS[levelIdx].speed);
    }
    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [gameStarted, gameOver, isPaused, moveSnake, levelIdx]);

  /* ── KEYBOARD ─────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!startedR.current || goR.current) return;
      if (['Space', 'KeyP'].includes(e.code)) { setIsPaused(p => !p); return; }
      if (pausedR.current) return;
      const d = dirR.current;
      const map: Record<string, Pt | null> = {
        ArrowUp:    d.y !== 1  ? { x: 0, y: -1 } : null,
        ArrowDown:  d.y !== -1 ? { x: 0, y:  1 } : null,
        ArrowLeft:  d.x !== 1  ? { x: -1, y: 0 } : null,
        ArrowRight: d.x !== -1 ? { x:  1, y: 0 } : null,
        KeyW: d.y !== 1  ? { x: 0, y: -1 } : null,
        KeyS: d.y !== -1 ? { x: 0, y:  1 } : null,
        KeyA: d.x !== 1  ? { x: -1, y: 0 } : null,
        KeyD: d.x !== -1 ? { x:  1, y: 0 } : null,
      };
      const newDir = map[e.code];
      if (newDir) setDirection(newDir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── START / RESET ────────────────────── */
  const startGame = () => {
    const sn  = INIT_SNAKE;
    const obs: Pt[] = [];
    setSnake(sn); setDirection(INIT_DIR); setScore(0);
    setLevelIdx(0); setObstacles(obs);
    setFoods(makeFoods(FOOD, sn, obs));
    setGameOver(false); setGameStarted(true); setIsPaused(false);
    setHasSaved(false); setPlayerName(''); setShowLevelUp(false);
    if (onReset) onReset();
    if (onStart) onStart();
  };

  const saveScore = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!playerName.trim()) return;
    const entry: ScoreEntry = { name: playerName.trim(), score, date: new Date().toLocaleDateString() };
    const prev = JSON.parse(localStorage.getItem('ritmo_neon_ranking') || '[]') as ScoreEntry[];
    const next = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem('ritmo_neon_ranking', JSON.stringify(next));
    setHasSaved(true);
    window.dispatchEvent(new Event('rankingUpdated'));
  };

  /* ── MOBILE DIRECTION HELPER ──────────── */
  const tap = (nx: number, ny: number) => {
    if (pausedR.current) return;
    const d = dirR.current;
    if (nx !== 0 && d.x === -nx) return;
    if (ny !== 0 && d.y === -ny) return;
    setDirection({ x: nx, y: ny });
  };

  const lv = LEVELS[levelIdx];

  /* ── RENDER ───────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-1 sm:p-2 w-full select-none">

      {/* HUD */}
      <div className="flex items-center justify-between w-full max-w-[520px] px-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-lg sm:text-xl font-bold text-cyan-400 tabular-nums">{score}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 flex-shrink-0" style={{ color: lv.snake }} />
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em]"
            style={{ color: lv.snake }}>
            {lv.name}
          </span>
        </div>

        {gameStarted && !gameOver && (
          <button onClick={() => setIsPaused(p => !p)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg border border-slate-700
                       text-slate-400 hover:text-cyan-400 font-mono text-[9px] uppercase transition-colors">
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span className="hidden sm:inline">{isPaused ? 'Continuar' : 'Pausa'}</span>
          </button>
        )}
      </div>

      {/* Level bar */}
      <div className="flex gap-1 w-full max-w-[520px] px-2">
        {LEVELS.map((l, i) => (
          <div key={l.id} className="flex-1 h-1 rounded-full transition-all duration-700"
            style={{
              backgroundColor: i <= levelIdx ? l.snake : '#1e293b',
              boxShadow: i === levelIdx ? `0 0 8px ${l.snake}` : 'none',
            }} />
        ))}
      </div>

      {/* Canvas container */}
      <div className="relative w-full max-w-[min(90vw,min(82vh,520px))] aspect-square rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 50px ${lv.snake}22, 0 0 100px ${lv.snake}0a, inset 0 0 0 1px ${lv.snake}33`,
        }}>

        <canvas ref={canvasRef} width={CS} height={CS} className="w-full h-full block" />

        {/* Level-up flash */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              key="lvlup"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none"
              style={{ background: `${lv.bg}cc`, backdropFilter: 'blur(4px)' }}>
              <motion.div className="text-center px-4"
                initial={{ y: -16 }} animate={{ y: 0 }}>
                <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: lv.snake }} />
                <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-slate-400 mb-1">Nivel desbloqueado</p>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-widest"
                  style={{ color: lv.snake, textShadow: `0 0 24px ${lv.snake}` }}>
                  {lv.name}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-2">
                  Velocidad +{Math.round((200 - lv.speed) / 200 * 100)}%
                  {lv.obstacles.length > 0 ? ' · Obstáculos activados' : ''}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game state overlays */}
        <AnimatePresence mode="wait">
          {(!gameStarted || gameOver || isPaused) && !showLevelUp && (
            <motion.div
              key={isPaused ? 'pause' : gameOver ? 'over' : 'start'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 p-5"
              style={{ background: 'rgba(4,8,15,0.88)', backdropFilter: 'blur(6px)' }}>

              {/* ── PAUSED ── */}
              {isPaused && (
                <div className="space-y-5 text-center">
                  <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-slate-500">Sistema suspendido</p>
                  <h2 className="text-4xl font-black uppercase tracking-[0.15em] text-cyan-400"
                    style={{ textShadow: '0 0 24px #00ffff88' }}>Pausa</h2>
                  <div className="text-[10px] font-mono text-slate-500 space-x-3">
                    <span>Pts: <b className="text-slate-300">{score}</b></span>
                    <span style={{ color: lv.snake }}>{lv.name}</span>
                  </div>
                  <button onClick={() => setIsPaused(false)}
                    className="px-9 py-2.5 border-2 border-cyan-400 text-cyan-400 font-bold uppercase
                               tracking-widest text-sm hover:bg-cyan-400 hover:text-slate-950 transition-all">
                    Continuar
                  </button>
                </div>
              )}

              {/* ── GAME OVER ── */}
              {gameOver && (
                <div className="w-full max-w-xs space-y-4 text-center">
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.35em] text-slate-500 mb-1">Conexión perdida</p>
                    <h2 className="text-3xl font-black uppercase tracking-widest text-rose-500"
                      style={{ textShadow: '0 0 20px #f43f5e88' }}>Fin</h2>
                    <p className="text-slate-400 font-mono text-sm mt-1">
                      Puntuación: <span className="text-white font-bold">{score}</span>
                    </p>
                    <p className="text-slate-600 font-mono text-[10px] mt-0.5"
                      style={{ color: lv.snake + 'aa' }}>{lv.name}</p>
                  </div>

                  {!hasSaved ? (
                    <form onSubmit={saveScore} className="space-y-2.5 text-left">
                      <p className="text-[9px] uppercase font-mono text-slate-500 pl-1">Nombre para el ranking</p>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" value={playerName}
                          onChange={e => setPlayerName(e.target.value)}
                          placeholder="TU NOMBRE"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 px-9 py-2 rounded-lg
                                     text-slate-100 placeholder:text-slate-600 font-mono uppercase text-xs focus:outline-none transition-colors"
                          maxLength={10} autoFocus />
                      </div>
                      <button type="submit" disabled={!playerName.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2 font-bold uppercase
                                   tracking-widest rounded-lg text-xs text-white transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: '#f43f5e' }}>
                        <Save className="w-3.5 h-3.5" /> Guardar en Ranking
                      </button>
                    </form>
                  ) : (
                    <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                      className="font-mono text-xs uppercase text-emerald-400 py-1">
                      ✓ ¡Puntuación guardada!
                    </motion.p>
                  )}

                  <button onClick={startGame}
                    className="w-full py-2 border-2 border-cyan-400 text-cyan-400 font-bold uppercase
                               tracking-widest rounded-lg text-xs hover:bg-cyan-400 hover:text-slate-950 transition-all">
                    Reiniciar
                  </button>
                </div>
              )}

              {/* ── START SCREEN ── */}
              {!isPaused && !gameOver && (
                <div className="space-y-5 text-center w-full max-w-xs">
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-slate-500 mb-2">
                      Sistema listo
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-cyan-400"
                      style={{ textShadow: '0 0 28px #00ffff66, 0 0 60px #00ffff22' }}>
                      Ritmo Neón
                    </h2>
                    <p className="text-[10px] font-mono text-slate-500 tracking-[0.25em] uppercase mt-1">
                      5 niveles · laberintos · velocidad extrema
                    </p>
                  </div>

                  <button onClick={startGame}
                    className="flex items-center gap-2 mx-auto px-8 py-3 border-2 border-cyan-400 text-cyan-400
                               font-black uppercase tracking-widest text-sm hover:bg-cyan-400 hover:text-slate-950
                               transition-all"
                    style={{ boxShadow: '0 0 24px #00ffff33' }}>
                    <Play className="w-4 h-4" /> Iniciar pulso
                  </button>

                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                    ↑ ↓ ← → o WASD · espacio para pausar
                  </p>

                  {/* Level dots */}
                  <div className="flex items-end justify-center gap-2 pt-1">
                    {LEVELS.map(l => (
                      <div key={l.id} className="text-center">
                        <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1"
                          style={{ background: l.snake, boxShadow: `0 0 6px ${l.snake}88` }} />
                        <span className="text-[7px] font-mono text-slate-600 uppercase">
                          {l.threshold === 0 ? 'inicio' : `${l.threshold}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile D-pad */}
      <div className="sm:hidden mt-1 flex flex-col items-center gap-1.5">
        <button onPointerDown={() => tap(0, -1)}
          className="w-14 h-14 flex items-center justify-center bg-slate-800/70 border border-slate-700
                     rounded-xl text-slate-300 active:bg-cyan-400 active:text-slate-950 transition-colors">
          <ArrowUp className="w-6 h-6" />
        </button>
        <div className="flex gap-1.5">
          {([[-1, 0, ArrowLeft], [0, 1, ArrowDown], [1, 0, ArrowRight]] as [number, number, any][]).map(([nx, ny, Icon], idx) => (
            <button key={idx} onPointerDown={() => tap(nx, ny)}
              className="w-14 h-14 flex items-center justify-center bg-slate-800/70 border border-slate-700
                         rounded-xl text-slate-300 active:bg-cyan-400 active:text-slate-950 transition-colors">
              <Icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ background: lv.snake, boxShadow: `0 0 6px ${lv.snake}` }} />
          Serpiente cyber
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ background: lv.food, boxShadow: `0 0 6px ${lv.food}` }} />
          Núcleo de energía
        </div>
      </div>
    </div>
  );
}