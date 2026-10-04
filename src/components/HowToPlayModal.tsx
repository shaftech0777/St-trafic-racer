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
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-[#06080e]/95 backdrop-blur-xl pointer-events-auto overflow-y-auto">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="font-racing text-2xl font-bold text-white tracking-wide">
          HOW TO PLAY
        </h2>

        <div className="w-16" />
      </div>

      {/* Guide Cards */}
      <div className="w-full max-w-sm mx-auto my-auto space-y-3 py-4">
        {/* Step 1: Steering */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="p-2.5 bg-cyan-950/50 border border-cyan-500/20 rounded-xl text-cyan-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Steering & Lane Changing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tilt your phone left or right to weave through highway traffic lanes. Or switch to on-screen Touch Buttons in Settings.
            </p>
          </div>
        </div>

        {/* Step 2: Nitro */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="p-2.5 bg-orange-950/50 border border-orange-500/20 rounded-xl text-orange-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Nitrous Boost</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tap the Nitro button in the bottom right corner for immediate supercharged velocity. Nitro fuel slowly recharges or refills with near-misses.
            </p>
          </div>
        </div>

        {/* Step 3: Near-Miss Scoring */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="p-2.5 bg-amber-950/50 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Near-Miss Overtakes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pass closely beside traffic cars at over 80 km/h to trigger Near-Miss bonus points (+150 pts) and stack combo multipliers!
            </p>
          </div>
        </div>

        {/* Step 4: Avoid Collisions */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="p-2.5 bg-red-950/50 border border-red-500/20 rounded-xl text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Watch Out for Traffic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Slower sedans, SUVs, and cargo trucks occupy the highway. Watch for cars changing lanes and stay alert at hyper-speeds!
            </p>
          </div>
        </div>
      </div>

      {/* Return button */}
      <div className="w-full max-w-sm mx-auto pt-2">
        <button
          onClick={handleBack}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-racing text-lg font-bold rounded-xl active:scale-98 transition-all"
        >
          GOT IT, LET'S RACE
        </button>
      </div>
    </div>
  );
};
