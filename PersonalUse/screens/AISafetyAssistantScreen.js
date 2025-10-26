import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Linking, Share, Alert, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assessThreatLevel, getGuidance } from '../Services/AISafetyService';
import * as Location from 'expo-location';
import { auth } from '../../firebaseConfig';

const threatSchema = z.object({
  surroundings: z.string().min(10, 'Please describe your surroundings in more detail.'),
  userInformation: z.string().optional(),
});

const guidanceSchema = z.object({
  situation: z.string().min(10, 'Please describe your situation in more detail.'),
});

export default function AISafetyAssistantScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('threat'); // 'threat' | 'guidance'
  const [threatResult, setThreatResult] = useState(null);
  const [guidanceResult, setGuidanceResult] = useState(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isGuiding, setIsGuiding] = useState(false);
  const [sendingSOS, setSendingSOS] = useState(false);
  const lastAssessAt = useRef(0);
  const lastGuideAt = useRef(0);

  const threatForm = useForm({
    resolver: zodResolver(threatSchema),
    defaultValues: { surroundings: '', userInformation: '' },
    mode: 'onSubmit',
  });

  const guidanceForm = useForm({
    resolver: zodResolver(guidanceSchema),
    defaultValues: { situation: '' },
    mode: 'onSubmit',
  });

  const onAssess = async (values) => {
    // Simple client-side cooldown to respect free-tier RPM
    const now = Date.now();
    if (now - lastAssessAt.current < 10000) {
      const remaining = Math.ceil((10000 - (now - lastAssessAt.current)) / 1000);
      Alert.alert('Please wait', `Try again in about ${remaining}s to avoid rate limits.`);
      return;
    }
    lastAssessAt.current = now;
    setIsAssessing(true);
    setThreatResult(null);
    try {
      const result = await assessThreatLevel(values);
      setThreatResult(result);
      // Auto-escalation logic based on threat level
      const level = String(result?.threatLevel || '').toUpperCase();
      if (level === 'HIGH') {
        try {
          // Show a prominent warning, then auto-open dialer and share location
          Alert.alert(
            'High threat detected',
            'We will open the emergency dialer (112) and a share-location sheet so responders or contacts can find you.',
            [{ text: 'OK' }],
            { cancelable: true }
          );
          // Small delays to avoid UI race conditions between alert, dialer and share sheet
          setTimeout(() => {
            dialEmergency();
          }, 400);
          setTimeout(() => {
            shareLocation();
          }, 1800);
        } catch (err) {
          console.warn('Auto-escalation error', err);
        }
      } else if (level === 'MEDIUM') {
        // Soft prompt suggesting a call, no automatic actions
        Alert.alert(
          'Consider calling for help',
          'If you feel unsafe, consider calling 112 (mobile), 10111 (SAPS), or 10177 (ambulance/fire).'
        );
      }
    } catch (e) {
      console.error('Assess error', e);
      const msg = String(e?.message || '');
      if (e?.code === 'AI_UNAVAILABLE' || msg.startsWith('AI_UNAVAILABLE')) {
        Alert.alert(
          'AI unavailable',
          'Gemini is not configured. Add GEMINI_API_KEY to your .env and rebuild the app.'
        );
      } else if (e?.code === 'AI_RATE_LIMIT') {
        Alert.alert('Rate limit', 'You’ve reached the free tier limit for now. Please wait a minute and try again.');
      } else {
        Alert.alert('Unable to assess', 'There was a problem getting an AI assessment. Please try again.');
      }
    } finally {
      setIsAssessing(false);
    }
  };

  const onGuide = async (values) => {
    const now = Date.now();
    if (now - lastGuideAt.current < 10000) {
      const remaining = Math.ceil((10000 - (now - lastGuideAt.current)) / 1000);
      Alert.alert('Please wait', `Try again in about ${remaining}s to avoid rate limits.`);
      return;
    }
    lastGuideAt.current = now;
    setIsGuiding(true);
    setGuidanceResult(null);
    try {
      const result = await getGuidance(values);
      setGuidanceResult(result);
    } catch (e) {
      console.error('Guidance error', e);
      const msg = String(e?.message || '');
      if (e?.code === 'AI_UNAVAILABLE' || msg.startsWith('AI_UNAVAILABLE')) {
        Alert.alert(
          'AI unavailable',
          'Gemini is not configured. Add GEMINI_API_KEY to your .env and rebuild the app.'
        );
      } else if (e?.code === 'AI_RATE_LIMIT') {
        Alert.alert('Rate limit', 'You’ve reached the free tier limit for now. Please wait a minute and try again.');
      } else {
        Alert.alert('Unable to get guidance', 'There was a problem getting AI guidance. Please try again.');
      }
    } finally {
      setIsGuiding(false);
    }
  };

  // Quick preset chips (reduce typing during emergencies)
  const threatPresets = useMemo(
    () => [
      "I think someone is following me.",
      "There's a suspicious person near my car.",
      "I hear loud yelling and fighting nearby.",
      "I'm alone and feel unsafe walking home.",
    ],
    []
  );

  const guidancePresets = useMemo(
    () => [
      "There's a fire in my building.",
      "Someone is unconscious and not breathing.",
      "Car accident with injuries.",
      "I suspect a home intruder.",
    ],
    []
  );

  // Emergency actions
  const dialEmergency = async () => {
    // Try 112 (international), fallback 911
    const numbers = ['112', '911'];
    for (const num of numbers) {
      const url = `tel:${num}`;
      const can = await Linking.canOpenURL(url);
      if (can) {
        Linking.openURL(url);
        return;
      }
    }
    Alert.alert('Cannot place call', 'Phone dialing is unavailable on this device.');
  };

  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to share your location.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const mapsLink = Platform.select({
        ios: `http://maps.apple.com/?ll=${coords.latitude},${coords.longitude}`,
        default: `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`,
      });
      const message = `My current location: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}\n${mapsLink}`;
      await Share.share({ message });
    } catch (e) {
      console.error('Share location error', e);
      Alert.alert('Error', 'Unable to get your location right now.');
    }
  };

  const sendSOS = async () => {
    try {
      setSendingSOS(true);
      const userId = auth?.currentUser?.uid || 'anonymous';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to send an alert.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { sendEmergencyAlert } = await import('../Services/APIService');
      const res = await sendEmergencyAlert(userId, 'Emergency', coords);
      if (res?.success) {
        Alert.alert('SOS sent', 'Emergency responders have been notified. Stay safe.');
      } else {
        Alert.alert('SOS failed', 'Could not send your alert. Try calling emergency services.');
      }
    } catch (e) {
      console.error('sendSOS error', e);
      Alert.alert('SOS failed', 'An unexpected error occurred.');
    } finally {
      setSendingSOS(false);
    }
  };

  const ThreatIcon = ({ level }) => {
    const map = {
      LOW: { name: 'shield-check', color: '#16A34A' },
      MEDIUM: { name: 'shield-alert', color: '#F59E0B' },
      HIGH: { name: 'shield-off', color: '#DC2626' },
    };
    const icon = map[level] || map.LOW;
    return <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} />;
  };

  const ThreatBadge = ({ level }) => {
    const stylesMap = {
      LOW: { backgroundColor: '#16A34A' },
      MEDIUM: { backgroundColor: '#F59E0B' },
      HIGH: { backgroundColor: '#DC2626' },
    };
    return (
      <View style={[styles.badge, stylesMap[level] || stylesMap.LOW]}>
        <Text style={styles.badgeText}>{level}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation?.goBack?.()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name={Platform.OS === 'ios' ? 'arrow-back-ios' : 'arrow-back'} size={22} color="#0F172A" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="robot-outline" size={28} color="#007AFF" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.title}>AI Safety Assistant</Text>
          <Text style={styles.subtitle}>Fast help, clear steps</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabTrigger, activeTab === 'threat' && styles.tabActive]}
          onPress={() => setActiveTab('threat')}
        >
          <Text style={[styles.tabLabel, activeTab === 'threat' && styles.tabLabelActive]}>Threat Assessment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabTrigger, activeTab === 'guidance' && styles.tabActive]}
          onPress={() => setActiveTab('guidance')}
        >
          <Text style={[styles.tabLabel, activeTab === 'guidance' && styles.tabLabelActive]}>Get Guidance</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'threat' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assess Your Situation</Text>
            <Text style={styles.cardDesc}>Minimal typing needed. Pick a preset or describe briefly.</Text>

            <View style={{ marginTop: 14 }}>
              <Controller
                control={threatForm.control}
                name="surroundings"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>Current Surroundings</Text>
                    <TextInput
                      style={[styles.textarea, fieldState.error && styles.inputError]}
                      placeholder="e.g., I'm on a dark street, I hear shouting..."
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                    />
                    {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                      {threatPresets.map((p, idx) => (
                        <TouchableOpacity key={idx} style={styles.chip} onPress={() => threatForm.setValue('surroundings', p)}>
                          <Text style={styles.chipText}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              />

              <Controller
                control={threatForm.control}
                name="userInformation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>Additional Information (Optional)</Text>
                    <TextInput
                      style={styles.textarea}
                      placeholder="e.g., I am alone, my car broke down."
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                    />
                  </View>
                )}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={threatForm.handleSubmit(onAssess)} disabled={isAssessing}>
                {isAssessing && <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />}
                <Text style={styles.primaryButtonText}>Assess Threat</Text>
              </TouchableOpacity>
            </View>

            {(isAssessing || threatResult) && (
              <View style={[styles.card, { marginTop: 16 }]}> 
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  {threatResult && <ThreatIcon level={threatResult.threatLevel} />}
                  <Text style={[styles.cardTitle, { marginLeft: 8 }]}>Assessment</Text>
                  {threatResult?.source === 'gemini' && (
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
                {threatResult?.source === 'heuristic' && (
                  <View style={[styles.offlineBadge, { alignSelf: 'flex-start', marginTop: 2, marginBottom: 8 }]}>
                    <Text style={styles.offlineBadgeText}>Using heuristic (offline)</Text>
                  </View>
                )}
                {isAssessing && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#6B7280" />
                    <Text style={{ color: '#6B7280' }}>Analyzing...</Text>
                  </View>
                )}
                {threatResult && (
                  <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Text style={{ fontWeight: '600' }}>Threat Level:</Text>
                      <ThreatBadge level={threatResult.threatLevel} />
                    </View>
                    {String(threatResult.threatLevel).toUpperCase() === 'MEDIUM' && (
                      <View style={styles.calloutWarn}>
                        <Text style={styles.calloutWarnText}>
                          Suggestion: If you feel unsafe, consider calling 112 (mobile), 10111 (SAPS), or 10177 (ambulance/fire).
                        </Text>
                      </View>
                    )}
                    <Text style={{ fontWeight: '600', marginBottom: 6 }}>Advice:</Text>
                    <Text style={styles.mutedText}>{threatResult.advice}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'guidance' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Emergency Guidance</Text>
            <Text style={styles.cardDesc}>Pick a scenario or type a short description.</Text>

            <View style={{ marginTop: 14 }}>
              <Controller
                control={guidanceForm.control}
                name="situation"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>Describe your Emergency</Text>
                    <TextInput
                      style={[styles.textarea, fieldState.error && styles.inputError]}
                      placeholder={"e.g., There's a fire in my kitchen, someone is having a heart attack."}
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                    />
                    {fieldState.error && <Text style={styles.errorText}>{fieldState.error.message}</Text>}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                      {guidancePresets.map((p, idx) => (
                        <TouchableOpacity key={idx} style={styles.chip} onPress={() => guidanceForm.setValue('situation', p)}>
                          <Text style={styles.chipText}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={guidanceForm.handleSubmit(onGuide)} disabled={isGuiding}>
                {isGuiding && <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />}
                <Text style={styles.primaryButtonText}>Get Guidance</Text>
              </TouchableOpacity>
            </View>

            {(isGuiding || guidanceResult) && (
              <View style={[styles.card, { marginTop: 16 }]}> 
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="assistant" size={22} color="#007AFF" />
                  <Text style={[styles.cardTitle, { marginLeft: 8 }]}>AI Guidance</Text>
                </View>
                {isGuiding && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#6B7280" />
                    <Text style={{ color: '#6B7280' }}>Generating steps...</Text>
                  </View>
                )}
                {guidanceResult && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 6 }}>Follow these steps carefully:</Text>
                    <Text style={styles.mutedText}>{guidanceResult.guidance}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      {/* Sticky emergency action bar */}
      <View style={styles.emergencyBar}>
        <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#DC2626' }]} onPress={dialEmergency}>
          <MaterialIcons name="call" size={20} color="#fff" />
          <Text style={styles.emergencyBtnText}>Call Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#0EA5E9' }]} onPress={shareLocation}>
          <MaterialIcons name="my-location" size={20} color="#fff" />
          <Text style={styles.emergencyBtnText}>Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: '#F59E0B' }]} onPress={sendSOS} disabled={sendingSOS}>
          {sendingSOS ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="shield-alert" size={20} color="#fff" />
          )}
          <Text style={styles.emergencyBtnText}>{sendingSOS ? 'Sending…' : 'Send SOS'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 },
  backBtn: { marginRight: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(15, 23, 42, 0.05)' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B' },
  tabs: { flexDirection: 'row', padding: 8, gap: 8, marginHorizontal: 16, backgroundColor: '#E2E8F0', borderRadius: 12 },
  tabTrigger: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabLabel: { fontSize: 14, color: '#475569', fontWeight: '600' },
  tabLabelActive: { color: '#0F172A', fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  cardDesc: { fontSize: 13, color: '#64748B', marginTop: 4 },
  formItem: { marginBottom: 14 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  textarea: { minHeight: 100, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, textAlignVertical: 'top', color: '#0F172A', backgroundColor: '#FFFFFF' },
  inputError: { borderColor: '#DC2626' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6 },
  primaryButton: { marginTop: 8, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  mutedText: { color: '#334155', lineHeight: 20 },
  chip: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  chipText: { color: '#1E40AF', fontWeight: '700', fontSize: 12 },
  sourceBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  sourceBadgeText: { color: '#065F46', fontWeight: '800', fontSize: 10 },
  offlineBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  offlineBadgeText: { color: '#334155', fontWeight: '800', fontSize: 10 },
  emergencyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  emergencyBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  emergencyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  calloutWarn: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
  calloutWarnText: { color: '#92400E' },
});
