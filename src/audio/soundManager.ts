/**
 * 100% Offline Procedural Web Audio Engine
 * Provides dynamic engine revs, nitro bursts, near-miss whooshes,
 * crashes, UI feedback, and an energetic synthwave background rhythm.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private musicEnabled = true;

  // Engine audio nodes
  private engineOsc: OscillatorNode | null = null;
  private engineOscSub: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning = false;

  // Music sequencer timer
  private musicInterval: number | null = null;
  private musicStep = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopEngine();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  // --- UI Click ---
  public playClick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Audio fallback safe
    }
  }

  // --- Engine Sound ---
  public startEngine() {
    if (!this.soundEnabled || this.isEngineRunning) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOscSub = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.engineOsc.type = 'sawtooth';
      this.engineOscSub.type = 'triangle';

      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.engineOscSub.frequency.setValueAtTime(27.5, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineOscSub.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.engineOscSub.start();
      this.isEngineRunning = true;
    } catch {
      this.isEngineRunning = false;
    }
  }

  public updateEngine(speedKmH: number, isNitro: boolean) {
    if (!this.soundEnabled || !this.isEngineRunning || !this.ctx || !this.engineOsc || !this.engineFilter || !this.engineOscSub) {
      if (this.soundEnabled && !this.isEngineRunning && speedKmH > 0) {
        this.startEngine();
      }
      return;
    }

    try {
      const now = this.ctx.currentTime;
      const speedNorm = Math.min(Math.max(speedKmH / 220, 0), 1.5);
      
      // Calculate realistic sports engine pitch
      const baseFreq = 50 + speedNorm * 110 + (isNitro ? 35 : 0);
      this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
      this.engineOscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);

      const cutoff = 240 + speedNorm * 650 + (isNitro ? 400 : 0);
      this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.08);

      if (this.engineGain) {
        const volume = Math.min(0.06 + speedNorm * 0.06 + (isNitro ? 0.03 : 0), 0.16);
        this.engineGain.gain.setTargetAtTime(volume, now, 0.08);
      }
    } catch {
      // Audio safety
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
      if (this.engineOscSub) {
        this.engineOscSub.stop();
        this.engineOscSub.disconnect();
      }
      if (this.engineFilter) this.engineFilter.disconnect();
      if (this.engineGain) this.engineGain.disconnect();
    } catch {
      // Ignore cleanup error
    }
    this.engineOsc = null;
    this.engineOscSub = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  // --- Nitro Boost Sound ---
  public playNitro() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Rocket whoosh noise
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);

      // Deep turbine whoosh tone
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.3);

      oscGain.gain.setValueAtTime(0.18, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignored
    }
  }

  // --- Near-Miss Doppler Whoosh ---
  public playNearMiss() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-speed wind pass
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Doppler pitch shift: 800Hz drops to 320Hz
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.22);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      // Crisp reward bell
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'triangle';
      bell.frequency.setValueAtTime(1200, now + 0.05);
      bell.frequency.exponentialRampToValueAtTime(1800, now + 0.2);

      bellGain.gain.setValueAtTime(0.15, now + 0.05);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      bell.connect(bellGain);
      bellGain.connect(this.ctx.destination);

      bell.start(now + 0.05);
      bell.stop(now + 0.35);
    } catch {
      // Ignored
    }
  }

  // --- Collision Crash ---
  public playCrash() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Heavy explosion noise
      const bufferSize = this.ctx.sampleRate * 0.7;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.6);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);

      // Low impact crunch thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(140, now);
      thud.frequency.exponentialRampToValueAtTime(30, now + 0.5);

      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);

      thud.start(now);
      thud.stop(now + 0.6);
    } catch {
      // Ignored
    }
  }

  // --- Background Synthwave Beat ---
  public startMusic() {
    if (!this.musicEnabled || this.musicInterval !== null) return;
    this.initContext();
    if (!this.ctx) return;

    this.musicStep = 0;
    // D Minor synthwave bassline notes
    const bassNotes = [73.42, 73.42, 87.31, 87.31, 65.41, 65.41, 98.00, 87.31]; // D2, D2, F2, F2, C2, C2, G2, F2
    const leadNotes = [293.66, 349.23, 392.00, 440.00, 392.00, 349.23, 329.63, 293.66]; // D4, F4, G4, A4...

    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const noteIndex = this.musicStep % bassNotes.length;
        
        // Bass synth hit
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassNotes[noteIndex], now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.16);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);

        // Hi-hat tick on every alternate step
        if (this.musicStep % 2 === 1) {
          const hatOsc = this.ctx.createOscillator();
          const hatGain = this.ctx.createGain();
          hatOsc.type = 'highpass' as unknown as OscillatorType; // use triangle high
          hatOsc.type = 'triangle';
          hatOsc.frequency.setValueAtTime(8000, now);
          hatGain.gain.setValueAtTime(0.015, now);
          hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          hatOsc.connect(hatGain);
          hatGain.connect(this.ctx.destination);
          hatOsc.start(now);
          hatOsc.stop(now + 0.05);
        }

        // Melodic accent on step 0 and 4
        if (this.musicStep % 4 === 0) {
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'sine';
          leadOsc.frequency.setValueAtTime(leadNotes[(this.musicStep / 4) % leadNotes.length], now);
          leadGain.gain.setValueAtTime(0.02, now);
          leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          leadOsc.connect(leadGain);
          leadGain.connect(this.ctx.destination);
          leadOsc.start(now);
          leadOsc.stop(now + 0.26);
        }

        this.musicStep++;
      } catch {
        // Safe
      }
    }, 140); // ~107 BPM
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public destroy() {
    this.stopEngine();
    this.stopMusic();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}

export const soundManager = new SoundManager();
