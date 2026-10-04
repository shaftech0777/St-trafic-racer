import React from 'react';
import { Play, Settings as SettingsIcon, Car, HelpCircle, Smartphone, Compass } from 'lucide-react';
import { PlayerStats, GameSettings, CarSpec } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface MainMenuProps {
  stats: PlayerStats;
  settings: GameSettings;
  activeCar: CarSpec;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onToggleControlScheme: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  settings,
  activeCar,
  onPlay,
  onOpenGarage,
  onOpenSettings,
  onOpenHowToPlay,
  onToggleControlScheme,
}) => {
  const handleAction = (cb: () => void) => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    cb();
  };

  const formattedDistance = (stats.totalDistanceMeters / 1000).toFixed(1);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-slate-100/90 via-transparent to-slate-100/95 dark:from-[#06080e]/85 dark:via-transparent dark:to-[#06080e]/95 pointer-events-auto">
      {/* Top Header Stats & Control Switcher */}
      <div className="w-full flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/racer_app_icon_1791113447385.jpg"
            alt="Logo"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 shadow-md object-cover"
          />
          <div>
            <h1 className="font-racing text-2xl font-bold tracking-wide text-slate-900 dark:text-white leading-tight">
              ST TRAFIC RACER
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wider">
              POWERED BY ST SOLUTIONS
            </p>
          </div>
        </div>

        {/* Quick Controls Scheme Badge / Toggle Button */}
        <button
          onClick={() => handleAction(onToggleControlScheme)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 active:scale-95 transition-all shadow-sm"
          title="Click to toggle steering control scheme"
        >
          {settings.controlScheme === 'tilt' ? (
            <>
              <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Tilt Steer</span>
            </>
          ) : settings.controlScheme === 'wheel' ? (
            <>
              <Car className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Wheel Steer</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              <span>Touch Buttons</span>
            </>
          )}
        </button>
      </div>

      {/* Center High Score & Active Car Card */}
      <div className="flex flex-col items-center justify-center my-auto space-y-4">
        {/* Career Best Stats */}
        <div className="w-full max-w-xs bg-white/90 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-around">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Best Score
            </span>
            <span className="font-mono-num text-2xl font-bold text-amber-500 dark:text-amber-400 tracking-tight">
              {stats.highScore.toLocaleString()}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />

          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Distance
            </span>
            <span className="font-mono-num text-2xl font-bold text-cyan-600 dark:text-cyan-400 tracking-tight">
              {formattedDistance} <span className="text-xs font-normal text-slate-400">km</span>
            </span>
          </div>
        </div>

        {/* Active Car Pill */}
        <button
          onClick={() => handleAction(onOpenGarage)}
          className="flex items-center gap-3 px-4 py-2 bg-white/90 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-slate-300 active:scale-98 transition-all shadow-sm"
        >
          <div
            className="w-3.5 h-3.5 rounded-full shadow-sm"
            style={{ backgroundColor: activeCar.bodyColor }}
          />
          <span className="font-semibold text-slate-900 dark:text-white">{activeCar.name}</span>
          <span className="text-slate-500 font-mono-num">({activeCar.topSpeed} km/h)</span>
        </button>
      </div>

      {/* Bottom Action Menu */}
      <div className="w-full max-w-sm mx-auto space-y-3 pb-2">
        {/* Primary Play Button */}
        <button
          onClick={() => handleAction(onPlay)}
          className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-racing text-2xl font-extrabold tracking-wider rounded-2xl shadow-xl glow-orange active:scale-95 transition-all flex items-center justify-center gap-3 group"
        >
          <Play className="w-6 h-6 fill-current text-slate-950 transition-transform group-hover:scale-110" />
          <span>START RACE</span>
        </button>

        {/* Secondary Buttons Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => handleAction(onOpenGarage)}
            className="flex flex-col items-center justify-center py-3 px-2 bg-white/90 hover:bg-slate-100 dark:bg-slate-900/85 dark:hover:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 active:scale-95 transition-all shadow-md"
          >
            <Car className="w-5 h-5 mb-1 text-cyan-600 dark:text-cyan-400" />
            <span className="text-[11px] font-bold tracking-wide uppercase">Garage</span>
          </button>

          <button
            onClick={() => handleAction(onOpenSettings)}
            className="flex flex-col items-center justify-center py-3 px-2 bg-white/90 hover:bg-slate-100 dark:bg-slate-900/85 dark:hover:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 active:scale-95 transition-all shadow-md"
          >
            <SettingsIcon className="w-5 h-5 mb-1 text-slate-600 dark:text-slate-300" />
            <span className="text-[11px] font-bold tracking-wide uppercase">Settings</span>
          </button>

          <button
            onClick={() => handleAction(onOpenHowToPlay)}
            className="flex flex-col items-center justify-center py-3 px-2 bg-white/90 hover:bg-slate-100 dark:bg-slate-900/85 dark:hover:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 active:scale-95 transition-all shadow-md"
          >
            <HelpCircle className="w-5 h-5 mb-1 text-amber-500 dark:text-amber-400" />
            <span className="text-[11px] font-bold tracking-wide uppercase">Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
