// Web Audio API Synthesizer for tactile video game UI sound effects
// Delivers subtle, non-fatiguing, high-contrast video game menu sounds (hover ticks, select clicks, warp pulses)

let audioCtx: AudioContext | null = null;
let sfxEnabled = true;

// Rate-limiting / deduplication state
let lastHoverTime = 0;
let lastHoverElement: EventTarget | null = null;
let lastClickTime = 0;

// Load persisted state if available
try {
  const saved = localStorage.getItem('zeji_sfx_enabled');
  if (saved !== null) {
    sfxEnabled = saved === 'true';
  }
} catch {
  // Ignore storage errors
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const unlockSfxContext = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
};

export const isSfxMuted = (): boolean => !sfxEnabled;

export const setSfxEnabled = (enabled: boolean): boolean => {
  sfxEnabled = enabled;
  try {
    localStorage.setItem('zeji_sfx_enabled', String(sfxEnabled));
  } catch {
    // Ignore
  }
  if (sfxEnabled) {
    playSelectSound();
  }
  return sfxEnabled;
};

export const toggleSfx = (): boolean => {
  return setSfxEnabled(!sfxEnabled);
};

/**
 * Menu Hover: Subtle, soft high-tech tick/blip
 * Engineered with gentle peak gain and micro-envelope (~22ms)
 * Rate-limited to prevent machine-gun stutter during fast mouse sweeps.
 */
export const playHoverSound = () => {
  if (!sfxEnabled) return;
  const now = performance.now();
  if (now - lastHoverTime < 35) {
    return; // Rate limit 35ms
  }
  lastHoverTime = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Gentle highpass filter to keep it crisp and clear of low-end mud
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    // Subtle sine/triangle micro-chirp (1100Hz -> 1650Hz over 24ms)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1680, ctx.currentTime + 0.022);

    // Soft, non-fatiguing volume envelope (peak 0.018)
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.024);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.026);
  } catch {
    // Graceful fallback
  }
};

/**
 * Menu Select / Navigation Confirm: Tactile cyber click
 * Features a high-speed mechanical transient click + warm dual-tone confirmation
 */
export const playSelectSound = () => {
  if (!sfxEnabled) return;
  const now = performance.now();
  if (now - lastClickTime < 40) {
    return; // Deduplicate rapid clicks
  }
  lastClickTime = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const time = ctx.currentTime;

    // Transient mechanical tick
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(2400, time);
    clickOsc.frequency.exponentialRampToValueAtTime(800, time + 0.009);
    clickGain.gain.setValueAtTime(0.035, time);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(time);
    clickOsc.stop(time + 0.014);

    // Harmonic affirmative tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const toneGain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // D5 -> A5 (587.33Hz -> 880Hz)
    osc1.frequency.setValueAtTime(659.25, time + 0.005); // E5
    osc1.frequency.exponentialRampToValueAtTime(987.77, time + 0.055); // B5

    // Higher harmonic shimmer
    osc2.frequency.setValueAtTime(1318.51, time + 0.018); // E6
    osc2.frequency.exponentialRampToValueAtTime(1975.53, time + 0.075); // B6

    toneGain.gain.setValueAtTime(0.001, time + 0.005);
    toneGain.gain.linearRampToValueAtTime(0.03, time + 0.012);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.085);

    osc1.connect(toneGain);
    osc2.connect(toneGain);
    toneGain.connect(ctx.destination);

    osc1.start(time + 0.005);
    osc1.stop(time + 0.06);

    osc2.start(time + 0.018);
    osc2.stop(time + 0.085);
  } catch {
    // Graceful fallback
  }
};

/**
 * Direct Alias for Menu Clicks
 */
export const playClickSound = playSelectSound;

/**
 * Subtle Micro-Click (for toggles, checkboxes, small utility icons)
 */
export const playSubtleClickSound = () => {
  if (!sfxEnabled) return;
  const now = performance.now();
  if (now - lastClickTime < 30) return;
  lastClickTime = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, time);
    osc.frequency.exponentialRampToValueAtTime(900, time + 0.015);

    gain.gain.setValueAtTime(0.02, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.016);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.018);
  } catch {
    // Graceful fallback
  }
};

/**
 * Navigation Sector Warp Click
 */
export const playNavClickSound = () => {
  if (!sfxEnabled) return;
  playSelectSound();
};

/**
 * Item Equip / Add to Inventory: Power-up resonant chord
 */
export const playEquipSound = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [440, 659.25, 880, 1318.51];
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.03);

      gain.gain.setValueAtTime(0.035, ctx.currentTime + index * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.03 + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.03);
      osc.stop(ctx.currentTime + index * 0.03 + 0.16);
    });
  } catch {
    // Graceful fallback
  }
};

/**
 * Cancel / Close Back sound
 */
export const playCancelSound = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // Graceful fallback
  }
};

/**
 * Level loading sequence warp pulse
 */
export const playLevelLoadSound = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Sub-bass sweep
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.2);
    subGain.gain.setValueAtTime(0.04, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(ctx.currentTime);
    subOsc.stop(ctx.currentTime + 0.25);

    // Digital sector chirp
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime + 0.02);
    osc.frequency.setValueAtTime(780, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.02, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + 0.02);
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Graceful fallback
  }
};

/**
 * Level warp complete lock-in chime
 */
export const playLevelCompleteSound = () => {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Graceful fallback
  }
};

/**
 * Attaches global event delegation for interactive game menu buttons and links.
 * Automatically gives every navigation link, tab, and menu button subtle hover & click sounds.
 * Avoids duplicate sound triggers and ignores typing inputs.
 */
export function setupMenuSoundListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const isInteractiveTarget = (el: HTMLElement | null): HTMLElement | null => {
    if (!el) return null;
    // Look up for closest interactive element
    const interactive = el.closest<HTMLElement>(
      'a, button, [role="button"], [role="menuitem"], [role="tab"], .game-btn, .nav-tab, [data-sound="menu"]'
    );
    if (!interactive) return null;

    // Ignore text inputs or elements marked data-no-sfx
    if (
      interactive.tagName === 'INPUT' ||
      interactive.tagName === 'TEXTAREA' ||
      interactive.tagName === 'SELECT' ||
      interactive.getAttribute('data-no-sfx') === 'true' ||
      interactive.closest('[data-no-sfx="true"]')
    ) {
      return null;
    }
    return interactive;
  };

  const handlePointerOver = (e: MouseEvent) => {
    const target = isInteractiveTarget(e.target as HTMLElement);
    if (target && target !== lastHoverElement) {
      lastHoverElement = target;
      playHoverSound();
    }
  };

  const handleClick = (e: MouseEvent) => {
    // Auto resume audio context on first click
    unlockSfxContext();

    const target = isInteractiveTarget(e.target as HTMLElement);
    if (target) {
      playSelectSound();
    }
  };

  document.addEventListener('mouseover', handlePointerOver, { passive: true });
  document.addEventListener('click', handleClick, { passive: true });

  return () => {
    document.removeEventListener('mouseover', handlePointerOver);
    document.removeEventListener('click', handleClick);
  };
}
