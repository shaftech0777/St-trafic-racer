import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, Music, Compass, Smartphone, Vibrate, CheckCircle, Disc, Sun, Moon, CloudSun, CloudRain, Palette } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { haptics } from '../utils/haptics';
import { TiltController } from '../utils/tiltController';

interface SettingsScreenProps {
  settings: GameSettings;
  tiltController: TiltController;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  tiltController,
  onUpdateSettings,
  onBack,
}) => {
  const [currentTiltGamma, setCurrentTiltGamma] = useState(0);
  const [calibratedSuccess, setCalibratedSuccess] = useState(false);

  useEffect(() => {
    // Listen to live orientation to show the spirit level bubble
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.gamma !== undefined) {
        setCurrentTiltGamma(e.gamma);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  const handleToggleSound = () => {
    const val = !settings.soundEnabled;
    soundManager.setSoundEnabled(val);
    haptics.tap(settings.hapticsEnabled);
    if (val) soundManager.playClick();
    onUpdateSettings({ ...settings, soundEnabled: val });
  };

  const handleToggleMusic = () => {
    const val = !settings.musicEnabled;
    soundManager.setMusicEnabled(val);
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onUpdateSettings({ ...settings, musicEnabled: val });
  };

  const handleSelectScheme = async (scheme: 'tilt' | 'touch' | 'wheel') => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();

    if (scheme === 'tilt') {
      await tiltController.requestPermission();
    }
    onUpdateSettings({ ...settings, controlScheme: scheme });
  };

  const handleSetTimeOfDay = (val: 'day' | 'night') => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onUpdateSettings({ ...settings, timeOfDay: val });
  };

  const handleSetWeather = (val: 'clear' | 'rain') => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onUpdateSettings({ ...settings, weather: val });
  };

  const handleSetUiTheme = (val: 'light' | 'dark') => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onUpdateSettings({ ...settings, uiTheme: val });
  };

  const handleSensitivityChange = (val: number) => {
    tiltController.setSensitivity(val);
    onUpdateSettings({ ...settings, tiltSensitivity: val });
  };

  const handleCalibrateCurrentAngle = () => {
    haptics.nitro(settings.hapticsEnabled);
    soundManager.playClick();
    const calibrated = tiltController.calibrateCurrentAngle();
    onUpdateSettings({ ...settings, neutralTiltGamma: calibrated });
    setCalibratedSuccess(true);
    setTimeout(() => setCalibratedSuccess(false), 2000);
  };

  const handleToggleHaptics = () => {
    const val = !settings.hapticsEnabled;
    if (val) haptics.tap(true);
    soundManager.playClick();
    onUpdateSettings({ ...settings, hapticsEnabled: val });
  };

  const handleBack = () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    onBack();
  };

  // Calculate relative angle to neutral calibration
  const effectiveTilt = currentTiltGamma - settings.neutralTiltGamma;
  // Clamp bubble position (-45% to +45%)
  const bubbleOffset = Math.max(-45, Math.min(45, (effectiveTilt / 20) * 45));

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
          SETTINGS
        </h2>

        <div className="w-16" />
      </div>

      {/* Main Settings List */}
      <div className="w-full max-w-sm mx-auto my-auto space-y-4 py-4">
        {/* Appearance / UI Theme Section */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Interface Theme
          </span>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
            <button
              onClick={() => handleSetUiTheme('light')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                settings.uiTheme === 'light'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-orange-500" />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => handleSetUiTheme('dark')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                settings.uiTheme === 'dark'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-cyan-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Environment Section */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Environment & Scenery
          </span>

          {/* Time of Day */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Highway Time</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleSetTimeOfDay('day')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  settings.timeOfDay === 'day'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Day</span>
              </button>

              <button
                onClick={() => handleSetTimeOfDay('night')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  settings.timeOfDay === 'night'
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Night</span>
              </button>
            </div>
          </div>

          {/* Weather */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Weather Condition</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleSetWeather('clear')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  settings.weather === 'clear'
                    ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CloudSun className="w-4 h-4" />
                <span>Clear</span>
              </button>

              <button
                onClick={() => handleSetWeather('rain')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  settings.weather === 'rain'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CloudRain className="w-4 h-4" />
                <span>Rain</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audio Section */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Audio & Sound
          </span>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sound Effects</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Engine, nitro, near-miss, crash</p>
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.soundEnabled ? 'bg-orange-500 justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          <div className="h-px bg-slate-200 dark:bg-white/5" />

          {/* Music Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Synthwave Music</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Heart-pumping driving soundtrack</p>
              </div>
            </div>

            <button
              onClick={handleToggleMusic}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.musicEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>
        </div>

        {/* Steering Scheme Section */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Steering Controls
          </span>

          {/* 3-Column Segmented Control Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
            <button
              onClick={() => handleSelectScheme('tilt')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                settings.controlScheme === 'tilt'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-md border border-cyan-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[11px]">Tilt</span>
            </button>

            <button
              onClick={() => handleSelectScheme('touch')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                settings.controlScheme === 'touch'
                  ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-md border border-orange-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[11px]">Touch</span>
            </button>

            <button
              onClick={() => handleSelectScheme('wheel')}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                settings.controlScheme === 'wheel'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md border border-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Disc className="w-4 h-4" />
              <span className="text-[11px]">Wheel</span>
            </button>
          </div>

          {/* Tilt Controls Options */}
          {settings.controlScheme === 'tilt' && (
            <div className="space-y-4 pt-1">
              {/* Sensitivity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Tilt Sensitivity</span>
                  <span className="font-mono-num font-bold text-cyan-600 dark:text-cyan-400">
                    {settings.tiltSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.2"
                  step="0.1"
                  value={settings.tiltSensitivity}
                  onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Spirit Level Live Visualizer */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Live Tilt Spirit Level</span>
                  <span className="font-mono-num font-semibold">{effectiveTilt.toFixed(1)}°</span>
                </div>
                <div className="relative h-6 w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                  {/* Center zero mark */}
                  <div className="absolute h-full w-0.5 bg-slate-300 dark:bg-white/20" />
                  {/* Floating bubble indicator */}
                  <div
                    className="absolute w-4 h-4 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 transition-all duration-75"
                    style={{
                      transform: `translateX(${bubbleOffset * 2.8}px)`,
                    }}
                  />
                </div>
              </div>

              {/* Calibrate Neutral Angle Button */}
              <button
                onClick={handleCalibrateCurrentAngle}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {calibratedSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Neutral Angle Calibrated!</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Calibrate Current Angle as Center</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Haptics & Feedback */}
        <div className="bg-white/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Vibrate className={`w-5 h-5 ${settings.hapticsEnabled ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Haptic Vibration</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Vibration on nitro, near-miss, & crash</p>
            </div>
          </div>

          <button
            onClick={handleToggleHaptics}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.hapticsEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>
      </div>

      {/* Done button */}
      <div className="w-full max-w-sm mx-auto pt-2">
        <button
          onClick={handleBack}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-racing text-lg font-bold rounded-xl active:scale-98 transition-all shadow-md"
        >
          SAVE & RETURN
        </button>
      </div>
    </div>
  );
};
