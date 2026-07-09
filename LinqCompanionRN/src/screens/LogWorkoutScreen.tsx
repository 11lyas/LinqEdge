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
  ActivityType, SymptomType, ACTIVITY_TYPES, SYMPTOM_TYPES, activityIcon,
} from '../models/types';
import { RatingSelector } from '../components/RatingSelector';

export default function LogWorkoutScreen({ navigation }: any) {
  const { addWorkout } = usePatientData();

  const [activity, setActivity] = useState<ActivityType>('Running');
  const [duration, setDuration] = useState('');
  const [exertion, setExertion] = useState(5);
  const [hydration, setHydration] = useState(3);
  const [stress, setStress] = useState(3);
  const [symptomsPresent, setSymptomsPresent] = useState<SymptomType[]>([]);
  const [postSymptoms, setPostSymptoms] = useState<SymptomType[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (s: SymptomType, list: SymptomType[], setter: (v: SymptomType[]) => void) => {
    setter(list.includes(s) ? list.filter(x => x !== s) : [...list, s]);
  };

  const handleSave = () => {
    const dur = parseInt(duration);
    if (!duration || isNaN(dur) || dur <= 0) {
      Alert.alert('Duration required', 'Please enter a valid duration in minutes.');
      return;
    }
    setSaving(true);
    addWorkout({
      id: `workout-${Date.now()}`,
      timestamp: new Date().toISOString(),
      activityType: activity,
      durationMinutes: dur,
      perceivedExertion: exertion,
      hydrationLevel: hydration,
      stressLevel: stress,
      symptomsPresent,
      postWorkoutSymptoms: postSymptoms,
      notes: notes.trim(),
    });
    setSaving(false);
    Alert.alert('Workout Saved', 'Your workout has been logged successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Activity picker */}
          <Text style={styles.sectionLabel}>Activity Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activityRow}>
            {ACTIVITY_TYPES.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.activityChip, activity === a && styles.activityChipActive]}
                onPress={() => setActivity(a)}
              >
                <Ionicons name={activityIcon(a) as any} size={18} color={activity === a ? '#fff' : colors.medtronicBlue} />
                <Text style={[styles.activityChipText, activity === a && styles.activityChipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Duration */}
          <Text style={styles.sectionLabel}>Duration (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g. 45"
            placeholderTextColor={colors.quaternaryText}
            keyboardType="number-pad"
          />

          {/* Perceived Exertion */}
          <Text style={styles.sectionLabel}>Perceived Exertion (RPE 1–10)</Text>
          <Text style={styles.rpeDesc}>
            {exertion <= 2 ? 'Very light' : exertion <= 4 ? 'Light' : exertion <= 6 ? 'Moderate' : exertion <= 8 ? 'Hard' : 'Maximum effort'}
          </Text>
          <RatingSelector value={exertion} max={10} onChange={setExertion} activeColor={colors.medtronicBlue} />

          {/* Hydration */}
          <Text style={styles.sectionLabel}>Hydration Level (1 = very dehydrated, 5 = well hydrated)</Text>
          <RatingSelector value={hydration} max={5} onChange={setHydration} activeColor={colors.cyan} />

          {/* Stress */}
          <Text style={styles.sectionLabel}>Stress Level (1 = very relaxed, 5 = very stressed)</Text>
          <RatingSelector value={stress} max={5} onChange={setStress} activeColor={colors.alertOrange} />

          {/* Symptoms during */}
          <Text style={styles.sectionLabel}>Symptoms During Workout</Text>
          <View style={styles.chipGrid}>
            {SYMPTOM_TYPES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.symptomChip, symptomsPresent.includes(s) && styles.symptomChipActive]}
                onPress={() => toggleSymptom(s, symptomsPresent, setSymptomsPresent)}
              >
                <Text style={[styles.symptomChipText, symptomsPresent.includes(s) && styles.symptomChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Post-workout symptoms */}
          <Text style={styles.sectionLabel}>Post-Workout Symptoms</Text>
          <View style={styles.chipGrid}>
            {SYMPTOM_TYPES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.symptomChip, postSymptoms.includes(s) && { backgroundColor: colors.alertOrange, borderColor: colors.alertOrange }]}
                onPress={() => toggleSymptom(s, postSymptoms, setPostSymptoms)}
              >
                <Text style={[styles.symptomChipText, postSymptoms.includes(s) && styles.symptomChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did you feel? Any details worth capturing..."
            placeholderTextColor={colors.quaternaryText}
            multiline
            textAlignVertical="top"
          />

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.saveBtnText}>Save Workout</Text>
          </TouchableOpacity>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              This data is stored locally and used only to provide context alongside your LINQ monitoring history.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  scroll:  { padding: 20, paddingBottom: 40 },

  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.secondaryText, marginTop: 20, marginBottom: 10 },
  rpeDesc:      { fontSize: 13, color: colors.medtronicBlue, fontStyle: 'italic', marginBottom: 8 },

  activityRow:  { gap: 8, paddingBottom: 4 },
  activityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.fillPrimary, borderWidth: 1.5, borderColor: colors.medtronicBlue + '30' },
  activityChipActive: { backgroundColor: colors.medtronicBlue, borderColor: colors.medtronicBlue },
  activityChipText:   { fontSize: 13, fontWeight: '600', color: colors.medtronicBlue },
  activityChipTextActive: { color: '#fff' },

  input:      { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.separatorOpaque },
  notesInput: { height: 100, paddingTop: 12 },

  chipGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomChip:    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.fillTertiary, borderWidth: 1, borderColor: 'transparent' },
  symptomChipActive: { backgroundColor: colors.medtronicBlue, borderColor: colors.medtronicBlue },
  symptomChipText:   { fontSize: 13, color: colors.secondaryText, fontWeight: '500' },
  symptomChipTextActive: { color: '#fff' },

  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.medtronicBlue, borderRadius: 16, padding: 18, marginTop: 28 },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  disclaimerBox:  { borderRadius: 12, padding: 12, backgroundColor: colors.fillTertiary, marginTop: 16 },
  disclaimerText: { fontSize: 12, color: colors.tertiaryText, textAlign: 'center', lineHeight: 17 },
});
