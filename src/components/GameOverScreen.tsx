import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Car, Trophy, Award, Gauge, Navigation } from 'lucide-react';
import { GameSession, PlayerStats } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface GameOverScreenProps {
  session: GameSession;
  stats: PlayerStats;
  isNewHighscore: boolean;
  hapticsEnabled: boolean;
  onPlayAgain: () => void;
  onOpenGarage: () => void;
  onMainMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  session,
  stats,
  isNewHighscore,
  hapticsEnabled,
  onPlayAgain,
  onOpenGarage,
  onMainMenu,
}) => {
  useEffect(() => {
    if (isNewHighscore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#06b6d4', '#eab308', '#ec4899'],
        });
      } catch {
        // Fallback safe
      }
    }
  }, [isNewHighscore]);

  const handleAction = (cb: () => void) => {
    haptics.tap(hapticsEnabled);
    soundManager.playClick();
    cb();
  };

  const distanceKm = (session.distance / 1000).toFixed(2);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#06080e]/90 backdrop-blur-lg pointer-events-auto">
      <div className="w-full max-w-sm bg-slate-950/95 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        {/* Banner: New Highscore or Collision */}
        <div>
          {isNewHighscore ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-xs font-bold mb-2">
              <Trophy className="w-4 h-4 fill-current text-amber-400" />
              <span>NEW PERSONAL BEST!</span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest block mb-1">
              Vehicle Totaled
            </span>
          )}

          <h2 className="font-racing text-4xl font-black text-white tracking-wide">
            GAME OVER
          </h2>
        </div>

        {/* Primary Score Stat Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-inner">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Final Score
          </span>
          <span className="font-mono-num text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 tracking-tight">
            {session.score.toLocaleString()}
          </span>
          <div className="text-[11px] text-slate-500 mt-1 font-mono-num">
            Career Best: {stats.highScore.toLocaleString()}
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Distance */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2.5">
            <Navigation className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Distance</span>
            <span className="font-mono-num text-sm font-bold text-white">
              {distanceKm} <span className="text-[10px] text-slate-400 font-normal">km</span>
            </span>
          </div>

          {/* Near Misses */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2.5">
            <Award className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Near Miss</span>
            <span className="font-mono-num text-sm font-bold text-amber-400">
              {session.nearMisses}
            </span>
          </div>

          {/* Max Speed */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2.5">
            <Gauge className="w-4 h-4 mx-auto text-orange-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Max Speed</span>
            <span className="font-mono-num text-sm font-bold text-white">
              {session.maxSpeed} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Play Again */}
          <button
            onClick={() => handleAction(onPlayAgain)}
            className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-slate-950 font-racing text-2xl font-black rounded-2xl shadow-xl glow-orange active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-6 h-6 stroke-[2.5]" />
            <span>PLAY AGAIN</span>
          </button>

          {/* Garage & Main Menu */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction(onOpenGarage)}
              className="py-3 px-3 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Car className="w-4 h-4 text-cyan-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={() => handleAction(onMainMenu)}
              className="py-3 px-3 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4 text-slate-300" />
              <span>MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
