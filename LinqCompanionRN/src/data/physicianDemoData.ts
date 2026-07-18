// ── Physician demo data ───────────────────────────────────────────────────────
// Mocked LINQ cardiac events, wearable (e.g. Fitbit) metrics, and patient
// symptom logs for the clinician-facing experience. All timestamps are
// relative to "now" so the demo always looks current.

import { SymptomEntry } from '../models/types';
import {
  PhysicianPatient, PatientBundle, CardiacEvent, EventContext,
  WearableDailyMetrics, riskLevelForScore,
} from '../models/physicianTypes';

function daysAgo(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Start-of-day ISO for metric buckets. */
function dayStart(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Compact builder for a day of wearable metrics. */
function m(
  day: number, sleepHours: number, sleepQualityScore: number, steps: number,
  activeMinutes: number, restingHR: number, avgHR: number, hrv: number,
): WearableDailyMetrics {
  return { date: dayStart(day), sleepHours, sleepQualityScore, steps, activeMinutes, restingHR, avgHR, hrv };
}

// ── Patient roster ────────────────────────────────────────────────────────────

function patient(
  id: string, name: string, age: number, sex: 'M' | 'F', mrn: string,
  deviceSerial: string, condition: PhysicianPatient['condition'],
  riskScore: number, trend: PhysicianPatient['trend'], latestEventAt: string,
): PhysicianPatient {
  return {
    id, name, age, sex, mrn, deviceSerial, condition,
    riskScore, riskLevel: riskLevelForScore(riskScore), trend, latestEventAt,
  };
}

const patients: PhysicianPatient[] = [
  patient('p1', 'Margaret Chen',   72, 'F', 'MRN-483920', 'LNQ-2209-4471', 'Atrial Fibrillation', 92, 'Worsening', daysAgo(1, 15, 12)),
  patient('p2', 'Robert Alvarez',  68, 'M', 'MRN-291837', 'LNQ-2151-8823', 'Pause',               84, 'Stable',    daysAgo(0, 3, 47)),
  patient('p3', 'James Whitfield', 75, 'M', 'MRN-748291', 'LNQ-2098-1204', 'Bradycardia',         71, 'Worsening', daysAgo(1, 6, 22)),
  patient('p4', 'Linda Okafor',    61, 'F', 'MRN-583017', 'LNQ-2233-9917', 'Tachycardia',         63, 'Stable',    daysAgo(2, 18, 40)),
  patient('p5', 'David Kim',       55, 'M', 'MRN-190284', 'LNQ-2187-3356', 'Atrial Fibrillation', 58, 'Improving', daysAgo(4, 9, 15)),
  patient('p6', 'Sofia Ramirez',   49, 'F', 'MRN-627450', 'LNQ-2241-7708', 'PVC Burden',          44, 'Stable',    daysAgo(3, 13, 5)),
  patient('p7', 'Emily Turner',    38, 'F', 'MRN-315729', 'LNQ-2262-0042', 'Sinus Arrhythmia',    22, 'Improving', daysAgo(6, 11, 30)),
  patient('p8', 'Thomas Becker',   66, 'M', 'MRN-904182', 'LNQ-2114-5590', 'Bradycardia',         18, 'Stable',    daysAgo(8, 5, 50)),
];

// ── Per-patient events ────────────────────────────────────────────────────────
// stripOffsetSec places each event region within the rendered 30 s ECG strip.

const events: Record<string, CardiacEvent[]> = {
  p1: [
    { id: 'p1-evt-1', patientId: 'p1', type: 'AFib Episode',      timestamp: daysAgo(1, 15, 12), durationSeconds: 542, hrAtEvent: 132, stripOffsetSec: 12, significance: 5 },
    { id: 'p1-evt-2', patientId: 'p1', type: 'Pause',             timestamp: daysAgo(2, 2, 31),  durationSeconds: 4,   hrAtEvent: 41,  stripOffsetSec: 22, significance: 4 },
    { id: 'p1-evt-3', patientId: 'p1', type: 'AFib Episode',      timestamp: daysAgo(4, 23, 48), durationSeconds: 186, hrAtEvent: 118, stripOffsetSec: 5,  significance: 3 },
  ],
  p2: [
    { id: 'p2-evt-1', patientId: 'p2', type: 'Pause',             timestamp: daysAgo(0, 3, 47),  durationSeconds: 4,   hrAtEvent: 38,  stripOffsetSec: 14, significance: 5 },
    { id: 'p2-evt-2', patientId: 'p2', type: 'Bradycardia Event', timestamp: daysAgo(3, 4, 15),  durationSeconds: 660, hrAtEvent: 39,  stripOffsetSec: 23, significance: 3 },
  ],
  p3: [
    { id: 'p3-evt-1', patientId: 'p3', type: 'Bradycardia Event', timestamp: daysAgo(1, 6, 22),  durationSeconds: 900, hrAtEvent: 38,  stripOffsetSec: 13, significance: 4 },
    { id: 'p3-evt-2', patientId: 'p3', type: 'Pause',             timestamp: daysAgo(5, 3, 2),   durationSeconds: 3,   hrAtEvent: 40,  stripOffsetSec: 22, significance: 3 },
  ],
  p4: [
    { id: 'p4-evt-1', patientId: 'p4', type: 'Tachycardia Event', timestamp: daysAgo(2, 18, 40), durationSeconds: 312, hrAtEvent: 156, stripOffsetSec: 15, significance: 4 },
    { id: 'p4-evt-2', patientId: 'p4', type: 'Tachycardia Event', timestamp: daysAgo(6, 19, 5),  durationSeconds: 240, hrAtEvent: 149, stripOffsetSec: 6,  significance: 3 },
  ],
  p5: [
    { id: 'p5-evt-1', patientId: 'p5', type: 'AFib Episode',      timestamp: daysAgo(4, 9, 15),  durationSeconds: 95,  hrAtEvent: 112, stripOffsetSec: 14, significance: 3 },
  ],
  p6: [
    { id: 'p6-evt-1', patientId: 'p6', type: 'PVC Run',           timestamp: daysAgo(3, 13, 5),  durationSeconds: 12,  hrAtEvent: 96,  stripOffsetSec: 13, significance: 3 },
    { id: 'p6-evt-2', patientId: 'p6', type: 'PVC Run',           timestamp: daysAgo(7, 16, 42), durationSeconds: 8,   hrAtEvent: 91,  stripOffsetSec: 22, significance: 2 },
  ],
  p7: [
    { id: 'p7-evt-1', patientId: 'p7', type: 'Tachycardia Event', timestamp: daysAgo(6, 11, 30), durationSeconds: 150, hrAtEvent: 138, stripOffsetSec: 15, significance: 2 },
  ],
  p8: [
    { id: 'p8-evt-1', patientId: 'p8', type: 'Bradycardia Event', timestamp: daysAgo(8, 5, 50),  durationSeconds: 480, hrAtEvent: 44,  stripOffsetSec: 15, significance: 2 },
  ],
};

// ── Per-patient symptom logs (reuses the patient-app SymptomEntry model) ─────

const symptoms: Record<string, SymptomEntry[]> = {
  p1: [
    { id: 'p1-sym-1', timestamp: daysAgo(1, 15, 5),  symptoms: ['Palpitations'],                 severity: 4, durationMinutes: 12,  context: 'During Exercise', notes: 'Fluttering in chest during afternoon walk. Had to sit down on a bench.' },
    { id: 'p1-sym-2', timestamp: daysAgo(1, 14, 50), symptoms: ['Dizziness'],                    severity: 3, durationMinutes: 8,   context: 'During Exercise', notes: 'Lightheaded climbing the hill on my walk. Slowed down.' },
    { id: 'p1-sym-3', timestamp: daysAgo(2, 2, 40),  symptoms: ['Palpitations', 'Lightheadedness'], severity: 3, durationMinutes: 15, context: 'During Sleep',  notes: 'Woke suddenly with racing heart, dizzy on standing.' },
    { id: 'p1-sym-4', timestamp: daysAgo(3, 14, 0),  symptoms: ['Fatigue'],                      severity: 2, durationMinutes: 180, context: 'At Rest',         notes: 'Very tired all afternoon, needed a nap.' },
    { id: 'p1-sym-5', timestamp: daysAgo(4, 23, 55), symptoms: ['Palpitations'],                 severity: 3, durationMinutes: 10,  context: 'At Rest',         notes: 'Heart pounding while reading in bed.' },
  ],
  p2: [
    { id: 'p2-sym-1', timestamp: daysAgo(0, 7, 10),  symptoms: ['Fatigue', 'Lightheadedness'],   severity: 3, durationMinutes: 45,  context: 'Upon Waking',     notes: 'Groggy and unsteady this morning, worse than usual.' },
    { id: 'p2-sym-2', timestamp: daysAgo(3, 8, 30),  symptoms: ['Dizziness'],                    severity: 2, durationMinutes: 10,  context: 'Upon Waking',     notes: 'Brief dizzy spell getting out of bed.' },
  ],
  p3: [
    { id: 'p3-sym-1', timestamp: daysAgo(1, 6, 45),  symptoms: ['Fainting / Near-Fainting'],     severity: 4, durationMinutes: 2,   context: 'Upon Waking',     notes: 'Nearly blacked out walking to the bathroom. Caught myself on the door.' },
    { id: 'p3-sym-2', timestamp: daysAgo(2, 10, 15), symptoms: ['Fatigue'],                      severity: 3, durationMinutes: 240, context: 'At Rest',         notes: 'No energy at all today.' },
    { id: 'p3-sym-3', timestamp: daysAgo(5, 3, 20),  symptoms: ['Dizziness'],                    severity: 3, durationMinutes: 5,   context: 'During Sleep',    notes: 'Woke dizzy in the middle of the night.' },
  ],
  p4: [
    { id: 'p4-sym-1', timestamp: daysAgo(2, 18, 35), symptoms: ['Palpitations', 'Shortness of Breath'], severity: 3, durationMinutes: 20, context: 'During Exercise', notes: 'Heart racing on the spin bike, breathless past normal.' },
    { id: 'p4-sym-2', timestamp: daysAgo(6, 19, 12), symptoms: ['Palpitations'],                 severity: 2, durationMinutes: 10,  context: 'After Exercise',  notes: 'Still pounding 15 minutes after class ended.' },
  ],
  p5: [
    { id: 'p5-sym-1', timestamp: daysAgo(4, 9, 25),  symptoms: ['Palpitations'],                 severity: 2, durationMinutes: 5,   context: 'At Rest',         notes: 'Short flutter at my desk. Passed quickly.' },
    { id: 'p5-sym-2', timestamp: daysAgo(9, 8, 0),   symptoms: ['Fatigue'],                      severity: 2, durationMinutes: 60,  context: 'Upon Waking',     notes: 'Slow start, but improved after coffee.' },
  ],
  p6: [
    { id: 'p6-sym-1', timestamp: daysAgo(3, 13, 15), symptoms: ['Palpitations'],                 severity: 2, durationMinutes: 3,   context: 'At Rest',         notes: 'Skipped-beat feeling after lunch.' },
  ],
  p7: [
    { id: 'p7-sym-1', timestamp: daysAgo(6, 11, 40), symptoms: ['Palpitations'],                 severity: 1, durationMinutes: 4,   context: 'After Exercise',  notes: 'Mild flutter after a hard interval run.' },
  ],
  p8: [],
};

// ── Per-patient 7-day wearable metrics (oldest first) ─────────────────────────

const metrics: Record<string, WearableDailyMetrics[]> = {
  // Hero patient: worsening picture — poor sleep, falling HRV, rising resting HR,
  // and an activity spike on the event day (day 1).
  p1: [
    m(7, 7.2, 78, 4900, 42, 66, 78, 46),
    m(6, 6.8, 71, 5200, 45, 67, 79, 43),
    m(5, 6.1, 62, 4400, 38, 69, 81, 38),
    m(4, 5.6, 55, 3900, 30, 71, 84, 34),
    m(3, 5.8, 52, 4100, 33, 72, 85, 32),
    m(2, 4.9, 44, 3600, 25, 74, 88, 29),
    m(1, 5.1, 48, 7850, 68, 76, 92, 28),
  ],
  p2: [
    m(7, 6.5, 60, 3200, 22, 58, 68, 40),
    m(6, 6.2, 58, 3500, 25, 57, 67, 41),
    m(5, 6.8, 64, 3100, 20, 58, 68, 39),
    m(4, 6.0, 55, 2900, 18, 56, 66, 42),
    m(3, 5.4, 47, 2600, 15, 55, 65, 38),
    m(2, 6.1, 56, 3000, 21, 56, 66, 40),
    m(1, 5.2, 45, 2400, 12, 54, 64, 37),
  ],
  p3: [
    m(7, 6.9, 66, 4100, 30, 52, 61, 35),
    m(6, 6.5, 62, 3800, 28, 51, 60, 34),
    m(5, 6.2, 58, 3400, 24, 50, 59, 33),
    m(4, 6.4, 60, 3600, 26, 49, 58, 31),
    m(3, 5.9, 52, 3000, 20, 48, 57, 30),
    m(2, 5.6, 49, 2700, 16, 47, 56, 28),
    m(1, 5.3, 45, 2300, 12, 45, 54, 27),
  ],
  p4: [
    m(7, 7.4, 80, 8200, 75, 62, 82, 52),
    m(6, 7.1, 76, 9400, 88, 63, 85, 50),
    m(5, 7.6, 82, 7800, 70, 62, 81, 53),
    m(4, 7.2, 78, 8500, 78, 62, 83, 51),
    m(3, 6.9, 72, 9100, 85, 63, 84, 49),
    m(2, 7.0, 74, 10200, 95, 64, 88, 48),
    m(1, 7.3, 79, 8000, 72, 62, 82, 51),
  ],
  p5: [
    m(7, 6.4, 58, 6100, 48, 64, 78, 38),
    m(6, 6.8, 64, 6500, 52, 63, 77, 40),
    m(5, 7.0, 68, 6800, 55, 62, 76, 42),
    m(4, 7.2, 72, 7100, 58, 61, 75, 44),
    m(3, 7.4, 76, 7400, 60, 60, 74, 46),
    m(2, 7.6, 80, 7700, 63, 59, 73, 48),
    m(1, 7.8, 83, 8000, 66, 58, 72, 50),
  ],
  p6: [
    m(7, 7.0, 72, 6900, 55, 61, 76, 45),
    m(6, 6.8, 70, 7200, 58, 61, 77, 44),
    m(5, 7.1, 74, 6600, 52, 60, 75, 46),
    m(4, 6.9, 71, 7000, 56, 61, 76, 45),
    m(3, 6.6, 66, 7400, 60, 62, 78, 42),
    m(2, 7.0, 73, 6800, 54, 61, 76, 45),
    m(1, 7.2, 75, 7100, 57, 60, 75, 46),
  ],
  p7: [
    m(7, 7.6, 84, 9800, 92, 55, 72, 62),
    m(6, 7.4, 81, 11200, 105, 56, 74, 60),
    m(5, 7.8, 86, 9200, 85, 54, 71, 64),
    m(4, 8.0, 88, 10400, 96, 54, 72, 65),
    m(3, 7.7, 85, 9900, 90, 53, 70, 66),
    m(2, 7.9, 87, 10800, 100, 53, 71, 67),
    m(1, 8.1, 90, 9500, 88, 52, 69, 68),
  ],
  p8: [
    m(7, 7.8, 82, 5600, 45, 48, 60, 55),
    m(6, 7.6, 80, 5900, 48, 48, 61, 54),
    m(5, 7.9, 84, 5400, 42, 47, 59, 56),
    m(4, 7.7, 81, 5700, 46, 48, 60, 55),
    m(3, 8.0, 85, 5500, 44, 47, 59, 57),
    m(2, 7.8, 83, 5800, 47, 47, 60, 56),
    m(1, 7.9, 84, 5600, 45, 47, 59, 56),
  ],
};

// ── Per-event wearable context (30-min window around detection) ──────────────

const eventContexts: Record<string, EventContext> = {
  'p1-evt-1': {
    eventId: 'p1-evt-1', stepsPrior30Min: 1250, activityLevel: 'Moderate',
    heartRateAtEvent: 132, hrvAtEvent: 28, sleepLastNightHours: 5.1, sleepLastNightQuality: 48,
    wearableInsight: 'HR climbed from 98 to 132 bpm within 10 minutes of sustained walking; HR variability rose sharply during exertion.',
  },
  'p1-evt-2': {
    eventId: 'p1-evt-2', stepsPrior30Min: 0, activityLevel: 'Resting',
    heartRateAtEvent: 41, hrvAtEvent: 31, sleepLastNightHours: 4.9, sleepLastNightQuality: 44,
    wearableInsight: 'Detected during deep sleep; wearable logged restless sleep with 4 wake events earlier in the night.',
  },
  'p1-evt-3': {
    eventId: 'p1-evt-3', stepsPrior30Min: 120, activityLevel: 'Light',
    heartRateAtEvent: 118, hrvAtEvent: 30, sleepLastNightHours: 5.8, sleepLastNightQuality: 52,
    wearableInsight: 'Late-evening episode at rest; elevated evening resting HR (74 bpm) compared to weekly baseline (66 bpm).',
  },
  'p2-evt-1': {
    eventId: 'p2-evt-1', stepsPrior30Min: 0, activityLevel: 'Resting',
    heartRateAtEvent: 38, hrvAtEvent: 36, sleepLastNightHours: 5.2, sleepLastNightQuality: 45,
    wearableInsight: '4.1 s pause during sleep at 3:47 AM; preceded by progressive HR slowing from 52 to 38 bpm.',
  },
  'p2-evt-2': {
    eventId: 'p2-evt-2', stepsPrior30Min: 0, activityLevel: 'Resting',
    heartRateAtEvent: 39, hrvAtEvent: 37, sleepLastNightHours: 5.4, sleepLastNightQuality: 47,
    wearableInsight: 'Sustained nocturnal bradycardia (11 min below 40 bpm) during estimated deep-sleep stage.',
  },
  'p3-evt-1': {
    eventId: 'p3-evt-1', stepsPrior30Min: 85, activityLevel: 'Light',
    heartRateAtEvent: 38, hrvAtEvent: 27, sleepLastNightHours: 5.3, sleepLastNightQuality: 45,
    wearableInsight: 'Wearable HR readings remained between 38 and 42 bpm around waking and standing.',
  },
  'p3-evt-2': {
    eventId: 'p3-evt-2', stepsPrior30Min: 0, activityLevel: 'Resting',
    heartRateAtEvent: 40, hrvAtEvent: 30, sleepLastNightHours: 6.1, sleepLastNightQuality: 55,
    wearableInsight: '3.2 s pause during sleep; two shorter pauses (2.1 s, 2.4 s) logged in the same hour.',
  },
  'p4-evt-1': {
    eventId: 'p4-evt-1', stepsPrior30Min: 2100, activityLevel: 'Vigorous',
    heartRateAtEvent: 156, hrvAtEvent: 22, sleepLastNightHours: 7.0, sleepLastNightQuality: 74,
    wearableInsight: 'Occurred during a spin class; HR remained above 150 bpm for 5 min after cooldown began.',
  },
  'p4-evt-2': {
    eventId: 'p4-evt-2', stepsPrior30Min: 1800, activityLevel: 'Vigorous',
    heartRateAtEvent: 149, hrvAtEvent: 24, sleepLastNightHours: 7.1, sleepLastNightQuality: 76,
    wearableInsight: 'HR decreased by 18 bpm during the first 2 minutes after exercise.',
  },
  'p5-evt-1': {
    eventId: 'p5-evt-1', stepsPrior30Min: 300, activityLevel: 'Light',
    heartRateAtEvent: 112, hrvAtEvent: 41, sleepLastNightHours: 7.2, sleepLastNightQuality: 72,
    wearableInsight: 'Brief irregular-rhythm flag at desk; self-terminated in 95 s. Weekly trend otherwise improving.',
  },
  'p6-evt-1': {
    eventId: 'p6-evt-1', stepsPrior30Min: 450, activityLevel: 'Light',
    heartRateAtEvent: 96, hrvAtEvent: 40, sleepLastNightHours: 6.6, sleepLastNightQuality: 66,
    wearableInsight: 'Short PVC run after lunch; caffeine logged 40 min prior in companion app.',
  },
  'p6-evt-2': {
    eventId: 'p6-evt-2', stepsPrior30Min: 700, activityLevel: 'Moderate',
    heartRateAtEvent: 91, hrvAtEvent: 42, sleepLastNightHours: 7.0, sleepLastNightQuality: 72,
    wearableInsight: 'Isolated PVC run during an afternoon walk; no symptom log within 2 hours.',
  },
  'p7-evt-1': {
    eventId: 'p7-evt-1', stepsPrior30Min: 2600, activityLevel: 'Vigorous',
    heartRateAtEvent: 138, hrvAtEvent: 58, sleepLastNightHours: 7.4, sleepLastNightQuality: 81,
    wearableInsight: 'HR increased during interval training and decreased by 32 bpm in the first 2 minutes afterward.',
  },
  'p8-evt-1': {
    eventId: 'p8-evt-1', stepsPrior30Min: 0, activityLevel: 'Resting',
    heartRateAtEvent: 44, hrvAtEvent: 54, sleepLastNightHours: 7.9, sleepLastNightQuality: 83,
    wearableInsight: 'Early-morning HR was below 50 bpm; no symptom was logged, and similar readings appeared during the week.',
  },
};

// ── Public accessors ──────────────────────────────────────────────────────────

export function getPatients(): PhysicianPatient[] {
  return [...patients];
}

export function getPatientBundle(patientId: string): PatientBundle | undefined {
  const p = patients.find(x => x.id === patientId);
  if (!p) return undefined;
  const evts = (events[patientId] ?? []).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return {
    patient: p,
    events: evts,
    metrics: metrics[patientId] ?? [],
    symptoms: (symptoms[patientId] ?? []).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    eventContexts,
  };
}
