import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  CardiacEvent, EventContext, eventColor, eventIcon,
} from '../../models/physicianTypes';
import { formatDateTime } from '../../context/PatientDataContext';

interface Props {
  event: CardiacEvent;
  context?: EventContext;
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem ? `${min}m ${rem}s` : `${min}m`;
}

/** Contextual wearable metadata for the selected ECG event marker. */
export default function EventInvestigationPanel({ event, context }: Props) {
  const color = eventColor(event.type);

  return (
    <View style={[styles.card, { borderColor: color + '40' }]}>
      {/* Event header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
          <Ionicons name={eventIcon(event.type) as any} size={20} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color }]}>{event.type}</Text>
          <Text style={styles.timestamp}>{formatDateTime(event.timestamp)}</Text>
        </View>
        <View style={[styles.durationChip, { backgroundColor: color + '15' }]}>
          <Text style={[styles.durationText, { color }]}>{fmtDuration(event.durationSeconds)}</Text>
        </View>
      </View>

      {context ? (
        <>
          {/* Wearable context grid */}
          <View style={styles.grid}>
            <Metric icon="moon"          label="Sleep Duration"  value={`${context.sleepLastNightHours.toFixed(1)} h`}    tint={colors.indigo} />
            <Metric icon="star"          label="Sleep Quality"   value={`${context.sleepLastNightQuality}/100`}           tint={colors.indigo} />
            <Metric icon="footsteps"     label="Steps (30 min)"  value={context.stepsPrior30Min.toLocaleString()}         tint={colors.medtronicBlue} />
            <Metric icon="walk"          label="Activity Level"  value={context.activityLevel}                            tint={colors.medtronicBlue} />
            <Metric icon="heart"         label="Heart Rate"      value={`${context.heartRateAtEvent} bpm`}                tint={colors.alertRed} />
            <Metric icon="pulse"         label="HRV"             value={`${context.hrvAtEvent} ms`}                       tint={colors.alertOrange} />
          </View>

          {/* Wearable insight */}
          <View style={styles.insightBox}>
            <Ionicons name="watch-outline" size={16} color={colors.medtronicBlue} style={{ marginTop: 1 }} />
            <Text style={styles.insightText}>{context.wearableInsight}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.noContext}>No wearable context available for this event.</Text>
      )}
    </View>
  );
}

function Metric({ icon, label, value, tint }: { icon: string; label: string; value: string; tint: string }) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: tint + '15' }]}>
        <Ionicons name={icon as any} size={14} color={tint} />
      </View>
      <View style={styles.metricText}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerText:   { flex: 1 },
  title:        { fontSize: 15, fontWeight: '700' },
  timestamp:    { fontSize: 12, color: colors.tertiaryText, marginTop: 1 },
  durationChip: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  durationText: { fontSize: 12, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, rowGap: 12 },
  metric:      { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  metricIcon:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  metricText:  { flex: 1 },
  metricValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  metricLabel: { fontSize: 11, color: colors.tertiaryText, marginTop: 1 },

  insightBox: {
    flexDirection: 'row', gap: 8, marginTop: 14, padding: 10,
    backgroundColor: colors.fillPrimary, borderRadius: 10,
  },
  insightText: { flex: 1, fontSize: 12.5, color: colors.secondaryText, lineHeight: 18 },

  noContext: { fontSize: 13, color: colors.tertiaryText, marginTop: 12 },
});
