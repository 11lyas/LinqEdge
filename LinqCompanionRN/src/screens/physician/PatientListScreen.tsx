import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { getPatients } from '../../data/physicianDemoData';
import { CONDITION_PRECEDENCE, PhysicianPatient } from '../../models/physicianTypes';
import PatientCard from '../../components/physician/PatientCard';

type SortMode = 'Risk Score' | 'Recent Events' | 'Condition';
const SORT_MODES: SortMode[] = ['Risk Score', 'Recent Events', 'Condition'];

function sortPatients(patients: PhysicianPatient[], mode: SortMode): PhysicianPatient[] {
  const list = [...patients];
  switch (mode) {
    case 'Recent Events':
      return list.sort((a, b) => b.latestEventAt.localeCompare(a.latestEventAt));
    case 'Condition':
      return list.sort((a, b) => {
        const diff = CONDITION_PRECEDENCE.indexOf(a.condition) - CONDITION_PRECEDENCE.indexOf(b.condition);
        return diff !== 0 ? diff : b.riskScore - a.riskScore;
      });
    default:
      return list.sort((a, b) => b.riskScore - a.riskScore);
  }
}

/** Patient Risk Stratification: ranked roster of monitored LINQ patients. */
export default function PatientListScreen({ navigation }: any) {
  const [sortMode, setSortMode] = useState<SortMode>('Risk Score');

  const patients = useMemo(() => sortPatients(getPatients(), sortMode), [sortMode]);
  const highCount = patients.filter(p => p.riskLevel === 'High').length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Patients</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="medkit" size={12} color={colors.purple} />
            <Text style={styles.roleBadgeText}>Physician View</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {patients.length} monitored · <Text style={styles.subtitleAlert}>{highCount} high risk</Text>
        </Text>
      </View>

      {/* Sort chips */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by</Text>
        {SORT_MODES.map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.chip, sortMode === mode && styles.chipActive]}
            onPress={() => setSortMode(mode)}
          >
            <Text style={[styles.chipText, sortMode === mode && styles.chipTextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={patients}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Demo only — all patients, risk scores and events are simulated. Not for clinical use.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:    { fontSize: 28, fontWeight: '700', color: colors.text },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.purple + '15', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: colors.purple },

  subtitle:      { fontSize: 14, color: colors.tertiaryText, marginTop: 2 },
  subtitleAlert: { color: colors.alertRed, fontWeight: '600' },

  sortRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  sortLabel: { fontSize: 12, color: colors.tertiaryText, marginRight: 2 },
  chip:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.fillTertiary },
  chipActive: { backgroundColor: colors.medtronicBlue },
  chipText:   { fontSize: 12.5, fontWeight: '500', color: colors.secondaryText },
  chipTextActive: { color: '#fff' },

  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },

  disclaimer:     { backgroundColor: colors.fillTertiary, borderRadius: 12, padding: 12, marginTop: 12 },
  disclaimerText: { fontSize: 11, color: colors.tertiaryText, textAlign: 'center', lineHeight: 16 },
});
