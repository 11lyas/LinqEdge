import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePatientData } from '../context/PatientDataContext';
import {
  UserProfile, UserRole, ThirdPartyConnection,
  THIRD_PARTY_SERVICES, ThirdPartyService, serviceIcon, serviceColor,
} from '../models/types';

const STEPS = ['Welcome', 'Consent', 'Profile', 'Connect', 'Preferences'];

export default function OnboardingScreen() {
  const { completeOnboarding } = usePatientData();

  const [step, setStep] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [name, setName] = useState('');
  const [monitorHint, setMonitorHint] = useState('');
  const [clinicianName, setClinicianName] = useState('');
  const [clinicianContact, setClinicianContact] = useState('');
  const [connections, setConnections] = useState<ThirdPartyConnection[]>(
    THIRD_PARTY_SERVICES.map(s => ({ service: s, connected: false }))
  );
  const [role, setRole] = useState<UserRole>('patient');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const canProceed = () => {
    if (step === 1) return consentGiven;
    if (step === 2) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleComplete();
  };

  const handleComplete = () => {
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim() || 'Patient',
      monitorSerialHint: monitorHint.trim() || 'LINQ II',
      onboardingCompleted: true,
      consentGiven,
      isDemoMode,
      notificationsEnabled: false,
      clinicianName: clinicianName.trim(),
      clinicianContact: clinicianContact.trim(),
      role,
      thirdPartyConnections: connections,
    };
    completeOnboarding(profile);
  };

  const toggleConnection = (service: ThirdPartyService) => {
    setConnections(prev =>
      prev.map(c => c.service === service ? { ...c, connected: !c.connected } : c)
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Progress bar */}
        <View style={styles.progressRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.progressStep}>
              <View style={[styles.progressDot, i <= step ? styles.progressDotActive : styles.progressDotInactive]} />
              {i < STEPS.length - 1 && (
                <View style={[styles.progressLine, i < step ? styles.progressLineActive : styles.progressLineInactive]} />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.progressLabel}>{STEPS[step]}</Text>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 0 && <WelcomeStep />}
          {step === 1 && <ConsentStep consentGiven={consentGiven} onToggle={setConsentGiven} />}
          {step === 2 && (
            <ProfileStep
              name={name} onName={setName}
              monitorHint={monitorHint} onMonitorHint={setMonitorHint}
              clinicianName={clinicianName} onClinicianName={setClinicianName}
              clinicianContact={clinicianContact} onClinicianContact={setClinicianContact}
            />
          )}
          {step === 3 && (
            <LinkageStep connections={connections} onToggle={toggleConnection} />
          )}
          {step === 4 && (
            <PreferencesStep role={role} onRole={setRole} isDemoMode={isDemoMode} onDemoMode={setIsDemoMode} />
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Ionicons name="chevron-back" size={20} color={colors.medtronicBlue} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextText}>{step === STEPS.length - 1 ? 'Get Started' : 'Continue'}</Text>
            <Ionicons name={step === STEPS.length - 1 ? 'checkmark-circle' : 'chevron-forward'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="pulse" size={52} color={colors.medtronicBlue} />
      </View>
      <Text style={styles.stepTitle}>LINQ Companion</Text>
      <Text style={styles.stepSubtitle}>Your personal cardiac context journal</Text>
      <View style={styles.featureList}>
        {[
          { icon: 'walk',             text: 'Log workouts, symptoms & sleep' },
          { icon: 'link',             text: 'Connect Apple Health, Strava & more' },
          { icon: 'people',           text: 'Choose patient or physician view' },
          { icon: 'shield-checkmark', text: 'Data stays on your device' },
        ].map(f => (
          <View key={f.text} style={styles.featureRow}>
            <Ionicons name={f.icon as any} size={22} color={colors.medtronicBlue} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This app is not a medical device and does not diagnose or treat any condition. Always follow your clinician's guidance.
        </Text>
      </View>
    </View>
  );
}

// ── Step 2: Consent ───────────────────────────────────────────────────────────

function ConsentStep({ consentGiven, onToggle }: { consentGiven: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Ionicons name="shield-checkmark" size={48} color={colors.medtronicBlue} style={{ marginBottom: 16 }} />
      <Text style={styles.stepTitle}>Privacy & Consent</Text>
      <Text style={styles.stepSubtitle}>Please read and acknowledge the following.</Text>
      <View style={styles.consentBox}>
        {[
          'All data you log is stored locally on this device and is never automatically transmitted anywhere.',
          'This app does NOT connect to or receive data from your LINQ monitor directly. Context data is entered manually.',
          'This app is not a clinical tool and is not intended to diagnose, treat, or monitor any medical condition.',
          'Always follow your clinician\'s instructions. In an emergency, call 911 immediately.',
          'You may delete all data at any time from the Settings screen.',
        ].map((text, i) => (
          <View key={i} style={styles.consentPoint}>
            <Ionicons name="information-circle-outline" size={18} color={colors.tertiaryText} style={{ marginTop: 2 }} />
            <Text style={styles.consentText}>{text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.consentToggle} onPress={() => onToggle(!consentGiven)}>
        <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
          {consentGiven && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={styles.consentToggleText}>I have read and understand the above</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 3: Profile ───────────────────────────────────────────────────────────

function ProfileStep({
  name, onName, monitorHint, onMonitorHint,
  clinicianName, onClinicianName, clinicianContact, onClinicianContact,
}: {
  name: string; onName: (v: string) => void;
  monitorHint: string; onMonitorHint: (v: string) => void;
  clinicianName: string; onClinicianName: (v: string) => void;
  clinicianContact: string; onClinicianContact: (v: string) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Ionicons name="person-circle" size={48} color={colors.medtronicBlue} style={{ marginBottom: 16 }} />
      <Text style={styles.stepTitle}>Your Profile</Text>
      <Text style={styles.stepSubtitle}>Stored only on your device.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Your Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={onName} placeholder="e.g. Alex Johnson" placeholderTextColor={colors.quaternaryText} autoCapitalize="words" />
        <Text style={styles.label}>Monitor Hint (optional)</Text>
        <TextInput style={styles.input} value={monitorHint} onChangeText={onMonitorHint} placeholder="e.g. Last 4 digits: 7842" placeholderTextColor={colors.quaternaryText} />
        <Text style={styles.label}>Clinician Name (optional)</Text>
        <TextInput style={styles.input} value={clinicianName} onChangeText={onClinicianName} placeholder="e.g. Dr. Sarah Patel" placeholderTextColor={colors.quaternaryText} />
        <Text style={styles.label}>Clinician Contact (optional)</Text>
        <TextInput style={styles.input} value={clinicianContact} onChangeText={onClinicianContact} placeholder="e.g. (555) 867-5309" placeholderTextColor={colors.quaternaryText} keyboardType="phone-pad" />
      </View>
    </View>
  );
}

// ── Step 4: Third-party Linkage ───────────────────────────────────────────────

function LinkageStep({
  connections,
  onToggle,
}: {
  connections: ThirdPartyConnection[];
  onToggle: (service: ThirdPartyService) => void;
}) {
  const connectedCount = connections.filter(c => c.connected).length;

  return (
    <View style={styles.stepContainer}>
      <Ionicons name="link" size={48} color={colors.medtronicBlue} style={{ marginBottom: 16 }} />
      <Text style={styles.stepTitle}>Connect Your Apps</Text>
      <Text style={styles.stepSubtitle}>
        Link third-party health and fitness apps to automatically pull in activity data. You can change this any time in Settings.
      </Text>

      {connectedCount > 0 && (
        <View style={styles.connectedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.alertGreen} />
          <Text style={styles.connectedBadgeText}>{connectedCount} app{connectedCount > 1 ? 's' : ''} selected</Text>
        </View>
      )}

      <View style={styles.serviceList}>
        {connections.map(c => {
          const col = serviceColor(c.service);
          return (
            <TouchableOpacity
              key={c.service}
              style={[styles.serviceCard, c.connected && { borderColor: col, borderWidth: 2 }]}
              onPress={() => onToggle(c.service)}
              activeOpacity={0.85}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: col + '18' }]}>
                <Ionicons name={serviceIcon(c.service) as any} size={24} color={col} />
              </View>
              <Text style={[styles.serviceLabel, c.connected && { color: col, fontWeight: '700' }]}>
                {c.service}
              </Text>
              <View style={[styles.serviceCheckbox, c.connected && { backgroundColor: col, borderColor: col }]}>
                {c.connected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.linkageNote}>
        <Ionicons name="information-circle-outline" size={15} color={colors.tertiaryText} />
        <Text style={styles.linkageNoteText}>
          In this prototype, connections are simulated and no real data is read from external services.
        </Text>
      </View>
    </View>
  );
}

// ── Step 5: Preferences (Role + Mode) ────────────────────────────────────────

function PreferencesStep({
  role, onRole, isDemoMode, onDemoMode,
}: {
  role: UserRole; onRole: (r: UserRole) => void;
  isDemoMode: boolean; onDemoMode: (v: boolean) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Ionicons name="options" size={48} color={colors.medtronicBlue} style={{ marginBottom: 16 }} />
      <Text style={styles.stepTitle}>Preferences</Text>
      <Text style={styles.stepSubtitle}>Personalise your experience. You can change these in Settings at any time.</Text>

      {/* Role picker */}
      <Text style={styles.prefSectionLabel}>View Mode</Text>
      <View style={styles.roleRow}>
        {(['patient', 'physician'] as UserRole[]).map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.roleCard, role === r && styles.roleCardSelected]}
            onPress={() => onRole(r)}
          >
            <Ionicons
              name={r === 'patient' ? 'person' : 'medkit'}
              size={28}
              color={role === r ? colors.medtronicBlue : colors.tertiaryText}
            />
            <Text style={[styles.roleTitle, role === r && { color: colors.medtronicBlue }]}>
              {r === 'patient' ? 'Patient' : 'Physician'}
            </Text>
            <Text style={styles.roleDesc}>
              {r === 'patient'
                ? 'Friendly summaries and easy logging'
                : 'Detailed clinical-style data view'}
            </Text>
            {role === r && <Ionicons name="checkmark-circle" size={20} color={colors.medtronicBlue} style={styles.roleCheck} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Demo mode */}
      <Text style={[styles.prefSectionLabel, { marginTop: 24 }]}>Data Mode</Text>
      <View style={styles.demoModeCard}>
        <Ionicons name="flask-outline" size={26} color={isDemoMode ? colors.medtronicBlue : colors.tertiaryText} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.demoModeTitle, isDemoMode && { color: colors.medtronicBlue }]}>Demo Mode</Text>
          <Text style={styles.demoModeDesc}>Load 14 days of sample data to explore all features immediately.</Text>
        </View>
        <Switch
          value={isDemoMode}
          onValueChange={onDemoMode}
          trackColor={{ false: colors.fillTertiary, true: colors.medtronicBlue }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.background },

  progressRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 16, paddingBottom: 4 },
  progressStep: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot:  { width: 12, height: 12, borderRadius: 6 },
  progressDotActive:   { backgroundColor: colors.medtronicBlue },
  progressDotInactive: { backgroundColor: colors.separator },
  progressLine:        { flex: 1, height: 2, marginHorizontal: 2 },
  progressLineActive:  { backgroundColor: colors.medtronicBlue },
  progressLineInactive: { backgroundColor: colors.separator },
  progressLabel: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.medtronicBlue, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },

  content:       { flexGrow: 1, padding: 24 },
  stepContainer: { alignItems: 'center' },

  iconCircle:   { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.fillPrimary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepTitle:    { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: colors.secondaryText, textAlign: 'center', marginBottom: 24, lineHeight: 22 },

  featureList:  { width: '100%', gap: 14, marginBottom: 24 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  featureText:  { fontSize: 15, color: colors.secondaryText },

  disclaimer:     { backgroundColor: colors.fillPrimary, borderRadius: 12, padding: 14, width: '100%' },
  disclaimerText: { fontSize: 12, color: colors.tertiaryText, textAlign: 'center', lineHeight: 18 },

  consentBox:    { backgroundColor: colors.card, borderRadius: 16, padding: 16, width: '100%', gap: 12, marginBottom: 20 },
  consentPoint:  { flexDirection: 'row', gap: 10 },
  consentText:   { flex: 1, fontSize: 13, color: colors.secondaryText, lineHeight: 19 },
  consentToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 12, backgroundColor: colors.card, borderRadius: 12 },
  checkbox:        { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.separator, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.medtronicBlue, borderColor: colors.medtronicBlue },
  consentToggleText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },

  form:  { width: '100%', gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.secondaryText, marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.separatorOpaque },

  connectedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.alertGreen + '18', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  connectedBadgeText: { fontSize: 13, fontWeight: '600', color: colors.alertGreen },

  serviceList:       { width: '100%', gap: 10 },
  serviceCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: 'transparent' },
  serviceIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceLabel:      { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  serviceCheckbox:   { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.separator, alignItems: 'center', justifyContent: 'center' },

  linkageNote:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 16, paddingHorizontal: 4 },
  linkageNoteText: { flex: 1, fontSize: 12, color: colors.tertiaryText, lineHeight: 17 },

  prefSectionLabel: { fontSize: 12, fontWeight: '700', color: colors.tertiaryText, textTransform: 'uppercase', letterSpacing: 0.6, alignSelf: 'flex-start', marginBottom: 10 },

  roleRow:       { flexDirection: 'row', gap: 12, width: '100%' },
  roleCard:      { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 2, borderColor: 'transparent' },
  roleCardSelected: { borderColor: colors.medtronicBlue, backgroundColor: colors.fillPrimary },
  roleTitle:     { fontSize: 15, fontWeight: '700', color: colors.text },
  roleDesc:      { fontSize: 11, color: colors.tertiaryText, textAlign: 'center', lineHeight: 15 },
  roleCheck:     { position: 'absolute', top: 10, right: 10 },

  demoModeCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  demoModeTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  demoModeDesc:  { fontSize: 12, color: colors.secondaryText, lineHeight: 17 },

  footer:  { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 12 },
  backText: { fontSize: 16, color: colors.medtronicBlue },
  nextBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.medtronicBlue, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  nextBtnDisabled: { backgroundColor: colors.separator },
  nextText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
