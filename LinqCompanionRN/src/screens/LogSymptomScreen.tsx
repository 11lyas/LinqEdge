import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePatientData } from '../context/PatientDataContext';
import {
  SymptomType, SymptomContext, SYMPTOM_TYPES, SYMPTOM_CONTEXTS, isCriticalSymptom, symptomIcon,
} from '../models/types';
import { RatingSelector } from '../components/RatingSelector';

export default function LogSymptomScreen({ navigation }: any) {
  const { addSymptom } = usePatientData();

  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [severity, setSeverity] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [context, setContext] = useState<SymptomContext>('At Rest');
  const [notes, setNotes] = useState('');

  const toggle = (s: SymptomType) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const hasCritical = selectedSymptoms.some(isCriticalSymptom);

  const handleSave = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Select symptoms', 'Please select at least one symptom.');
      return;
    }
    addSymptom({
      id: `symptom-${Date.now()}`,
      timestamp: new Date().toISOString(),
      symptoms: selectedSymptoms,
      severity,
      durationMinutes: parseInt(durationMinutes) || 0,
      context,
      notes: notes.trim(),
    });
    Alert.alert('Symptoms Saved', 'Your symptom entry has been logged.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Emergency banner */}
          <View style={styles.emergencyBanner}>
            <Ionicons name="warning" size={18} color={colors.alertRed} />
            <Text style={styles.emergencyText}>
              If you are having a medical emergency, call 911 immediately. Do not use this app in an emergency.
            </Text>
          </View>

          {/* Symptom selector */}
          <Text style={styles.sectionLabel}>What are you experiencing?</Text>
          <View style={styles.chipGrid}>
            {SYMPTOM_TYPES.map(s => {
              const selected = selectedSymptoms.includes(s);
              const critical = isCriticalSymptom(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.symptomChip,
                    selected && (critical ? styles.symptomChipCritical : styles.symptomChipSelected),
                  ]}
                  onPress={() => toggle(s)}
                >
                  <Ionicons
                    name={symptomIcon(s) as any}
                    size={16}
                    color={selected ? '#fff' : critical ? colors.alertRed : colors.medtronicBlue}
                  />
                  <Text style={[styles.symptomChipText, selected && styles.symptomChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Critical warning */}
          {hasCritical && (
            <View style={styles.criticalWarning}>
              <Ionicons name="alert-circle" size={20} color={colors.alertRed} />
              <Text style={styles.criticalText}>
                You've selected a potentially serious symptom. If this is ongoing or worsening, seek care immediately.
              </Text>
            </View>
          )}

          {/* Severity */}
          <Text style={styles.sectionLabel}>Severity (1 = mild, 5 = severe)</Text>
          <RatingSelector value={severity} max={5} onChange={setSeverity} activeColor={severity >= 4 ? colors.alertRed : severity === 3 ? colors.alertOrange : colors.alertGreen} />

          {/* Duration */}
          <Text style={styles.sectionLabel}>Approximate Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="e.g. 5 (enter 0 if ongoing)"
            placeholderTextColor={colors.quaternaryText}
            keyboardType="number-pad"
          />

          {/* Context */}
          <Text style={styles.sectionLabel}>When did this occur?</Text>
          <View style={styles.chipGrid}>
            {SYMPTOM_CONTEXTS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.contextChip, context === c && styles.contextChipActive]}
                onPress={() => setContext(c)}
              >
                <Text style={[styles.contextChipText, context === c && styles.contextChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe what you felt, what you were doing, what helped..."
            placeholderTextColor={colors.quaternaryText}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.saveBtnText}>Save Symptoms</Text>
          </TouchableOpacity>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              This is not a clinical symptom tracker. Share this information with your care team at your next appointment.
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

  emergencyBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF5F5', borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: colors.alertRed + '30' },
  emergencyText:   { flex: 1, fontSize: 13, color: colors.alertRed, fontWeight: '500', lineHeight: 18 },

  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.secondaryText, marginTop: 20, marginBottom: 10 },

  chipGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.fillPrimary, borderWidth: 1, borderColor: colors.medtronicBlue + '30' },
  symptomChipSelected: { backgroundColor: colors.medtronicBlue, borderColor: colors.medtronicBlue },
  symptomChipCritical: { backgroundColor: colors.alertRed, borderColor: colors.alertRed },
  symptomChipText:     { fontSize: 13, color: colors.secondaryText, fontWeight: '500' },
  symptomChipTextActive: { color: '#fff' },

  criticalWarning: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#FFF5F5', borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: colors.alertRed + '40' },
  criticalText:    { flex: 1, fontSize: 13, color: colors.alertRed, fontWeight: '500', lineHeight: 18 },

  input:      { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.separatorOpaque },
  notesInput: { height: 100, paddingTop: 12 },

  contextChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.fillTertiary, borderWidth: 1.5, borderColor: 'transparent' },
  contextChipActive: { backgroundColor: colors.medtronicBlue + '15', borderColor: colors.medtronicBlue },
  contextChipText:   { fontSize: 13, color: colors.secondaryText, fontWeight: '500' },
  contextChipTextActive: { color: colors.medtronicBlue },

  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.medtronicBlue, borderRadius: 16, padding: 18, marginTop: 28 },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  disclaimerBox:  { borderRadius: 12, padding: 12, backgroundColor: colors.fillTertiary, marginTop: 16 },
  disclaimerText: { fontSize: 12, color: colors.tertiaryText, textAlign: 'center', lineHeight: 17 },
});
