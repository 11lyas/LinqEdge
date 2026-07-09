import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePatientData } from '../context/PatientDataContext';
import { SleepQuality, SLEEP_QUALITIES, sleepQualityColor, sleepQualityIcon } from '../models/types';
import { RatingSelector } from '../components/RatingSelector';

export default function LogSleepScreen({ navigation }: any) {
  const { addSleep } = usePatientData();

  const [hoursSlept, setHoursSlept] = useState('');
  const [quality, setQuality] = useState<SleepQuality>('Good');
  const [wakeCount, setWakeCount] = useState(0);
  const [notes, setNotes] = useState('');

  const qualityEmoji: Record<SleepQuality, string> = {
    Poor: '😴', Fair: '🌙', Good: '😊', Excellent: '⭐',
  };

  const handleSave = () => {
    const hrs = parseFloat(hoursSlept);
    if (!hoursSlept || isNaN(hrs) || hrs <= 0 || hrs > 24) {
      Alert.alert('Invalid hours', 'Please enter a valid number of hours between 0 and 24.');
      return;
    }
    addSleep({
      id: `sleep-${Date.now()}`,
      date: new Date().toISOString(),
      hoursSlept: hrs,
      quality,
      wakeCount,
      notes: notes.trim(),
    });
    Alert.alert('Sleep Logged', 'Your sleep entry has been saved.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={styles.intro}>
            Logging your sleep helps build context around cardiac monitoring events. This reflects last night's sleep.
          </Text>

          {/* Hours slept */}
          <Text style={styles.sectionLabel}>Hours Slept *</Text>
          <TextInput
            style={styles.input}
            value={hoursSlept}
            onChangeText={setHoursSlept}
            placeholder="e.g. 7.5"
            placeholderTextColor={colors.quaternaryText}
            keyboardType="decimal-pad"
          />

          {/* Quality */}
          <Text style={styles.sectionLabel}>Sleep Quality</Text>
          <View style={styles.qualityRow}>
            {SLEEP_QUALITIES.map(q => {
              const selected = quality === q;
              const col = sleepQualityColor(q);
              return (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityCard, selected && { borderColor: col, backgroundColor: col + '12' }]}
                  onPress={() => setQuality(q)}
                >
                  <Text style={styles.qualityEmoji}>{qualityEmoji[q]}</Text>
                  <Text style={[styles.qualityLabel, selected && { color: col, fontWeight: '700' }]}>{q}</Text>
                  {selected && <Ionicons name="checkmark-circle-outline" size={18} color={col} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Wake count */}
          <Text style={styles.sectionLabel}>Times You Woke Up</Text>
          <View style={styles.wakeRow}>
            {[0, 1, 2, 3, 4, 5, 6].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.wakeChip, wakeCount === n && styles.wakeChipActive]}
                onPress={() => setWakeCount(n)}
              >
                <Text style={[styles.wakeChipText, wakeCount === n && styles.wakeChipTextActive]}>{n === 6 ? '6+' : n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Restless, vivid dreams, stress before bed..."
            placeholderTextColor={colors.quaternaryText}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="moon" size={22} color="#fff" />
            <Text style={styles.saveBtnText}>Save Sleep Entry</Text>
          </TouchableOpacity>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              Sleep data you enter is for personal context only and is not used for clinical monitoring.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  intro:        { fontSize: 14, color: colors.secondaryText, lineHeight: 21, marginBottom: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.secondaryText, marginTop: 20, marginBottom: 10 },

  input:      { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.separatorOpaque },
  notesInput: { height: 100, paddingTop: 12 },

  qualityRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  qualityCard:  { flex: 1, minWidth: '44%', alignItems: 'center', gap: 4, padding: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.separatorOpaque },
  qualityEmoji: { fontSize: 26 },
  qualityLabel: { fontSize: 13, color: colors.secondaryText, fontWeight: '500' },

  wakeRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  wakeChip:     { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.fillTertiary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  wakeChipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  wakeChipText:   { fontSize: 15, fontWeight: '700', color: colors.secondaryText },
  wakeChipTextActive: { color: '#fff' },

  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.indigo, borderRadius: 16, padding: 18, marginTop: 28 },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  disclaimerBox:  { borderRadius: 12, padding: 12, backgroundColor: colors.fillTertiary, marginTop: 16 },
  disclaimerText: { fontSize: 12, color: colors.tertiaryText, textAlign: 'center', lineHeight: 17 },
});
