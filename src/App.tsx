import { useState, useEffect, useRef, useCallback } from 'react';
import { GameScreen, GameSettings, PlayerStats, GameSession, ControlScheme } from './types/game';
import { AVAILABLE_CARS } from './data/cars';
import { loadSettings, saveSettings, loadPlayerStats, savePlayerStats } from './utils/storage';
import { TiltController } from './utils/tiltController';
import { HighwayScene } from './game3d/HighwayScene';
import { soundManager } from './audio/soundManager';
import { haptics } from './utils/haptics';

import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { GarageScreen } from './components/GarageScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameHUD } from './components/GameHUD';
import { PauseMenu } from './components/PauseMenu';
import { GameOverScreen } from './components/GameOverScreen';

export default function App() {
  // Persistence state
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats());

  // Navigation state
  const [screen, setScreen] = useState<GameScreen>('splash');
  const [isNewHighscore, setIsNewHighscore] = useState(false);
  const [steerValue, setSteerValue] = useState(0);

  // Active car
  const activeCar = AVAILABLE_CARS.find((c) => c.id === playerStats.selectedCarId) || AVAILABLE_CARS[0];

  // Live game session
  const [session, setSession] = useState<GameSession>({
    score: 0,
    distance: 0,
    speed: 0,
    maxSpeed: 0,
    nearMisses: 0,
    combo: 0,
    nitroFuel: 100,
    isNitroActive: false,
    isBraking: false,
    coinsEarned: 0,
    isPaused: false,
    isGameOver: false,
    isNewHighscore: false,
    nearMissNotice: null,
  });

  // 3D Canvas and Controllers refs
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<HighwayScene | null>(null);
  const tiltControllerRef = useRef<TiltController>(
    new TiltController(settings.neutralTiltGamma, settings.tiltSensitivity)
  );

  // Near miss timeout ref
  const nearMissTimeoutRef = useRef<number | null>(null);

  // 1. Initialize Sound Manager settings sync
  useEffect(() => {
    soundManager.setSoundEnabled(settings.soundEnabled);
    soundManager.setMusicEnabled(settings.musicEnabled);
    saveSettings(settings);
    if (sceneRef.current) {
      sceneRef.current.updateSettings(settings);
    }
  }, [settings]);

  // 2. Save stats whenever updated
  useEffect(() => {
    savePlayerStats(playerStats);
  }, [playerStats]);

  // Sync UI Theme (Light vs Dark) to document.documentElement
  useEffect(() => {
    if (settings.uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.uiTheme]);

  // 3. Callback handlers for Three.js HighwayScene
  const handleUpdateHUD = useCallback((stats: {
    speed: number;
    distance: number;
    score: number;
    nitroFuel: number;
    isNitroActive: boolean;
  }) => {
    setSession((prev) => ({
      ...prev,
      speed: stats.speed,
      distance: stats.distance,
      score: stats.score,
      nitroFuel: stats.nitroFuel,
      isNitroActive: stats.isNitroActive,
      maxSpeed: Math.max(prev.maxSpeed, stats.speed),
    }));

    // Update continuous procedural engine sound
    soundManager.updateEngine(stats.speed, stats.isNitroActive);
  }, []);

  const handleNearMiss = useCallback((points: number, combo: number) => {
    soundManager.playNearMiss();
    haptics.nearMiss(settings.hapticsEnabled);

    if (nearMissTimeoutRef.current) {
      window.clearTimeout(nearMissTimeoutRef.current);
    }

    setSession((prev) => ({
      ...prev,
      nearMisses: prev.nearMisses + 1,
      combo,
      nearMissNotice: {
        id: Date.now(),
        text: 'NEAR MISS!',
        points,
        combo,
      },
    }));

    nearMissTimeoutRef.current = window.setTimeout(() => {
      setSession((prev) => ({ ...prev, nearMissNotice: null }));
    }, 1800);
  }, [settings.hapticsEnabled]);

  const handleCollision = useCallback((finalScore: number, finalDistance: number, maxSpeed: number) => {
    soundManager.stopEngine();
    soundManager.playCrash();
    haptics.collision(settings.hapticsEnabled);

    // Stop tilt listening
    tiltControllerRef.current.stopListening();

    const earnedCoins = Math.max(10, Math.floor(finalScore / 20));

    setPlayerStats((prev) => {
      const isNewBest = finalScore > prev.highScore;
      const effectiveHighScore = isNewBest ? finalScore : prev.highScore;
      setIsNewHighscore(isNewBest);

      // Auto-unlock cars that meet required score
      const newlyUnlocked = AVAILABLE_CARS
        .filter((c) => effectiveHighScore >= c.requiredScore && !prev.unlockedCarIds.includes(c.id))
        .map((c) => c.id);

      return {
        ...prev,
        highScore: effectiveHighScore,
        totalDistanceMeters: prev.totalDistanceMeters + finalDistance,
        totalNearMisses: prev.totalNearMisses + session.nearMisses,
        gamesPlayed: prev.gamesPlayed + 1,
        coins: (prev.coins ?? 500) + earnedCoins,
        unlockedCarIds: [...new Set([...(prev.unlockedCarIds ?? ['specter_gt']), ...newlyUnlocked])],
      };
    });

    setSession((prev) => ({
      ...prev,
      score: finalScore,
      distance: finalDistance,
      maxSpeed,
      isGameOver: true,
      isNitroActive: false,
      isBraking: false,
      coinsEarned: earnedCoins,
    }));

    setScreen('game-over');
  }, [settings.hapticsEnabled, session.nearMisses]);

  // 4. Mount Three.js Scene once on startup
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new HighwayScene(
      canvasContainerRef.current,
      activeCar,
      settings,
      {
        onUpdateHUD: handleUpdateHUD,
        onNearMiss: handleNearMiss,
        onCollision: handleCollision,
      }
    );
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []); // Run once

  // 5. Update player car in 3D scene when car selection changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.spawnPlayerCar(activeCar);
    }
  }, [activeCar]);

  // 6. Manage Tilt orientation listening when in Playing mode
  useEffect(() => {
    const tilt = tiltControllerRef.current;
    tilt.setSensitivity(settings.tiltSensitivity);
    tilt.setCalibratedZero(settings.neutralTiltGamma);

    if (screen === 'playing' && !session.isPaused && settings.controlScheme === 'tilt') {
      tilt.startListening((steer) => {
        setSteerValue(steer);
        if (sceneRef.current) {
          sceneRef.current.setSteerInput(steer);
        }
      });
    } else {
      tilt.stopListening();
    }

    return () => tilt.stopListening();
  }, [screen, session.isPaused, settings.controlScheme, settings.tiltSensitivity, settings.neutralTiltGamma]);

  // 7. Manage Garage Showroom Mode
  useEffect(() => {
    if (sceneRef.current) {
      if (screen === 'garage') {
        sceneRef.current.setGarageMode(true);
      } else {
        sceneRef.current.setGarageMode(false);
      }
    }
  }, [screen]);

  // --- ACTIONS ---
  const handleStartRace = async () => {
    if (settings.controlScheme === 'tilt') {
      await tiltControllerRef.current.requestPermission();
    }

    setSession({
      score: 0,
      distance: 0,
      speed: 70,
      maxSpeed: 70,
      nearMisses: 0,
      combo: 0,
      nitroFuel: 100,
      isNitroActive: false,
      isBraking: false,
      coinsEarned: 0,
      isPaused: false,
      isGameOver: false,
      isNewHighscore: false,
      nearMissNotice: null,
    });
    setIsNewHighscore(false);
    setScreen('playing');

    if (sceneRef.current) {
      sceneRef.current.start();
    }
    soundManager.startEngine();
    soundManager.startMusic();
  };

  const handlePause = () => {
    if (sceneRef.current) {
      sceneRef.current.pause();
    }
    soundManager.stopEngine();
    soundManager.stopMusic();
    setSession((prev) => ({ ...prev, isPaused: true }));
  };

  const handleResume = () => {
    if (sceneRef.current) {
      sceneRef.current.resume();
    }
    soundManager.startEngine();
    soundManager.startMusic();
    setSession((prev) => ({ ...prev, isPaused: false }));
  };

  const handleRestart = () => {
    handleStartRace();
  };

  const handleMainMenu = () => {
    if (sceneRef.current) {
      sceneRef.current.stop();
    }
    soundManager.stopEngine();
    soundManager.stopMusic();
    setSession((prev) => ({ ...prev, isBraking: false, isNitroActive: false }));
    setScreen('menu');
  };

  const handleSelectCar = (carId: string) => {
    const car = AVAILABLE_CARS.find((c) => c.id === carId);
    const isUnlocked = car?.unlocked || playerStats.unlockedCarIds?.includes(carId);
    if (isUnlocked) {
      setPlayerStats((prev) => ({ ...prev, selectedCarId: carId }));
    }
  };

  const handleUnlockCar = (carId: string) => {
    const car = AVAILABLE_CARS.find((c) => c.id === carId);
    if (!car) return;
    const currentCoins = playerStats.coins ?? 0;
    if (currentCoins < car.price) return;
    if (playerStats.unlockedCarIds?.includes(carId)) return;

    setPlayerStats((prev) => ({
      ...prev,
      coins: currentCoins - car.price,
      unlockedCarIds: [...(prev.unlockedCarIds ?? ['specter_gt']), carId],
      selectedCarId: carId,
    }));
  };

  const handleToggleControlScheme = async () => {
    const schemes: ControlScheme[] = ['tilt', 'touch', 'wheel'];
    const currentIndex = schemes.indexOf(settings.controlScheme);
    const nextScheme = schemes[(currentIndex + 1) % schemes.length];
    if (nextScheme === 'tilt') {
      await tiltControllerRef.current.requestPermission();
    }
    setSettings((prev) => ({ ...prev, controlScheme: nextScheme }));
  };

  const handleSteerTouch = (val: number) => {
    setSteerValue(val);
    if (sceneRef.current) {
      sceneRef.current.setSteerInput(val);
    }
  };

  const handleBrakeTouch = useCallback((active: boolean) => {
    if (sceneRef.current) {
      sceneRef.current.setBrake(active);
    }
    setSession((prev) => ({ ...prev, isBraking: active }));
  }, []);

  const handleNitroTouch = (active: boolean) => {
    if (sceneRef.current) {
      sceneRef.current.setNitro(active);
    }
  };

  const handleQuickCalibrateTilt = () => {
    haptics.tap(settings.hapticsEnabled);
    soundManager.playClick();
    const calibrated = tiltControllerRef.current.calibrateCurrentAngle();
    setSettings((prev) => ({ ...prev, neutralTiltGamma: calibrated }));
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-[#06080e] select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full z-0 cursor-default"
      />

      {/* 1. Splash Screen */}
      {screen === 'splash' && (
        <SplashScreen
          hapticsEnabled={settings.hapticsEnabled}
          onComplete={() => setScreen('menu')}
        />
      )}

      {/* 2. Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          stats={playerStats}
          settings={settings}
          activeCar={activeCar}
          onPlay={handleStartRace}
          onOpenGarage={() => setScreen('garage')}
          onOpenSettings={() => setScreen('settings')}
          onOpenHowToPlay={() => setScreen('how-to-play')}
          onToggleControlScheme={handleToggleControlScheme}
        />
      )}

      {/* 3. Garage Screen */}
      {screen === 'garage' && (
        <GarageScreen
          cars={AVAILABLE_CARS}
          selectedCarId={playerStats.selectedCarId}
          settings={settings}
          coins={playerStats.coins ?? 500}
          unlockedCarIds={playerStats.unlockedCarIds ?? ['specter_gt']}
          onSelectCar={handleSelectCar}
          onPreviewCar={(carId) => {
            const car = AVAILABLE_CARS.find((c) => c.id === carId);
            if (car && sceneRef.current) {
              sceneRef.current.spawnPlayerCar(car);
            }
          }}
          onUnlockCar={handleUnlockCar}
          onBack={() => {
            if (sceneRef.current) {
              sceneRef.current.spawnPlayerCar(activeCar);
            }
            setScreen('menu');
          }}
          onStartRace={handleStartRace}
        />
      )}

      {/* 4. Settings Screen */}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          tiltController={tiltControllerRef.current}
          onUpdateSettings={setSettings}
          onBack={() => setScreen('menu')}
        />
      )}

      {/* 5. How To Play Modal */}
      {screen === 'how-to-play' && (
        <HowToPlayModal
          hapticsEnabled={settings.hapticsEnabled}
          onBack={() => setScreen('menu')}
        />
      )}

      {/* 6. Active Gameplay HUD */}
      {screen === 'playing' && (
        <GameHUD
          session={session}
          settings={settings}
          steerValue={steerValue}
          onPause={handlePause}
          onSteerTouch={handleSteerTouch}
          onBrakeTouch={handleBrakeTouch}
          onNitroTouch={handleNitroTouch}
          onQuickCalibrateTilt={handleQuickCalibrateTilt}
        />
      )}

      {/* 7. Pause Overlay */}
      {screen === 'playing' && session.isPaused && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenSettings={() => setScreen('settings')}
          onMainMenu={handleMainMenu}
          hapticsEnabled={settings.hapticsEnabled}
        />
      )}

      {/* 8. Game Over Screen */}
      {screen === 'game-over' && (
        <GameOverScreen
          session={session}
          stats={playerStats}
          isNewHighscore={isNewHighscore}
          hapticsEnabled={settings.hapticsEnabled}
          onPlayAgain={handleStartRace}
          onOpenGarage={() => setScreen('garage')}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
