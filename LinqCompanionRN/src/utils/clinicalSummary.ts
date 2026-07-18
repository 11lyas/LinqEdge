// ── AI / Clinical summary (mocked) ────────────────────────────────────────────
// Deterministic template engine that mimics an LLM-generated clinical summary.
// Priority of evidence: (1) patient symptom logs, (2) activity data,
// (3) sleep data, (4) other wearable metrics.
//
// NOTE: the async signature is intentional — swap `buildMockSummary` for a real
// LLM call later without touching any callers.

import { SymptomEntry } from '../models/types';
import {
  CardiacEvent, EventContext, PhysicianPatient, WearableDailyMetrics,
} from '../models/physicianTypes';

export interface SummaryInput {
  patient: PhysicianPatient;
  event: CardiacEvent;
  context?: EventContext;
  symptoms: SymptomEntry[];
  metrics: WearableDailyMetrics[];
}

export interface ClinicalSummary {
  text: string;
  sources: string[];    // which data streams informed the summary
  generatedAt: string;  // ISO
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SYMPTOM_WINDOW_MS = 60 * 60 * 1000; // ±60 min around the event

function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const min = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem ? `${min} min ${rem} s` : `${min} minutes`;
}

function severityWord(sev: number): string {
  if (sev >= 4) return 'high-severity';
  if (sev === 3) return 'moderate';
  return 'mild';
}

/** Symptom entries logged within the window around the event, closest first. */
export function symptomsNearEvent(symptoms: SymptomEntry[], event: CardiacEvent): SymptomEntry[] {
  const t = new Date(event.timestamp).getTime();
  return symptoms
    .filter(s => Math.abs(new Date(s.timestamp).getTime() - t) <= SYMPTOM_WINDOW_MS)
    .sort((a, b) =>
      Math.abs(new Date(a.timestamp).getTime() - t) - Math.abs(new Date(b.timestamp).getTime() - t));
}

function weeklyAvg(metrics: WearableDailyMetrics[], pick: (m: WearableDailyMetrics) => number): number {
  if (!metrics.length) return 0;
  return metrics.reduce((sum, mm) => sum + pick(mm), 0) / metrics.length;
}

// ── Mock generator ────────────────────────────────────────────────────────────

function buildMockSummary(input: SummaryInput): ClinicalSummary {
  const { event, context, symptoms, metrics } = input;
  const sources: string[] = [];
  const parts: string[] = [];

  // Opening: what and when.
  parts.push(`${event.type} detected at ${fmtClock(event.timestamp)}, lasting ${fmtDuration(event.durationSeconds)} with a heart rate of ${event.hrAtEvent} bpm.`);

  // 1) Patient symptom logs (highest priority).
  const near = symptomsNearEvent(symptoms, event);
  if (near.length) {
    sources.push('Symptom logs');
    const first = near[0];
    const names = near
      .slice(0, 2)
      .flatMap(s => s.symptoms)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(' and ')
      .toLowerCase();
    parts.push(`In the surrounding hour the patient reported ${severityWord(first.severity)} ${names} (logged ${fmtClock(first.timestamp)}${first.notes ? ` — "${first.notes}"` : ''}), temporally aligning with the device-detected event.`);
  } else {
    parts.push('No patient-reported symptoms were logged near this event.');
  }

  // 2) Activity data.
  if (context) {
    sources.push('Activity data');
    if (context.activityLevel === 'Resting') {
      parts.push('Wearable data shows the patient was at rest, with no steps recorded in the preceding 30 minutes.');
    } else {
      parts.push(`During the preceding 30 minutes the wearable recorded ${context.stepsPrior30Min.toLocaleString()} steps (${context.activityLevel.toLowerCase()} activity).`);
    }
  }

  // 3) Sleep data.
  if (context && metrics.length) {
    sources.push('Sleep data');
    const avgSleep = weeklyAvg(metrics, mm => mm.sleepHours);
    const rel = context.sleepLastNightHours < avgSleep - 0.5 ? 'below'
      : context.sleepLastNightHours > avgSleep + 0.5 ? 'above' : 'near';
    parts.push(`Sleep the prior night was ${context.sleepLastNightHours.toFixed(1)} h (quality ${context.sleepLastNightQuality}/100), ${rel} the 7-day average of ${avgSleep.toFixed(1)} h.`);
  }

  // 4) Other wearable metrics.
  if (context?.wearableInsight) {
    sources.push('Wearable metrics');
    parts.push(context.wearableInsight);
  }

  // Descriptive context only. Do not infer cause, mechanism, severity, or risk.
  parts.push(contextStatementFor(event, context));

  return {
    text: parts.join(' '),
    sources,
    generatedAt: new Date().toISOString(),
  };
}

function contextStatementFor(event: CardiacEvent, context: EventContext | undefined): string {
  const exertional = context && (context.activityLevel === 'Moderate' || context.activityLevel === 'Vigorous');
  const resting = context?.activityLevel === 'Resting';
  const poorSleep = context !== undefined && context.sleepLastNightHours < 6;

  let activityStatement: string;
  switch (event.type) {
    case 'AFib Episode':
      activityStatement = exertional
        ? 'The episode occurred during moderate or vigorous activity.'
        : context
          ? 'The available activity data did not show moderate or vigorous activity near the episode.'
          : 'No activity context was available for this episode.';
      break;
    case 'Pause':
      activityStatement = resting
        ? 'The pause occurred while the available activity data indicated rest.'
        : context
          ? 'The available activity data did not indicate rest near the pause.'
          : 'No activity context was available for this pause.';
      break;
    case 'Tachycardia Event':
      activityStatement = exertional
        ? 'The rate elevation occurred during moderate or vigorous activity.'
        : context
          ? 'The available activity data did not show moderate or vigorous activity near the rate elevation.'
          : 'No activity context was available for this rate elevation.';
      break;
    case 'Bradycardia Event':
      activityStatement = resting
        ? 'The slow rate occurred while the available activity data indicated rest.'
        : context
          ? 'The available activity data did not indicate rest near the slow rate.'
          : 'No activity context was available for this slow rate.';
      break;
    default:
      activityStatement = context
        ? `The event occurred while the available activity data indicated ${context.activityLevel.toLowerCase()} activity.`
        : 'No activity context was available for this event.';
  }

  const sleepStatement = poorSleep
    ? ' Sleep logged for the prior night was under six hours.'
    : '';

  return activityStatement + sleepStatement;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a clinical summary for a cardiac event.
 * Currently mocked with a deterministic template + small latency to simulate
 * an AI service; replace the body with a real LLM call when available.
 */
export function generateClinicalSummary(input: SummaryInput): Promise<ClinicalSummary> {
  const summary = buildMockSummary(input);
  return new Promise(resolve => setTimeout(() => resolve(summary), 550));
}
