import React from 'react';
import { ArrowLeft, Compass, Smartphone, Flame, ShieldAlert, Award } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface HowToPlayModalProps {
  onBack: () => void;
  hapticsEnabled: boolean;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onBack, hapticsEnabled }) => {
  const handleBack = () => {
    haptics.tap(hapticsEnabled);
    soundManager.playClick();
    onBack();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-slate-100/95 dark:bg-[#06080e]/95 backdrop-blur-xl pointer-events-auto overflow-y-auto">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="font-racing text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
          HOW TO PLAY
        </h2>

        <div className="w-16" />
      </div>

      {/* Guide Cards */}
      <div className="w-full max-w-sm mx-auto my-auto space-y-3 py-4">
        {/* Step 1: Steering */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex gap-3.5 items-start shadow-sm">
          <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Steering & Lane Changing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tilt your phone left or right to weave through highway traffic lanes. Or switch to on-screen Touch Buttons or Virtual Wheel in Settings.
            </p>
          </div>
        </div>

        {/* Step 2: Nitro */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex gap-3.5 items-start shadow-sm">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-500/20 rounded-xl text-orange-500 dark:text-orange-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nitrous Boost</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tap the Nitro button in the bottom right corner for immediate supercharged velocity. Nitro fuel slowly recharges or refills with near-misses.
            </p>
          </div>
        </div>

        {/* Step 3: Brake */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex gap-3.5 items-start shadow-sm">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/20 rounded-xl text-red-500 dark:text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Brakes & Deceleration</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Hold the BRAKE button (or Down Arrow / S) to quickly decelerate down to safe speeds when traffic clusters together ahead.
            </p>
          </div>
        </div>

        {/* Step 4: Near-Miss Scoring */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex gap-3.5 items-start shadow-sm">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-500 dark:text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Near-Miss Overtakes</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pass closely beside traffic cars at over 80 km/h to trigger Near-Miss bonus points (+150 pts) and stack combo multipliers!
            </p>
          </div>
        </div>
      </div>

      {/* Return button */}
      <div className="w-full max-w-sm mx-auto pt-2">
        <button
          onClick={handleBack}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-racing text-lg font-bold rounded-xl active:scale-98 transition-all shadow-lg"
        >
          GOT IT, LET'S RACE
        </button>
      </div>
    </div>
  );
};
