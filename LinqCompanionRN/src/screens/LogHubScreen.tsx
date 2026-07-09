import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePatientData, formatRelative } from '../context/PatientDataContext';

const LOG_OPTIONS = [
  {
    screen: 'LogWorkout',
    label: 'Log Workout',
    icon: 'walk',
    color: colors.medtronicBlue,
    description: 'Activity type, duration, exertion, hydration & any symptoms during exercise',
  },
  {
    screen: 'LogSymptom',
    label: 'Log Symptoms',
    icon: 'heart',
    color: colors.alertOrange,
    description: 'Palpitations, dizziness, fatigue, chest discomfort, and more',
  },
  {
    screen: 'LogSleep',
    label: 'Log Sleep',
    icon: 'moon',
    color: colors.indigo,
    description: "Hours slept, quality rating, and wake-up count from last night",
  },
];

export default function LogHubScreen({ navigation }: any) {
  const { workoutSessions, symptomEntries, sleepEntries } = usePatientData();

  const lastWorkout  = workoutSessions[0];
  const lastSymptom  = symptomEntries[0];
  const lastSleep    = sleepEntries[0];

  const lastEntry = (entry: { timestamp?: string; date?: string } | undefined) => {
    const ts = entry?.timestamp ?? entry?.date;
    return ts ? `Last: ${formatRelative(ts)}` : 'Not yet logged';
  };

  const lasts = [lastEntry(lastWorkout), lastEntry(lastSymptom), lastEntry(lastSleep)];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Log Activity</Text>
        <Text style={styles.subtitle}>
          Contextual data you log here is paired with LINQ monitoring events to build richer insights.
        </Text>

        {LOG_OPTIONS.map((opt, idx) => (
          <TouchableOpacity
            key={opt.screen}
            style={styles.card}
            onPress={() => navigation.navigate(opt.screen)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: opt.color + '15' }]}>
              <Ionicons name={opt.icon as any} size={30} color={opt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{opt.label}</Text>
              <Text style={styles.cardDesc}>{opt.description}</Text>
              <Text style={[styles.lastEntry, { color: opt.color }]}>{lasts[idx]}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tertiaryText} />
          </TouchableOpacity>
        ))}

        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.tertiaryText} />
          <Text style={styles.disclaimerText}>
            Data you log here stays on your device and is used only to provide context alongside your LINQ monitoring history.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  scroll:  { padding: 20, paddingBottom: 40 },
  title:   { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.secondaryText, marginBottom: 28, lineHeight: 22 },

  card:        { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  iconCircle:  { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 3 },
  cardDesc:    { fontSize: 13, color: colors.secondaryText, lineHeight: 18, marginBottom: 6 },
  lastEntry:   { fontSize: 12, fontWeight: '600' },

  disclaimerBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.fillTertiary, borderRadius: 12, padding: 14, marginTop: 8 },
  disclaimerText: { flex: 1, fontSize: 12, color: colors.tertiaryText, lineHeight: 17 },
});
