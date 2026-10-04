import React from 'react';
import { Play, RotateCcw, Home, Settings as SettingsIcon } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
  hapticsEnabled: boolean;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
  hapticsEnabled,
}) => {
  const handleAction = (cb: () => void) => {
    haptics.tap(hapticsEnabled);
    soundManager.playClick();
    cb();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#06080e]/85 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-xs bg-slate-950/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <div>
          <h2 className="font-racing text-3xl font-extrabold text-white tracking-wide">
            PAUSED
          </h2>
          <p className="text-xs text-slate-400 font-medium">Take a breath, then rejoin the tarmac</p>
        </div>

        <div className="space-y-2.5">
          {/* Resume */}
          <button
            onClick={() => handleAction(onResume)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-slate-950 font-racing text-xl font-black rounded-xl shadow-lg glow-orange active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => handleAction(onRestart)}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-semibold text-sm rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Restart Race</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => handleAction(onOpenSettings)}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-semibold text-sm rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <SettingsIcon className="w-4 h-4 text-slate-300" />
            <span>Settings</span>
          </button>

          {/* Main Menu */}
          <button
            onClick={() => handleAction(onMainMenu)}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-semibold text-sm rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
