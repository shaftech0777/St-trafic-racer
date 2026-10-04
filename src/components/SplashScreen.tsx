import React, { useEffect, useState } from 'react';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface SplashScreenProps {
  onComplete: () => void;
  hapticsEnabled: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, hapticsEnabled }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 2400; // 2.4 seconds

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(p);

      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 200);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    haptics.tap(hapticsEnabled);
    soundManager.playClick();
    onComplete();
  };

  return (
    <div 
      onClick={handleSkip}
      className="absolute inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#06080e] cursor-pointer"
    >
      <div className="w-full flex justify-end">
        <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">
          Tap to skip
        </span>
      </div>

      <div className="flex flex-col items-center text-center space-y-6 max-w-sm">
        {/* App Icon Glow Container */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-3xl blur-xl opacity-40 animate-pulse" />
          <img
            src="/src/assets/images/racer_app_icon_1791113447385.jpg"
            alt="ST Trafic Racer Icon"
            referrerPolicy="no-referrer"
            className="relative w-28 h-28 rounded-2xl shadow-2xl border border-white/15 object-cover"
          />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="font-racing text-4xl sm:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-cyan-400">
            ST TRAFIC RACER
          </h1>
          <p className="text-xs sm:text-sm font-medium tracking-widest text-slate-400 uppercase">
            POWERED BY ST SOLUTIONS
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>WebGL Engine</span>
          <span aria-hidden="true">·</span>
          <span>Tilt & Touch Steering</span>
          <span aria-hidden="true">·</span>
          <span>100% Offline</span>
        </div>
      </div>

      {/* Loading Progress Bar */}
      <div className="w-full max-w-xs space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono-num">
          <span>INITIALIZING</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 transition-all duration-75 ease-out rounded-full shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
