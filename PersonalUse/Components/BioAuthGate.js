import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth, firestore } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

const BioAuthGate = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  const runAuth = async () => {
    setError('');
    try {
      const u = auth.currentUser;
      if (!u) { setAllowed(true); setChecking(false); return; }

      // Read user preference
      const ref = doc(firestore, 'users', u.uid);
      const snap = await getDoc(ref);
      const prefs = snap.exists() ? (snap.data().preferences || {}) : {};
      const wantsBio = !!prefs.biometricAuth;

      if (!wantsBio) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      // Check device support
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setAllowed(true); // fallback: allow if not supported
        setChecking(false);
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setAllowed(true); // allow if user hasn't enrolled biometrics
        setChecking(false);
        return;
      }

      // Prompt user
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock GoGaurdians',
        fallbackLabel: Platform.OS === 'ios' ? 'Use Passcode' : 'Use Screen Lock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setAllowed(true);
      } else {
        setError(result.warning || 'Authentication failed');
        setAllowed(false);
      }
    } catch (e) {
      setError(e?.message || 'Authentication error');
      setAllowed(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await runAuth();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, []);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.hint}>Checking security…</Text>
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.lockScreen}>
        <View style={styles.lockCard}>
          <MaterialIcons name="lock" size={36} color="#00D9FF" />
          <Text style={styles.title}>Authentication Required</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.primaryBtn} onPress={runAuth}>
            <Text style={styles.primaryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAllowed(true)}>
            <Text style={styles.secondaryText}>Use app (skip)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0F1419',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: '#A0AFBB',
    marginTop: 12,
  },
  lockScreen: {
    flex: 1,
    backgroundColor: '#0F1419',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  error: {
    color: '#A0AFBB',
    textAlign: 'center',
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#00D9FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryText: {
    color: '#000',
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#A0AFBB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  secondaryText: {
    color: '#A0AFBB',
    fontWeight: '600',
  },
});

export default BioAuthGate;
