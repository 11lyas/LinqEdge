import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PhysicianPatient, riskColor } from '../../models/physicianTypes';
import { formatRelative } from '../../context/PatientDataContext';
import RiskBadge from './RiskBadge';
import TrendIndicator from './TrendIndicator';

interface Props {
  patient: PhysicianPatient;
  onPress: () => void;
}

function initials(name: string): string {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

/** Ranked roster row: name, condition, risk, trend, latest event. */
export default function PatientCard({ patient, onPress }: Props) {
  const accent = riskColor(patient.riskLevel);

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: accent }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: accent + '18' }]}>
          <Text style={[styles.avatarText, { color: accent }]}>{initials(patient.name)}</Text>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{patient.name}</Text>
          <Text style={styles.demographics}>
            {patient.condition} · {patient.age} {patient.sex}
          </Text>
        </View>

        <View style={styles.scoreBlock}>
          <Text style={[styles.score, { color: accent }]}>{patient.riskScore}</Text>
          <Text style={styles.scoreCaption}>Risk Score</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <RiskBadge level={patient.riskLevel} compact />
        <TrendIndicator trend={patient.trend} />
        <View style={styles.spacer} />
        <Ionicons name="time-outline" size={13} color={colors.tertiaryText} />
        <Text style={styles.eventTime}>Last event {formatRelative(patient.latestEventAt)}</Text>
        <Ionicons name="chevron-forward" size={15} color={colors.quaternaryText} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 16, borderLeftWidth: 4,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  topRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 15, fontWeight: '700' },
  identity:     { flex: 1 },
  name:         { fontSize: 16, fontWeight: '700', color: colors.text },
  demographics: { fontSize: 12.5, color: colors.secondaryText, marginTop: 2 },
  scoreBlock:   { alignItems: 'center' },
  score:        { fontSize: 24, fontWeight: '800' },
  scoreCaption: { fontSize: 10, color: colors.tertiaryText, marginTop: -2 },

  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  spacer:    { flex: 1 },
  eventTime: { fontSize: 11.5, color: colors.tertiaryText, marginRight: 2 },
});
