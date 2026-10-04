import { CarSpec } from '../types/game';

export const AVAILABLE_CARS: CarSpec[] = [
  {
    id: 'specter_gt',
    name: 'Specter GT-R',
    tagline: 'Balanced High-Speed Cruiser',
    bodyColor: '#f97316', // neon orange
    accentColor: '#1e293b', // slate black
    style: 'coupe',
    topSpeed: 195,
    acceleration: 3.5,
    handling: 4.0,
    nitroBoost: 45,
    description: 'A finely tuned twin-turbo machine engineered for agility and rapid lane shifting.',
    unlocked: true,
    requiredScore: 0,
  },
  {
    id: 'apex_phantom',
    name: 'Apex Phantom',
    tagline: 'Aerodynamic Hypercar',
    bodyColor: '#06b6d4', // cyber cyan
    accentColor: '#0f172a',
    style: 'hypercar',
    topSpeed: 235,
    acceleration: 4.5,
    handling: 4.2,
    nitroBoost: 60,
    description: 'Ultra-light carbon fiber chassis designed for sustained hyper-velocity on open tarmac.',
    unlocked: true,
    requiredScore: 3000,
  },
  {
    id: 'vortex_xr',
    name: 'Vortex XR Neon',
    tagline: 'Nitrous Acceleration Demon',
    bodyColor: '#10b981', // emerald lime
    accentColor: '#090d16',
    style: 'exotic',
    topSpeed: 215,
    acceleration: 5.0,
    handling: 4.6,
    nitroBoost: 70,
    description: 'Equipped with dual cryogenic injectors providing explosive burst acceleration.',
    unlocked: true,
    requiredScore: 8000,
  },
  {
    id: 'titan_enforcer',
    name: 'Titan Enforcer',
    tagline: 'Heavy High-Torque Muscle',
    bodyColor: '#ef4444', // crimson red
    accentColor: '#18181b',
    style: 'muscle',
    topSpeed: 210,
    acceleration: 4.0,
    handling: 3.8,
    nitroBoost: 50,
    description: 'Raw naturally aspirated V8 brute force with unwavering straight-line stability.',
    unlocked: true,
    requiredScore: 15000,
  },
];
