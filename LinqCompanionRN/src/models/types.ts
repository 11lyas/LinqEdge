// ── Enums / Union types ───────────────────────────────────────────────────────

export type UserRole = 'patient' | 'physician';

export type ActivityType =
  | 'Running' | 'Cycling' | 'Swimming' | 'Weight Training'
  | 'Yoga' | 'Walking' | 'Hiking' | 'Basketball' | 'Soccer' | 'Other';

export const ACTIVITY_TYPES: ActivityType[] = [
  'Running', 'Cycling', 'Swimming', 'Weight Training',
  'Yoga', 'Walking', 'Hiking', 'Basketball', 'Soccer', 'Other',
];

export function activityIcon(type: ActivityType): string {
  const map: Record<ActivityType, string> = {
    'Running': 'walk', 'Cycling': 'bicycle', 'Swimming': 'water',
    'Weight Training': 'barbell', 'Yoga': 'body', 'Walking': 'footsteps',
    'Hiking': 'trail-sign', 'Basketball': 'basketball', 'Soccer': 'football',
    'Other': 'fitness',
  };
  return map[type] ?? 'fitness';
}

export type SymptomType =
  | 'Palpitations' | 'Dizziness' | 'Fatigue' | 'Chest Discomfort'
  | 'Shortness of Breath' | 'Lightheadedness' | 'Fainting / Near-Fainting' | 'Nausea';

export const SYMPTOM_TYPES: SymptomType[] = [
  'Palpitations', 'Dizziness', 'Fatigue', 'Chest Discomfort',
  'Shortness of Breath', 'Lightheadedness', 'Fainting / Near-Fainting', 'Nausea',
];

export function symptomIcon(type: SymptomType): string {
  const map: Record<SymptomType, string> = {
    'Palpitations': 'heart', 'Dizziness': 'refresh-circle', 'Fatigue': 'battery-dead',
    'Chest Discomfort': 'medkit', 'Shortness of Breath': 'leaf', 'Lightheadedness': 'alert-circle',
    'Fainting / Near-Fainting': 'warning', 'Nausea': 'sad',
  };
  return map[type] ?? 'alert-circle';
}

export function isCriticalSymptom(type: SymptomType): boolean {
  return type === 'Fainting / Near-Fainting' || type === 'Chest Discomfort';
}

export type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Excellent';
export const SLEEP_QUALITIES: SleepQuality[] = ['Poor', 'Fair', 'Good', 'Excellent'];

export function sleepQualityColor(q: SleepQuality): string {
  const { colors } = require('../theme/colors');
  if (q === 'Poor') return colors.alertRed;
  if (q === 'Fair') return colors.alertOrange;
  if (q === 'Good') return colors.alertGreen;
  return colors.medtronicBlue;
}

export function sleepQualityIcon(q: SleepQuality): string {
  if (q === 'Poor') return 'moon-outline';
  if (q === 'Fair') return 'moon';
  if (q === 'Good') return 'moon';
  return 'sparkles';
}

export type SymptomContext =
  | 'During Exercise' | 'After Exercise' | 'At Rest'
  | 'During Sleep' | 'Upon Waking' | 'Other';

export const SYMPTOM_CONTEXTS: SymptomContext[] = [
  'During Exercise', 'After Exercise', 'At Rest',
  'During Sleep', 'Upon Waking', 'Other',
];

// ── Third-party integrations ──────────────────────────────────────────────────

export type ThirdPartyService =
  | 'Apple Health' | 'Google Health Connect' | 'Strava'
  | 'Garmin Connect' | 'Fitbit' | 'Whoop' | 'Samsung Health';

export const THIRD_PARTY_SERVICES: ThirdPartyService[] = [
  'Apple Health', 'Google Health Connect', 'Strava',
  'Garmin Connect', 'Fitbit', 'Whoop', 'Samsung Health',
];

export interface ThirdPartyConnection {
  service: ThirdPartyService;
  connected: boolean;
  lastSynced?: string;
}

export function serviceIcon(service: ThirdPartyService): string {
  const map: Record<ThirdPartyService, string> = {
    'Apple Health': 'heart-circle',
    'Google Health Connect': 'logo-google',
    'Strava': 'flame',
    'Garmin Connect': 'watch',
    'Fitbit': 'fitness',
    'Whoop': 'pulse',
    'Samsung Health': 'phone-portrait',
  };
  return map[service] ?? 'link';
}

export function serviceColor(service: ThirdPartyService): string {
  const { colors } = require('../theme/colors');
  const map: Record<ThirdPartyService, string> = {
    'Apple Health': '#FF2D55',
    'Google Health Connect': '#4285F4',
    'Strava': '#FC4C02',
    'Garmin Connect': '#007CC3',
    'Fitbit': '#00B0B9',
    'Whoop': '#00B347',
    'Samsung Health': '#1428A0',
  };
  return map[service] ?? colors.medtronicBlue;
}

// ── Data models ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  monitorSerialHint: string;
  onboardingCompleted: boolean;
  consentGiven: boolean;
  isDemoMode: boolean;
  notificationsEnabled: boolean;
  clinicianName: string;
  clinicianContact: string;
  role: UserRole;
  thirdPartyConnections: ThirdPartyConnection[];
}

export interface WorkoutSession {
  id: string;
  timestamp: string;
  activityType: ActivityType;
  durationMinutes: number;
  perceivedExertion: number; // 1-10
  symptomsPresent: SymptomType[];
  hydrationLevel: number;    // 1-5
  stressLevel: number;       // 1-5
  notes: string;
  postWorkoutSymptoms: SymptomType[];
}

export interface SymptomEntry {
  id: string;
  timestamp: string;
  symptoms: SymptomType[];
  severity: number; // 1-5
  durationMinutes: number;
  context: SymptomContext;
  associatedWorkoutId?: string;
  notes: string;
}

export interface SleepEntry {
  id: string;
  date: string;
  hoursSlept: number;
  quality: SleepQuality;
  notes: string;
  wakeCount: number;
}

// ── Derived / computed ────────────────────────────────────────────────────────

export type TimelineEntryType = 'workout' | 'symptom' | 'sleep';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  type: TimelineEntryType;
  title: string;
  subtitle: string;
  detail: string;
  icon: string;
  color: string;
  isUrgent: boolean;
  sourceId: string;
}
