import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePatientData, formatRelative } from '../context/PatientDataContext';
import { sleepQualityColor } from '../models/types';

export default function DashboardScreen({ navigation }: any) {
  const {
    userProfile, workoutSessions, symptomEntries, sleepEntries,
  } = usePatientData();

  const today    = new Date();
  const todayStr = today.toDateString();
  const isPhysician = userProfile?.role === 'physician';

  const todayWorkouts = workoutSessions.filter(w => new Date(w.timestamp).toDateString() === todayStr);
  const todaySymptoms = symptomEntries.filter(s => new Date(s.timestamp).toDateString() === todayStr);
  const lastSleep     = sleepEntries[0];
  const recentWorkouts = workoutSessions.slice(0, 3);
  const recentSymptoms = symptomEntries.slice(0, 2);

  const connectedCount = (userProfile?.thirdPartyConnections ?? []).filter(c => c.connected).length;

  const greeting = () => {
    const h = today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{userProfile?.name ?? 'Patient'}</Text>
            <View style={styles.roleBadgeRow}>
              <View style={[styles.roleBadge, isPhysician && styles.roleBadgePhysician]}>
                <Ionicons name={isPhysician ? 'medkit' : 'person'} size={12} color={isPhysician ? colors.purple : colors.medtronicBlue} />
                <Text style={[styles.roleBadgeText, isPhysician && { color: colors.purple }]}>
                  {isPhysician ? 'Physician View' : 'Patient View'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.gearBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.medtronicBlue} />
          </TouchableOpacity>
        </View>

        {/* Demo banner */}
        {userProfile?.isDemoMode && (
          <View style={styles.demoBanner}>
            <Ionicons name="flask" size={16} color={colors.medtronicBlue} />
            <Text style={styles.demoBannerText}>Demo Mode — Sample data loaded for exploration</Text>
          </View>
        )}

        {/* Connected apps */}
        {connectedCount > 0 && (
          <View style={styles.connectedBanner}>
            <Ionicons name="link" size={16} color={colors.alertGreen} />
            <Text style={styles.connectedBannerText}>{connectedCount} app{connectedCount > 1 ? 's' : ''} connected</Text>
          </View>
        )}

        {/* Today's stats */}
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statGrid}>
          <StatTile
            value={todayWorkouts.length.toString()}
            label="Workouts"
            icon="walk"
            color={colors.medtronicBlue}
          />
          <StatTile
            value={todaySymptoms.length.toString()}
            label="Symptoms"
            icon="heart"
            color={todaySymptoms.length > 0 ? colors.alertOrange : colors.alertGreen}
          />
          <StatTile
            value={lastSleep ? `${lastSleep.hoursSlept}h` : '—'}
            label="Last Sleep"
            icon="moon"
            color={lastSleep ? sleepQualityColor(lastSleep.quality) : colors.indigo}
          />
          <StatTile
            value={workoutSessions.length.toString()}
            label="Total Logs"
            icon="analytics"
            color={colors.cyan}
          />
        </View>

        {/* Quick Log */}
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <View style={styles.quickLogRow}>
          {[
            { label: 'Workout', icon: 'walk',  screen: 'LogWorkout', color: colors.medtronicBlue },
            { label: 'Symptom', icon: 'heart', screen: 'LogSymptom', color: colors.alertOrange },
            { label: 'Sleep',   icon: 'moon',  screen: 'LogSleep',   color: colors.indigo },
          ].map(q => (
            <TouchableOpacity
              key={q.label}
              style={styles.quickLogBtn}
              onPress={() => navigation.getParent()?.navigate('LogTab', { screen: q.screen })}
            >
              <View style={[styles.quickLogIcon, { backgroundColor: q.color + '15' }]}>
                <Ionicons name={q.icon as any} size={28} color={q.color} />
              </View>
              <Text style={styles.quickLogLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <View style={styles.card}>
              {recentWorkouts.map((w, idx) => (
                <View key={w.id}>
                  <View style={styles.listRow}>
                    <View style={[styles.listIconCircle, { backgroundColor: colors.medtronicBlue + '15' }]}>
                      <Ionicons name="walk" size={18} color={colors.medtronicBlue} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>{w.activityType}</Text>
                      <Text style={styles.listSubtitle}>{w.durationMinutes} min · RPE {w.perceivedExertion}/10</Text>
                      {isPhysician && w.symptomsPresent.length > 0 && (
                        <Text style={styles.listDetail}>Symptoms: {w.symptomsPresent.join(', ')}</Text>
                      )}
                    </View>
                    <Text style={styles.listTime}>{formatRelative(w.timestamp)}</Text>
                  </View>
                  {idx < recentWorkouts.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent Symptoms (physician view shows more detail) */}
        {recentSymptoms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            <View style={styles.card}>
              {recentSymptoms.map((s, idx) => (
                <View key={s.id}>
                  <View style={styles.listRow}>
                    <View style={[styles.listIconCircle, { backgroundColor: colors.alertOrange + '15' }]}>
                      <Ionicons name="heart" size={18} color={colors.alertOrange} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>{s.symptoms.join(', ')}</Text>
                      <Text style={styles.listSubtitle}>
                        Severity {s.severity}/5 · {s.context}
                        {isPhysician ? ` · ${s.durationMinutes > 0 ? s.durationMinutes + ' min' : 'Duration unknown'}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.listTime}>{formatRelative(s.timestamp)}</Text>
                  </View>
                  {idx < recentSymptoms.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Sleep summary */}
        {lastSleep && (
          <>
            <Text style={styles.sectionTitle}>Last Sleep</Text>
            <View style={[styles.card, styles.sleepCard]}>
              <Ionicons name="moon" size={32} color={sleepQualityColor(lastSleep.quality)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sleepQuality}>{lastSleep.quality}</Text>
                <Text style={styles.sleepDetail}>{lastSleep.hoursSlept.toFixed(1)} hrs · Woke {lastSleep.wakeCount}x</Text>
                {isPhysician && lastSleep.notes ? (
                  <Text style={styles.sleepNotes}>{lastSleep.notes}</Text>
                ) : null}
              </View>
            </View>
          </>
        )}

        {/* Empty state */}
        {workoutSessions.length === 0 && symptomEntries.length === 0 && sleepEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={44} color={colors.quaternaryText} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySubtitle}>Use the Log tab to start recording your activity, symptoms, and sleep.</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.tertiaryText} />
          <Text style={styles.disclaimerText}>
            This app is not a medical device. Data logged here is for personal reference and clinician discussions only.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon as any} size={22} color={color} style={{ marginBottom: 6 }} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 32 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  greeting:     { fontSize: 15, color: colors.tertiaryText },
  name:         { fontSize: 26, fontWeight: '700', color: colors.text },
  roleBadgeRow: { marginTop: 4 },
  roleBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.fillPrimary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  roleBadgePhysician: { backgroundColor: colors.purple + '15' },
  roleBadgeText:      { fontSize: 11, fontWeight: '600', color: colors.medtronicBlue },
  gearBtn:      { padding: 8, backgroundColor: colors.fillPrimary, borderRadius: 20 },

  demoBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.fillPrimary, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12 },
  demoBannerText: { fontSize: 13, color: colors.medtronicBlue },
  connectedBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.alertGreen + '12', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12 },
  connectedBannerText: { fontSize: 13, color: colors.alertGreen, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginHorizontal: 20, marginTop: 20, marginBottom: 10 },

  statGrid:  { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, gap: 8 },
  statTile:  { flex: 1, minWidth: '44%', backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.tertiaryText, fontWeight: '500' },

  quickLogRow:  { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16 },
  quickLogBtn:  { alignItems: 'center', gap: 8, padding: 8 },
  quickLogIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLogLabel: { fontSize: 13, fontWeight: '600', color: colors.secondaryText },

  card:    { backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  divider: { height: 1, backgroundColor: colors.separatorOpaque, marginHorizontal: 16 },

  listRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  listIconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  listTitle:    { fontSize: 14, fontWeight: '600', color: colors.text },
  listSubtitle: { fontSize: 12, color: colors.secondaryText, marginTop: 2 },
  listDetail:   { fontSize: 11, color: colors.tertiaryText, marginTop: 2 },
  listTime:     { fontSize: 11, color: colors.tertiaryText },

  sleepCard:    { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  sleepQuality: { fontSize: 18, fontWeight: '700', color: colors.text },
  sleepDetail:  { fontSize: 13, color: colors.secondaryText, marginTop: 2 },
  sleepNotes:   { fontSize: 12, color: colors.tertiaryText, marginTop: 4, fontStyle: 'italic' },

  emptyState:    { alignItems: 'center', padding: 40 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: colors.secondaryText, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: colors.tertiaryText, marginTop: 6, textAlign: 'center', lineHeight: 19 },

  disclaimerBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.fillTertiary, marginHorizontal: 16, marginTop: 20, borderRadius: 12, padding: 12 },
  disclaimerText: { flex: 1, fontSize: 12, color: colors.tertiaryText, lineHeight: 17 },
});
