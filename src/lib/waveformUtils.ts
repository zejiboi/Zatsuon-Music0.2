/**
 * Waveform generation and audio extraction utility for Japanese Manga UI
 * Generates rich, authentic waveform peak profiles for audio preview & scrubber
 */

// Simple deterministic string hash for stable waveform generation
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Pseudo-random generator based on seed
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates a realistic mastered audio track waveform profile
 * Simulates intro buildup, verses, choruses/drops, bridge, and outro
 */
export function generateWaveformData(seedStr: string, count: number = 48): number[] {
  const seed = hashString(seedStr || 'ZEJI_AUDIO');
  const rng = seededRandom(seed);
  const waveform: number[] = [];

  for (let i = 0; i < count; i++) {
    const progress = i / count;

    // Macro structural envelope (Intro -> Drop 1 -> Breakdown -> Drop 2 / Climax -> Outro)
    let macroEnvelope = 0.5;
    if (progress < 0.12) {
      // Intro ramp
      macroEnvelope = 0.2 + progress * 4;
    } else if (progress < 0.4) {
      // First drop / verse
      macroEnvelope = 0.7 + Math.sin(progress * 18) * 0.2;
    } else if (progress < 0.55) {
      // Mid breakdown
      macroEnvelope = 0.35 + Math.sin(progress * 12) * 0.15;
    } else if (progress < 0.88) {
      // High-energy climax / Second Drop
      macroEnvelope = 0.85 + Math.sin(progress * 24) * 0.15;
    } else {
      // Outro fade
      macroEnvelope = Math.max(0.15, (1 - progress) * 3);
    }

    // Micro rhythmic beat variance
    const microPulse = (i % 2 === 0 ? 0.9 : 0.6) + rng() * 0.35;
    const value = Math.min(1, Math.max(0.12, macroEnvelope * microPulse));
    waveform.push(Number(value.toFixed(2)));
  }

  return waveform;
}

// In-memory cache for decoded audio waveforms to avoid redundant fetches
const waveformCache = new Map<string, number[]>();

/**
 * Attempts to decode actual audio peaks from an audio URL, falling back to algorithmic waveform
 */
export async function getTrackWaveform(urlOrId: string, title: string = '', count: number = 48): Promise<number[]> {
  const cacheKey = `${urlOrId}_${count}`;
  if (waveformCache.has(cacheKey)) {
    return waveformCache.get(cacheKey)!;
  }

  // Generate fallback profile first
  const fallback = generateWaveformData(title || urlOrId, count);
  waveformCache.set(cacheKey, fallback);

  // If URL is an external link or data URL, we can attempt AudioContext decoding in background
  if (typeof window !== 'undefined' && urlOrId && urlOrId.startsWith('data:audio') && window.AudioContext) {
    try {
      const response = await fetch(urlOrId);
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / count);
      const peaks: number[] = [];

      for (let i = 0; i < count; i++) {
        const start = i * blockSize;
        let max = 0;
        for (let j = 0; j < blockSize; j += 16) {
          const val = Math.abs(channelData[start + j] || 0);
          if (val > max) max = val;
        }
        peaks.push(Math.max(0.15, Math.min(1, max)));
      }

      audioCtx.close();
      waveformCache.set(cacheKey, peaks);
      return peaks;
    } catch {
      // Return the algorithmic waveform on decode failure
      return fallback;
    }
  }

  return fallback;
}
