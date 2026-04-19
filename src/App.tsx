import React, { useState, useEffect } from 'react';
import NeonSnake from './components/NeonSnake';
import NeonMusicPlayer from './components/NeonMusicPlayer';
import { motion } from 'motion/react';
import { ListOrdered, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreEntry {
  name: string;
  score: number;
  difficulty?: string;
  date: string;
}

export default function App() {
  const [playLoseTrack, setPlayLoseTrack] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [ranking, setRanking] = useState<ScoreEntry[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);

  useEffect(() => {
    const loadRanking = async () => {
      const sheetUrl = import.meta.env.VITE_SHEETDB_URL;
      setIsLoadingRanking(true);
      
      if (sheetUrl) {
        try {
          const res = await fetch(sheetUrl, { cache: 'no-store' });
          if (res.ok) {
            const data: any[] = await res.json();
            const parsed: ScoreEntry[] = data.map(row => ({
              name: String(row.name || 'ANON'),
              score: parseInt(row.score, 10) || 0,
              difficulty: String(row.difficulty || ''),
              date: String(row.date || '')
            }));
            const sorted = parsed.sort((a, b) => b.score - a.score).slice(0, 10);
            setRanking(sorted);
            setIsLoadingRanking(false);
            return;
          }
        } catch (error) {
          console.error("Fallo conectando a SheetDB, usando respaldo local:", error);
        }
      }
      
      // Fallback a localStorage
      const saved = JSON.parse(localStorage.getItem('ritmo_neon_ranking') || '[]');
      setRanking(saved);
      setIsLoadingRanking(false);
    };
    
    loadRanking();
    window.addEventListener('rankingUpdated', loadRanking);
    return () => window.removeEventListener('rankingUpdated', loadRanking);
  }, []);

  return (
    // overflow-hidden impide que las flechas del teclado hagan scroll en la página
    <div className="h-screen w-screen overflow-hidden bg-[#0c0c0e] flex flex-col font-sans selection:bg-cyan-500/30 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-magenta-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full pt-1.5 sm:pt-3 pb-1 px-4 flex flex-col items-center z-50 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-slate-900 flex-shrink-0"
      >
        <div className="flex items-baseline gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-2xl font-black italic text-slate-100 tracking-tighter uppercase relative">
            Ritmo
            <span className="text-cyan-400 text-neon-cyan">Neón</span>
            <span className="absolute -top-1 -right-4 sm:-top-1.5 sm:-right-5 text-[6px] sm:text-[8px] font-mono text-magenta-500 font-bold bg-magenta-500/10 px-0.5 py-0.2 rounded border border-magenta-500/20">V1.1</span>
          </h1>
        </div>
        <p className="text-slate-500 font-mono tracking-[0.3em] text-[6px] sm:text-[8px] uppercase text-center leading-none">
          Hecho por <span className="text-cyan-400 font-bold">Galindez</span>
        </p>
      </motion.header>

      {/* Main Content — fills remaining height, no scroll */}
      <div className="flex-1 flex flex-col w-full z-10 relative min-h-0">
        {/* Ranking Sidebar */}
        <motion.aside
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:absolute lg:left-0 lg:top-0 lg:bottom-0 z-20 lg:w-44 xl:w-52 p-2 sm:p-3 lg:border-r border-t lg:border-t-0 border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col flex-shrink-0"
        >
          <button
            onClick={() => setRankingOpen(o => !o)}
            className="flex items-center gap-2 mb-2 lg:pointer-events-none w-full"
          >
            <ListOrdered className="w-3.5 h-3.5 text-magenta-500" />
            <h2 className="text-[10px] sm:text-xs font-bold text-slate-100 uppercase tracking-widest italic">Ranking</h2>
            <span className="lg:hidden ml-auto text-slate-500">
              {rankingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          <div className={`flex-1 space-y-1.5 overflow-y-auto pr-1 transition-all duration-300
            ${rankingOpen ? 'max-h-[140px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
            lg:max-h-none lg:opacity-100 lg:overflow-y-auto`}>
            {isLoadingRanking ? (
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">Sincronizando...</p>
              </div>
            ) : ranking.length > 0 ? (
              ranking.map((entry, index) => (
                <div
                  key={index}
                  className="group flex flex-col p-1 bg-slate-800/20 border border-slate-700/30 rounded hover:border-magenta-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`font-mono font-black italic text-[10px] ${index < 3 ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-100 uppercase truncate max-w-[50px] sm:max-w-[70px]">{entry.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] sm:text-[10px] font-black text-magenta-500 leading-none">{entry.score}</p>
                    </div>
                  </div>
                  {entry.difficulty && (
                    <div className="flex justify-start ml-3">
                      <p className="text-[6px] sm:text-[7px] text-slate-500 uppercase tracking-wider">{entry.difficulty}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-2 border border-dashed border-slate-800 rounded">
                <p className="text-[7px] font-mono text-slate-600 uppercase">Vacío</p>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Game Area */}
        <main className="flex-1 flex flex-col items-center justify-center w-full h-full p-1 sm:p-2 lg:p-4 overflow-hidden relative bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:40px_40px]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full h-full flex items-center justify-center"
          >
            <NeonSnake
              onGameOver={() => {
                setPlayLoseTrack(true);
                setIsGameStarted(false);
              }}
              onReset={() => setPlayLoseTrack(false)}
              onStart={() => {
                setIsGameStarted(true);
                setPlayLoseTrack(false);
              }}
            />
          </motion.div>
        </main>
      </div>

      {/* ── UNA SOLA instancia del player, compartida entre desktop y mobile ── */}
      {/* Desktop: floating bottom-right */}
      <div className="hidden sm:block fixed bottom-4 right-4 z-50 w-72 lg:w-80">
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <NeonMusicPlayer playLoseTrack={playLoseTrack} isGameStarted={isGameStarted} />
        </motion.div>
      </div>

      {/* Mobile: strip at the bottom — in flow, not fixed */}
      <div className="sm:hidden w-full flex-shrink-0 bg-[#0c0c0e]/95 backdrop-blur-md border-t border-slate-900 z-50">
        <div className="max-w-md mx-auto">
          <NeonMusicPlayer playLoseTrack={playLoseTrack} isGameStarted={isGameStarted} />
        </div>
      </div>

      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
    </div>
  );
}
