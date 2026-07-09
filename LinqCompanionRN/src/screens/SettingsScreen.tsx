import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { usePatientData } from '../context/PatientDataContext';
import { UserRole, ThirdPartyService, serviceIcon, serviceColor } from '../models/types';

export default function SettingsScreen({ navigation }: any) {
  const { userProfile, updateProfile, resetToDemo, updateConnections } = usePatientData();

  const [name, setName] = useState(userProfile?.name ?? '');
  const [monitorHint, setMonitorHint] = useState(userProfile?.monitorSerialHint ?? '');
  const [clinicianName, setClinicianName] = useState(userProfile?.clinicianName ?? '');
  const [clinicianContact, setClinicianContact] = useState(userProfile?.clinicianContact ?? '');
  const [isDemoMode, setIsDemoMode] = useState(userProfile?.isDemoMode ?? false);
  const [role, setRole] = useState<UserRole>(userProfile?.role ?? 'patient');
  const [editing, setEditing] = useState(false);

  const connections = userProfile?.thirdPartyConnections ?? [];

  const handleSave = () => {
    if (!userProfile) return;
    updateProfile({
      ...userProfile,
      name: name.trim() || userProfile.name,
      monitorSerialHint: monitorHint.trim(),
      clinicianName: clinicianName.trim(),
      clinicianContact: clinicianContact.trim(),
      isDemoMode,
      role,
    });
    setEditing(false);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const toggleConnection = (service: ThirdPartyService) => {
    const updated = connections.map(c =>
      c.service === service ? { ...c, connected: !c.connected } : c
    );
    updateConnections(updated);
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your logged workouts, symptoms, and sleep entries from this device. Your profile will remain. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['lc_workouts', 'lc_symptoms', 'lc_sleep']);
            Alert.alert('Data Deleted', 'All logged data has been removed.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  const handleResetDemo = () => {
    Alert.alert(
      'Load Demo Data',
      'This will replace your current logged data with sample demo data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Load Demo Data', onPress: () => { resetToDemo(); navigation.goBack(); } },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <SectionHeader
          title="Profile"
          action={editing ? (
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        />
        <View style={styles.card}>
          <SettingRow icon="person" label="Your Name">
            {editing ? <TextInput style={styles.inlineInput} value={name} onChangeText={setName} autoCapitalize="words" /> : <Text style={styles.settingValue}>{name}</Text>}
          </SettingRow>
          <Separator />
          <SettingRow icon="radio" label="Monitor Hint">
            {editing ? <TextInput style={styles.inlineInput} value={monitorHint} onChangeText={setMonitorHint} placeholder="e.g. Last 4: 7842" placeholderTextColor={colors.quaternaryText} /> : <Text style={styles.settingValue}>{monitorHint || 'Not set'}</Text>}
          </SettingRow>
          <Separator />
          <SettingRow icon="medical" label="Clinician Name">
            {editing ? <TextInput style={styles.inlineInput} value={clinicianName} onChangeText={setClinicianName} autoCapitalize="words" /> : <Text style={styles.settingValue}>{clinicianName || 'Not set'}</Text>}
          </SettingRow>
          <Separator />
          <SettingRow icon="call" label="Clinician Contact">
            {editing ? <TextInput style={styles.inlineInput} value={clinicianContact} onChangeText={setClinicianContact} keyboardType="phone-pad" /> : <Text style={styles.settingValue}>{clinicianContact || 'Not set'}</Text>}
          </SettingRow>
        </View>

        {/* View Mode */}
        <SectionHeader title="View Mode" />
        <View style={styles.roleRow}>
          {(['patient', 'physician'] as UserRole[]).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roleCard, role === r && styles.roleCardActive]}
              onPress={() => { setRole(r); if (!editing) setEditing(true); }}
            >
              <Ionicons
                name={r === 'patient' ? 'person' : 'medkit'}
                size={26}
                color={role === r ? colors.medtronicBlue : colors.tertiaryText}
              />
              <Text style={[styles.roleTitle, role === r && { color: colors.medtronicBlue }]}>
                {r === 'patient' ? 'Patient' : 'Physician'}
              </Text>
              <Text style={styles.roleDesc}>
                {r === 'patient' ? 'Simplified, friendly view' : 'Detailed clinical data view'}
              </Text>
              {role === r && <View style={styles.roleActiveDot} />}
            </TouchableOpacity>
          ))}
        </View>
        {editing && <Text style={styles.editHint}>Tap Save above to apply changes.</Text>}

        {/* Connected Apps */}
        <SectionHeader title="Connected Apps" />
        <View style={styles.card}>
          {connections.length === 0 ? (
            <View style={styles.emptyConnections}>
              <Text style={styles.emptyConnectionsText}>No services configured. Reset onboarding to add connections.</Text>
            </View>
          ) : (
            connections.map((c, idx) => {
              const col = serviceColor(c.service);
              return (
                <React.Fragment key={c.service}>
                  <View style={styles.serviceRow}>
                    <View style={[styles.serviceIcon, { backgroundColor: col + '15' }]}>
                      <Ionicons name={serviceIcon(c.service) as any} size={18} color={col} />
                    </View>
                    <Text style={styles.serviceLabel}>{c.service}</Text>
                    {c.connected && (
                      <View style={styles.connectedPill}>
                        <Text style={styles.connectedPillText}>Connected</Text>
                      </View>
                    )}
                    <Switch
                      value={c.connected}
                      onValueChange={() => toggleConnection(c.service)}
                      trackColor={{ false: colors.fillTertiary, true: col + '80' }}
                      thumbColor={c.connected ? col : '#fff'}
                    />
                  </View>
                  {idx < connections.length - 1 && <Separator />}
                </React.Fragment>
              );
            })
          )}
        </View>
        <Text style={styles.connectionNote}>
          In this prototype connections are simulated. No data is read from external services.
        </Text>

        {/* App Mode */}
        <SectionHeader title="App Mode" />
        <View style={styles.card}>
          <SettingRow icon="flask" label="Demo Mode">
            <Switch
              value={isDemoMode}
              onValueChange={v => { setIsDemoMode(v); if (!editing) setEditing(true); }}
              trackColor={{ false: colors.fillTertiary, true: colors.medtronicBlue }}
              thumbColor="#fff"
            />
          </SettingRow>
        </View>

        {/* Demo data */}
        <SectionHeader title="Demo Data" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleResetDemo}>
            <Ionicons name="refresh-circle" size={22} color={colors.medtronicBlue} />
            <Text style={styles.actionText}>Reload Demo Data</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tertiaryText} />
          </TouchableOpacity>
        </View>

        {/* Privacy & Data */}
        <SectionHeader title="Privacy & Data" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteData}>
            <Ionicons name="trash" size={22} color={colors.alertRed} />
            <Text style={[styles.actionText, { color: colors.alertRed }]}>Delete All Logged Data</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tertiaryText} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingRow icon="information-circle" label="Version">
            <Text style={styles.settingValue}>1.0.0</Text>
          </SettingRow>
          <Separator />
          <SettingRow icon="business" label="Intended Use">
            <Text style={styles.settingValue} numberOfLines={2}>Personal context logging</Text>
          </SettingRow>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            LINQ Companion is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease. All data remains on your device unless you choose to share it.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

function SettingRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Ionicons name={icon as any} size={20} color={colors.medtronicBlue} style={styles.settingIcon} />
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>{children}</View>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 48 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8, paddingHorizontal: 2 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: colors.tertiaryText, textTransform: 'uppercase', letterSpacing: 0.6 },
  saveText:      { fontSize: 15, fontWeight: '700', color: colors.medtronicBlue },
  editText:      { fontSize: 15, color: colors.medtronicBlue },
  editHint:      { fontSize: 12, color: colors.tertiaryText, marginTop: 6, marginLeft: 4 },

  card:      { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  separator: { height: 1, backgroundColor: colors.separatorOpaque, marginLeft: 56 },

  settingRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  settingIcon:  { marginRight: 12 },
  settingLabel: { flex: 1, fontSize: 15, color: colors.text },
  settingRight: { maxWidth: 200, alignItems: 'flex-end' },
  settingValue: { fontSize: 15, color: colors.tertiaryText },
  inlineInput:  { fontSize: 15, color: colors.text, textAlign: 'right', minWidth: 120 },

  roleRow:      { flexDirection: 'row', gap: 10 },
  roleCard:     { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  roleCardActive: { borderColor: colors.medtronicBlue, backgroundColor: colors.fillPrimary },
  roleTitle:    { fontSize: 14, fontWeight: '700', color: colors.text },
  roleDesc:     { fontSize: 11, color: colors.tertiaryText, textAlign: 'center' },
  roleActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.medtronicBlue, position: 'absolute', top: 10, right: 10 },

  serviceRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  serviceIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { flex: 1, fontSize: 15, color: colors.text },
  connectedPill: { backgroundColor: colors.alertGreen + '18', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  connectedPillText: { fontSize: 11, fontWeight: '600', color: colors.alertGreen },
  emptyConnections:     { padding: 16 },
  emptyConnectionsText: { fontSize: 13, color: colors.tertiaryText, textAlign: 'center' },
  connectionNote: { fontSize: 12, color: colors.quaternaryText, marginTop: 6, marginLeft: 4, lineHeight: 17 },

  actionRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },

  disclaimerBox:  { marginTop: 24, backgroundColor: colors.fillTertiary, borderRadius: 12, padding: 14 },
  disclaimerText: { fontSize: 12, color: colors.tertiaryText, textAlign: 'center', lineHeight: 18 },
});
