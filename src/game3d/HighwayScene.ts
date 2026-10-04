import * as THREE from 'three';
import { CarSpec, GameSettings } from '../types/game';
import {
  Car3DInstance,
  createPlayerCar,
  createTrafficCar,
  TrafficCarInstance,
  TrafficType,
} from './carModels';

export interface HighwaySceneCallbacks {
  onUpdateHUD: (stats: {
    speed: number;
    distance: number;
    score: number;
    nitroFuel: number;
    isNitroActive: boolean;
  }) => void;
  onNearMiss: (points: number, combo: number) => void;
  onCollision: (finalScore: number, finalDistance: number, maxSpeed: number) => void;
}

export class HighwayScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isDestroyed = false;

  // Game state
  private isPlaying = false;
  private isPaused = false;
  private isCrashed = false;
  private isGarageMode = false;
  private lastTime = 0;

  // Settings & player specs
  private settings: GameSettings;
  private carSpec: CarSpec;
  private callbacks: HighwaySceneCallbacks;

  // 3D Objects
  private playerCar: Car3DInstance | null = null;
  private playerBox = new THREE.Box3();
  private trafficPool: TrafficCarInstance[] = [];
  private roadSegments: THREE.Group[] = [];
  private streetLamps: THREE.Group[] = [];
  private overheadGantries: THREE.Group[] = [];
  private particleGroup: THREE.Group = new THREE.Group();
  private speedLines: THREE.LineSegments | null = null;
  private rainGroup: THREE.Group = new THREE.Group();
  private rainLines: THREE.LineSegments | null = null;
  private garagePlatform: THREE.Group | null = null;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private playerHeadlightLeft: THREE.SpotLight;
  private playerHeadlightRight: THREE.SpotLight;

  // Driving metrics & physics
  private currentSpeed = 0; // km/h
  private targetSpeed = 0; // km/h
  private maxSpeed = 0;
  private distanceTraveled = 0; // meters
  private score = 0;
  private nearMissCombo = 0;
  private lastNearMissTime = 0;

  // Player controls
  private playerLaneX = 0;
  private playerTargetX = 0;
  private playerSteerAngle = 0;
  private isNitroActive = false;
  private isBraking = false;
  private nitroFuel = 100;
  private inputSteer = 0; // -1 to 1

  // Road geometry
  private readonly LANE_X = [-5.2, -1.75, 1.75, 5.2];
  private readonly ROAD_WIDTH = 14.8;
  private readonly ROAD_LENGTH = 140;
  private readonly ROAD_SEGMENT_COUNT = 3;

  // Crash animation
  private crashTimer = 0;
  private crashSpin = new THREE.Vector3();
  private cameraShake = 0;

  constructor(
    container: HTMLElement,
    carSpec: CarSpec,
    settings: GameSettings,
    callbacks: HighwaySceneCallbacks
  ) {
    this.container = container;
    this.carSpec = carSpec;
    this.settings = settings;
    this.callbacks = callbacks;

    // 1. Setup Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060911);
    this.scene.fog = new THREE.FogExp2(0x060911, 0.012);

    // 2. Setup Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 300);
    this.camera.position.set(0, 3.2, 6.8);
    this.camera.lookAt(0, 1.1, -12);

    // 3. Setup Renderer (optimized for mobile)
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0x2a3b5c, 1.4);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xa5c9ff, 1.8);
    this.dirLight.position.set(20, 40, -30);
    this.scene.add(this.dirLight);

    // Dynamic player headlights
    this.playerHeadlightLeft = new THREE.SpotLight(0xfff8ee, 4, 60, Math.PI / 6, 0.4, 1.2);
    this.playerHeadlightRight = new THREE.SpotLight(0xfff8ee, 4, 60, Math.PI / 6, 0.4, 1.2);
    this.scene.add(this.playerHeadlightLeft);
    this.scene.add(this.playerHeadlightRight);

    // 5. Build Environment
    this.buildRoadSegments();
    this.buildStreetLamps();
    this.buildOverheadGantries();
    this.buildSpeedLines();
    this.buildRainSystem();
    this.buildParticlePool();
    this.buildTrafficPool();

    // 6. Spawn Player Car
    this.spawnPlayerCar(carSpec);

    // 7. Apply Time of Day and Weather settings
    this.applyEnvironmentSettings();

    // 8. Window resize listener
    window.addEventListener('resize', this.onWindowResize);

    // 9. Start render loop
    this.lastTime = performance.now();
    this.animate();
  }

  public applyEnvironmentSettings() {
    const isDay = this.settings.timeOfDay === 'day';
    const isRain = this.settings.weather === 'rain';

    if (isDay) {
      const skyHex = isRain ? 0x6e7e94 : 0x5a9be4;
      this.scene.background = new THREE.Color(skyHex);
      this.scene.fog = new THREE.FogExp2(skyHex, isRain ? 0.015 : 0.007);

      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = isRain ? 1.7 : 2.5;

      this.dirLight.color.setHex(0xfff5e6);
      this.dirLight.intensity = isRain ? 1.5 : 2.8;
      this.dirLight.position.set(30, 60, -20);

      this.playerHeadlightLeft.intensity = 0;
      this.playerHeadlightRight.intensity = 0;
    } else {
      const nightHex = isRain ? 0x04060b : 0x060911;
      this.scene.background = new THREE.Color(nightHex);
      this.scene.fog = new THREE.FogExp2(nightHex, isRain ? 0.018 : 0.012);

      this.ambientLight.color.setHex(0x2a3b5c);
      this.ambientLight.intensity = 1.4;

      this.dirLight.color.setHex(0xa5c9ff);
      this.dirLight.intensity = 1.8;
      this.dirLight.position.set(20, 40, -30);

      this.playerHeadlightLeft.intensity = 4;
      this.playerHeadlightRight.intensity = 4;
    }

    if (this.rainGroup) {
      this.rainGroup.visible = isRain;
    }
  }

  private buildRainSystem() {
    const dropCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(dropCount * 6);

    for (let i = 0; i < dropCount; i++) {
      const x = (Math.random() - 0.5) * 24;
      const y = Math.random() * 22;
      const z = (Math.random() - 0.5) * 90;
      const len = 0.9 + Math.random() * 0.7;

      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y - len;
      positions[i * 6 + 5] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.65,
    });

    this.rainLines = new THREE.LineSegments(geometry, material);
    this.rainGroup.add(this.rainLines);
    this.scene.add(this.rainGroup);
    this.rainGroup.visible = false;
  }

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  // --- BUILD 3D HIGHWAY & PROPS ---
  private buildRoadSegments() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x141824,
      roughness: 0.85,
      metalness: 0.15,
    });

    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f18,
      roughness: 0.95,
      metalness: 0.05,
    });

    const guardrailMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.35,
    });

    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (let i = 0; i < this.ROAD_SEGMENT_COUNT; i++) {
      const segment = new THREE.Group();
      const zPos = -i * this.ROAD_LENGTH;

      // Main asphalt
      const asphalt = new THREE.Mesh(
        new THREE.PlaneGeometry(this.ROAD_WIDTH, this.ROAD_LENGTH),
        roadMat
      );
      asphalt.rotation.x = -Math.PI / 2;
      segment.add(asphalt);

      // Side shoulders
      const leftShoulder = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, this.ROAD_LENGTH),
        shoulderMat
      );
      leftShoulder.rotation.x = -Math.PI / 2;
      leftShoulder.position.x = -this.ROAD_WIDTH / 2 - 1.75;
      segment.add(leftShoulder);

      const rightShoulder = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, this.ROAD_LENGTH),
        shoulderMat
      );
      rightShoulder.rotation.x = -Math.PI / 2;
      rightShoulder.position.x = this.ROAD_WIDTH / 2 + 1.75;
      segment.add(rightShoulder);

      // Guardrails
      const railGeo = new THREE.BoxGeometry(0.3, 0.6, this.ROAD_LENGTH);
      const railLeft = new THREE.Mesh(railGeo, guardrailMat);
      railLeft.position.set(-this.ROAD_WIDTH / 2 - 3.4, 0.4, 0);
      segment.add(railLeft);

      const railRight = new THREE.Mesh(railGeo, guardrailMat);
      railRight.position.set(this.ROAD_WIDTH / 2 + 3.4, 0.4, 0);
      segment.add(railRight);

      // Yellow outer border lines
      const edgeLineGeo = new THREE.PlaneGeometry(0.2, this.ROAD_LENGTH);
      const leftYellow = new THREE.Mesh(edgeLineGeo, yellowLineMat);
      leftYellow.rotation.x = -Math.PI / 2;
      leftYellow.position.set(-this.ROAD_WIDTH / 2 + 0.15, 0.01, 0);
      segment.add(leftYellow);

      const rightYellow = new THREE.Mesh(edgeLineGeo, yellowLineMat);
      rightYellow.rotation.x = -Math.PI / 2;
      rightYellow.position.set(this.ROAD_WIDTH / 2 - 0.15, 0.01, 0);
      segment.add(rightYellow);

      // Dashed lane divider lines (3 dividers separating 4 lanes)
      const dashGeo = new THREE.PlaneGeometry(0.18, 4.0);
      const dashSpacing = 8.0;
      const dashCount = Math.floor(this.ROAD_LENGTH / dashSpacing);
      const laneDivX = [-3.5, 0, 3.5];

      laneDivX.forEach((x) => {
        for (let d = 0; d < dashCount; d++) {
          const dash = new THREE.Mesh(dashGeo, whiteLineMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(x, 0.01, -this.ROAD_LENGTH / 2 + d * dashSpacing + 2.0);
          segment.add(dash);
        }
      });

      segment.position.z = zPos;
      this.scene.add(segment);
      this.roadSegments.push(segment);
    }
  }

  private buildStreetLamps() {
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.4,
    });
    const lampLightMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });

    const spacing = 45;
    const count = 12;

    for (let i = 0; i < count; i++) {
      const lampGroup = new THREE.Group();
      const isLeft = i % 2 === 0;
      const x = isLeft ? -this.ROAD_WIDTH / 2 - 2.8 : this.ROAD_WIDTH / 2 + 2.8;

      // Vertical pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8), postMat);
      pole.position.y = 3.75;
      lampGroup.add(pole);

      // Overhanging arm
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), postMat);
      arm.rotation.z = isLeft ? Math.PI / 3 : -Math.PI / 3;
      arm.position.set(isLeft ? 0.9 : -0.9, 7.2, 0);
      lampGroup.add(arm);

      // Glowing light fixture
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.8), lampLightMat);
      bulb.position.set(isLeft ? 1.7 : -1.7, 7.0, 0);
      lampGroup.add(bulb);

      lampGroup.position.set(x, 0, -i * spacing);
      this.scene.add(lampGroup);
      this.streetLamps.push(lampGroup);
    }
  }

  private buildOverheadGantries() {
    const gantryMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
    });
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      metalness: 0.2,
      roughness: 0.5,
    });

    const count = 3;
    const spacing = 140;

    for (let i = 0; i < count; i++) {
      const gantry = new THREE.Group();

      // Left and right pillars
      const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.2, 0.4), gantryMat);
      pillarL.position.set(-this.ROAD_WIDTH / 2 - 2.0, 3.6, 0);
      gantry.add(pillarL);

      const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.2, 0.4), gantryMat);
      pillarR.position.set(this.ROAD_WIDTH / 2 + 2.0, 3.6, 0);
      gantry.add(pillarR);

      // Top crossbeam
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(this.ROAD_WIDTH + 4.4, 0.6, 0.6),
        gantryMat
      );
      beam.position.set(0, 6.9, 0);
      gantry.add(beam);

      // Highway overhead sign
      const sign = new THREE.Mesh(new THREE.BoxGeometry(9.0, 2.2, 0.15), signMat);
      sign.position.set(0, 6.0, 0);
      gantry.add(sign);

      gantry.position.z = -70 - i * spacing;
      this.scene.add(gantry);
      this.overheadGantries.push(gantry);
    }
  }

  private buildSpeedLines() {
    const lineCount = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = 0.5 + Math.random() * 5.0;
      const z = -Math.random() * 80;
      const length = 2.0 + Math.random() * 4.0;

      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z + length;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
    });

    this.speedLines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.speedLines);
  }

  private buildParticlePool() {
    this.scene.add(this.particleGroup);
  }

  private spawnCrashSparks(pos: THREE.Vector3) {
    const sparkCount = 45;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3 + 0] = pos.x;
      sparkPos[i * 3 + 1] = pos.y + 0.5;
      sparkPos[i * 3 + 2] = pos.z;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 18,
          Math.random() * 14 + 4,
          (Math.random() - 0.5) * 18
        )
      );
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa22,
      size: 0.35,
      transparent: true,
      opacity: 1,
    });

    const points = new THREE.Points(sparkGeo, sparkMat);
    this.particleGroup.add(points);

    let life = 0;
    const maxLife = 1.0;

    const updateSparks = () => {
      life += 0.03;
      const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < sparkCount; i++) {
        arr[i * 3 + 0] += velocities[i].x * 0.03;
        arr[i * 3 + 1] += velocities[i].y * 0.03;
        arr[i * 3 + 2] += velocities[i].z * 0.03;
        velocities[i].y -= 9.8 * 0.03; // gravity
      }
      posAttr.needsUpdate = true;
      sparkMat.opacity = Math.max(1 - life / maxLife, 0);

      if (life < maxLife && !this.isDestroyed) {
        requestAnimationFrame(updateSparks);
      } else {
        this.particleGroup.remove(points);
        points.geometry.dispose();
        sparkMat.dispose();
      }
    };
    requestAnimationFrame(updateSparks);
  }

  private buildTrafficPool() {
    const types: TrafficType[] = ['sedan', 'suv', 'truck', 'sport'];
    const poolSize = 14;

    for (let i = 0; i < poolSize; i++) {
      const type = types[i % types.length];
      const car = createTrafficCar(type);
      car.group.position.set(0, -50, 0); // hidden initially
      car.active = false;
      this.scene.add(car.group);
      this.trafficPool.push(car);
    }
  }

  // --- PLAYER CAR INITIALIZATION ---
  public spawnPlayerCar(spec: CarSpec) {
    if (this.playerCar) {
      this.scene.remove(this.playerCar.group);
    }
    this.carSpec = spec;
    this.playerCar = createPlayerCar(spec);
    this.playerCar.group.position.set(0, 0, 0);
    this.scene.add(this.playerCar.group);

    // Position headlights relative to car
    this.playerHeadlightLeft.target = this.playerCar.group;
    this.playerHeadlightRight.target = this.playerCar.group;
  }

  // --- GARAGE SHOWROOM MODE ---
  public setGarageMode(enabled: boolean) {
    this.isGarageMode = enabled;
    if (enabled) {
      this.stop();
      if (!this.garagePlatform) {
        this.garagePlatform = new THREE.Group();
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(5.0, 5.2, 0.4, 32),
          new THREE.MeshStandardMaterial({
            color: 0x0b1120,
            metalness: 0.9,
            roughness: 0.2,
          })
        );
        base.position.y = -0.2;
        this.garagePlatform.add(base);

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(4.7, 0.08, 16, 64),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.01;
        this.garagePlatform.add(ring);
        this.scene.add(this.garagePlatform);
      }
      this.garagePlatform.visible = true;

      // Hide road & traffic
      this.roadSegments.forEach((r) => (r.visible = false));
      this.streetLamps.forEach((l) => (l.visible = false));
      this.overheadGantries.forEach((g) => (g.visible = false));
      this.trafficPool.forEach((t) => (t.group.visible = false));

      if (this.playerCar) {
        this.playerCar.group.position.set(0, 0, 0);
        this.playerCar.group.rotation.set(0, Math.PI / 5, 0);
      }
      this.camera.position.set(0, 2.2, 6.2);
      this.camera.lookAt(0, 0.7, 0);
    } else {
      if (this.garagePlatform) {
        this.garagePlatform.visible = false;
      }
      this.roadSegments.forEach((r) => (r.visible = true));
      this.streetLamps.forEach((l) => (l.visible = true));
      this.overheadGantries.forEach((g) => (g.visible = true));
    }
  }

  // --- GAMEPLAY LIFECYCLE ---
  public start() {
    this.isGarageMode = false;
    if (this.garagePlatform) this.garagePlatform.visible = false;
    this.roadSegments.forEach((r) => (r.visible = true));
    this.streetLamps.forEach((l) => (l.visible = true));
    this.overheadGantries.forEach((g) => (g.visible = true));

    this.isPlaying = true;
    this.isPaused = false;
    this.isCrashed = false;
    this.currentSpeed = 70;
    this.targetSpeed = 120;
    this.maxSpeed = 70;
    this.distanceTraveled = 0;
    this.score = 0;
    this.nearMissCombo = 0;
    this.playerLaneX = 0;
    this.playerTargetX = 0;
    this.playerSteerAngle = 0;
    this.nitroFuel = 100;
    this.isNitroActive = false;
    this.isBraking = false;
    this.inputSteer = 0;

    if (this.playerCar) {
      this.playerCar.group.position.set(0, 0, 0);
      this.playerCar.group.rotation.set(0, 0, 0);
      this.setNitroVisuals(false);
    }

    // Reset traffic
    this.trafficPool.forEach((car) => {
      car.active = false;
      car.group.position.set(0, -50, 0);
    });

    // Seed first wave of traffic ahead
    for (let i = 0; i < 6; i++) {
      this.spawnTrafficCar(-50 - i * 22);
    }

    this.lastTime = performance.now();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
  }

  public updateSettings(settings: GameSettings) {
    this.settings = settings;
    this.applyEnvironmentSettings();
  }

  // --- STEERING & NITRO & BRAKE INPUT ---
  public setBrake(active: boolean) {
    this.isBraking = active;
    if (active && this.isNitroActive) {
      this.setNitro(false);
    }
  }

  public setSteerInput(val: number) {
    // val is -1 (hard left) to +1 (hard right)
    this.inputSteer = Math.max(-1, Math.min(1, val));
  }

  public setNitro(active: boolean) {
    if (this.isCrashed || !this.isPlaying || this.isPaused) {
      this.isNitroActive = false;
      this.setNitroVisuals(false);
      return;
    }

    if (active && this.nitroFuel > 15) {
      this.isNitroActive = true;
      this.setNitroVisuals(true);
    } else {
      this.isNitroActive = false;
      this.setNitroVisuals(false);
    }
  }

  private setNitroVisuals(active: boolean) {
    if (!this.playerCar) return;

    this.playerCar.nitroFlames.forEach((flame) => {
      (flame.material as THREE.MeshBasicMaterial).opacity = active ? 0.9 : 0;
    });

    this.playerCar.exhaustLights.forEach((light) => {
      light.intensity = active ? 3.5 : 0;
    });

    if (this.speedLines) {
      (this.speedLines.material as THREE.LineBasicMaterial).opacity = active ? 0.6 : 0;
    }
  }

  // --- TRAFFIC SPAWNER ---
  private spawnTrafficCar(minZ = -120) {
    const inactiveCar = this.trafficPool.find((c) => !c.active);
    if (!inactiveCar) return;

    // Pick lane with least traffic
    const laneIndex = Math.floor(Math.random() * this.LANE_X.length);
    const laneX = this.LANE_X[laneIndex];

    // Check if space is clear
    const isOccupied = this.trafficPool.some(
      (c) => c.active && Math.abs(c.group.position.x - laneX) < 2.0 && Math.abs(c.group.position.z - minZ) < 18
    );
    if (isOccupied) return;

    inactiveCar.active = true;
    inactiveCar.lane = laneIndex;
    inactiveCar.targetLane = laneIndex;
    inactiveCar.isChangingLane = false;
    inactiveCar.passedPlayer = false;

    // Traffic speed variation based on vehicle type and lane
    // Left lanes faster, trucks slower
    const baseSpeed = inactiveCar.type === 'truck' ? 65 : 75 + Math.random() * 35;
    inactiveCar.speed = baseSpeed;

    inactiveCar.group.position.set(laneX, 0, minZ);
    inactiveCar.group.visible = true;
  }

  // --- MAIN ANIMATION & SIMULATION LOOP ---
  private animate = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.isGarageMode) {
      if (this.playerCar) {
        this.playerCar.group.rotation.y += 0.008;
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.isPlaying || this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this.updatePhysics(dt);
    this.updateRoadAndProps(dt);
    this.updateTraffic(dt);
    this.checkCollisionsAndOvertakes();
    this.updateCamera(dt);

    this.renderer.render(this.scene, this.camera);
  };

  private updatePhysics(dt: number) {
    if (this.isCrashed) {
      this.crashTimer += dt;
      if (this.playerCar) {
        this.playerCar.group.position.x += this.crashSpin.x * dt;
        this.playerCar.group.position.z += this.crashSpin.z * dt;
        this.playerCar.group.rotation.y += 4.0 * dt;
        this.playerCar.group.rotation.z += 1.5 * dt;
      }
      this.currentSpeed = Math.max(0, this.currentSpeed - 120 * dt);
      return;
    }

    // Nitro fuel management
    if (this.isNitroActive) {
      this.nitroFuel = Math.max(0, this.nitroFuel - 32 * dt);
      if (this.nitroFuel <= 0) {
        this.setNitro(false);
      }
    } else {
      // Slow automatic recharge
      this.nitroFuel = Math.min(100, this.nitroFuel + 8 * dt);
    }

    // Top speed calculation
    const baseTopSpeed = this.carSpec.topSpeed;
    const accelRate = 18 + this.carSpec.acceleration * 4.5;
    const target = this.isNitroActive ? baseTopSpeed + this.carSpec.nitroBoost : baseTopSpeed;

    // Acceleration & Braking logic
    if (this.isBraking) {
      // Rapid deceleration down to minimum 25 km/h
      this.currentSpeed = Math.max(25, this.currentSpeed - 90 * dt);
    } else {
      // Auto-acceleration
      if (this.currentSpeed < target) {
        this.currentSpeed = Math.min(target, this.currentSpeed + accelRate * dt);
      } else {
        this.currentSpeed = Math.max(target, this.currentSpeed - 35 * dt);
      }
    }

    if (this.currentSpeed > this.maxSpeed) {
      this.maxSpeed = this.currentSpeed;
    }

    // Distance and score
    const speedMS = (this.currentSpeed * 1000) / 3600;
    const deltaDistance = speedMS * dt;
    this.distanceTraveled += deltaDistance;

    // Score increases with speed and distance
    const speedMultiplier = Math.max(1, (this.currentSpeed - 80) / 40);
    this.score += Math.floor(deltaDistance * speedMultiplier * (this.isNitroActive ? 2.2 : 1.0));

    // Player Lateral Steering
    const handlingFactor = 12 + this.carSpec.handling * 2.8;
    this.playerTargetX += this.inputSteer * handlingFactor * dt;

    // Road boundaries: clamp so car stays on highway asphalt
    const maxRoadX = this.ROAD_WIDTH / 2 - 1.2;
    this.playerTargetX = Math.max(-maxRoadX, Math.min(maxRoadX, this.playerTargetX));

    // Smooth lerp to target X
    this.playerLaneX += (this.playerTargetX - this.playerLaneX) * (14 * dt);

    // Tilt visual roll
    const targetRoll = -this.inputSteer * 0.12;
    this.playerSteerAngle += (targetRoll - this.playerSteerAngle) * (12 * dt);

    if (this.playerCar) {
      this.playerCar.group.position.x = this.playerLaneX;
      this.playerCar.group.rotation.z = this.playerSteerAngle;
      this.playerCar.group.rotation.y = -this.inputSteer * 0.08;

      // Wheel rotation
      const wheelAngularSpeed = (speedMS / 0.38) * dt;
      this.playerCar.wheels.forEach((w) => {
        w.rotation.x += wheelAngularSpeed;
      });

      // Brake lights emissive flare when braking
      if (this.playerCar.brakeLights) {
        this.playerCar.brakeLights.forEach((bl) => {
          const mat = bl.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = this.isBraking ? 4.5 : 2.0;
        });
      }

      // Headlight dynamic follow
      this.playerHeadlightLeft.position.set(this.playerLaneX - 0.7, 0.6, -1.8);
      this.playerHeadlightRight.position.set(this.playerLaneX + 0.7, 0.6, -1.8);
    }

    // Notify React HUD
    this.callbacks.onUpdateHUD({
      speed: Math.round(this.currentSpeed),
      distance: Math.round(this.distanceTraveled),
      score: this.score,
      nitroFuel: Math.round(this.nitroFuel),
      isNitroActive: this.isNitroActive,
    });
  }

  private updateRoadAndProps(dt: number) {
    const speedMS = (this.currentSpeed * 1000) / 3600;
    const moveZ = speedMS * dt;

    // 1. Move road segments
    this.roadSegments.forEach((segment) => {
      segment.position.z += moveZ;
      if (segment.position.z > this.ROAD_LENGTH) {
        // Find furthest segment
        let minZ = 0;
        this.roadSegments.forEach((s) => {
          if (s.position.z < minZ) minZ = s.position.z;
        });
        segment.position.z = minZ - this.ROAD_LENGTH + 0.1;
      }
    });

    // 2. Move street lamps
    this.streetLamps.forEach((lamp) => {
      lamp.position.z += moveZ;
      if (lamp.position.z > 20) {
        let minZ = 0;
        this.streetLamps.forEach((l) => {
          if (l.position.z < minZ) minZ = l.position.z;
        });
        lamp.position.z = minZ - 45;
      }
    });

    // 3. Move overhead gantries
    this.overheadGantries.forEach((gantry) => {
      gantry.position.z += moveZ;
      if (gantry.position.z > 25) {
        let minZ = 0;
        this.overheadGantries.forEach((g) => {
          if (g.position.z < minZ) minZ = g.position.z;
        });
        gantry.position.z = minZ - 140;
      }
    });

    // 4. Update speed lines during boost
    if (this.speedLines && this.isNitroActive) {
      const posAttr = this.speedLines.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const boostSpeedZ = moveZ * 2.2;

      for (let i = 0; i < arr.length / 6; i++) {
        arr[i * 6 + 2] += boostSpeedZ;
        arr[i * 6 + 5] += boostSpeedZ;
        if (arr[i * 6 + 2] > 10) {
          arr[i * 6 + 2] = -90 - Math.random() * 40;
          arr[i * 6 + 5] = arr[i * 6 + 2] + 4.0;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 5. Update rain particles
    if (this.rainLines && this.rainGroup.visible) {
      const posAttr = this.rainLines.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const dropSpeedY = 48 * dt;
      const fallMoveZ = moveZ * 0.45;

      for (let i = 0; i < arr.length / 6; i++) {
        arr[i * 6 + 1] -= dropSpeedY;
        arr[i * 6 + 4] -= dropSpeedY;
        arr[i * 6 + 2] += fallMoveZ;
        arr[i * 6 + 5] += fallMoveZ;

        // Recycle raindrop once it falls below y=0 or passes far behind player
        if (arr[i * 6 + 1] < 0 || arr[i * 6 + 2] > 20) {
          const newY = 16 + Math.random() * 8;
          const dropLen = 0.9 + Math.random() * 0.7;
          const newX = (Math.random() - 0.5) * 24;
          const newZ = -Math.random() * 80 + 5;

          arr[i * 6 + 0] = newX;
          arr[i * 6 + 1] = newY;
          arr[i * 6 + 2] = newZ;

          arr[i * 6 + 3] = newX;
          arr[i * 6 + 4] = newY - dropLen;
          arr[i * 6 + 5] = newZ;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  private updateTraffic(dt: number) {
    const playerSpeedMS = (this.currentSpeed * 1000) / 3600;

    let activeCount = 0;

    this.trafficPool.forEach((car) => {
      if (!car.active) return;
      activeCount++;

      const trafficSpeedMS = (car.speed * 1000) / 3600;
      // Relative motion: car moves backward toward player as player overtakes
      const relativeSpeedZ = (playerSpeedMS - trafficSpeedMS) * dt;
      car.group.position.z += relativeSpeedZ;

      // Rotate wheels
      const wheelRot = (trafficSpeedMS / 0.38) * dt;
      car.wheels.forEach((w) => (w.rotation.x += wheelRot));

      // Occasional intelligent lane change AI
      if (!car.isChangingLane && Math.random() < 0.003 && car.group.position.z < -25) {
        const canGoLeft = car.lane > 0;
        const canGoRight = car.lane < this.LANE_X.length - 1;
        if (canGoLeft || canGoRight) {
          const delta = canGoLeft && canGoRight ? (Math.random() < 0.5 ? -1 : 1) : canGoLeft ? -1 : 1;
          car.targetLane = car.lane + delta;
          car.isChangingLane = true;
          car.laneChangeProgress = 0;
        }
      }

      if (car.isChangingLane) {
        car.laneChangeProgress += 1.2 * dt;
        const startX = this.LANE_X[car.lane];
        const endX = this.LANE_X[car.targetLane];
        car.group.position.x = THREE.MathUtils.lerp(startX, endX, Math.min(1, car.laneChangeProgress));

        if (car.laneChangeProgress >= 1) {
          car.lane = car.targetLane;
          car.isChangingLane = false;
        }
      }

      // Despawn when car falls far behind player
      if (car.group.position.z > 22) {
        car.active = false;
        car.group.position.set(0, -50, 0);
      }
    });

    // Spawn new traffic if count is below target
    const targetTraffic = 7;
    if (activeCount < targetTraffic && Math.random() < 0.08) {
      this.spawnTrafficCar(-110 - Math.random() * 30);
    }
  }

  private checkCollisionsAndOvertakes() {
    if (this.isCrashed || !this.playerCar) return;

    // Update player bounding box
    const pPos = this.playerCar.group.position;
    this.playerBox.setFromCenterAndSize(
      new THREE.Vector3(pPos.x, 0.6, pPos.z),
      new THREE.Vector3(this.playerCar.width * 0.88, 1.1, this.playerCar.length * 0.88)
    );

    for (const car of this.trafficPool) {
      if (!car.active) return;

      const cPos = car.group.position;
      car.box.setFromCenterAndSize(
        new THREE.Vector3(cPos.x, 0.6, cPos.z),
        new THREE.Vector3(car.width * 0.9, 1.1, car.length * 0.9)
      );

      // 1. Collision check
      if (this.playerBox.intersectsBox(car.box)) {
        this.triggerCrash(car);
        return;
      }

      // 2. Near-miss check:
      // When player passes traffic at high speed (>= 80 km/h), within close lateral distance (< 2.6m)
      if (
        !car.passedPlayer &&
        cPos.z > -2.2 &&
        cPos.z < 2.2 &&
        this.currentSpeed >= 80
      ) {
        const lateralDist = Math.abs(pPos.x - cPos.x);
        if (lateralDist < 2.7) {
          car.passedPlayer = true;
          this.triggerNearMiss();
        }
      } else if (cPos.z > 3.0) {
        car.passedPlayer = true;
      }
    }
  }

  private triggerNearMiss() {
    const now = performance.now();
    // Chain combo if another near miss happens within 4 seconds
    if (now - this.lastNearMissTime < 4000) {
      this.nearMissCombo++;
    } else {
      this.nearMissCombo = 1;
    }
    this.lastNearMissTime = now;

    // Reward points: 150 base * combo
    const bonus = 150 * this.nearMissCombo;
    this.score += bonus;
    // Replenish a bit of nitro on successful near miss!
    this.nitroFuel = Math.min(100, this.nitroFuel + 18);

    // Subtle camera kick
    this.cameraShake = 0.25;

    this.callbacks.onNearMiss(bonus, this.nearMissCombo);
  }

  private triggerCrash(trafficCar: TrafficCarInstance) {
    this.isCrashed = true;
    this.cameraShake = 1.2;

    const crashPos = this.playerCar!.group.position.clone();
    this.spawnCrashSparks(crashPos);

    // Impact physics impulse
    const pushDirX = crashPos.x > trafficCar.group.position.x ? 8 : -8;
    this.crashSpin.set(pushDirX, 0, -12);

    this.setNitroVisuals(false);

    // Delay slightly to show crash explosion before game over modal
    setTimeout(() => {
      this.callbacks.onCollision(
        this.score,
        Math.round(this.distanceTraveled),
        Math.round(this.maxSpeed)
      );
    }, 1200);
  }

  private updateCamera(dt: number) {
    if (!this.playerCar) return;

    // Base camera follow
    const targetCamX = this.playerLaneX * 0.45;
    const baseCamY = 3.2;
    const baseCamZ = 6.8;

    // Camera FOV expansion during nitro
    const targetFOV = this.isNitroActive ? 68 : 58;
    this.camera.fov += (targetFOV - this.camera.fov) * (6 * dt);
    this.camera.updateProjectionMatrix();

    // Camera shake decay
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShake > 0.01) {
      shakeX = (Math.random() - 0.5) * this.cameraShake;
      shakeY = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - 2.5 * dt);
    }

    this.camera.position.x += (targetCamX - this.camera.position.x) * (10 * dt) + shakeX;
    this.camera.position.y = baseCamY + (this.isNitroActive ? -0.2 : 0) + shakeY;
    this.camera.position.z = baseCamZ + (this.isNitroActive ? 0.6 : 0);

    const lookTargetX = this.playerLaneX * 0.7;
    this.camera.lookAt(lookTargetX, 1.1, -12);
  }

  // --- CLEANUP ---
  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);

    try {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    } catch {
      // Ignore
    }
  }
}
