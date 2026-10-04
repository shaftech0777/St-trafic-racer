import React, { useState, useEffect } from 'react';
import { Pause, Flame, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { GameSession, GameSettings } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface GameHUDProps {
  session: GameSession;
  settings: GameSettings;
  steerValue: number;
  onPause: () => void;
  onSteerTouch: (direction: number) => void;
  onNitroTouch: (active: boolean) => void;
  onQuickCalibrateTilt: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  session,
  settings,
  steerValue,
  onPause,
  onSteerTouch,
  onNitroTouch,
  onQuickCalibrateTilt,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  // Keyboard desktop controls support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        onSteerTouch(-1);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        onSteerTouch(1);
      } else if (e.key === ' ' || e.key === 'Shift') {
        haptics.nitro(settings.hapticsEnabled);
        soundManager.playNitro();
        onNitroTouch(true);
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        onPause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        onSteerTouch(0);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        onSteerTouch(0);
      } else if (e.key === ' ' || e.key === 'Shift') {
        onNitroTouch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onSteerTouch, onNitroTouch, onPause, settings.hapticsEnabled]);

  const handlePause = () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onPause();
  };

  const handleTouchLeft = (pressed: boolean) => {
    setLeftPressed(pressed);
    onSteerTouch(pressed ? -1 : rightPressed ? 1 : 0);
  };

  const handleTouchRight = (pressed: boolean) => {
    setRightPressed(pressed);
    onSteerTouch(pressed ? 1 : leftPressed ? -1 : 0);
  };

  const handleNitroPress = (active: boolean) => {
    if (active && session.nitroFuel > 15) {
      haptics.nitro(settings.hapticsEnabled);
      soundManager.playNitro();
    }
    onNitroTouch(active);
  };

  // Speedometer circular gauge math
  const maxDialSpeed = 260;
  const speedRatio = Math.min(1, Math.max(0, session.speed / maxDialSpeed));
  const strokeDashoffset = 180 - speedRatio * 180;

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5 pointer-events-none select-none">
      {/* Top Bar: Distance, Score, Pause */}
      <div className="w-full flex items-center justify-between">
        {/* Distance Traveled */}
        <div className="bg-slate-950/70 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl shadow-md pointer-events-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Distance
          </span>
          <span className="font-mono-num text-base sm:text-lg font-bold text-cyan-400">
            {(session.distance / 1000).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">km</span>
          </span>
        </div>

        {/* Center: Live Score */}
        <div className="text-center bg-slate-950/70 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-xl shadow-md pointer-events-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Score
          </span>
          <span className="font-mono-num text-lg sm:text-2xl font-black text-amber-400 tracking-tight">
            {session.score.toLocaleString()}
          </span>
        </div>

        {/* Pause Button */}
        <button
          onClick={handlePause}
          className="p-2.5 bg-slate-950/70 hover:bg-slate-800 backdrop-blur-md border border-white/10 rounded-xl text-slate-200 active:scale-90 transition-all pointer-events-auto shadow-md"
          title="Pause Game"
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>

      {/* Near Miss Floating Notification Alert */}
      {session.nearMissNotice && (
        <div className="mx-auto my-auto animate-bounce pointer-events-none">
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 border-2 border-cyan-300 px-5 py-2 rounded-2xl shadow-2xl glow-cyan text-center transform scale-110">
            <span className="font-racing text-xl sm:text-2xl font-black text-white tracking-wider block">
              NEAR MISS!
            </span>
            <div className="flex items-center justify-center gap-2 text-xs font-mono-num font-bold text-cyan-200">
              <span>+{session.nearMissNotice.points} PTS</span>
              {session.nearMissNotice.combo > 1 && (
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[11px] font-black">
                  {session.nearMissNotice.combo}X COMBO
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tilt Status Indicator (if in tilt mode) */}
      {settings.controlScheme === 'tilt' && (
        <div className="mx-auto flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Tilt Steer</span>
          {/* Subtle balance pip */}
          <div className="w-16 h-2 bg-slate-800 rounded-full relative overflow-hidden">
            <div
              className="w-2.5 h-2 bg-cyan-400 rounded-full absolute top-0 transition-transform duration-75"
              style={{
                left: '50%',
                transform: `translateX(-50%) translateX(${steerValue * 28}px)`,
              }}
            />
          </div>
          <button
            onClick={onQuickCalibrateTilt}
            className="text-[10px] text-cyan-300 font-bold hover:underline pl-1"
            title="Set current angle as center"
          >
            Calibrate
          </button>
        </div>
      )}

      {/* Bottom Controls Bar: Speedometer + Touch Controls + Nitro */}
      <div className="w-full flex items-end justify-between gap-3 pointer-events-auto pt-2">
        {/* Left: Speedometer Gauge */}
        <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl shadow-xl">
          {/* Circular dial SVG */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r="28"
                className="stroke-slate-800"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="36"
                cy="36"
                r="28"
                className={`transition-all duration-75 ${
                  session.isNitroActive ? 'stroke-cyan-400' : 'stroke-orange-500'
                }`}
                strokeWidth="5"
                strokeDasharray="180"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-racing text-lg font-black leading-none text-white font-mono-num">
                {session.speed}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase -mt-0.5">
                KM/H
              </span>
            </div>
          </div>
        </div>

        {/* Center / Left: Touch Steering Buttons (if in Touch Mode) */}
        {settings.controlScheme === 'touch' && (
          <div className="flex items-center gap-3">
            <button
              onPointerDown={() => handleTouchLeft(true)}
              onPointerUp={() => handleTouchLeft(false)}
              onPointerLeave={() => handleTouchLeft(false)}
              onPointerCancel={() => handleTouchLeft(false)}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-xl ${
                leftPressed
                  ? 'bg-orange-500/80 border-orange-400 text-white'
                  : 'bg-slate-950/80 border-white/15 text-slate-300 hover:text-white'
              }`}
              title="Steer Left"
            >
              <ChevronLeft className="w-9 h-9 stroke-[3]" />
            </button>

            <button
              onPointerDown={() => handleTouchRight(true)}
              onPointerUp={() => handleTouchRight(false)}
              onPointerLeave={() => handleTouchRight(false)}
              onPointerCancel={() => handleTouchRight(false)}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-xl ${
                rightPressed
                  ? 'bg-orange-500/80 border-orange-400 text-white'
                  : 'bg-slate-950/80 border-white/15 text-slate-300 hover:text-white'
              }`}
              title="Steer Right"
            >
              <ChevronRight className="w-9 h-9 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Right: Nitro Boost Button (Ergonomic thumb position) */}
        <div className="relative">
          <button
            onPointerDown={() => handleNitroPress(true)}
            onPointerUp={() => handleNitroPress(false)}
            onPointerLeave={() => handleNitroPress(false)}
            onPointerCancel={() => handleNitroPress(false)}
            disabled={session.nitroFuel < 15 && !session.isNitroActive}
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 shadow-2xl ${
              session.isNitroActive
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 border-cyan-300 glow-cyan text-white animate-pulse'
                : session.nitroFuel >= 15
                ? 'bg-slate-950/85 border-cyan-500/40 text-cyan-400 hover:border-cyan-400'
                : 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-60'
            }`}
            title="Nitro Boost"
          >
            <Flame className={`w-8 h-8 ${session.isNitroActive ? 'animate-bounce text-white' : ''}`} />
            <span className="font-racing text-xs font-black tracking-wider uppercase mt-0.5">
              NITRO
            </span>

            {/* Circular or bottom fuel bar */}
            <div className="absolute -bottom-1.5 w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-75 ${
                  session.isNitroActive ? 'bg-cyan-300' : 'bg-cyan-500'
                }`}
                style={{ width: `${session.nitroFuel}%` }}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
