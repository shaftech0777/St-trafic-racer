import { GameSettings, PlayerStats } from '../types/game';

const SETTINGS_KEY = 'st_trafic_racer_settings';
const STATS_KEY = 'st_trafic_racer_player_stats';

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  controlScheme: 'touch', // Default to touch for foolproof first run, with easy 1-tap tilt toggle
  tiltSensitivity: 1.0,
  neutralTiltGamma: 0,
  hapticsEnabled: true,
  timeOfDay: 'day',
  weather: 'clear',
  uiTheme: 'light',
};

export const DEFAULT_STATS: PlayerStats = {
  highScore: 0,
  totalDistanceMeters: 0,
  totalNearMisses: 0,
  selectedCarId: 'specter_gt',
  gamesPlayed: 0,
  coins: 500,
  unlockedCarIds: ['specter_gt'],
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save player stats to localStorage', e);
  }
}
