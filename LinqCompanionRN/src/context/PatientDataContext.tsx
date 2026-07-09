import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile, WorkoutSession, SymptomEntry, SleepEntry,
  TimelineEntry, sleepQualityColor, sleepQualityIcon, isCriticalSymptom,
  ThirdPartyConnection, ThirdPartyService,
} from '../models/types';
import { colors } from '../theme/colors';
import { demoWorkoutSessions, demoSymptomEntries, demoSleepEntries } from '../data/demoData';

// ── State ─────────────────────────────────────────────────────────────────────

interface AppState {
  userProfile: UserProfile | null;
  onboardingComplete: boolean;
  workoutSessions: WorkoutSession[];
  symptomEntries: SymptomEntry[];
  sleepEntries: SleepEntry[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'LOADED'; state: Partial<AppState> }
  | { type: 'COMPLETE_ONBOARDING'; profile: UserProfile }
  | { type: 'ADD_WORKOUT'; workout: WorkoutSession }
  | { type: 'ADD_SYMPTOM'; symptom: SymptomEntry }
  | { type: 'ADD_SLEEP'; sleep: SleepEntry }
  | { type: 'LOAD_DEMO'; workouts: WorkoutSession[]; symptoms: SymptomEntry[]; sleeps: SleepEntry[] }
  | { type: 'UPDATE_PROFILE'; profile: UserProfile };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOADED':
      return { ...state, ...action.state, isLoading: false };
    case 'COMPLETE_ONBOARDING':
      return { ...state, userProfile: action.profile, onboardingComplete: true };
    case 'ADD_WORKOUT':
      return { ...state, workoutSessions: [action.workout, ...state.workoutSessions].sort((a, b) => b.timestamp.localeCompare(a.timestamp)) };
    case 'ADD_SYMPTOM':
      return { ...state, symptomEntries: [action.symptom, ...state.symptomEntries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)) };
    case 'ADD_SLEEP':
      return { ...state, sleepEntries: [action.sleep, ...state.sleepEntries].sort((a, b) => b.date.localeCompare(a.date)) };
    case 'LOAD_DEMO':
      return { ...state, workoutSessions: action.workouts, symptomEntries: action.symptoms, sleepEntries: action.sleeps };
    case 'UPDATE_PROFILE':
      return { ...state, userProfile: action.profile };
    default:
      return state;
  }
}

const initialState: AppState = {
  userProfile: null,
  onboardingComplete: false,
  workoutSessions: [],
  symptomEntries: [],
  sleepEntries: [],
  isLoading: true,
};

// ── Context interface ─────────────────────────────────────────────────────────

interface PatientDataContextType extends AppState {
  completeOnboarding: (profile: UserProfile) => void;
  addWorkout: (workout: WorkoutSession) => void;
  addSymptom: (symptom: SymptomEntry) => void;
  addSleep: (sleep: SleepEntry) => void;
  resetToDemo: () => void;
  updateProfile: (profile: UserProfile) => void;
  updateConnections: (connections: ThirdPartyConnection[]) => void;
  timelineEntries: TimelineEntry[];
}

const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

// ── Helper: Timeline ──────────────────────────────────────────────────────────

function buildTimeline(
  workouts: WorkoutSession[],
  symptoms: SymptomEntry[],
  sleeps: SleepEntry[],
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const w of workouts) {
    entries.push({
      id: w.id,
      timestamp: w.timestamp,
      type: 'workout',
      title: w.activityType,
      subtitle: `${w.durationMinutes} min · RPE ${w.perceivedExertion}/10`,
      detail: w.symptomsPresent.length
        ? `Symptoms during: ${w.symptomsPresent.join(', ')}${w.notes ? '\n' + w.notes : ''}`
        : w.notes || 'No symptoms logged',
      icon: 'walk',
      color: colors.medtronicBlue,
      isUrgent: false,
      sourceId: w.id,
    });
  }

  for (const s of symptoms) {
    const names = s.symptoms.join(', ') || 'Symptom Entry';
    entries.push({
      id: s.id,
      timestamp: s.timestamp,
      type: 'symptom',
      title: names,
      subtitle: `Severity ${s.severity}/5 · ${s.context}`,
      detail: s.notes,
      icon: 'heart',
      color: s.severity >= 4 ? colors.alertRed : s.severity === 3 ? colors.alertOrange : colors.alertGreen,
      isUrgent: s.severity >= 4 || s.symptoms.some(isCriticalSymptom),
      sourceId: s.id,
    });
  }

  for (const sl of sleeps) {
    entries.push({
      id: sl.id,
      timestamp: sl.date,
      type: 'sleep',
      title: `Sleep: ${sl.quality}`,
      subtitle: `${sl.hoursSlept.toFixed(1)} hrs · Woke ${sl.wakeCount}x`,
      detail: sl.notes,
      icon: sleepQualityIcon(sl.quality),
      color: sleepQualityColor(sl.quality),
      isUrgent: false,
      sourceId: sl.id,
    });
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const KEYS = {
  profile:  'lc_profile',
  workouts: 'lc_workouts',
  symptoms: 'lc_symptoms',
  sleep:    'lc_sleep',
};

async function loadAll(): Promise<Partial<AppState>> {
  try {
    const [profile, workouts, symptoms, sleep] = await AsyncStorage.multiGet([
      KEYS.profile, KEYS.workouts, KEYS.symptoms, KEYS.sleep,
    ]);
    const partial: Partial<AppState> = {};
    if (profile[1]) {
      const p: UserProfile = JSON.parse(profile[1]);
      partial.userProfile = p;
      partial.onboardingComplete = p.onboardingCompleted;
    }
    if (workouts[1]) partial.workoutSessions = JSON.parse(workouts[1]);
    if (symptoms[1]) partial.symptomEntries   = JSON.parse(symptoms[1]);
    if (sleep[1])    partial.sleepEntries      = JSON.parse(sleep[1]);
    return partial;
  } catch {
    return {};
  }
}

async function saveAll(state: AppState) {
  try {
    const pairs: [string, string][] = [];
    if (state.userProfile) pairs.push([KEYS.profile, JSON.stringify(state.userProfile)]);
    pairs.push([KEYS.workouts, JSON.stringify(state.workoutSessions)]);
    pairs.push([KEYS.symptoms, JSON.stringify(state.symptomEntries)]);
    pairs.push([KEYS.sleep,    JSON.stringify(state.sleepEntries)]);
    await AsyncStorage.multiSet(pairs);
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PatientDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadAll().then(partial => dispatch({ type: 'LOADED', state: partial }));
  }, []);

  useEffect(() => {
    if (!state.isLoading) saveAll(state);
  }, [state.workoutSessions, state.symptomEntries, state.sleepEntries, state.userProfile]);

  const completeOnboarding = useCallback((profile: UserProfile) => {
    const completed = { ...profile, onboardingCompleted: true };
    dispatch({ type: 'COMPLETE_ONBOARDING', profile: completed });
    if (profile.isDemoMode) {
      dispatch({ type: 'LOAD_DEMO', workouts: demoWorkoutSessions, symptoms: demoSymptomEntries, sleeps: demoSleepEntries });
    }
  }, []);

  const addWorkout = useCallback((workout: WorkoutSession) => dispatch({ type: 'ADD_WORKOUT', workout }), []);
  const addSymptom = useCallback((symptom: SymptomEntry) => dispatch({ type: 'ADD_SYMPTOM', symptom }), []);
  const addSleep   = useCallback((sleep: SleepEntry) => dispatch({ type: 'ADD_SLEEP', sleep }), []);
  const updateProfile = useCallback((profile: UserProfile) => dispatch({ type: 'UPDATE_PROFILE', profile }), []);

  const resetToDemo = useCallback(() => {
    dispatch({ type: 'LOAD_DEMO', workouts: demoWorkoutSessions, symptoms: demoSymptomEntries, sleeps: demoSleepEntries });
  }, []);

  const updateConnections = useCallback((connections: ThirdPartyConnection[]) => {
    if (!state.userProfile) return;
    dispatch({ type: 'UPDATE_PROFILE', profile: { ...state.userProfile, thirdPartyConnections: connections } });
  }, [state.userProfile]);

  const timelineEntries = buildTimeline(state.workoutSessions, state.symptomEntries, state.sleepEntries);

  return (
    <PatientDataContext.Provider value={{
      ...state,
      completeOnboarding,
      addWorkout,
      addSymptom,
      addSleep,
      resetToDemo,
      updateProfile,
      updateConnections,
      timelineEntries,
    }}>
      {children}
    </PatientDataContext.Provider>
  );
}

export function usePatientData(): PatientDataContextType {
  const ctx = useContext(PatientDataContext);
  if (!ctx) throw new Error('usePatientData must be used within PatientDataProvider');
  return ctx;
}
