import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, firestore, storage } from '../../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  updateProfile,
  updateEmail,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    avatar: '👤',
    avatarUrl: '',
  });
  const [settings, setSettings] = useState({
    locationTracking: true,
    emergencyAlerts: true,
    communityAlerts: true,
    biometricAuth: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(userProfile);
  const [passwordMode, setPasswordMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [deleteForm, setDeleteForm] = useState({ password: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const u = auth.currentUser;
        if (!u) {
          setLoading(false);
          return;
        }
        const ref = doc(firestore, 'users', u.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        const displayName = data.displayName || u.displayName || [firstName, lastName].filter(Boolean).join(' ') || '';
        const phone = data.profileData?.phoneNumber || data.phone || '';
        const avatarUrl = data.profileData?.avatarUrl || data.avatarUrl || '';
        const prefs = data.preferences || {};
        const profile = {
          firstName,
          lastName,
          name: displayName,
          email: u.email || '',
          phone,
          avatar: '👤',
          avatarUrl,
        };
        setUserProfile(profile);
        setEditData(profile);
        setSettings({
          locationTracking: prefs.notifications ?? true, // fallback mapping
          emergencyAlerts: prefs.notifications ?? true,
          communityAlerts: prefs.emailUpdates ?? true,
          biometricAuth: prefs.biometricAuth ?? false,
        });
      } catch (e) {
        console.warn('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSetting = async (key) => {
    try {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
      const u = auth.currentUser;
      if (!u) return;
      const ref = doc(firestore, 'users', u.uid);
      await setDoc(
        ref,
        { preferences: { [key]: !settings[key] } },
        { merge: true }
      );
    } catch (e) {
      console.warn('Failed to save setting', key, e);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const u = auth.currentUser;
      if (!u) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }
      const firstName = editData.firstName?.trim() || '';
      const lastName = editData.lastName?.trim() || '';
      const name = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (editData.name?.trim() || '');
      const phone = editData.phone?.trim() || '';
      const email = editData.email?.trim() || '';

      // Basic validations
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        setLoading(false);
        Alert.alert('Invalid email', 'Please enter a valid email address.');
        return;
      }
      if (phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 7) {
          setLoading(false);
          Alert.alert('Invalid phone', 'Please enter a valid phone number.');
          return;
        }
      }

      // Persist to Firestore
      const ref = doc(firestore, 'users', u.uid);
      await setDoc(
        ref,
        {
          displayName: name,
          firstName: firstName || null,
          lastName: lastName || null,
          profileData: { phoneNumber: phone },
        },
        { merge: true }
      );

      // Update Auth profile display name
      if (name && name !== (u.displayName || '')) {
        await updateProfile(u, { displayName: name });
      }

      // Try to update auth email if changed
      if (email && email !== (u.email || '')) {
        try {
          await updateEmail(u, email);
        } catch (err) {
          // Most likely requires recent login
          Alert.alert(
            'Email not updated',
            'To change your email, please re-authenticate in the login screen and try again.'
          );
        }
      }

      setUserProfile({ ...userProfile, ...editData, name });
      Alert.alert('Profile Updated', 'Your profile changes have been saved.');
      setEditMode(false);
    } catch (e) {
      console.error('Save profile failed:', e);
      Alert.alert('Error', 'Could not save your profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadAvatar = async () => {
    try {
      const u = auth.currentUser;
      if (!u) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // MediaTypeOptions deprecated; use MediaType array
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      setLoading(true);
      // Resize/compress before upload
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();

      const objectRef = ref(storage, `avatars/${u.uid}.jpg`);
      await uploadBytes(objectRef, blob, { contentType: blob.type || 'image/jpeg' });
      const url = await getDownloadURL(objectRef);

      // Save URL in Firestore
      const userRef = doc(firestore, 'users', u.uid);
      await setDoc(
        userRef,
        { profileData: { avatarUrl: url } },
        { merge: true }
      );

      setUserProfile((prev) => ({ ...prev, avatarUrl: url }));
      Alert.alert('Updated', 'Your profile photo has been updated.');
    } catch (e) {
      console.error('Avatar upload failed:', e);
      const code = e?.code || 'unknown';
      const msg = e?.message || '';
      let human = 'Could not update your photo. Please try again.';
      if (code === 'storage/unauthorized') human = 'Upload not authorized. Check Firebase Storage rules.';
      if (code === 'storage/object-not-found') human = 'Storage path not found.';
      if (code === 'storage/bucket-not-found') human = 'Storage bucket is misconfigured. Verify FIREBASE_STORAGE_BUCKET in your .env and app.config.js.';
      if (code === 'storage/quota-exceeded') human = 'Storage quota exceeded on your Firebase project.';
      Alert.alert('Upload failed', human + (msg ? `\n\nDetails: ${msg}` : ''));
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async () => {
    try {
      const { current, next, confirm } = passwordForm;
      if (!current || !next) {
        Alert.alert('Missing info', 'Please fill in all fields.');
        return;
      }
      if (next.length < 6) {
        Alert.alert('Weak password', 'Password must be at least 6 characters.');
        return;
      }
      if (next !== confirm) {
        Alert.alert('Mismatch', 'New passwords do not match.');
        return;
      }
      const u = auth.currentUser;
      if (!u || !u.email) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }
      setLoading(true);
      const cred = EmailAuthProvider.credential(u.email, current);
      await reauthenticateWithCredential(u, cred);
      await updatePassword(u, next);
      setPasswordMode(false);
      setPasswordForm({ current: '', next: '', confirm: '' });
      Alert.alert('Password changed', 'Your password has been updated.');
    } catch (e) {
      console.error('Change password failed:', e);
      Alert.alert('Failed', 'Could not change password. Check your current password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDeleteAccount = async () => {
    try {
      const u = auth.currentUser;
      if (!u || !u.email) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }
      if (!deleteForm.password) {
        Alert.alert('Password required', 'Please enter your password to confirm.');
        return;
      }
      setLoading(true);
      // Re-authenticate
      const cred = EmailAuthProvider.credential(u.email, deleteForm.password);
      await reauthenticateWithCredential(u, cred);

      // Best-effort cleanup: avatar and Firestore
      try {
        const objectRef = ref(storage, `avatars/${u.uid}.jpg`);
        await deleteObject(objectRef);
      } catch {}
      try {
        await deleteDoc(doc(firestore, 'users', u.uid));
      } catch {}

      await deleteUser(u);
      setDeleteMode(false);
      setDeleteForm({ password: '' });
    } catch (e) {
      console.error('Delete account failed:', e);
      Alert.alert('Failed', 'Could not delete account. Check your password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      Alert.alert('Sign out failed', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="person" size={24} color="#00D9FF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Account and settings</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingRow}>
            <Text style={styles.headerSubtitle}>Loading your profile…</Text>
          </View>
        )}
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {userProfile.avatarUrl ? (
              <Image
                source={{ uri: userProfile.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarEmoji}>{userProfile.avatar}</Text>
            )}
            <TouchableOpacity style={styles.cameraBadge} onPress={pickAndUploadAvatar}>
              <MaterialIcons name="photo-camera" size={16} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name || '—'}</Text>
            <Text style={styles.profileDetail}>{userProfile.email || '—'}</Text>
            <Text style={styles.profileDetail}>{userProfile.phone || '—'}</Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <MaterialIcons name="edit" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Membership Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>
          
          <View style={styles.membershipCard}>
            <View style={styles.membershipHeader}>
              <AntDesign name="star" size={24} color="#FFB800" />
              <View style={styles.membershipContent}>
                <Text style={styles.membershipStatus}>Premium Member</Text>
                <Text style={styles.membershipDate}>Member since Jan 2024</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>View Benefits</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="lock" size={20} color="#00D9FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Location Tracking</Text>
                <Text style={styles.settingDesc}>Allow app to track your location</Text>
              </View>
            </View>
            <Switch
              value={settings.locationTracking}
              onValueChange={() => toggleSetting('locationTracking')}
              trackColor={{ false: '#444', true: '#00D9FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="notifications-active" size={20} color="#00D9FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Emergency Alerts</Text>
                <Text style={styles.settingDesc}>Receive urgent safety alerts</Text>
              </View>
            </View>
            <Switch
              value={settings.emergencyAlerts}
              onValueChange={() => toggleSetting('emergencyAlerts')}
              trackColor={{ false: '#444', true: '#00D9FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="groups" size={20} color="#00D9FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Community Alerts</Text>
                <Text style={styles.settingDesc}>Share safety insights with community</Text>
              </View>
            </View>
            <Switch
              value={settings.communityAlerts}
              onValueChange={() => toggleSetting('communityAlerts')}
              trackColor={{ false: '#444', true: '#00D9FF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="fingerprint" size={20} color="#00D9FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Biometric Auth</Text>
                <Text style={styles.settingDesc}>Use fingerprint or face to unlock</Text>
              </View>
            </View>
            <Switch
              value={settings.biometricAuth}
              onValueChange={() => toggleSetting('biometricAuth')}
              trackColor={{ false: '#444', true: '#00D9FF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setPasswordMode(true)}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="vpn-key" size={20} color="#00D9FF" />
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>Change Password</Text>
                <Text style={styles.optionDesc}>Update your password</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => Alert.alert('Download Data', 'Your data export is ready')}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="download" size={20} color="#00D9FF" />
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>Download My Data</Text>
                <Text style={styles.optionDesc}>Export your account data</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => Alert.alert('Privacy Policy', 'View full privacy details')}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="policy" size={20} color="#00D9FF" />
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>Privacy Policy</Text>
                <Text style={styles.optionDesc}>Read our privacy terms</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleSignOut}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="logout" size={20} color="#FF6B6B" />
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>Sign Out</Text>
                <Text style={styles.optionDesc}>Sign out of your account</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => Alert.alert('Help Center', 'Contact support team')}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="help" size={20} color="#FFB800" />
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>Help Center</Text>
                <Text style={styles.optionDesc}>Browse FAQs and guides</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => Alert.alert('Contact Support', 'support@gogaurdians.com')}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="email" size={20} color="#FFB800" />
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>Contact Support</Text>
                <Text style={styles.optionDesc}>Reach our support team</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0AFBB" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => setDeleteMode(true)}
          >
            <MaterialIcons name="delete-forever" size={20} color="#FF6B6B" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editMode}
        transparent
        animationType="fade"
        onRequestClose={() => setEditMode(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }] }>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter first name"
                    placeholderTextColor="#999"
                    value={editData.firstName}
                    onChangeText={(text) => setEditData({ ...editData, firstName: text })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }] }>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter last name"
                    placeholderTextColor="#999"
                    value={editData.lastName}
                    onChangeText={(text) => setEditData({ ...editData, lastName: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={editData.email}
                  onChangeText={(text) => setEditData({ ...editData, email: text })}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={editData.phone}
                  onChangeText={(text) => setEditData({ ...editData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditMode(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordMode}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordMode(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordMode(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={passwordForm.current}
                  onChangeText={(t) => setPasswordForm({ ...passwordForm, current: t })}
                  placeholder="Enter current password"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={passwordForm.next}
                  onChangeText={(t) => setPasswordForm({ ...passwordForm, next: t })}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={passwordForm.confirm}
                  onChangeText={(t) => setPasswordForm({ ...passwordForm, confirm: t })}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPasswordMode(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={onChangePassword}>
                <Text style={styles.saveButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteMode}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteMode(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <TouchableOpacity onPress={() => setDeleteMode(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={{ color: '#0F1419', marginBottom: 12 }}>
                This will permanently delete your account, profile, and settings. This action cannot be undone.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm with Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={deleteForm.password}
                  onChangeText={(t) => setDeleteForm({ password: t })}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteMode(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#FF6B6B' }]} onPress={onDeleteAccount}>
                <Text style={[styles.saveButtonText, { color: '#000' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingRow: {
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
    gap: 12,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)'
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileDetail: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  membershipCard: {
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  membershipContent: {
    flex: 1,
  },
  membershipStatus: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  membershipDate: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 2,
  },
  upgradeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFB800',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingDesc: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 217, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.1)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionDesc: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1419',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1419',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F1419',
    backgroundColor: '#F9FAFB',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F1419',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
});

export default ProfileScreen;
