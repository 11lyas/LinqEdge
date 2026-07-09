// ── Physician-view domain types ───────────────────────────────────────────────
// Types for the clinician-facing experience: patient risk stratification,
// LINQ-derived cardiac events, wearable metrics, and event correlation.

import { SymptomEntry } from './types';

// ── Risk & trend ──────────────────────────────────────────────────────────────

export type RiskLevel = 'High' | 'Medium' | 'Low';

export type TrendDirection = 'Improving' | 'Stable' | 'Worsening';

export function riskLevelForScore(score: number): RiskLevel {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export function riskColor(level: RiskLevel): string {
  const { colors } = require('../theme/colors');
  if (level === 'High') return colors.alertRed;
  if (level === 'Medium') return colors.alertOrange;
  return colors.alertGreen;
}

export function trendIcon(trend: TrendDirection): string {
  if (trend === 'Worsening') return 'trending-up';
  if (trend === 'Improving') return 'trending-down';
  return 'remove';
}

export function trendColor(trend: TrendDirection): string {
  const { colors } = require('../theme/colors');
  if (trend === 'Worsening') return colors.alertRed;
  if (trend === 'Improving') return colors.alertGreen;
  return colors.tertiaryText;
}

// ── Cardiac conditions & events ───────────────────────────────────────────────

export type CardiacCondition =
  | 'Atrial Fibrillation'
  | 'Bradycardia'
  | 'Tachycardia'
  | 'Pause'
  | 'PVC Burden'
  | 'Sinus Arrhythmia';

/** Clinical precedence used when sorting the roster by condition type. */
export const CONDITION_PRECEDENCE: CardiacCondition[] = [
  'Atrial Fibrillation', 'Pause', 'Tachycardia',
  'Bradycardia', 'PVC Burden', 'Sinus Arrhythmia',
];

export function conditionAbbrev(c: CardiacCondition): string {
  const map: Record<CardiacCondition, string> = {
    'Atrial Fibrillation': 'AFib',
    'Bradycardia': 'Brady',
    'Tachycardia': 'Tachy',
    'Pause': 'Pause',
    'PVC Burden': 'PVC',
    'Sinus Arrhythmia': 'Sinus Arr.',
  };
  return map[c];
}

export type CardiacEventType =
  | 'AFib Episode'
  | 'Pause'
  | 'Tachycardia Event'
  | 'Bradycardia Event'
  | 'PVC Run';

export function eventColor(t: CardiacEventType): string {
  const { colors } = require('../theme/colors');
  const map: Record<CardiacEventType, string> = {
    'AFib Episode': colors.alertRed,
    'Pause': colors.purple,
    'Tachycardia Event': colors.alertOrange,
    'Bradycardia Event': colors.indigo,
    'PVC Run': colors.cyan,
  };
  return map[t];
}

export function eventIcon(t: CardiacEventType): string {
  const map: Record<CardiacEventType, string> = {
    'AFib Episode': 'pulse',
    'Pause': 'pause-circle',
    'Tachycardia Event': 'speedometer',
    'Bradycardia Event': 'hourglass',
    'PVC Run': 'analytics',
  };
  return map[t];
}

/** A LINQ-detected cardiac event (mocked). */
export interface CardiacEvent {
  id: string;
  patientId: string;
  type: CardiacEventType;
  timestamp: string;          // ISO
  durationSeconds: number;    // episode duration
  hrAtEvent: number;          // bpm at detection
  /** Position of the event within the rendered ECG strip, in seconds. */
  stripOffsetSec: number;
  /** 1-5, drives marker prominence + auto-selection. */
  significance: number;
}

// ── Wearable metrics (mocked third-party data, e.g. Fitbit) ──────────────────

export interface WearableDailyMetrics {
  date: string;            // ISO (start of day)
  sleepHours: number;
  sleepQualityScore: number; // 0-100
  steps: number;
  activeMinutes: number;
  restingHR: number;       // bpm
  avgHR: number;           // bpm
  hrv: number;             // ms (SDNN-like)
}

export type ActivityLevel = 'Resting' | 'Light' | 'Moderate' | 'Vigorous';

/** Wearable-derived context for the 30-min window around a cardiac event. */
export interface EventContext {
  eventId: string;
  stepsPrior30Min: number;
  activityLevel: ActivityLevel;
  heartRateAtEvent: number;    // bpm
  hrvAtEvent: number;          // ms
  sleepLastNightHours: number;
  sleepLastNightQuality: number; // 0-100
  wearableInsight: string;     // short natural-language observation
}

// ── Patient roster ────────────────────────────────────────────────────────────

export interface PhysicianPatient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  mrn: string;              // medical record number
  deviceSerial: string;     // LINQ device
  condition: CardiacCondition;
  riskScore: number;        // 0-100, LINQ-derived (mocked)
  riskLevel: RiskLevel;
  trend: TrendDirection;
  latestEventAt: string;    // ISO
}

/** Everything the detail screen needs for one patient. */
export interface PatientBundle {
  patient: PhysicianPatient;
  events: CardiacEvent[];                    // newest first
  metrics: WearableDailyMetrics[];           // oldest first (7 days)
  symptoms: SymptomEntry[];                  // newest first
  eventContexts: Record<string, EventContext>; // keyed by event id
}
