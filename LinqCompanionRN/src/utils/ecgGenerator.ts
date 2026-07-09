// ── Synthetic single-channel ECG generator ────────────────────────────────────
// Produces a deterministic, stylized 30-second ECG strip with condition-correct
// morphology regions for each cardiac event (AFib, pause, tachy, brady, PVC).
// Purely illustrative — not real ECG data.

import { CardiacEvent, CardiacEventType } from '../models/physicianTypes';

export interface EcgMarker {
  eventId: string;
  type: CardiacEventType;
  timeSec: number; // position within the strip
}

export interface EcgStripData {
  samples: number[];   // normalized amplitude, roughly -0.6..1.4
  sampleRate: number;  // Hz
  durationSec: number;
  markers: EcgMarker[];
}

// ── Seeded RNG (mulberry32) so the strip is stable across renders ─────────────

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Waveform primitives ───────────────────────────────────────────────────────

/** Adds a gaussian bump centered at tCenter into the sample buffer. */
function addGaussian(
  samples: number[], sampleRate: number,
  tCenter: number, amplitude: number, sigma: number,
) {
  const from = Math.max(0, Math.floor((tCenter - 4 * sigma) * sampleRate));
  const to = Math.min(samples.length - 1, Math.ceil((tCenter + 4 * sigma) * sampleRate));
  for (let i = from; i <= to; i++) {
    const t = i / sampleRate;
    const d = (t - tCenter) / sigma;
    samples[i] += amplitude * Math.exp(-0.5 * d * d);
  }
}

type BeatKind = 'normal' | 'afib' | 'tachy' | 'brady' | 'pvc';

/** Draws one P-QRS-T complex with the R peak at tR. */
function addBeat(samples: number[], sampleRate: number, tR: number, kind: BeatKind, rng: () => number) {
  const amp = 1 + (rng() - 0.5) * 0.08;
  switch (kind) {
    case 'pvc':
      // Wide, bizarre complex: no P, broad tall R, deep S, discordant T.
      addGaussian(samples, sampleRate, tR - 0.02, -0.15 * amp, 0.02);
      addGaussian(samples, sampleRate, tR, 1.35 * amp, 0.035);
      addGaussian(samples, sampleRate, tR + 0.07, -0.45 * amp, 0.03);
      addGaussian(samples, sampleRate, tR + 0.32, -0.28 * amp, 0.07);
      return;
    case 'afib':
      // No discernible P wave; slightly variable QRS amplitude.
      addGaussian(samples, sampleRate, tR - 0.025, -0.09 * amp, 0.009);
      addGaussian(samples, sampleRate, tR, (0.95 + rng() * 0.2) * amp, 0.009);
      addGaussian(samples, sampleRate, tR + 0.028, -0.24 * amp, 0.01);
      addGaussian(samples, sampleRate, tR + 0.29, 0.26 * amp, 0.05);
      return;
    default: {
      // Normal sinus morphology (tachy/brady vary only in rate; tachy P merges slightly).
      const pAmp = kind === 'tachy' ? 0.09 : 0.13;
      addGaussian(samples, sampleRate, tR - 0.17, pAmp * amp, 0.026);
      addGaussian(samples, sampleRate, tR - 0.025, -0.1 * amp, 0.009);
      addGaussian(samples, sampleRate, tR, 1.0 * amp, 0.009);
      addGaussian(samples, sampleRate, tR + 0.028, -0.26 * amp, 0.01);
      addGaussian(samples, sampleRate, tR + 0.3, 0.3 * amp, 0.055);
    }
  }
}

// ── Event regions ─────────────────────────────────────────────────────────────

interface Region {
  start: number;
  end: number;
  event: CardiacEvent;
}

function regionHalfWidth(type: CardiacEventType): number {
  switch (type) {
    case 'Bradycardia Event': return 3.2;
    case 'Pause': return 2.2;
    default: return 2.6;
  }
}

function beatKindFor(type: CardiacEventType): BeatKind {
  switch (type) {
    case 'AFib Episode': return 'afib';
    case 'Tachycardia Event': return 'tachy';
    case 'Bradycardia Event': return 'brady';
    case 'PVC Run': return 'pvc';
    default: return 'normal';
  }
}

/** RR interval in seconds for a beat starting inside (or outside) a region. */
function rrFor(kind: BeatKind | 'pause', rng: () => number): number {
  switch (kind) {
    case 'afib': return (60 / 125) * (0.68 + rng() * 0.75); // irregularly irregular
    case 'tachy': return (60 / 152) * (0.98 + rng() * 0.04);
    case 'brady': return (60 / 40) * (0.97 + rng() * 0.06);
    case 'pvc': return (60 / 105) * (0.95 + rng() * 0.1);   // coupled ectopy
    default: return (60 / 72) * (0.97 + rng() * 0.06);
  }
}

// ── Main generator ────────────────────────────────────────────────────────────

export const ECG_DURATION_SEC = 30;
export const ECG_SAMPLE_RATE = 80;

export function generateEcgStrip(events: CardiacEvent[], seedKey: string): EcgStripData {
  const sampleRate = ECG_SAMPLE_RATE;
  const durationSec = ECG_DURATION_SEC;
  const n = durationSec * sampleRate;
  const samples = new Array<number>(n).fill(0);
  const rng = mulberry32(hashSeed(seedKey));

  const regions: Region[] = events.map(e => {
    const hw = regionHalfWidth(e.type);
    return { start: e.stripOffsetSec - hw, end: e.stripOffsetSec + hw, event: e };
  });

  const regionAt = (t: number): Region | undefined =>
    regions.find(r => t >= r.start && t <= r.end);

  // Schedule beats along the strip.
  const pausesDone = new Set<string>();
  let t = 0.35 + rng() * 0.2;
  while (t < durationSec + 0.5) {
    const region = regionAt(t);

    if (region && region.event.type === 'Pause' && !pausesDone.has(region.event.id)) {
      // One beat, then asystole (flatline), then resume.
      addBeat(samples, sampleRate, t, 'normal', rng);
      const gap = Math.min(4, Math.max(2.8, region.event.durationSeconds));
      pausesDone.add(region.event.id);
      t += gap;
      continue;
    }

    const kind: BeatKind = region ? beatKindFor(region.event.type) : 'normal';
    addBeat(samples, sampleRate, t, kind, rng);
    t += rrFor(kind, rng);
  }

  // Fibrillatory baseline inside AFib regions.
  for (const r of regions) {
    if (r.event.type !== 'AFib Episode') continue;
    const p1 = rng() * Math.PI * 2;
    const p2 = rng() * Math.PI * 2;
    const from = Math.max(0, Math.floor(r.start * sampleRate));
    const to = Math.min(n - 1, Math.ceil(r.end * sampleRate));
    for (let i = from; i <= to; i++) {
      const ts = i / sampleRate;
      samples[i] += 0.045 * Math.sin(2 * Math.PI * 6.8 * ts + p1)
                  + 0.03 * Math.sin(2 * Math.PI * 4.9 * ts + p2);
    }
  }

  // Gentle baseline wander + fine noise across the whole strip.
  const wanderPhase = rng() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const ts = i / sampleRate;
    samples[i] += 0.025 * Math.sin(2 * Math.PI * 0.18 * ts + wanderPhase);
    samples[i] += (rng() - 0.5) * 0.015;
  }

  const markers: EcgMarker[] = events.map(e => ({
    eventId: e.id,
    type: e.type,
    timeSec: e.stripOffsetSec,
  }));

  return { samples, sampleRate, durationSec, markers };
}
