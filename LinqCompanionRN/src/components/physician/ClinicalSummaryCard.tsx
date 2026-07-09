import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  ClinicalSummary, SummaryInput, generateClinicalSummary,
} from '../../utils/clinicalSummary';

interface Props {
  input: SummaryInput;
}

/**
 * "AI" clinical summary for the selected event. Regenerates when the selected
 * event changes. Backed by a mocked async generator (see utils/clinicalSummary).
 */
export default function ClinicalSummaryCard({ input }: Props) {
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const eventId = input.event.id;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSummary(null);
    generateClinicalSummary(input).then(result => {
      if (cancelled) return;
      setSummary(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // Regenerate only when the selected event changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={16} color={colors.purple} />
        </View>
        <Text style={styles.title}>AI Clinical Summary</Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.purple} />
          <Text style={styles.loadingText}>Analyzing symptoms, activity and sleep data…</Text>
        </View>
      ) : summary ? (
        <>
          <Text style={styles.summaryText}>{summary.text}</Text>

          {summary.sources.length > 0 && (
            <View style={styles.sourcesRow}>
              {summary.sources.map(src => (
                <View key={src} style={styles.sourceChip}>
                  <Text style={styles.sourceText}>{src}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.disclaimer}>
            AI-generated from correlated data · verify before clinical use
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.purple + '30',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.purple + '15', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 14, fontWeight: '700', color: colors.text },

  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 18 },
  loadingText: { fontSize: 13, color: colors.tertiaryText },

  summaryText: { fontSize: 13.5, color: colors.secondaryText, lineHeight: 20, marginTop: 10 },

  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  sourceChip: { backgroundColor: colors.purple + '12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sourceText: { fontSize: 11, fontWeight: '600', color: colors.purple },

  disclaimer: { fontSize: 10.5, color: colors.quaternaryText, marginTop: 10 },
});
