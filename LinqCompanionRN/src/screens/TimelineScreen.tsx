import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePatientData, formatDateTime } from '../context/PatientDataContext';
import { TimelineEntry, TimelineEntryType } from '../models/types';

type Filter = 'All' | 'Workouts' | 'Symptoms' | 'Sleep';

const FILTERS: Filter[] = ['All', 'Workouts', 'Symptoms', 'Sleep'];

const TYPE_MAP: Record<Filter, TimelineEntryType | null> = {
  All: null,
  Workouts: 'workout',
  Symptoms: 'symptom',
  Sleep: 'sleep',
};

export default function TimelineScreen() {
  const { timelineEntries, userProfile } = usePatientData();
  const [filter, setFilter] = useState<Filter>('All');
  const isPhysician = userProfile?.role === 'physician';

  const filtered = useMemo(() => {
    if (filter === 'All') return timelineEntries;
    const t = TYPE_MAP[filter];
    return timelineEntries.filter(e => e.type === t);
  }, [timelineEntries, filter]);

  const renderItem = ({ item, index }: { item: TimelineEntry; index: number }) => (
    <TimelineRow entry={item} isLast={index === filtered.length - 1} isPhysician={isPhysician} />
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.subtitle}>{filtered.length} {filter !== 'All' ? filter.toLowerCase() : 'entries'}</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={52} color={colors.quaternaryText} />
          <Text style={styles.emptyTitle}>No {filter !== 'All' ? filter.toLowerCase() : 'entries'} yet</Text>
          <Text style={styles.emptySubtitle}>Start logging data to see it appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function TimelineRow({ entry, isLast, isPhysician }: { entry: TimelineEntry; isLast: boolean; isPhysician: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.rowWrapper}>
      <View style={styles.timelineColumn}>
        <View style={[styles.dot, { backgroundColor: entry.isUrgent ? colors.alertRed : entry.color }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      <TouchableOpacity
        style={[styles.card, entry.isUrgent && styles.cardUrgent]}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: entry.color + '18' }]}>
            <Ionicons name={entry.icon as any} size={18} color={entry.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, entry.isUrgent && { color: colors.alertRed }]}>
              {entry.title}
            </Text>
            <Text style={styles.cardSubtitle}>{entry.subtitle}</Text>
            <Text style={styles.cardTime}>{formatDateTime(entry.timestamp)}</Text>
          </View>
          {entry.isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.tertiaryText}
          />
        </View>

        {expanded && entry.detail ? (
          <View style={styles.cardDetail}>
            <Text style={styles.cardDetailText}>{entry.detail}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.background },
  header:   { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title:    { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.tertiaryText, marginTop: 2 },

  filterRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.fillTertiary },
  chipActive:     { backgroundColor: colors.medtronicBlue },
  chipText:       { fontSize: 13, fontWeight: '500', color: colors.secondaryText },
  chipTextActive: { color: '#fff' },

  list:         { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  rowWrapper:   { flexDirection: 'row', gap: 12, marginBottom: 4 },

  timelineColumn: { alignItems: 'center', width: 16 },
  dot:            { width: 14, height: 14, borderRadius: 7, marginTop: 14, zIndex: 1 },
  line:           { flex: 1, width: 2, backgroundColor: colors.separatorOpaque, marginTop: 2 },

  card:       { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardUrgent: { borderWidth: 1, borderColor: colors.alertRed + '40' },

  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconCircle:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.secondaryText, marginTop: 2 },
  cardTime:     { fontSize: 11, color: colors.tertiaryText, marginTop: 2 },

  urgentBadge: { backgroundColor: colors.alertRed + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  urgentText:  { fontSize: 11, fontWeight: '700', color: colors.alertRed },

  cardDetail:     { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.separatorOpaque },
  cardDetailText: { fontSize: 13, color: colors.secondaryText, lineHeight: 19 },

  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:    { fontSize: 20, fontWeight: '700', color: colors.secondaryText, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.tertiaryText, marginTop: 6, textAlign: 'center' },
});
