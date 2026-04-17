import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Save, User } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;
const FOOD_COUNT = 3;

interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

interface NeonSnakeProps {
  onGameOver?: (score: number) => void;
  onReset?: () => void;
  onStart?: () => void;
}

export default function NeonSnake({ onGameOver, onReset, onStart }: NeonSnakeProps) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [foods, setFoods] = useState<{ x: number, y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [hasSaved, setHasSaved] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFoods = useCallback((count = FOOD_COUNT, currentSnake = INITIAL_SNAKE) => {
    const newFoods: { x: number, y: number }[] = [];
    while (newFoods.length < count) {
      const food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some(seg => seg.x === food.x && seg.y === food.y);
      const onOtherFood = newFoods.some(f => f.x === food.x && f.y === food.y);
      if (!onSnake && !onOtherFood) {
        newFoods.push(food);
      }
    }
    setFoods(newFoods);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    setHasSaved(false);
    setPlayerName('');
    generateFoods(FOOD_COUNT, INITIAL_SNAKE);
    if (onReset) onReset();
    if (onStart) onStart();
  };

  const saveScore = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!playerName.trim()) return;

    const newEntry: ScoreEntry = {
      name: playerName.trim(),
      score,
      date: new Date().toLocaleDateString()
    };

    const existingScores = JSON.parse(localStorage.getItem('ritmo_neon_ranking') || '[]');
    const newScores = [...existingScores, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem('ritmo_neon_ranking', JSON.stringify(newScores));
    setHasSaved(true);
    // Dispatch event to update ranking sidebar in App.tsx
    window.dispatchEvent(new Event('rankingUpdated'));
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted || isPaused) return;

    setSnake((currentSnake) => {
      const head = currentSnake[0];
      const nextX = head.x + direction.x;
      const nextY = head.y + direction.y;

      // Wall Collision (NEW)
      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
        setGameOver(true);
        setGameStarted(false);
        if (onGameOver) onGameOver(score);
        return currentSnake;
      }

      const newHead = { x: nextX, y: nextY };

      // Self Collision
      if (currentSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setGameStarted(false);
        if (onGameOver) onGameOver(score);
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];

      // Food consumption
      const foodIndex = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
      if (foodIndex !== -1) {
        setScore((s) => s + 10);
        const updatedFoods = [...foods];
        updatedFoods.splice(foodIndex, 1);
        
        let newFood;
        while (true) {
          newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          };
          const onSnake = newSnake.some(seg => seg.x === newFood?.x && seg.y === newFood?.y);
          const onOtherFood = updatedFoods.some(f => f.x === newFood?.x && f.y === newFood?.y);
          if (!onSnake && !onOtherFood) break;
        }
        setFoods([...updatedFoods, newFood]);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, foods, gameOver, gameStarted, isPaused, score, onGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      if (e.key === ' ' || e.key === 'p') {
        setIsPaused(prev => !prev);
        return;
      }
      if (isPaused) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted, gameOver, isPaused]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, isPaused, moveSnake]);

  return (
    <div className="flex flex-col items-center justify-center p-1 sm:p-2 w-full max-w-full">
      <div className="mb-2 sm:mb-4 flex items-center justify-between w-full max-w-md px-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <span className="font-mono text-base sm:text-xl font-bold text-cyan-400">PUNTOS: {score}</span>
        </div>
        
        {gameStarted && !gameOver && (
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-2 px-2 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-400 hover:text-cyan-400 font-mono text-[10px] sm:text-xs uppercase"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Continuar' : 'Pausa'}
          </button>
        )}
      </div>

      <div className="relative p-1 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 w-full max-w-[min(90vw,min(70vh,600px))] aspect-square group-hover:border-cyan-500/50 transition-colors">
        <div 
          className="grid gap-[1px] bg-slate-900 border border-slate-700 w-full h-full"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnake = snake.some((s) => s.x === x && s.y === y);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isFood = foods.some(f => f.x === x && f.y === y);

            return (
              <div
                key={i}
                className={`w-full h-full rounded-[1px] sm:rounded-[2px] transition-all duration-200 ${
                  isHead 
                    ? 'bg-cyan-400 shadow-neon-cyan z-10' 
                    : isSnake 
                    ? 'bg-cyan-600/60' 
                    : isFood 
                    ? 'bg-magenta-500 animate-pulse shadow-neon-magenta' 
                    : 'bg-slate-800/20'
                }`}
                style={{
                  backgroundColor: isFood ? '#ff00ff' : isHead ? '#00ffff' : isSnake ? 'rgba(0, 255, 255, 0.4)' : undefined
                }}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {(!gameStarted || gameOver || isPaused) && (
            <motion.div
              key={isPaused ? 'paused' : gameOver ? 'gameover' : 'start'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-8 text-center z-20"
            >
              {isPaused ? (
                <div className="space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-bold text-cyan-400 text-neon-cyan uppercase tracking-widest">Pausa</h2>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-3 bg-cyan-400 text-slate-950 font-bold uppercase tracking-widest hover:shadow-neon-cyan transition-all"
                  >
                    Continuar
                  </button>
                </div>
              ) : gameOver ? (
                <div className="space-y-6 w-full max-w-sm">
                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-bold text-magenta-500 text-neon-magenta uppercase tracking-widest">Fin del Juego</h2>
                    <p className="text-slate-400 font-mono text-sm sm:text-base">Puntuación Final: {score}</p>
                  </div>

                  {!hasSaved ? (
                    <form onSubmit={saveScore} className="space-y-3">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] uppercase font-mono text-slate-500 px-1">Tu Nombre</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Escribe tu nombre..."
                            className="w-full bg-slate-900 border border-slate-700 px-10 py-2.5 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-magenta-500 transition-colors font-mono uppercase text-sm"
                            maxLength={10}
                            autoFocus
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!playerName.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-magenta-500 text-white font-bold uppercase tracking-widest rounded-lg hover:bg-magenta-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        Guardar Rango
                      </button>
                    </form>
                  ) : (
                    <div className="text-magenta-400 font-mono text-xs uppercase animate-pulse">
                      ¡Puntuación guardada!
                    </div>
                  )}

                  <button
                    onClick={resetGame}
                    className="w-full py-2.5 bg-transparent border-2 border-cyan-400 text-cyan-400 font-bold uppercase tracking-widest rounded-lg hover:bg-cyan-400 hover:text-slate-950 transition-all"
                  >
                    Reiniciar
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-bold text-cyan-400 text-neon-cyan uppercase tracking-widest">Ritmo Neón</h2>
                    <p className="text-slate-400 font-mono text-xs sm:text-sm">Domina el ritmo de la red</p>
                  </div>

                  <button
                    onClick={resetGame}
                    className="px-8 py-3 bg-transparent border-2 border-cyan-400 text-cyan-400 font-bold uppercase tracking-widest hover:bg-cyan-400 hover:text-slate-950 hover:shadow-neon-cyan transition-all"
                  >
                    <div className="flex items-center gap-2">
                       <Play className="w-5 h-5" />
                       Iniciar Pulso
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* On-screen Controls for Mobile */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:hidden">
        <div />
        <button 
          onPointerDown={() => !isPaused && direction.y !== 1 && setDirection({ x: 0, y: -1 })}
          className="w-12 h-12 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 active:bg-cyan-400 active:text-slate-950"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />
        <button 
          onPointerDown={() => !isPaused && direction.x !== 1 && setDirection({ x: -1, y: 0 })}
          className="w-12 h-12 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 active:bg-cyan-400 active:text-slate-950"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onPointerDown={() => !isPaused && direction.y !== -1 && setDirection({ x: 0, y: 1 })}
          className="w-12 h-12 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 active:bg-cyan-400 active:text-slate-950"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <button 
          onPointerDown={() => !isPaused && direction.x !== -1 && setDirection({ x: 1, y: 0 })}
          className="w-12 h-12 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 active:bg-cyan-400 active:text-slate-950"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-4 text-[9px] sm:text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-400 shadow-neon-cyan rounded-full" />
          <span>SERPIENTE CYBER</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-magenta-500 shadow-neon-magenta rounded-full" />
          <span>NÚCLEO ENERGÍA</span>
        </div>
      </div>
    </div>
  );
}
