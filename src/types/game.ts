export type GameScreen = 
  | 'splash' 
  | 'menu' 
  | 'garage' 
  | 'settings' 
  | 'how-to-play' 
  | 'playing' 
  | 'game-over';

export type ControlScheme = 'tilt' | 'touch' | 'wheel';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  controlScheme: ControlScheme;
  tiltSensitivity: number; // 0.5 to 2.5
  neutralTiltGamma: number; // Calibrated horizontal angle
  hapticsEnabled: boolean;
  timeOfDay: 'day' | 'night';
  weather: 'clear' | 'rain';
}

export interface CarSpec {
  id: string;
  name: string;
  tagline: string;
  bodyColor: string;
  accentColor: string;
  style: 'coupe' | 'hypercar' | 'exotic' | 'muscle';
  topSpeed: number; // km/h (e.g. 190 to 250)
  acceleration: number; // 1 - 5
  handling: number; // 1 - 5
  nitroBoost: number; // +km/h
  description: string;
  unlocked: boolean;
  requiredScore: number;
  price: number;
}

export interface PlayerStats {
  highScore: number;
  totalDistanceMeters: number;
  totalNearMisses: number;
  selectedCarId: string;
  gamesPlayed: number;
  coins: number;
  unlockedCarIds: string[];
}

export interface GameSession {
  score: number;
  distance: number; // meters
  speed: number; // km/h
  maxSpeed: number;
  nearMisses: number;
  combo: number;
  nitroFuel: number; // 0 to 100
  isNitroActive: boolean;
  isBraking: boolean;
  coinsEarned: number;
  isPaused: boolean;
  isGameOver: boolean;
  isNewHighscore: boolean;
  nearMissNotice: {
    id: number;
    text: string;
    points: number;
    combo: number;
  } | null;
}
