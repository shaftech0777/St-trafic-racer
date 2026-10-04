export interface TiltState {
  rawGamma: number;
  rawBeta: number;
  steerValue: number; // -1 (left) to 1 (right)
  isSupported: boolean;
  permissionGranted: boolean;
  calibratedZero: number;
}

export class TiltController {
  private listener: ((event: DeviceOrientationEvent) => void) | null = null;
  private currentGamma = 0;
  private currentBeta = 0;
  private calibratedZero = 0;
  private sensitivity = 1.0;
  private isListening = false;
  private onTiltChange?: (steer: number, state: TiltState) => void;

  constructor(initialCalibratedZero = 0, initialSensitivity = 1.0) {
    this.calibratedZero = initialCalibratedZero;
    this.sensitivity = initialSensitivity;
  }

  public setSensitivity(val: number) {
    this.sensitivity = Math.max(0.4, Math.min(2.5, val));
  }

  public setCalibratedZero(val: number) {
    this.calibratedZero = val;
  }

  public calibrateCurrentAngle(): number {
    this.calibratedZero = this.currentGamma;
    return this.calibratedZero;
  }

  public async requestPermission(): Promise<boolean> {
    try {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        const response = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        return response === 'granted';
      }
      return true; // Android / standard desktop Chrome doesn't require explicit prompt
    } catch {
      return false;
    }
  }

  public startListening(callback: (steer: number, state: TiltState) => void) {
    this.onTiltChange = callback;
    if (this.isListening) return;

    this.listener = (e: DeviceOrientationEvent) => {
      // In portrait: gamma is left-to-right tilt in degrees (-90 to +90)
      if (e.gamma !== null && e.gamma !== undefined) {
        this.currentGamma = e.gamma;
      }
      if (e.beta !== null && e.beta !== undefined) {
        this.currentBeta = e.beta;
      }

      // Calculate relative angle to calibrated zero
      const delta = this.currentGamma - this.calibratedZero;

      // Small deadzone of 1.5 degrees to eliminate resting hand tremor
      const deadzone = 1.5;
      let effectiveDelta = 0;
      if (Math.abs(delta) > deadzone) {
        effectiveDelta = delta > 0 ? delta - deadzone : delta + deadzone;
      }

      // Map ~18 degrees of tilt to full steering (-1 to +1) scaled by sensitivity
      const maxAngle = 18 / this.sensitivity;
      let steer = effectiveDelta / maxAngle;
      steer = Math.max(-1, Math.min(1, steer));

      if (this.onTiltChange) {
        this.onTiltChange(steer, {
          rawGamma: this.currentGamma,
          rawBeta: this.currentBeta,
          steerValue: steer,
          isSupported: true,
          permissionGranted: true,
          calibratedZero: this.calibratedZero,
        });
      }
    };

    window.addEventListener('deviceorientation', this.listener, true);
    this.isListening = true;
  }

  public stopListening() {
    if (this.listener) {
      window.removeEventListener('deviceorientation', this.listener, true);
      this.listener = null;
    }
    this.isListening = false;
  }

  public getCurrentSteer(): number {
    const delta = this.currentGamma - this.calibratedZero;
    const deadzone = 1.5;
    let effectiveDelta = 0;
    if (Math.abs(delta) > deadzone) {
      effectiveDelta = delta > 0 ? delta - deadzone : delta + deadzone;
    }
    const maxAngle = 18 / this.sensitivity;
    return Math.max(-1, Math.min(1, effectiveDelta / maxAngle));
  }
}
