import * as THREE from 'three';
import { CarSpec } from '../types/game';

export interface Car3DInstance {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  exhaustLights: THREE.PointLight[];
  nitroFlames: THREE.Mesh[];
  brakeLights: THREE.Mesh[];
  headlights: THREE.Mesh[];
  speedLines?: THREE.Points;
  bodyColor: string;
  width: number;
  length: number;
  height: number;
}

// Reusable shared materials and geometries for optimal mobile performance
const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 16);
const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.33, 12);
const tireMat = new THREE.MeshStandardMaterial({
  color: 0x141416,
  roughness: 0.85,
  metalness: 0.1,
});
// Chrome-ish rim finish
const rimMat = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  roughness: 0.18,
  metalness: 0.92,
});
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x0b1120,
  roughness: 0.05,
  metalness: 0.95,
  transparent: true,
  opacity: 0.85,
});

// Soft fake under-car shadow material
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x020408,
  transparent: true,
  opacity: 0.52,
  depthWrite: false,
});

function createCarShadow(width: number, length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width * 1.08, length * 0.98);
  const shadow = new THREE.Mesh(geo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  return shadow;
}

function createWheelMesh(): THREE.Group {
  const wheelGroup = new THREE.Group();
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = false;
  tire.receiveShadow = false;

  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.z = Math.PI / 2;
  wheelGroup.add(tire);
  wheelGroup.add(rim);

  return wheelGroup;
}

export function createPlayerCar(spec: CarSpec): Car3DInstance {
  const carGroup = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const exhaustLights: THREE.PointLight[] = [];
  const nitroFlames: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];

  const mainColor = new THREE.Color(spec.bodyColor);
  const accentColor = new THREE.Color(spec.accentColor);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: mainColor,
    metalness: 0.8,
    roughness: 0.22,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.88,
    roughness: 0.25,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x88ccff,
    emissiveIntensity: 2.8,
    roughness: 0.15,
  });

  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: 0xff1122,
    emissive: 0xff1122,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  // 1. Soft Underbody Shadow
  const shadow = createCarShadow(2.1, 4.5);
  carGroup.add(shadow);

  // 2. Base chassis
  const chassisGeo = new THREE.BoxGeometry(1.82, 0.46, 4.3);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.y = 0.48;
  carGroup.add(chassis);

  // 3. Cabin / Greenhouse (tapered & angled windshield look)
  let cabinWidth = 1.45;
  let cabinLength = 2.2;
  let cabinHeight = 0.42;

  if (spec.style === 'hypercar') {
    cabinWidth = 1.38;
    cabinLength = 2.0;
    cabinHeight = 0.38;
  } else if (spec.style === 'muscle') {
    cabinWidth = 1.5;
    cabinLength = 2.3;
    cabinHeight = 0.45;
  }

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength), glassMat);
  cabin.position.set(0, 0.82, -0.1);
  carGroup.add(cabin);

  // Angled Windshield panel for tapered aerodynamic look
  const windshieldGeo = new THREE.BoxGeometry(cabinWidth * 0.96, cabinHeight * 0.85, 0.45);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.rotation.x = Math.PI / 6;
  windshield.position.set(0, 0.78, -cabinLength / 2 - 0.12);
  carGroup.add(windshield);

  // Angled Rear glass panel
  const rearGlassGeo = new THREE.BoxGeometry(cabinWidth * 0.94, cabinHeight * 0.8, 0.4);
  const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
  rearGlass.rotation.x = -Math.PI / 6;
  rearGlass.position.set(0, 0.78, cabinLength / 2 + 0.1);
  carGroup.add(rearGlass);

  // Roof plate
  const roof = new THREE.Mesh(new THREE.BoxGeometry(cabinWidth * 0.94, 0.05, cabinLength * 0.82), bodyMat);
  roof.position.set(0, 0.82 + cabinHeight / 2 + 0.02, -0.1);
  carGroup.add(roof);

  // Side Mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.18, 0.08, 0.15);
  const mirrorL = new THREE.Mesh(mirrorGeo, accentMat);
  mirrorL.position.set(-cabinWidth * 0.55 - 0.08, 0.75, -0.7);
  const mirrorR = new THREE.Mesh(mirrorGeo, accentMat);
  mirrorR.position.set(cabinWidth * 0.55 + 0.08, 0.75, -0.7);
  carGroup.add(mirrorL);
  carGroup.add(mirrorR);

  // Hood scoop or bonnet detail for muscle style
  if (spec.style === 'muscle') {
    const scoopGeo = new THREE.BoxGeometry(0.6, 0.15, 1.0);
    const scoop = new THREE.Mesh(scoopGeo, accentMat);
    scoop.position.set(0, 0.75, -1.2);
    carGroup.add(scoop);
  }

  // Front bumper / splitter
  const splitterGeo = new THREE.BoxGeometry(1.86, 0.12, 0.65);
  const splitter = new THREE.Mesh(splitterGeo, accentMat);
  splitter.position.set(0, 0.28, -2.1);
  carGroup.add(splitter);

  // Rear diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.82, 0.18, 0.55);
  const diffuser = new THREE.Mesh(diffuserGeo, accentMat);
  diffuser.position.set(0, 0.3, 2.1);
  carGroup.add(diffuser);

  // Rear spoiler with sleek aerodynamic wing & endplates
  const spoilerWingGeo = new THREE.BoxGeometry(1.8, 0.06, 0.4);
  const spoilerWing = new THREE.Mesh(spoilerWingGeo, accentMat);
  spoilerWing.position.set(0, 1.1, 1.95);

  const postGeo = new THREE.BoxGeometry(0.06, 0.36, 0.12);
  const postLeft = new THREE.Mesh(postGeo, accentMat);
  postLeft.position.set(-0.62, 0.92, 1.95);
  const postRight = new THREE.Mesh(postGeo, accentMat);
  postRight.position.set(0.62, 0.92, 1.95);

  // Wing Endplates
  const endplateGeo = new THREE.BoxGeometry(0.05, 0.18, 0.42);
  const endplateL = new THREE.Mesh(endplateGeo, accentMat);
  endplateL.position.set(-0.9, 1.1, 1.95);
  const endplateR = new THREE.Mesh(endplateGeo, accentMat);
  endplateR.position.set(0.9, 1.1, 1.95);

  carGroup.add(spoilerWing);
  carGroup.add(postLeft);
  carGroup.add(postRight);
  carGroup.add(endplateL);
  carGroup.add(endplateR);

  // Headlights
  const hlGeo = new THREE.BoxGeometry(0.36, 0.12, 0.1);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
  hlLeft.position.set(-0.66, 0.52, -2.16);
  const hlRight = new THREE.Mesh(hlGeo, headlightMat);
  hlRight.position.set(0.66, 0.52, -2.16);
  carGroup.add(hlLeft);
  carGroup.add(hlRight);
  headlights.push(hlLeft, hlRight);

  // Taillights
  const tlGeo = new THREE.BoxGeometry(0.44, 0.1, 0.1);
  const tlLeft = new THREE.Mesh(tlGeo, brakeLightMat);
  tlLeft.position.set(-0.66, 0.55, 2.16);
  const tlRight = new THREE.Mesh(tlGeo, brakeLightMat);
  tlRight.position.set(0.66, 0.55, 2.16);
  carGroup.add(tlLeft);
  carGroup.add(tlRight);
  brakeLights.push(tlLeft, tlRight);

  // Wheels placement (front left, front right, rear left, rear right)
  const wheelPositions = [
    { x: -0.92, y: 0.38, z: -1.35 },
    { x: 0.92, y: 0.38, z: -1.35 },
    { x: -0.92, y: 0.38, z: 1.35 },
    { x: 0.92, y: 0.38, z: 1.35 },
  ];

  wheelPositions.forEach((pos) => {
    const w = createWheelMesh();
    w.position.set(pos.x, pos.y, pos.z);
    carGroup.add(w);
    const tire = w.children[0] as THREE.Mesh;
    wheels.push(tire);
  });

  // Nitro exhaust tips and flame meshes
  const flameGeo = new THREE.ConeGeometry(0.12, 0.75, 8);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0,
  });

  [-0.32, 0.32].forEach((xPos) => {
    const flame = new THREE.Mesh(flameGeo, flameMat.clone());
    flame.position.set(xPos, 0.34, 2.5);
    carGroup.add(flame);
    nitroFlames.push(flame);

    const light = new THREE.PointLight(0x00ffff, 0, 4);
    light.position.set(xPos, 0.34, 2.3);
    carGroup.add(light);
    exhaustLights.push(light);
  });

  return {
    group: carGroup,
    wheels,
    exhaustLights,
    nitroFlames,
    brakeLights,
    headlights,
    bodyColor: spec.bodyColor,
    width: 1.9,
    length: 4.4,
    height: 1.25,
  };
}

export type TrafficType = 'sedan' | 'suv' | 'truck' | 'sport';

export interface TrafficCarInstance {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  type: TrafficType;
  lane: number;
  targetLane: number;
  isChangingLane: boolean;
  laneChangeProgress: number;
  speed: number; // km/h
  speedZ: number; // Three.js units/sec
  width: number;
  length: number;
  height: number;
  active: boolean;
  passedPlayer: boolean;
  box: THREE.Box3;
}

const TRAFFIC_COLORS = [
  0xd97706, // amber
  0x2563eb, // sapphire
  0xdc2626, // ruby
  0x16a34a, // forest green
  0x475569, // slate metallic
  0xe2e8f0, // silver pearl
  0x0f172a, // onyx
  0xf59e0b, // taxi yellow
  0x7c3aed, // violet
];

export function createTrafficCar(type: TrafficType = 'sedan', colorHex?: number): TrafficCarInstance {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const color = colorHex !== undefined ? colorHex : TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.68,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.4,
  });

  const trafficBrakeMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xcc0000,
    emissiveIntensity: 1.8,
  });

  const trafficHeadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffeeaa,
    emissiveIntensity: 2.0,
  });

  let length = 4.2;
  let width = 1.85;
  let height = 1.35;

  if (type === 'truck') {
    // Delivery Box Truck
    length = 6.2;
    width = 2.2;
    height = 2.6;

    // Soft Shadow
    const shadow = createCarShadow(width, length);
    group.add(shadow);

    // Cab
    const cabGeo = new THREE.BoxGeometry(width, 1.4, 1.8);
    const cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(0, 1.1, -1.8);
    group.add(cab);

    // Box cargo container
    const containerMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.55,
      metalness: 0.25,
    });
    const boxGeo = new THREE.BoxGeometry(width + 0.1, 1.8, 3.8);
    const container = new THREE.Mesh(boxGeo, containerMat);
    container.position.set(0, 1.5, 0.9);
    group.add(container);

    // Truck Windshield
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.6, 0.4), glassMat);
    cabGlass.position.set(0, 1.3, -2.4);
    group.add(cabGlass);
  } else if (type === 'suv') {
    // Large SUV
    length = 4.5;
    width = 1.95;
    height = 1.6;

    // Soft Shadow
    const shadow = createCarShadow(width, length);
    group.add(shadow);

    const suvBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.65, length), bodyMat);
    suvBody.position.y = 0.6;
    group.add(suvBody);

    const suvCabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.65, 3.0), glassMat);
    suvCabin.position.set(0, 1.1, 0.1);
    group.add(suvCabin);

    const roofRack = new THREE.Mesh(new THREE.BoxGeometry(width * 0.75, 0.08, 2.4), trimMat);
    roofRack.position.set(0, 1.45, 0.1);
    group.add(roofRack);
  } else {
    // Standard Sedan or Hatchback
    length = 4.1;
    width = 1.8;
    height = 1.3;

    // Soft Shadow
    const shadow = createCarShadow(width, length);
    group.add(shadow);

    const sedanBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.48, length), bodyMat);
    sedanBody.position.y = 0.5;
    group.add(sedanBody);

    const sedanCabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.45, 2.1), glassMat);
    sedanCabin.position.set(0, 0.88, -0.05);
    group.add(sedanCabin);
  }

  // Headlights & Taillights
  const hlGeo = new THREE.BoxGeometry(0.3, 0.12, 0.08);
  const hlL = new THREE.Mesh(hlGeo, trafficHeadMat);
  hlL.position.set(-width * 0.36, 0.55, -length * 0.5 - 0.02);
  const hlR = new THREE.Mesh(hlGeo, trafficHeadMat);
  hlR.position.set(width * 0.36, 0.55, -length * 0.5 - 0.02);
  group.add(hlL);
  group.add(hlR);

  const tlGeo = new THREE.BoxGeometry(0.32, 0.12, 0.08);
  const tlL = new THREE.Mesh(tlGeo, trafficBrakeMat);
  tlL.position.set(-width * 0.36, 0.6, length * 0.5 + 0.02);
  const tlR = new THREE.Mesh(tlGeo, trafficBrakeMat);
  tlR.position.set(width * 0.36, 0.6, length * 0.5 + 0.02);
  group.add(tlL);
  group.add(tlR);

  // Wheels
  const zOffset = length * 0.32;
  const wheelPos = [
    { x: -width * 0.5, y: 0.38, z: -zOffset },
    { x: width * 0.5, y: 0.38, z: -zOffset },
    { x: -width * 0.5, y: 0.38, z: zOffset },
    { x: width * 0.5, y: 0.38, z: zOffset },
  ];

  wheelPos.forEach((p) => {
    const w = createWheelMesh();
    w.position.set(p.x, p.y, p.z);
    group.add(w);
    wheels.push(w.children[0] as THREE.Mesh);
  });

  return {
    group,
    wheels,
    type,
    lane: 0,
    targetLane: 0,
    isChangingLane: false,
    laneChangeProgress: 0,
    speed: 80,
    speedZ: 0,
    width,
    length,
    height,
    active: false,
    passedPlayer: false,
    box: new THREE.Box3(),
  };
}
