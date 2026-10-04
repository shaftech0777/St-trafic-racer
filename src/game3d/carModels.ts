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
  color: 0x18181b,
  roughness: 0.9,
  metalness: 0.1,
});
const rimMat = new THREE.MeshStandardMaterial({
  color: 0xd4d4d8,
  roughness: 0.3,
  metalness: 0.8,
});
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x090d16,
  roughness: 0.1,
  metalness: 0.9,
  transparent: true,
  opacity: 0.85,
});

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
    metalness: 0.75,
    roughness: 0.25,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.85,
    roughness: 0.3,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x88ccff,
    emissiveIntensity: 2.5,
    roughness: 0.2,
  });

  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: 0xff1122,
    emissive: 0xff1122,
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });

  // Base chassis
  const chassisGeo = new THREE.BoxGeometry(1.8, 0.45, 4.2);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.y = 0.48;
  carGroup.add(chassis);

  // Cabin / Greenhouse
  let cabinGeo: THREE.BoxGeometry;
  if (spec.style === 'hypercar') {
    cabinGeo = new THREE.BoxGeometry(1.4, 0.38, 2.0);
  } else if (spec.style === 'muscle') {
    cabinGeo = new THREE.BoxGeometry(1.5, 0.45, 2.2);
  } else {
    cabinGeo = new THREE.BoxGeometry(1.45, 0.42, 2.3);
  }
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.82, -0.1);
  carGroup.add(cabin);

  // Roof plate
  const roofGeo = new THREE.BoxGeometry(1.36, 0.05, 1.8);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 1.04, -0.1);
  carGroup.add(roof);

  // Hood scoop or bonnet detail
  if (spec.style === 'muscle') {
    const scoopGeo = new THREE.BoxGeometry(0.6, 0.15, 1.0);
    const scoop = new THREE.Mesh(scoopGeo, accentMat);
    scoop.position.set(0, 0.75, -1.2);
    carGroup.add(scoop);
  }

  // Front bumper / splitter
  const splitterGeo = new THREE.BoxGeometry(1.82, 0.12, 0.6);
  const splitter = new THREE.Mesh(splitterGeo, accentMat);
  splitter.position.set(0, 0.3, -2.05);
  carGroup.add(splitter);

  // Rear diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.78, 0.18, 0.5);
  const diffuser = new THREE.Mesh(diffuserGeo, accentMat);
  diffuser.position.set(0, 0.32, 2.05);
  carGroup.add(diffuser);

  // Rear spoiler
  const spoilerWingGeo = new THREE.BoxGeometry(1.7, 0.06, 0.35);
  const spoilerWing = new THREE.Mesh(spoilerWingGeo, accentMat);
  spoilerWing.position.set(0, 1.08, 1.95);

  const postGeo = new THREE.BoxGeometry(0.08, 0.35, 0.1);
  const postLeft = new THREE.Mesh(postGeo, accentMat);
  postLeft.position.set(-0.6, 0.9, 1.95);
  const postRight = new THREE.Mesh(postGeo, accentMat);
  postRight.position.set(0.6, 0.9, 1.95);

  carGroup.add(spoilerWing);
  carGroup.add(postLeft);
  carGroup.add(postRight);

  // Headlights
  const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
  hlLeft.position.set(-0.65, 0.52, -2.11);
  const hlRight = new THREE.Mesh(hlGeo, headlightMat);
  hlRight.position.set(0.65, 0.52, -2.11);
  carGroup.add(hlLeft);
  carGroup.add(hlRight);
  headlights.push(hlLeft, hlRight);

  // Taillights
  const tlGeo = new THREE.BoxGeometry(0.42, 0.1, 0.1);
  const tlLeft = new THREE.Mesh(tlGeo, brakeLightMat);
  tlLeft.position.set(-0.65, 0.55, 2.11);
  const tlRight = new THREE.Mesh(tlGeo, brakeLightMat);
  tlRight.position.set(0.65, 0.55, 2.11);
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
    // save tire cylinder for rotation
    const tire = w.children[0] as THREE.Mesh;
    wheels.push(tire);
  });

  // Nitro exhaust tips and flame meshes
  const flameGeo = new THREE.ConeGeometry(0.12, 0.65, 8);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0,
  });

  [-0.32, 0.32].forEach((xPos) => {
    const flame = new THREE.Mesh(flameGeo, flameMat.clone());
    flame.position.set(xPos, 0.36, 2.45);
    carGroup.add(flame);
    nitroFlames.push(flame);

    const light = new THREE.PointLight(0x00ffff, 0, 4);
    light.position.set(xPos, 0.36, 2.3);
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
    roughness: 0.35,
    metalness: 0.65,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.4,
  });

  const trafficBrakeMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xaa0000,
    emissiveIntensity: 1.5,
  });

  const trafficHeadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffeeaa,
    emissiveIntensity: 1.8,
  });

  let length = 4.2;
  let width = 1.85;
  let height = 1.35;

  if (type === 'truck') {
    // Delivery Box Truck
    length = 6.2;
    width = 2.2;
    height = 2.6;

    // Cab
    const cabGeo = new THREE.BoxGeometry(width, 1.4, 1.8);
    const cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(0, 1.1, -1.8);
    group.add(cab);

    // Box cargo container
    const containerMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.6,
      metalness: 0.2,
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
