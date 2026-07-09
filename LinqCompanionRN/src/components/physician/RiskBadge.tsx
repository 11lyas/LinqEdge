import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel, riskColor } from '../../models/physicianTypes';

interface Props {
  level: RiskLevel;
  compact?: boolean;
}

/** Color-coded risk pill: 🔴 High / 🟠 Medium / 🟢 Low. */
export default function RiskBadge({ level, compact }: Props) {
  const color = riskColor(level);
  return (
    <View style={[styles.badge, { backgroundColor: color + '18' }, compact && styles.badgeCompact]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, compact && styles.textCompact]}>
        {level} Risk
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeCompact: { paddingHorizontal: 7, paddingVertical: 3 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  text:         { fontSize: 12, fontWeight: '700' },
  textCompact:  { fontSize: 11 },
});
