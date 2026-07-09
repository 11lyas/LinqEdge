import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { getPatientBundle } from '../../data/physicianDemoData';
import { CardiacEvent, eventColor, riskColor } from '../../models/physicianTypes';
import RiskBadge from '../../components/physician/RiskBadge';
import TrendIndicator from '../../components/physician/TrendIndicator';
import EcgStrip from '../../components/physician/EcgStrip';
import EventInvestigationPanel from '../../components/physician/EventInvestigationPanel';
import ClinicalSummaryCard from '../../components/physician/ClinicalSummaryCard';
import SymptomTimeline from '../../components/physician/SymptomTimeline';
import MetricTrendChart, { EventMark } from '../../components/physician/MetricTrendChart';

function sameDay(isoA: string, isoB: string): boolean {
  return new Date(isoA).toDateString() === new Date(isoB).toDateString();
}

function weekday(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' });
}

/** Most clinically significant event, tie-broken by recency. */
function defaultEvent(events: CardiacEvent[]): CardiacEvent | null {
  if (!events.length) return null;
  return [...events].sort((a, b) =>
    b.significance - a.significance || b.timestamp.localeCompare(a.timestamp))[0];
}

/**
 * Patient Detail: ECG with event markers → investigation panel → AI summary →
 * symptom timeline → correlated wearable trends.
 */
export default function PatientDetailScreen({ navigation, route }: any) {
  const patientId: string = route?.params?.patientId;
  const bundle = useMemo(() => getPatientBundle(patientId), [patientId]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    () => defaultEvent(bundle?.events ?? [])?.id ?? null,
  );

  useLayoutEffect(() => {
    if (bundle) navigation.setOptions({ title: bundle.patient.name });
  }, [navigation, bundle]);

  if (!bundle) {
    return (
      <View style={styles.missing}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.quaternaryText} />
        <Text style={styles.missingText}>Patient not found.</Text>
      </View>
    );
  }

  const { patient, events, metrics, symptoms, eventContexts } = bundle;
  const selectedEvent = events.find(e => e.id === selectedEventId) ?? null;
  const selectedContext = selectedEvent ? eventContexts[selectedEvent.id] : undefined;
  const accent = riskColor(patient.riskLevel);

  // Days on which events occurred → vertical markers on every trend chart.
  const eventMarks: EventMark[] = events
    .map(e => ({
      index: metrics.findIndex(m => sameDay(m.date, e.timestamp)),
      color: eventColor(e.type),
    }))
    .filter(mk => mk.index >= 0);

  const chartPoints = (pick: (m: (typeof metrics)[number]) => number) =>
    metrics.map(m => ({ label: weekday(m.date), value: pick(m) }));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Patient header ── */}
      <View style={[styles.headerCard, { borderLeftColor: accent }]}>
        <View style={styles.headerTop}>
          <View style={[styles.avatar, { backgroundColor: accent + '18' }]}>
            <Text style={[styles.avatarText, { color: accent }]}>
              {patient.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerIdentity}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>
              {patient.age} yrs · {patient.sex} · {patient.mrn}
            </Text>
            <Text style={styles.patientMeta}>LINQ {patient.deviceSerial}</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={[styles.score, { color: accent }]}>{patient.riskScore}</Text>
            <Text style={styles.scoreCaption}>Risk Score</Text>
          </View>
        </View>
        <View style={styles.headerBottom}>
          <RiskBadge level={patient.riskLevel} compact />
          <View style={styles.conditionChip}>
            <Ionicons name="heart" size={11} color={colors.medtronicBlue} />
            <Text style={styles.conditionText}>{patient.condition}</Text>
          </View>
          <TrendIndicator trend={patient.trend} />
        </View>
      </View>

      {/* ── A) ECG with event markers ── */}
      <SectionHeader icon="pulse" title="ECG" subtitle={`${events.length} detected event${events.length === 1 ? '' : 's'}`} />
      <EcgStrip
        events={events}
        seedKey={patient.id}
        selectedEventId={selectedEventId}
        onSelectEvent={setSelectedEventId}
      />

      {/* ── B) Event investigation ── */}
      {selectedEvent && (
        <>
          <SectionHeader icon="search" title="Event Investigation" />
          <EventInvestigationPanel event={selectedEvent} context={selectedContext} />

          {/* ── C) AI clinical summary ── */}
          <View style={styles.summarySpacing}>
            <ClinicalSummaryCard
              input={{ patient, event: selectedEvent, context: selectedContext, symptoms, metrics }}
            />
          </View>
        </>
      )}

      {/* ── D) Symptom timeline ── */}
      <SectionHeader icon="clipboard" title="Symptom Timeline" subtitle={`${symptoms.length} patient-reported`} />
      <SymptomTimeline symptoms={symptoms} selectedEvent={selectedEvent} />

      {/* ── E) Correlated health metrics ── */}
      <SectionHeader icon="stats-chart" title="Correlated Health Metrics" subtitle="7-day wearable trends" />
      <View style={styles.correlationHint}>
        <Ionicons name="information-circle" size={14} color={colors.medtronicBlue} />
        <Text style={styles.correlationHintText}>
          Dashed vertical markers show days with detected cardiac events.
        </Text>
      </View>

      <MetricTrendChart title="Sleep Duration"     unit="h"     color={colors.indigo}        points={chartPoints(m => m.sleepHours)}        eventMarks={eventMarks} decimals={1} />
      <MetricTrendChart title="Sleep Quality"      unit="/100"  color={colors.purple}        points={chartPoints(m => m.sleepQualityScore)} eventMarks={eventMarks} />
      <MetricTrendChart title="Daily Steps"        unit="steps" color={colors.medtronicBlue} points={chartPoints(m => m.steps)}             eventMarks={eventMarks} kind="bar" />
      <MetricTrendChart title="Activity Intensity" unit="min"   color={colors.cyan}          points={chartPoints(m => m.activeMinutes)}     eventMarks={eventMarks} kind="bar" />
      <MetricTrendChart title="Resting Heart Rate" unit="bpm"   color={colors.alertRed}      points={chartPoints(m => m.restingHR)}         eventMarks={eventMarks} />
      <MetricTrendChart title="Average Heart Rate" unit="bpm"   color={colors.alertOrange}   points={chartPoints(m => m.avgHR)}             eventMarks={eventMarks} />
      <MetricTrendChart title="Heart Rate Variability" unit="ms" color={colors.alertGreen}   points={chartPoints(m => m.hrv)}               eventMarks={eventMarks} />

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Demo only — ECG, events, wearable data and summaries are simulated. Not for diagnosis or treatment decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={15} color={colors.medtronicBlue} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

  missing:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
  missingText: { fontSize: 15, color: colors.tertiaryText },

  headerCard: {
    backgroundColor: colors.card, borderRadius: 16, borderLeftWidth: 4, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  headerTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:         { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 16, fontWeight: '700' },
  headerIdentity: { flex: 1 },
  patientName:    { fontSize: 17, fontWeight: '700', color: colors.text },
  patientMeta:    { fontSize: 12, color: colors.tertiaryText, marginTop: 1 },
  scoreBlock:     { alignItems: 'center' },
  score:          { fontSize: 26, fontWeight: '800' },
  scoreCaption:   { fontSize: 10, color: colors.tertiaryText, marginTop: -2 },

  headerBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  conditionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.fillPrimary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  conditionText: { fontSize: 11.5, fontWeight: '600', color: colors.medtronicBlue },

  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, marginBottom: 10 },
  sectionTitle:    { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionSubtitle: { fontSize: 12, color: colors.tertiaryText, marginLeft: 4 },

  summarySpacing: { marginTop: 12 },

  correlationHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.fillPrimary, borderRadius: 10, padding: 9, marginBottom: 10,
  },
  correlationHintText: { flex: 1, fontSize: 11.5, color: colors.secondaryText },

  disclaimer:     { backgroundColor: colors.fillTertiary, borderRadius: 12, padding: 12, marginTop: 16 },
  disclaimerText: { fontSize: 11, color: colors.tertiaryText, textAlign: 'center', lineHeight: 16 },
});
