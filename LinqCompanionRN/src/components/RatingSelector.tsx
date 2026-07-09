import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  value: number;
  max: number;
  onChange: (v: number) => void;
  activeColor?: string;
}

export function RatingSelector({ value, max, onChange, activeColor = colors.medtronicBlue }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <TouchableOpacity
          key={n}
          style={[styles.dot, { borderColor: activeColor }, n <= value && { backgroundColor: activeColor }]}
          onPress={() => onChange(n)}
        >
          <Text style={[styles.dotText, n <= value && styles.dotTextActive]}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:          { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dot:          { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  dotText:      { fontSize: 13, fontWeight: '600', color: colors.tertiaryText },
  dotTextActive: { color: '#fff' },
});
