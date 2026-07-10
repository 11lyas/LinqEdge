import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  isCriticalSymptom,
  SleepEntry,
  SymptomEntry,
  WorkoutSession,
} from '../models/types';
import { colors } from '../theme/colors';

interface WeeklyOverviewCardProps {
  workouts: WorkoutSession[];
  symptoms: SymptomEntry[];
  sleepEntries: SleepEntry[];
  onViewTimeline: () => void;
}

interface WeeklyOverview {
  workoutCount: number;
  workoutMinutes: number;
  symptomCount: number;
  highestSeverity: number;
  hasCriticalSymptom: boolean;
  averageSleepHours: number | null;
  sleepNights: number;
  loggedDays: number;
}

const WINDOW_DAYS = 7;

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isWithinWindow(value: string, windowStart: Date, windowEnd: Date): boolean {
  const timestamp = new Date(value).getTime();
  return (
    Number.isFinite(timestamp) &&
    timestamp >= windowStart.getTime() &&
    timestamp <= windowEnd.getTime()
  );
}

function dayKey(value: string): string | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toDateString() : null;
}

function buildWeeklyOverview(
  workouts: WorkoutSession[],
  symptoms: SymptomEntry[],
  sleepEntries: SleepEntry[],
): WeeklyOverview {
  const today = startOfDay(new Date());
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - (WINDOW_DAYS - 1));

  const windowEnd = new Date(today);
  windowEnd.setHours(23, 59, 59, 999);

  const recentWorkouts = workouts.filter(entry =>
    isWithinWindow(entry.timestamp, windowStart, windowEnd),
  );
  const recentSymptoms = symptoms.filter(entry =>
    isWithinWindow(entry.timestamp, windowStart, windowEnd),
  );
  const recentSleep = sleepEntries.filter(entry =>
    isWithinWindow(entry.date, windowStart, windowEnd),
  );

  const loggedDayKeys = new Set<string>();
  [...recentWorkouts, ...recentSymptoms].forEach(entry => {
    const key = dayKey(entry.timestamp);
    if (key) loggedDayKeys.add(key);
  });
  recentSleep.forEach(entry => {
    const key = dayKey(entry.date);
    if (key) loggedDayKeys.add(key);
  });

  const sleepHours = recentSleep.reduce(
    (total, entry) => total + entry.hoursSlept,
    0,
  );

  return {
    workoutCount: recentWorkouts.length,
    workoutMinutes: recentWorkouts.reduce(
      (total, entry) => total + entry.durationMinutes,
      0,
    ),
    symptomCount: recentSymptoms.length,
    highestSeverity: recentSymptoms.reduce(
      (highest, entry) => Math.max(highest, entry.severity),
      0,
    ),
    hasCriticalSymptom: recentSymptoms.some(entry =>
      entry.symptoms.some(isCriticalSymptom),
    ),
    averageSleepHours: recentSleep.length > 0
      ? sleepHours / recentSleep.length
      : null,
    sleepNights: recentSleep.length,
    loggedDays: loggedDayKeys.size,
  };
}

export default function WeeklyOverviewCard({
  workouts,
  symptoms,
  sleepEntries,
  onViewTimeline,
}: WeeklyOverviewCardProps) {
  const overview = useMemo(
    () => buildWeeklyOverview(workouts, symptoms, sleepEntries),
    [workouts, symptoms, sleepEntries],
  );

  const hasEntries = overview.loggedDays > 0;
  const coveragePercent = `${Math.round(
    (overview.loggedDays / WINDOW_DAYS) * 100,
  )}%` as `${number}%`;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`Seven day overview. ${overview.loggedDays} of seven days have logged information.`}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={20} color={colors.medtronicBlue} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>7-Day Overview</Text>
          <Text style={styles.subtitle}>A summary of information you logged</Text>
        </View>
        <View style={styles.periodPill}>
          <Text style={styles.periodText}>7 days</Text>
        </View>
      </View>

      {hasEntries ? (
        <>
          <View style={styles.metricGrid}>
            <Metric
              icon="walk"
              color={colors.medtronicBlue}
              value={overview.workoutCount.toString()}
              label="Workouts"
              detail={`${overview.workoutMinutes} total min`}
            />
            <Metric
              icon="heart"
              color={
                overview.hasCriticalSymptom
                  ? colors.alertRed
                  : colors.alertOrange
              }
              value={overview.symptomCount.toString()}
              label="Symptom logs"
              detail={
                overview.symptomCount > 0
                  ? `Highest severity ${overview.highestSeverity}/5`
                  : 'None recorded'
              }
            />
            <Metric
              icon="moon"
              color={colors.indigo}
              value={
                overview.averageSleepHours === null
                  ? '—'
                  : `${overview.averageSleepHours.toFixed(1)}h`
              }
              label="Avg. sleep"
              detail={`${overview.sleepNights} night${overview.sleepNights === 1 ? '' : 's'} logged`}
            />
          </View>

          <View style={styles.coverageSection}>
            <View style={styles.coverageCopy}>
              <Text style={styles.coverageLabel}>Logging coverage</Text>
              <Text style={styles.coverageValue}>
                {overview.loggedDays} of {WINDOW_DAYS} days
              </Text>
            </View>
            <View
              style={styles.coverageTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: WINDOW_DAYS,
                now: overview.loggedDays,
              }}
            >
              <View style={[styles.coverageFill, { width: coveragePercent }]} />
            </View>
            <Text style={styles.coverageHint}>
              Consistent logging gives you and your care team a clearer record
              to discuss.
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="analytics-outline"
              size={28}
              color={colors.medtronicBlue}
            />
          </View>
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Build your weekly picture</Text>
            <Text style={styles.emptyText}>
              Log a workout, symptom, or sleep entry to begin your overview.
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="View your full timeline"
        activeOpacity={0.75}
        onPress={onViewTimeline}
        style={styles.timelineButton}
      >
        <Text style={styles.timelineButtonText}>View Full Timeline</Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={colors.medtronicBlue}
        />
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        This overview describes your entries only. It does not diagnose a
        condition or establish cause and effect.
      </Text>
    </View>
  );
}

function Metric({
  icon,
  color,
  value,
  label,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.fillPrimary,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.tertiaryText,
    fontSize: 12,
    marginTop: 2,
  },
  periodPill: {
    backgroundColor: colors.fillTertiary,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  periodText: {
    color: colors.secondaryText,
    fontSize: 11,
    fontWeight: '600',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: colors.fillSecondary,
    borderRadius: 14,
    flex: 1,
    minHeight: 145,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    marginBottom: 8,
    width: 34,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.secondaryText,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  metricDetail: {
    color: colors.tertiaryText,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  coverageSection: {
    borderTopColor: colors.separatorOpaque,
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 16,
  },
  coverageCopy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverageLabel: {
    color: colors.secondaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  coverageValue: {
    color: colors.medtronicBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  coverageTrack: {
    backgroundColor: colors.fillTertiary,
    borderRadius: 5,
    height: 8,
    marginTop: 9,
    overflow: 'hidden',
  },
  coverageFill: {
    backgroundColor: colors.medtronicBlue,
    borderRadius: 5,
    height: '100%',
  },
  coverageHint: {
    color: colors.tertiaryText,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.fillSecondary,
    borderRadius: 14,
    flexDirection: 'row',
    marginTop: 18,
    padding: 14,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.fillPrimary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyCopy: {
    flex: 1,
    marginLeft: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.tertiaryText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  timelineButton: {
    alignItems: 'center',
    borderTopColor: colors.separatorOpaque,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 15,
  },
  timelineButtonText: {
    color: colors.medtronicBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimer: {
    color: colors.quaternaryText,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 14,
  },
});
