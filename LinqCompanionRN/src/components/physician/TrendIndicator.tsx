import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrendDirection, trendColor, trendIcon } from '../../models/physicianTypes';

interface Props {
  trend: TrendDirection;
  showLabel?: boolean;
}

/** Improving / Stable / Worsening indicator with directional icon. */
export default function TrendIndicator({ trend, showLabel = true }: Props) {
  const color = trendColor(trend);
  return (
    <View style={styles.row}>
      <Ionicons name={trendIcon(trend) as any} size={14} color={color} />
      {showLabel && <Text style={[styles.label, { color }]}>{trend}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
});
