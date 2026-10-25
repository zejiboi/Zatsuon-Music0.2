// Web Audio API Generative Dark Orchestral Ambient Soundscape Engine
// Synthesizes authentic, evolving dark cinematic orchestra (contrabass, cellos, violins, brass, cathedral drones, reverberant tympani)
// and supports custom audio tracks as ambient background music.

import { audioVisualizer } from './audioVisualizer';

export type OrchestraPreset = 
  | 'GOTHIC_REQUIEM' 
  | 'ABYSS_CHAMBER' 
  | 'BLOOD_OVERTURE' 
  | 'VOID_HARMONICS'
  | 'CYBERPUNK_DRIFT'
  | 'CATHEDRAL_NOIR';

export interface AmbientTrack {
  id: string;
  title: string;
  album: string;
  audioUrl: string;
  duration?: string;
  coverUrl?: string;
}

export interface OrchestraState {
  isPlaying: boolean;
  isUnlocked: boolean;
  volume: number; // 0 to 1
  preset: OrchestraPreset;
  currentChordName: string;
  activeMode: 'generative' | 'song';
  currentSong: AmbientTrack | null;
}

type Listener = (state: OrchestraState) => void;

class DarkOrchestraEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isRunning = false;
  private isDucked = false;
  private timerId: number | null = null;
  private tympaniTimerId: number | null = null;
  private listeners: Set<Listener> = new Set();
  private ambientAudio: HTMLAudioElement | null = null;

  private state: OrchestraState = {
    isPlaying: true,
    isUnlocked: false,
    volume: 0.65,
    preset: 'GOTHIC_REQUIEM',
    currentChordName: 'D MINOR REQUIEM',
    activeMode: 'generative',
    currentSong: null
  };

  private activeVoices: { osc: OscillatorNode; gain: GainNode }[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedVolume = localStorage.getItem('zeji_orchestra_vol');
        if (savedVolume !== null) {
          this.state.volume = Math.max(0, Math.min(1, parseFloat(savedVolume)));
        }
        const savedPreset = localStorage.getItem('zeji_orchestra_preset') as OrchestraPreset | null;
        if (savedPreset && ['GOTHIC_REQUIEM', 'ABYSS_CHAMBER', 'BLOOD_OVERTURE', 'VOID_HARMONICS', 'CYBERPUNK_DRIFT', 'CATHEDRAL_NOIR'].includes(savedPreset)) {
          this.state.preset = savedPreset;
        }
        const savedPlay = localStorage.getItem('zeji_orchestra_playing');
        if (savedPlay !== null) {
          this.state.isPlaying = savedPlay === 'true';
        }
        const savedMode = localStorage.getItem('zeji_orchestra_mode');
        if (savedMode === 'song' || savedMode === 'generative') {
          this.state.activeMode = savedMode;
        }
        const savedSong = localStorage.getItem('zeji_orchestra_song');
        if (savedSong) {
          this.state.currentSong = JSON.parse(savedSong);
        }
      } catch {
        // Ignore storage errors
      }

      // Auto-unlock on first user interaction if audio context starts suspended
      const unlockHandler = () => {
        this.unlockContext();
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      };
      window.addEventListener('click', unlockHandler, { once: true });
      window.addEventListener('keydown', unlockHandler, { once: true });
      window.addEventListener('touchstart', unlockHandler, { once: true });
    }
  }

  private initAudio() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.duckGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain.gain.setValueAtTime(this.state.isPlaying ? this.state.volume : 0, this.ctx.currentTime);
    this.duckGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.reverbNode = this.buildCathedralReverb(this.ctx);

    this.duckGain.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    if (this.ctx.state === 'running') {
      this.state.isUnlocked = true;
      this.notify();
    }
  }

  private buildCathedralReverb(ctx: AudioContext): ConvolverNode {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * 3.8;
    const decay = 2.4;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i;
      const t = n / length;
      const envelope = Math.pow(1 - t, decay);
      left[i] = (Math.random() * 2 - 1) * envelope * (1 + 0.1 * Math.sin(i * 0.005));
      right[i] = (Math.random() * 2 - 1) * envelope * (1 + 0.1 * Math.cos(i * 0.005));
    }

    convolver.buffer = impulse;
    return convolver;
  }

  public unlockContext() {
    this.initAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.state.isUnlocked = true;
        this.notify();
        if (this.state.isPlaying) {
          if (this.state.activeMode === 'generative') {
            this.startOrchestraProgression();
          } else if (this.ambientAudio) {
            this.ambientAudio.play().catch(() => {});
          }
        }
      }).catch(() => {});
    } else {
      this.state.isUnlocked = true;
      this.notify();
      if (this.state.isPlaying) {
        if (this.state.activeMode === 'generative') {
          this.startOrchestraProgression();
        } else if (this.ambientAudio) {
          this.ambientAudio.play().catch(() => {});
        }
      }
    }
  }

  private getProgression(preset: OrchestraPreset): { name: string; notes: number[]; brass: number[]; bass: number }[] {
    switch (preset) {
      case 'GOTHIC_REQUIEM':
        return [
          { name: 'D MINOR REQUIEM', bass: 36.71, notes: [73.42, 110.0, 146.83, 174.61, 220.0, 329.63], brass: [110.0, 146.83] },
          { name: 'Bb MAJ7 (OBSIDIAN)', bass: 29.14, notes: [58.27, 116.54, 146.83, 174.61, 233.08, 349.23], brass: [116.54, 174.61] },
          { name: 'G MINOR (ABYSS)', bass: 48.99, notes: [97.99, 146.83, 196.0, 233.08, 293.66, 392.0], brass: [97.99, 146.83] },
          { name: 'A DIMINISHED 7TH', bass: 55.0, notes: [110.0, 138.59, 164.81, 207.65, 277.18, 329.63], brass: [110.0, 164.81] }
        ];

      case 'ABYSS_CHAMBER':
        return [
          { name: 'C MINOR ELEGY', bass: 32.70, notes: [65.41, 98.0, 130.81, 155.56, 196.0, 311.13], brass: [98.0, 130.81] },
          { name: 'Ab MAJOR 9TH', bass: 51.91, notes: [103.83, 130.81, 155.56, 207.65, 261.63, 329.63], brass: [103.83, 155.56] },
          { name: 'F MINOR 6TH', bass: 43.65, notes: [87.31, 130.81, 174.61, 207.65, 293.66, 349.23], brass: [87.31, 174.61] },
          { name: 'G PHRYGIAN DOMINANT', bass: 48.99, notes: [97.99, 123.47, 146.83, 196.0, 246.94, 311.13], brass: [97.99, 146.83] }
        ];

      case 'BLOOD_OVERTURE':
        return [
          { name: 'F# MINOR WARFARE', bass: 46.25, notes: [92.50, 138.59, 185.0, 220.0, 277.18, 369.99], brass: [92.50, 185.0] },
          { name: 'D MAJOR 7TH TENSION', bass: 36.71, notes: [73.42, 110.0, 146.83, 185.0, 220.0, 293.66], brass: [110.0, 146.83] },
          { name: 'B MINOR 9TH', bass: 61.74, notes: [123.47, 146.83, 185.0, 246.94, 293.66, 369.99], brass: [123.47, 185.0] },
          { name: 'C# SUS4 DARK FINALE', bass: 69.30, notes: [138.59, 185.0, 207.65, 277.18, 369.99, 415.3], brass: [138.59, 207.65] }
        ];

      case 'VOID_HARMONICS':
        return [
          { name: 'ASTRAL A MINOR', bass: 55.0, notes: [110.0, 164.81, 220.0, 261.63, 329.63, 440.0], brass: [110.0, 220.0] },
          { name: 'F LORIAN HARMONICS', bass: 43.65, notes: [87.31, 130.81, 174.61, 220.0, 349.23, 440.0], brass: [87.31, 174.61] },
          { name: 'D SUS2 VOID', bass: 36.71, notes: [73.42, 110.0, 146.83, 164.81, 220.0, 293.66], brass: [110.0, 164.81] },
          { name: 'E SUS4 ELEVATION', bass: 41.20, notes: [82.41, 123.47, 164.81, 220.0, 329.63, 392.0], brass: [82.41, 164.81] }
        ];

      case 'CYBERPUNK_DRIFT':
        return [
          { name: 'NEON RAIN MINOR', bass: 38.89, notes: [77.78, 116.54, 155.56, 174.61, 233.08, 311.13], brass: [116.54, 155.56] },
          { name: 'SUB-SECTOR ELEGY', bass: 43.65, notes: [87.31, 130.81, 164.81, 207.65, 261.63, 349.23], brass: [87.31, 130.81] },
          { name: 'OBSIDIAN SYNTH MATRIX', bass: 32.70, notes: [65.41, 98.0, 146.83, 196.0, 246.94, 293.66], brass: [98.0, 146.83] },
          { name: 'CYBER HARMONICS', bass: 48.99, notes: [97.99, 138.59, 174.61, 220.0, 277.18, 329.63], brass: [97.99, 174.61] }
        ];

      case 'CATHEDRAL_NOIR':
        return [
          { name: 'GOTHIC BASILICA', bass: 34.65, notes: [69.30, 103.83, 138.59, 174.61, 207.65, 277.18], brass: [103.83, 138.59] },
          { name: 'SHADOW CHOIR', bass: 41.20, notes: [82.41, 123.47, 164.81, 196.0, 246.94, 329.63], brass: [123.47, 164.81] },
          { name: 'ORGANUM MYSTICA', bass: 46.25, notes: [92.50, 138.59, 185.0, 220.0, 293.66, 369.99], brass: [138.59, 185.0] },
          { name: 'VESPERS LITURGY', bass: 51.91, notes: [103.83, 155.56, 196.0, 233.08, 311.13, 392.0], brass: [103.83, 196.0] }
        ];
    }
  }

  private chordIndex = 0;

  private startOrchestraProgression() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.triggerNextMovement();

    this.timerId = window.setInterval(() => {
      this.triggerNextMovement();
    }, 14000);

    const scheduleTympani = () => {
      if (!this.isRunning) return;
      this.playTympaniHit();
      const nextDelay = 8000 + Math.random() * 5000;
      this.tympaniTimerId = window.setTimeout(scheduleTympani, nextDelay);
    };
    this.tympaniTimerId = window.setTimeout(scheduleTympani, 3000);
  }

  private stopOrchestraProgression() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.tympaniTimerId !== null) {
      clearTimeout(this.tympaniTimerId);
      this.tympaniTimerId = null;
    }

    if (this.ctx) {
      const now = this.ctx.currentTime;
      for (const voice of this.activeVoices) {
        try {
          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
          voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
          voice.osc.stop(now + 0.9);
        } catch {}
      }
    }
    this.activeVoices = [];
  }

  private triggerNextMovement() {
    if (!this.ctx || !this.duckGain || !this.reverbNode) return;
    const progression = this.getProgression(this.state.preset);
    const currentChord = progression[this.chordIndex % progression.length];
    this.chordIndex++;

    this.state.currentChordName = currentChord.name;
    this.notify();

    const now = this.ctx.currentTime;
    const fadeOutDuration = 4.5;
    const fadeInDuration = 4.0;

    for (const voice of this.activeVoices) {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutDuration);
        voice.osc.stop(now + fadeOutDuration + 0.1);
      } catch {}
    }
    this.activeVoices = [];

    // Contrabass
    const bassOsc = this.ctx.createOscillator();
    const bassSub = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(currentChord.bass, now);

    bassSub.type = 'sine';
    bassSub.frequency.setValueAtTime(currentChord.bass, now);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(140, now);
    bassFilter.frequency.exponentialRampToValueAtTime(220, now + 6);
    bassFilter.frequency.exponentialRampToValueAtTime(120, now + 14);
    bassFilter.Q.setValueAtTime(3.5, now);

    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.38, now + fadeInDuration);

    bassOsc.connect(bassFilter);
    bassSub.connect(bassFilter);
    bassFilter.connect(bassGain);

    bassGain.connect(this.duckGain);
    bassGain.connect(this.reverbNode);
    this.reverbNode.connect(this.duckGain);

    bassOsc.start(now);
    bassSub.start(now);
    this.activeVoices.push({ osc: bassOsc, gain: bassGain });

    // String Section
    currentChord.notes.forEach((freq, idx) => {
      if (!this.ctx || !this.duckGain || !this.reverbNode) return;
      const osc = this.ctx.createOscillator();
      const stringFilter = this.ctx.createBiquadFilter();
      const voiceGain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      const detuneCents = (idx % 2 === 0 ? 1 : -1) * (3 + (idx * 2.2));
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneCents, now);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4.6 + (idx * 0.3), now);
      lfoGain.gain.setValueAtTime(1.8, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

      stringFilter.type = 'bandpass';
      stringFilter.frequency.setValueAtTime(freq * 1.5, now);
      stringFilter.Q.setValueAtTime(1.8, now);

      if (panner) {
        const panValue = ((idx / (currentChord.notes.length - 1 || 1)) * 1.2) - 0.6;
        panner.pan.setValueAtTime(panValue, now);
      }

      const voiceVol = (0.09 / (currentChord.notes.length * 0.7));
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(voiceVol, now + fadeInDuration + (idx * 0.4));

      osc.connect(stringFilter);
      stringFilter.connect(voiceGain);

      if (panner) {
        voiceGain.connect(panner);
        panner.connect(this.duckGain);
        panner.connect(this.reverbNode);
      } else {
        voiceGain.connect(this.duckGain);
        voiceGain.connect(this.reverbNode);
      }

      osc.start(now);
      this.activeVoices.push({ osc, gain: voiceGain });
    });

    // Low Brass
    currentChord.brass.forEach((freq) => {
      if (!this.ctx || !this.duckGain || !this.reverbNode) return;
      const brassOsc = this.ctx.createOscillator();
      const brassFilter = this.ctx.createBiquadFilter();
      const brassGain = this.ctx.createGain();

      brassOsc.type = 'sawtooth';
      brassOsc.frequency.setValueAtTime(freq, now);

      brassFilter.type = 'lowpass';
      brassFilter.frequency.setValueAtTime(180, now);
      brassFilter.frequency.exponentialRampToValueAtTime(450, now + 7);
      brassFilter.frequency.exponentialRampToValueAtTime(160, now + 13);
      brassFilter.Q.setValueAtTime(2.0, now);

      brassGain.gain.setValueAtTime(0.0001, now);
      brassGain.gain.exponentialRampToValueAtTime(0.12, now + 5.5);

      brassOsc.connect(brassFilter);
      brassFilter.connect(brassGain);
      brassGain.connect(this.duckGain);
      brassGain.connect(this.reverbNode);

      brassOsc.start(now);
      this.activeVoices.push({ osc: brassOsc, gain: brassGain });
    });
  }

  private playTympaniHit() {
    if (!this.ctx || !this.duckGain || !this.reverbNode || !this.state.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(78, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.duckGain);
      gain.connect(this.reverbNode);

      osc.start(now);
      osc.stop(now + 3.3);
    } catch {}
  }

  private getOrCreateAmbientAudio(): HTMLAudioElement {
    if (!this.ambientAudio && typeof window !== 'undefined') {
      this.ambientAudio = new Audio();
      this.ambientAudio.loop = true;
      this.ambientAudio.crossOrigin = 'anonymous';
      audioVisualizer.attach(this.ambientAudio);
    }
    return this.ambientAudio!;
  }

  /**
   * Set a custom song from the catalog as the ambient backing music
   */
  public setSong(song: AmbientTrack) {
    this.unlockContext();
    this.stopOrchestraProgression();

    this.state.activeMode = 'song';
    this.state.currentSong = song;
    this.state.currentChordName = song.title;

    try {
      localStorage.setItem('zeji_orchestra_mode', 'song');
      localStorage.setItem('zeji_orchestra_song', JSON.stringify(song));
    } catch {}

    const audio = this.getOrCreateAmbientAudio();
    audio.src = song.audioUrl;
    audio.volume = this.isDucked ? this.state.volume * 0.15 : this.state.volume;

    if (this.state.isPlaying) {
      audio.play().catch(e => console.log('Ambient song autoplay prevented', e));
    }

    this.notify();
  }

  /**
   * Set a generative orchestral movement
   */
  public setPreset(preset: OrchestraPreset) {
    if (this.ambientAudio) {
      this.ambientAudio.pause();
    }

    this.state.activeMode = 'generative';
    this.state.preset = preset;

    try {
      localStorage.setItem('zeji_orchestra_mode', 'generative');
      localStorage.setItem('zeji_orchestra_preset', preset);
    } catch {}

    this.chordIndex = 0;
    this.stopOrchestraProgression();

    if (this.state.isPlaying) {
      this.startOrchestraProgression();
    }

    this.notify();
  }

  public play() {
    this.state.isPlaying = true;
    try {
      localStorage.setItem('zeji_orchestra_playing', 'true');
    } catch {}

    this.unlockContext();

    if (this.state.activeMode === 'song') {
      if (this.ambientAudio && this.state.currentSong) {
        this.ambientAudio.volume = this.isDucked ? this.state.volume * 0.15 : this.state.volume;
        this.ambientAudio.play().catch(() => {});
      }
    } else {
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, this.state.volume), now + 1.2);
      }
      if (!this.isRunning) {
        this.startOrchestraProgression();
      }
    }

    this.notify();
  }

  public pause() {
    this.state.isPlaying = false;
    try {
      localStorage.setItem('zeji_orchestra_playing', 'false');
    } catch {}

    if (this.state.activeMode === 'song' && this.ambientAudio) {
      this.ambientAudio.pause();
    } else {
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      }
    }

    this.notify();
  }

  public toggle() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    try {
      localStorage.setItem('zeji_orchestra_vol', String(clamped));
    } catch {}

    if (this.ambientAudio) {
      this.ambientAudio.volume = this.isDucked ? clamped * 0.15 : clamped;
    }

    if (this.ctx && this.masterGain && this.state.isPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, clamped), now + 0.1);
    }
    this.notify();
  }

  public duck(isDucked: boolean) {
    if (this.isDucked === isDucked) return;
    this.isDucked = isDucked;

    if (this.ambientAudio) {
      this.ambientAudio.volume = isDucked ? this.state.volume * 0.15 : this.state.volume;
    }

    if (!this.ctx || !this.duckGain) return;

    const now = this.ctx.currentTime;
    this.duckGain.gain.cancelScheduledValues(now);
    this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, now);

    if (isDucked) {
      this.duckGain.gain.exponentialRampToValueAtTime(0.12, now + 1.2);
    } else {
      this.duckGain.gain.exponentialRampToValueAtTime(1.0, now + 1.6);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getState(): OrchestraState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}

export const darkOrchestra = new DarkOrchestraEngine();
