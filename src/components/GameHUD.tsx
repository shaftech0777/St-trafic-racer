import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Flame, ChevronLeft, ChevronRight, Compass, Disc, Octagon } from 'lucide-react';
import { GameSession, GameSettings } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface GameHUDProps {
  session: GameSession;
  settings: GameSettings;
  steerValue: number;
  onPause: () => void;
  onSteerTouch: (direction: number) => void;
  onBrakeTouch: (active: boolean) => void;
  onNitroTouch: (active: boolean) => void;
  onQuickCalibrateTilt: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  session,
  settings,
  steerValue,
  onPause,
  onSteerTouch,
  onBrakeTouch,
  onNitroTouch,
  onQuickCalibrateTilt,
}) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [brakePressed, setBrakePressed] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const isDraggingWheelRef = useRef(false);

  // Keyboard desktop controls support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (e.key === 'ArrowLeft' || key === 'a') {
        setLeftPressed(true);
        onSteerTouch(-1);
      } else if (e.key === 'ArrowRight' || key === 'd') {
        setRightPressed(true);
        onSteerTouch(1);
      } else if (e.key === 'ArrowDown' || key === 's') {
        setBrakePressed(true);
        haptics.tap(settings.hapticsEnabled);
        onBrakeTouch(true);
      } else if (e.key === ' ' || e.key === 'Shift') {
        haptics.nitro(settings.hapticsEnabled);
        soundManager.playNitro();
        onNitroTouch(true);
      } else if (e.key === 'Escape' || key === 'p') {
        onPause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.key === 'ArrowLeft' || key === 'a') {
        setLeftPressed(false);
        onSteerTouch(0);
      } else if (e.key === 'ArrowRight' || key === 'd') {
        setRightPressed(false);
        onSteerTouch(0);
      } else if (e.key === 'ArrowDown' || key === 's') {
        setBrakePressed(false);
        onBrakeTouch(false);
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
  }, [onSteerTouch, onBrakeTouch, onNitroTouch, onPause, settings.hapticsEnabled]);

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

  const handleBrakePress = (active: boolean) => {
    setBrakePressed(active);
    if (active) {
      haptics.tap(settings.hapticsEnabled);
    }
    onBrakeTouch(active);
  };

  const handleNitroPress = (active: boolean) => {
    if (active && session.nitroFuel > 15) {
      haptics.nitro(settings.hapticsEnabled);
      soundManager.playNitro();
    }
    onNitroTouch(active);
  };

  // Virtual Steering Wheel drag handlers
  const updateWheelAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angleRad = Math.atan2(dx, -dy);
    let deg = angleRad * (180 / Math.PI);

    // Clamp wheel rotation to +/- 75 degrees
    deg = Math.max(-75, Math.min(75, deg));
    setWheelAngle(deg);

    // Map -75..75 to -1..1 steer value
    const steer = deg / 75;
    onSteerTouch(steer);
  }, [onSteerTouch]);

  const handleWheelPointerDown = (e: React.PointerEvent) => {
    isDraggingWheelRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateWheelAngleFromPointer(e.clientX, e.clientY);
  };

  const handleWheelPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingWheelRef.current) return;
    updateWheelAngleFromPointer(e.clientX, e.clientY);
  };

  const handleWheelPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingWheelRef.current) return;
    isDraggingWheelRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Safe
    }
    // Return wheel to center
    setWheelAngle(0);
    onSteerTouch(0);
  };

  // Speedometer circular gauge math
  const maxDialSpeed = 260;
  const speedRatio = Math.min(1, Math.max(0, session.speed / maxDialSpeed));
  const strokeDashoffset = 180 - speedRatio * 180;

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5 pointer-events-none select-none">
      {/* Top Section: Distance, Score, Pause */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full flex items-center justify-between">
          {/* Distance Traveled */}
          <div className="bg-white/85 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200 dark:border-white/10 px-3.5 py-1.5 rounded-xl shadow-md pointer-events-auto">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Distance
            </span>
            <span className="font-mono-num text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">
              {(session.distance / 1000).toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">km</span>
            </span>
          </div>

          {/* Center: Live Score */}
          <div className="text-center bg-white/85 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200 dark:border-white/10 px-4 py-1.5 rounded-xl shadow-md pointer-events-auto">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Score
            </span>
            <span className="font-mono-num text-lg sm:text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
              {session.score.toLocaleString()}
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={handlePause}
            className="p-2.5 bg-white/85 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 active:scale-90 transition-all pointer-events-auto shadow-md"
            title="Pause Game"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>

        {/* Near Miss Compact Top Alert (Placed right below top bar, NEVER blocks central road view) */}
        {session.nearMissNotice && (
          <div className="mt-2 pointer-events-none animate-pulse">
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 border border-cyan-300 px-3.5 py-1 rounded-xl shadow-lg glow-cyan text-center flex items-center gap-2">
              <span className="font-racing text-sm font-black text-white tracking-wider">
                NEAR MISS!
              </span>
              <span className="text-xs font-mono-num font-bold text-cyan-100">
                +{session.nearMissNotice.points} PTS
              </span>
              {session.nearMissNotice.combo > 1 && (
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
                  {session.nearMissNotice.combo}X COMBO
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tilt Status Indicator (if in tilt mode) */}
      {settings.controlScheme === 'tilt' && (
        <div className="mx-auto flex items-center gap-2 bg-white/85 dark:bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 text-xs pointer-events-auto shadow-sm">
          <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Tilt Steer</span>
          {/* Subtle balance pip */}
          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
            <div
              className="w-2.5 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full absolute top-0 transition-transform duration-75"
              style={{
                left: '50%',
                transform: `translateX(-50%) translateX(${steerValue * 28}px)`,
              }}
            />
          </div>
          <button
            onClick={onQuickCalibrateTilt}
            className="text-[10px] text-cyan-600 dark:text-cyan-300 font-bold hover:underline pl-1"
            title="Set current angle as center"
          >
            Calibrate
          </button>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="w-full flex items-end justify-between gap-2 sm:gap-3 pointer-events-auto pt-2">
        {/* Left: Speedometer Gauge */}
        <div className="flex items-center gap-2 bg-white/85 dark:bg-slate-950/75 backdrop-blur-md border border-slate-200 dark:border-white/10 p-2 sm:p-2.5 rounded-2xl shadow-xl shrink-0">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <svg className="w-12 h-12 sm:w-14 sm:h-14 transform -rotate-90" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r="28"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="36"
                cy="36"
                r="28"
                className={`transition-all duration-75 ${
                  session.isNitroActive
                    ? 'stroke-cyan-500'
                    : session.isBraking
                    ? 'stroke-red-500'
                    : 'stroke-orange-500'
                }`}
                strokeWidth="5"
                strokeDasharray="180"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-racing text-base sm:text-lg font-black leading-none text-slate-900 dark:text-white font-mono-num">
                {session.speed}
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase -mt-0.5">
                KM/H
              </span>
            </div>
          </div>
        </div>

        {/* Center: Steering Controls (Touch buttons or Steering Wheel) */}
        {settings.controlScheme === 'touch' && (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onPointerDown={() => handleTouchLeft(true)}
              onPointerUp={() => handleTouchLeft(false)}
              onPointerLeave={() => handleTouchLeft(false)}
              onPointerCancel={() => handleTouchLeft(false)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-xl ${
                leftPressed
                  ? 'bg-orange-500/90 border-orange-400 text-white'
                  : 'bg-white/85 dark:bg-slate-950/80 border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Steer Left"
            >
              <ChevronLeft className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
            </button>

            <button
              onPointerDown={() => handleTouchRight(true)}
              onPointerUp={() => handleTouchRight(false)}
              onPointerLeave={() => handleTouchRight(false)}
              onPointerCancel={() => handleTouchRight(false)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-xl ${
                rightPressed
                  ? 'bg-orange-500/90 border-orange-400 text-white'
                  : 'bg-white/85 dark:bg-slate-950/80 border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Steer Right"
            >
              <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Wheel Control Scheme */}
        {settings.controlScheme === 'wheel' && (
          <div className="flex flex-col items-center">
            <div
              ref={wheelRef}
              onPointerDown={handleWheelPointerDown}
              onPointerMove={handleWheelPointerMove}
              onPointerUp={handleWheelPointerUp}
              onPointerCancel={handleWheelPointerUp}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/90 dark:bg-slate-950/90 border-2 border-cyan-500/40 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing active:scale-105 transition-transform"
              style={{
                touchAction: 'none',
              }}
            >
              {/* Rotating inner wheel graphic */}
              <div
                className="w-full h-full rounded-full flex items-center justify-center relative pointer-events-none transition-transform duration-75"
                style={{
                  transform: `rotate(${wheelAngle}deg)`,
                }}
              >
                {/* Wheel Outer Rim */}
                <div className="absolute inset-1.5 rounded-full border-4 border-slate-400 dark:border-slate-700 shadow-inner" />
                {/* Horizontal Spoke */}
                <div className="absolute w-full h-2 bg-slate-400 dark:bg-slate-700 rounded-sm" />
                {/* Vertical bottom spoke */}
                <div className="absolute w-2 h-1/2 bottom-1 bg-slate-400 dark:bg-slate-700 rounded-sm" />
                {/* Center Hub */}
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border border-white/30 flex items-center justify-center shadow-lg">
                  <Disc className="w-4 h-4 text-white animate-spin-slow" />
                </div>
              </div>
            </div>
            <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold uppercase mt-1 tracking-wider">
              Steer Wheel
            </span>
          </div>
        )}

        {/* Right Section: Brake Button + Nitro Boost Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Brake Button */}
          <button
            onPointerDown={() => handleBrakePress(true)}
            onPointerUp={() => handleBrakePress(false)}
            onPointerLeave={() => handleBrakePress(false)}
            onPointerCancel={() => handleBrakePress(false)}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 shadow-xl ${
              brakePressed || session.isBraking
                ? 'bg-red-600/90 border-red-400 text-white shadow-red-950/50'
                : 'bg-white/85 dark:bg-slate-950/85 border-red-500/40 text-red-600 dark:text-red-400 hover:border-red-400'
            }`}
            title="Brake / Slow Down"
          >
            <Octagon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-racing text-[10px] sm:text-xs font-black tracking-wider uppercase mt-0.5">
              BRAKE
            </span>
          </button>

          {/* Nitro Boost Button */}
          <div className="relative">
            <button
              onPointerDown={() => handleNitroPress(true)}
              onPointerUp={() => handleNitroPress(false)}
              onPointerLeave={() => handleNitroPress(false)}
              onPointerCancel={() => handleNitroPress(false)}
              disabled={session.nitroFuel < 15 && !session.isNitroActive}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 shadow-2xl ${
                session.isNitroActive
                  ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 border-cyan-300 glow-cyan text-white animate-pulse'
                  : session.nitroFuel >= 15
                  ? 'bg-white/85 dark:bg-slate-950/85 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:border-cyan-400'
                  : 'bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60'
              }`}
              title="Nitro Boost"
            >
              <Flame className={`w-6 h-6 sm:w-8 sm:h-8 ${session.isNitroActive ? 'animate-bounce text-white' : ''}`} />
              <span className="font-racing text-[10px] sm:text-xs font-black tracking-wider uppercase mt-0.5">
                NITRO
              </span>

              {/* Bottom Fuel Bar */}
              <div className="absolute -bottom-1.5 w-12 sm:w-14 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                <div
                  className={`h-full transition-all duration-75 ${
                    session.isNitroActive ? 'bg-cyan-400' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${session.nitroFuel}%` }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
