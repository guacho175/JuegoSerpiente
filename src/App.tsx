import React, { useState, useEffect } from 'react';
import NeonSnake from './components/NeonSnake';
import NeonMusicPlayer from './components/NeonMusicPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { ListOrdered, Trophy } from 'lucide-react';

interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

export default function App() {
  const [playLoseTrack, setPlayLoseTrack] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [ranking, setRanking] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const loadRanking = () => {
      const saved = JSON.parse(localStorage.getItem('ritmo_neon_ranking') || '[]');
      setRanking(saved);
    };
    
    loadRanking();
    window.addEventListener('rankingUpdated', loadRanking);
    return () => window.removeEventListener('rankingUpdated', loadRanking);
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex flex-col font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-magenta-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Header - Very Compact & Sticky */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full pt-1.5 sm:pt-3 pb-1 px-4 flex flex-col items-center z-50 sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-slate-900"
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

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-full z-10 relative min-h-0 lg:h-[calc(100vh-64px)]">
        {/* Ranking Sidebar (LEFT) - Compact */}
        <motion.aside 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-44 xl:w-52 p-2 sm:p-3 lg:border-r border-slate-800 bg-slate-900/30 backdrop-blur-md order-2 lg:order-1 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-2">
            <ListOrdered className="w-3.5 h-3.5 text-magenta-500" />
            <h2 className="text-[10px] sm:text-xs font-bold text-slate-100 uppercase tracking-widest italic">Ranking</h2>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[120px] lg:max-h-full pr-1 custom-scrollbar">
            {ranking.length > 0 ? (
              ranking.map((entry, index) => (
                <div 
                  key={index}
                  className="group flex items-center justify-between p-1 bg-slate-800/20 border border-slate-700/30 rounded hover:border-magenta-500/50 transition-all"
                >
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
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-2 border border-dashed border-slate-800 rounded">
                <p className="text-[7px] font-mono text-slate-600 uppercase">Vacío</p>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Game Area - Maximum Priority */}
        <main className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 lg:p-4 order-1 lg:order-2 overflow-hidden relative bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:40px_40px]">
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

      {/* Footer / Music Player - Floating compact panel on the right */}
      <footer className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 pointer-events-none hidden sm:block">
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-64 sm:w-80 pointer-events-auto"
        >
          <NeonMusicPlayer playLoseTrack={playLoseTrack} isGameStarted={isGameStarted} />
        </motion.div>
      </footer>

      {/* Mobile Music Player - Fixed bottom strip */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pointer-events-auto bg-[#0c0c0e]/95 backdrop-blur-md border-t border-slate-900">
        <div className="max-w-md mx-auto">
          <NeonMusicPlayer playLoseTrack={playLoseTrack} isGameStarted={isGameStarted} />
        </div>
      </footer>

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
    </div>
  );
}
