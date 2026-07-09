import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { SymptomEntry, symptomIcon } from '../../models/types';
import { CardiacEvent } from '../../models/physicianTypes';
import { formatDateTime } from '../../context/PatientDataContext';
import { symptomsNearEvent } from '../../utils/clinicalSummary';

interface Props {
  symptoms: SymptomEntry[];
  selectedEvent?: CardiacEvent | null;
}

function severityWord(sev: number): 'High' | 'Medium' | 'Low' {
  if (sev >= 4) return 'High';
  if (sev === 3) return 'Medium';
  return 'Low';
}

function severityColor(sev: number): string {
  if (sev >= 4) return colors.alertRed;
  if (sev === 3) return colors.alertOrange;
  return colors.alertGreen;
}

/**
 * Patient-reported symptom log list. Entries within ±60 min of the selected
 * ECG event are highlighted to surface temporal correlation.
 */
export default function SymptomTimeline({ symptoms, selectedEvent }: Props) {
  if (!symptoms.length) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="clipboard-outline" size={22} color={colors.quaternaryText} />
        <Text style={styles.emptyText}>No symptoms reported by this patient.</Text>
      </View>
    );
  }

  const nearIds = new Set(
    selectedEvent ? symptomsNearEvent(symptoms, selectedEvent).map(s => s.id) : [],
  );

  return (
    <View>
      {symptoms.map((entry, idx) => {
        const linked = nearIds.has(entry.id);
        const sevColor = severityColor(entry.severity);
        return (
          <View key={entry.id} style={styles.rowWrapper}>
            {/* Timeline rail */}
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: sevColor }]} />
              {idx < symptoms.length - 1 && <View style={styles.line} />}
            </View>

            <View style={[styles.card, linked && styles.cardLinked]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: sevColor + '15' }]}>
                  <Ionicons name={symptomIcon(entry.symptoms[0]) as any} size={15} color={sevColor} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.symptomName}>{entry.symptoms.join(', ')}</Text>
                  <Text style={styles.timestamp}>{formatDateTime(entry.timestamp)} · {entry.context}</Text>
                </View>
                <View style={[styles.sevBadge, { backgroundColor: sevColor + '15' }]}>
                  <Text style={[styles.sevText, { color: sevColor }]}>{severityWord(entry.severity)}</Text>
                </View>
              </View>

              {entry.notes ? <Text style={styles.notes}>"{entry.notes}"</Text> : null}

              {linked && (
                <View style={styles.linkedRow}>
                  <Ionicons name="link" size={12} color={colors.medtronicBlue} />
                  <Text style={styles.linkedText}>Near selected ECG event</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 13, color: colors.tertiaryText },

  rowWrapper: { flexDirection: 'row', gap: 10 },
  rail:       { alignItems: 'center', width: 14 },
  dot:        { width: 12, height: 12, borderRadius: 6, marginTop: 16, zIndex: 1 },
  line:       { flex: 1, width: 2, backgroundColor: colors.separatorOpaque, marginTop: 2 },

  card: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardLinked: { borderWidth: 1.5, borderColor: colors.medtronicBlue + '50', backgroundColor: colors.fillPrimary },

  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  headerText:  { flex: 1 },
  symptomName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  timestamp:   { fontSize: 11, color: colors.tertiaryText, marginTop: 1 },

  sevBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sevText:  { fontSize: 11, fontWeight: '700' },

  notes: { fontSize: 12.5, color: colors.secondaryText, fontStyle: 'italic', lineHeight: 18, marginTop: 8 },

  linkedRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  linkedText: { fontSize: 11, fontWeight: '600', color: colors.medtronicBlue },
});
