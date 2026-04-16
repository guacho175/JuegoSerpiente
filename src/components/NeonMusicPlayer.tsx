import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music2 } from 'lucide-react';
import { DUMMY_TRACKS, LOSE_TRACK } from '../constants';

interface NeonMusicPlayerProps {
  playLoseTrack?: boolean;
  isGameStarted?: boolean;
}

export default function NeonMusicPlayer({ playLoseTrack, isGameStarted }: NeonMusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentTrack = playLoseTrack ? LOSE_TRACK : DUMMY_TRACKS[currentTrackIndex];

  // Auto-play when game starts
  useEffect(() => {
    if (isGameStarted && !playLoseTrack) {
      setIsPlaying(true);
    }
  }, [isGameStarted, playLoseTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // We call play() whenever isPlaying is true, 
        // including when the track URL changes
        audioRef.current.play().catch(err => {
          console.error("Audio play failed:", err);
          if (!isGameStarted && !playLoseTrack) setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack.url, playLoseTrack, isGameStarted]);

  // If game is over, we should force play the lose track
  useEffect(() => {
    if (playLoseTrack) {
      setIsPlaying(true);
    }
  }, [playLoseTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleTrackEnd = () => {
    skipForward();
  };

  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % DUMMY_TRACKS.length);
    setIsPlaying(true);
  };

  const skipBack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + DUMMY_TRACKS.length) % DUMMY_TRACKS.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleTrackEnd}
      />
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Album Art */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
            <motion.div 
              animate={{ 
                rotate: isPlaying ? 360 : 0,
                scale: isPlaying ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 8, ease: "linear" },
                scale: { repeat: Infinity, duration: 1, ease: "easeInOut" }
              }}
              className="w-full h-full rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600"
              style={{ 
                boxShadow: `0 0 15px ${currentTrack.color}33`,
                borderColor: currentTrack.color 
              }}
            >
              <Music2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTrack.color }} />
            </motion.div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold truncate text-slate-100 uppercase tracking-wide" style={{ textShadow: `0 0 8px ${currentTrack.color}66` }}>
              {currentTrack.title}
            </h3>
            <p className="text-slate-500 font-mono text-[8px] sm:text-[10px] uppercase truncate">{currentTrack.artist}</p>
          </div>

          {/* Controls - Compact */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={skipBack}
              className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-950 hover:bg-[#ff00ff] hover:text-white transition-all transform active:scale-90"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
            </button>

            <button 
              onClick={skipForward}
              className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Meta */}
        <div className="space-y-1.5">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden cursor-pointer group">
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                width: `${progress}%`,
                backgroundColor: currentTrack.color,
                boxShadow: `0 0 8px ${currentTrack.color}`
              }}
            />
          </div>
          <div className="flex justify-between font-mono text-[7px] text-slate-600 uppercase tracking-tighter">
            <span>{isPlaying ? 'Phase: Active' : 'Phase: Idle'}</span>
            <span>Buffer: Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
