/**
 * Real-time Web Audio API frequency analysis engine for Zeji Manga UI
 * Safely handles AudioContext, AnalyserNode, MediaElementSource caching,
 * and seamless dynamic fallback for CORS/cross-origin audio streams.
 */

class AudioVisualizerEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
  private currentElement: HTMLAudioElement | null = null;
  private frequencyData: Uint8Array = new Uint8Array(32);
  private timeDomainData: Uint8Array = new Uint8Array(64);
  private peakLevels: number[] = new Array(32).fill(0);
  private peakHoldTimes: number[] = new Array(32).fill(0);
  private isSyntheticFallback = false;
  private lastNonZeroTime = 0;

  constructor() {
    // Lazy AudioContext initialization on first user interaction or attachment
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64; // 32 frequency bins
        this.analyser.smoothingTimeConstant = 0.82;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Safely attach an HTMLAudioElement to the Web Audio Analyser graph
   */
  public attach(audioEl: HTMLAudioElement | null) {
    if (!audioEl || typeof window === 'undefined') return;
    this.initContext();
    if (!this.audioCtx || !this.analyser) return;

    if (this.currentElement === audioEl) return;
    this.currentElement = audioEl;

    // Ensure audio element allows cross-origin where permitted
    if (!audioEl.crossOrigin) {
      try {
        audioEl.crossOrigin = 'anonymous';
      } catch {
        // Ignore if already loaded
      }
    }

    try {
      let sourceNode = this.sourceMap.get(audioEl);
      if (!sourceNode) {
        sourceNode = this.audioCtx.createMediaElementSource(audioEl);
        sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        this.sourceMap.set(audioEl, sourceNode);
      }
    } catch (err) {
      // If browser security or duplicate connection prevents MediaElementSource,
      // fallback smoothly to synthetic reactive spectrum mode
      this.isSyntheticFallback = true;
    }
  }

  /**
   * Resume AudioContext upon user gesture
   */
  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Reads real-time frequency spectrum data (0..255)
   * With dynamic fallback if CORS silences the hardware analyser
   */
  public getFrequencyData(isPlaying: boolean = false, currentTime: number = 0): { data: Uint8Array; peaks: number[] } {
    if (!this.audioCtx || !this.analyser) {
      this.initContext();
    }

    const binCount = this.analyser ? this.analyser.frequencyBinCount : 32;
    if (this.frequencyData.length !== binCount) {
      this.frequencyData = new Uint8Array(binCount);
      this.timeDomainData = new Uint8Array(binCount);
      this.peakLevels = new Array(binCount).fill(0);
      this.peakHoldTimes = new Array(binCount).fill(0);
    }

    let isSilent = true;

    if (this.analyser && !this.isSyntheticFallback) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      for (let i = 0; i < this.frequencyData.length; i++) {
        if (this.frequencyData[i] > 5) {
          isSilent = false;
          this.lastNonZeroTime = performance.now();
          break;
        }
      }
    }

    // If browser returns 0 due to CORS restriction on audio element or uninitialized pipeline while playing,
    // generate lively reactive rhythmic harmonics matching time & beats
    if (isPlaying && isSilent) {
      const now = performance.now() / 1000;
      const t = currentTime > 0 ? currentTime : now;
      const bpm = 124; // Standard cyberpunk synthwave tempo
      const beat = (t * (bpm / 60)) % 4; // 4-beat measure

      for (let i = 0; i < this.frequencyData.length; i++) {
        const binProgress = i / this.frequencyData.length;
        
        // Bass kick pulse on quarter notes
        const kickPulse = Math.max(0, 1 - (beat % 1) * 2.8) * Math.max(0, 1 - binProgress * 2.5);
        
        // Snare / clap on beats 2 & 4 in mid-range
        const isSnareBeat = beat >= 1 && beat < 2 || beat >= 3;
        const snarePulse = isSnareBeat ? Math.max(0, 1 - ((beat % 2) - 1) * 3) * Math.sin(binProgress * Math.PI) : 0;
        
        // High hat shimmer in high frequencies
        const hatPulse = Math.sin(t * 16 + i) * 0.25 * binProgress;

        // Sub harmonic waves
        const subWave = Math.sin(t * 4 + i * 0.6) * 0.2 + Math.cos(t * 8 + i * 0.3) * 0.15;

        // Base frequency curve (high energy bass tapering to airy highs)
        const baseSlope = (1 - binProgress * 0.65);
        const composite = Math.max(0.08, baseSlope * 0.45 + kickPulse * 0.55 + snarePulse * 0.4 + hatPulse + subWave);
        
        const byteVal = Math.min(255, Math.floor(composite * 255));
        this.frequencyData[i] = byteVal;
      }
    } else if (!isPlaying) {
      // Rapid decay to zero when stopped
      for (let i = 0; i < this.frequencyData.length; i++) {
        this.frequencyData[i] = Math.max(0, Math.floor(this.frequencyData[i] * 0.85));
      }
    }

    // Calculate peak holds with gravity decay
    const nowMs = performance.now();
    for (let i = 0; i < this.frequencyData.length; i++) {
      const current = this.frequencyData[i];
      if (current >= this.peakLevels[i]) {
        this.peakLevels[i] = current;
        this.peakHoldTimes[i] = nowMs + 350; // hold for 350ms
      } else if (nowMs > this.peakHoldTimes[i]) {
        // Falloff decay
        this.peakLevels[i] = Math.max(0, this.peakLevels[i] - 4.5);
      }
    }

    return {
      data: this.frequencyData,
      peaks: this.peakLevels
    };
  }

  /**
   * Reads real-time waveform time domain data (for oscilloscope)
   */
  public getTimeDomainData(isPlaying: boolean = false, currentTime: number = 0): Uint8Array {
    if (this.analyser && !this.isSyntheticFallback) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
      let isFlat = true;
      for (let i = 0; i < this.timeDomainData.length; i++) {
        if (Math.abs(this.timeDomainData[i] - 128) > 2) {
          isFlat = false;
          break;
        }
      }
      if (!isFlat) return this.timeDomainData;
    }

    // Dynamic wave fallback
    if (isPlaying) {
      const now = currentTime > 0 ? currentTime : performance.now() / 1000;
      for (let i = 0; i < this.timeDomainData.length; i++) {
        const phase = (i / this.timeDomainData.length) * Math.PI * 4;
        const wave = Math.sin(phase + now * 12) * 0.6 + Math.sin(phase * 2.5 - now * 8) * 0.3;
        this.timeDomainData[i] = Math.floor(128 + wave * 90);
      }
    } else {
      this.timeDomainData.fill(128);
    }

    return this.timeDomainData;
  }
}

export const audioVisualizer = new AudioVisualizerEngine();
