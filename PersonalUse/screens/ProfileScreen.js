import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

const ProfileScreen = () => {
  const [userProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: '👤',
  });

  const [settings, setSettings] = useState({
    locationTracking: true,
    emergencyAlerts: true,
    communityAlerts: true,
    biometricAuth: false,
  });

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(userProfile);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveProfile = () => {
    Alert.alert('Profile Updated', 'Your profile changes have been saved.');
    setEditMode(false);
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
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{userProfile.avatar}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileDetail}>{userProfile.email}</Text>
            <Text style={styles.profileDetail}>{userProfile.phone}</Text>
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
            onPress={() => Alert.alert('Change Password', 'Password change functionality')}
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
            onPress={() =>
              Alert.alert(
                'Delete Account',
                'Are you sure? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive' },
                ]
              )
            }
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
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                />
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
  },
  avatarEmoji: {
    fontSize: 36,
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
