import React from 'react';
import { ArrowLeft, Check, Gauge, Zap, Compass, Flame, Lock, Coins } from 'lucide-react';
import { CarSpec, GameSettings } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';

interface GarageScreenProps {
  cars: CarSpec[];
  selectedCarId: string;
  settings: GameSettings;
  coins: number;
  unlockedCarIds: string[];
  onSelectCar: (carId: string) => void;
  onUnlockCar: (carId: string) => void;
  onBack: () => void;
  onStartRace: () => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  cars,
  selectedCarId,
  settings,
  coins,
  unlockedCarIds,
  onSelectCar,
  onUnlockCar,
  onBack,
  onStartRace,
}) => {
  const currentCar = cars.find((c) => c.id === selectedCarId) || cars[0];
  const isCurrentUnlocked = currentCar.unlocked || unlockedCarIds.includes(currentCar.id);
  const canAfford = coins >= currentCar.price;

  const handleSelect = (carId: string) => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onSelectCar(carId);
  };

  const handleBack = () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onBack();
  };

  const handleRace = () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onStartRace();
  };

  const handleUnlock = () => {
    if (!canAfford) return;
    haptics.nitro(settings.hapticsEnabled);
    soundManager.playClick();
    onUnlockCar(currentCar.id);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#06080e]/90 via-transparent to-[#06080e]/95 pointer-events-auto">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/10 rounded-xl text-xs font-semibold text-slate-200 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <div className="text-center">
          <h2 className="font-racing text-2xl font-bold text-white tracking-wide">
            GARAGE
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Select Your Machine</p>
        </div>

        {/* Player Coin Balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl shadow-sm">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="font-mono-num font-bold text-xs text-amber-300">
            {coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Horizontal Car Selector Tabs */}
      <div className="w-full max-w-md mx-auto my-auto pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center">
          {cars.map((car) => {
            const isSelected = car.id === currentCar.id;
            const isUnlocked = car.unlocked || unlockedCarIds.includes(car.id);

            return (
              <button
                key={car.id}
                onClick={() => handleSelect(car.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-950/70 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {isUnlocked ? (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: car.bodyColor }}
                  />
                ) : (
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                <span className="truncate max-w-[100px]">{car.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Car Details & Action CTA */}
      <div className="w-full max-w-sm mx-auto space-y-3 pb-2">
        {/* Car Specs Card */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-racing text-xl font-bold text-white leading-tight">
                  {currentCar.name}
                </h3>
                {!isCurrentUnlocked && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-md text-[10px] font-bold">
                    LOCKED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{currentCar.tagline}</p>
            </div>
            <div className="text-right">
              <span className="font-mono-num text-xl font-bold text-cyan-400">
                {currentCar.topSpeed}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1">KM/H TOP</span>
            </div>
          </div>

          {/* Performance Sliders */}
          <div className="space-y-2 text-xs">
            {/* Top Speed Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Gauge className="w-3.5 h-3.5 text-orange-400" /> Top Speed
                </span>
                <span className="font-mono-num font-semibold text-slate-100">
                  {currentCar.topSpeed} km/h
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${Math.min(100, (currentCar.topSpeed / 250) * 100)}%` }}
                />
              </div>
            </div>

            {/* Acceleration Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Acceleration
                </span>
                <span className="font-mono-num font-semibold text-slate-100">
                  {currentCar.acceleration.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${(currentCar.acceleration / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Handling Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" /> Handling
                </span>
                <span className="font-mono-num font-semibold text-slate-100">
                  {currentCar.handling.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${(currentCar.handling / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Nitro Boost Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" /> Nitro Power
                </span>
                <span className="font-mono-num font-semibold text-slate-100">
                  +{currentCar.nitroBoost} km/h
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${(currentCar.nitroBoost / 75) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA: SELECT & RACE vs UNLOCK FOR COINS */}
        {isCurrentUnlocked ? (
          <button
            onClick={handleRace}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-racing text-xl font-extrabold tracking-wider rounded-xl shadow-xl glow-cyan active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>SELECT & RACE</span>
          </button>
        ) : (
          <div className="space-y-1.5">
            <button
              onClick={handleUnlock}
              disabled={!canAfford}
              className={`w-full py-3.5 px-6 font-racing text-xl font-extrabold tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                canAfford
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 glow-orange active:scale-95'
                  : 'bg-slate-900 border border-white/10 text-slate-500 opacity-60 cursor-not-allowed'
              }`}
            >
              <Coins className="w-5 h-5 text-current" />
              <span>UNLOCK FOR {currentCar.price.toLocaleString()} COINS</span>
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Or reach a high score of <span className="text-amber-400 font-bold font-mono-num">{currentCar.requiredScore.toLocaleString()} pts</span> to unlock for free
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
