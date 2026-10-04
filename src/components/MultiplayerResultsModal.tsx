import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, Home, Coins } from 'lucide-react';
import { NetworkPlayer } from '../network/multiplayerClient';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface MultiplayerResultsModalProps {
  players: NetworkPlayer[];
  myPlayerId: string;
  hapticsEnabled: boolean;
  onBackToLobby: () => void;
  onMainMenu: () => void;
}

export const MultiplayerResultsModal: React.FC<MultiplayerResultsModalProps> = ({
  players,
  myPlayerId,
  hapticsEnabled,
  onBackToLobby,
  onMainMenu,
}) => {
  // Sort players by total score / distance
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isCrashed && !b.isCrashed) return 1;
    if (!a.isCrashed && b.isCrashed) return -1;
    return (b.score || b.zDistance) - (a.score || a.zDistance);
  });

  const myRankIndex = sortedPlayers.findIndex((p) => p.id === myPlayerId);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : 1;
  const isWinner = myRank === 1;

  useEffect(() => {
    if (isWinner) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#f97316', '#eab308', '#3b82f6'],
        });
      } catch {
        // Safe
      }
    }
  }, [isWinner]);

  const handleAction = (cb: () => void) => {
    haptics.tap(hapticsEnabled);
    soundManager.playClick();
    cb();
  };

  const coinsEarned = isWinner ? 300 : myRank === 2 ? 150 : 75;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-[#06080e]/90 backdrop-blur-xl pointer-events-auto">
      <div className="w-full max-w-sm bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        {/* Match Header */}
        <div>
          {isWinner ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-500 dark:text-amber-400 text-xs font-bold mb-2">
              <Trophy className="w-4 h-4 fill-current text-amber-500" />
              <span>VICTORY! 1ST PLACE CHAMPION</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 rounded-full text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-2">
              <Award className="w-4 h-4" />
              <span>FINISHED #{myRank} PLACE</span>
            </div>
          )}

          <h2 className="font-racing text-3xl font-black text-slate-900 dark:text-white tracking-wide">
            MULTIPLAYER RESULTS
          </h2>
        </div>

        {/* Podium Standings List */}
        <div className="bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2.5">
          {sortedPlayers.map((p, idx) => {
            const rank = idx + 1;
            const isMe = p.id === myPlayerId;

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  rank === 1
                    ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white font-bold'
                    : isMe
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-racing text-xs font-black ${
                      rank === 1
                        ? 'bg-amber-500 text-slate-950'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : 'bg-amber-800 text-amber-100'
                    }`}
                  >
                    #{rank}
                  </span>

                  <div className="text-left">
                    <span className="text-xs font-bold block leading-tight">
                      {p.name} {isMe && '(YOU)'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono-num">
                      {(p.zDistance / 1000).toFixed(2)} km
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono-num">
                  <span className="text-xs font-extrabold text-amber-500 dark:text-amber-400 block">
                    {p.score.toLocaleString()} pts
                  </span>
                  {p.isCrashed && (
                    <span className="text-[9px] text-red-500 font-bold block">CRASHED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coins Reward Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
            +{coinsEarned.toLocaleString()} Multiplayer Coins Earned
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => handleAction(onBackToLobby)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-racing text-xl font-extrabold tracking-wider rounded-xl shadow-xl glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>RETURN TO LOBBY</span>
          </button>

          <button
            onClick={() => handleAction(onMainMenu)}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
