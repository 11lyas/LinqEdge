import { WorkoutSession, SymptomEntry, SleepEntry } from '../models/types';

function daysAgo(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const demoWorkoutSessions: WorkoutSession[] = [
  {
    id: 'demo-workout-1',
    timestamp: daysAgo(1, 7, 0),
    activityType: 'Running',
    durationMinutes: 45,
    perceivedExertion: 8,
    symptomsPresent: ['Palpitations'],
    hydrationLevel: 2,
    stressLevel: 3,
    notes: 'Morning trail run. Noticed a flutter feeling around mile 3. Slowed down and it resolved.',
    postWorkoutSymptoms: ['Fatigue'],
  },
  {
    id: 'demo-workout-2',
    timestamp: daysAgo(4, 18, 0),
    activityType: 'Cycling',
    durationMinutes: 60,
    perceivedExertion: 6,
    symptomsPresent: [],
    hydrationLevel: 4,
    stressLevel: 2,
    notes: 'Easy evening ride along the river path. Felt great throughout.',
    postWorkoutSymptoms: [],
  },
  {
    id: 'demo-workout-3',
    timestamp: daysAgo(6, 7, 30),
    activityType: 'Running',
    durationMinutes: 32,
    perceivedExertion: 7,
    symptomsPresent: ['Palpitations', 'Dizziness'],
    hydrationLevel: 2,
    stressLevel: 5,
    notes: 'Cut run short. Felt off — flutter plus lightheadedness. Rehydrated after.',
    postWorkoutSymptoms: ['Fatigue', 'Dizziness'],
  },
  {
    id: 'demo-workout-4',
    timestamp: daysAgo(10, 17, 0),
    activityType: 'Weight Training',
    durationMinutes: 50,
    perceivedExertion: 7,
    symptomsPresent: [],
    hydrationLevel: 3,
    stressLevel: 3,
    notes: 'Good gym session. No issues.',
    postWorkoutSymptoms: [],
  },
  {
    id: 'demo-workout-5',
    timestamp: daysAgo(12, 8, 15),
    activityType: 'Yoga',
    durationMinutes: 45,
    perceivedExertion: 3,
    symptomsPresent: [],
    hydrationLevel: 4,
    stressLevel: 1,
    notes: 'Morning yoga. Very relaxing.',
    postWorkoutSymptoms: [],
  },
];

export const demoSymptomEntries: SymptomEntry[] = [
  {
    id: 'demo-symptom-1',
    timestamp: daysAgo(1, 7, 20),
    symptoms: ['Palpitations'],
    severity: 3,
    durationMinutes: 5,
    context: 'During Exercise',
    associatedWorkoutId: 'demo-workout-1',
    notes: 'Heart flutter during run at mile 3. Faded when I slowed my pace.',
  },
  {
    id: 'demo-symptom-2',
    timestamp: daysAgo(3, 23, 5),
    symptoms: ['Palpitations', 'Lightheadedness'],
    severity: 4,
    durationMinutes: 10,
    context: 'Upon Waking',
    notes: 'Woke up with racing heart and felt dizzy standing up. Settled after about 10 minutes.',
  },
  {
    id: 'demo-symptom-3',
    timestamp: daysAgo(6, 7, 28),
    symptoms: ['Palpitations', 'Dizziness'],
    severity: 3,
    durationMinutes: 8,
    context: 'During Exercise',
    associatedWorkoutId: 'demo-workout-3',
    notes: 'Same flutter feeling as last week during morning run. Also lightheaded.',
  },
  {
    id: 'demo-symptom-4',
    timestamp: daysAgo(9, 14, 0),
    symptoms: ['Fatigue'],
    severity: 2,
    durationMinutes: 120,
    context: 'At Rest',
    notes: 'Unusual afternoon fatigue. Took a nap.',
  },
];

export const demoSleepEntries: SleepEntry[] = [
  { id: 'demo-sleep-1', date: daysAgo(1, 6, 0),  hoursSlept: 5.5, quality: 'Poor',      notes: "Couldn't stop thinking. Woke up multiple times.", wakeCount: 4 },
  { id: 'demo-sleep-2', date: daysAgo(2, 6, 30), hoursSlept: 7.0, quality: 'Good',      notes: '',                                                   wakeCount: 1 },
  { id: 'demo-sleep-3', date: daysAgo(3, 5, 45), hoursSlept: 4.5, quality: 'Poor',      notes: 'Terrible sleep. Woke nearly every hour.',             wakeCount: 6 },
  { id: 'demo-sleep-4', date: daysAgo(4, 7, 0),  hoursSlept: 7.5, quality: 'Good',      notes: '',                                                   wakeCount: 1 },
  { id: 'demo-sleep-5', date: daysAgo(5, 6, 45), hoursSlept: 8.0, quality: 'Excellent', notes: 'Best sleep in weeks.',                                wakeCount: 0 },
  { id: 'demo-sleep-6', date: daysAgo(6, 5, 30), hoursSlept: 5.0, quality: 'Poor',      notes: "Stressed. Couldn't fall asleep until after midnight.", wakeCount: 3 },
  { id: 'demo-sleep-7', date: daysAgo(7, 7, 0),  hoursSlept: 6.5, quality: 'Fair',      notes: 'Decent but woke twice.',                              wakeCount: 2 },
];
