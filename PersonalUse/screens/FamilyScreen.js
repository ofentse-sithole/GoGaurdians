import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';

const FamilyScreen = () => {
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Sarah Johnson', phone: '+1 (555) 123-4567', relation: 'Sister', avatar: '👩' },
    { id: 2, name: 'Mom', phone: '+1 (555) 234-5678', relation: 'Mother', avatar: '👵' },
    { id: 3, name: 'David Smith', phone: '+1 (555) 345-6789', relation: 'Brother', avatar: '👨' },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      setEmergencyContacts([
        ...emergencyContacts,
        {
          id: emergencyContacts.length + 1,
          ...newContact,
          avatar: '👤',
        },
      ]);
      setNewContact({ name: '', phone: '', relation: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'Contact added successfully');
    }
  };

  const deleteContact = (id) => {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
  };

  const callContact = (phone) => {
    Alert.alert('Call', `Calling ${phone}...`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <AntDesign name="contacts" size={24} color="#00D9FF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Family & Contacts</Text>
            <Text style={styles.headerSubtitle}>{emergencyContacts.length} contacts</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="people" size={32} color="#00D9FF" />
            <Text style={styles.statNumber}>{emergencyContacts.length}</Text>
            <Text style={styles.statLabel}>Trusted Contacts</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="notifications-active" size={32} color="#00D9FF" />
            <Text style={styles.statNumber}>Auto</Text>
            <Text style={styles.statLabel}>Alert on Emergency</Text>
          </View>
        </View>

        {/* Contacts List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.avatarEmoji}>{contact.avatar}</Text>
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relation}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => callContact(contact.phone)}
                >
                  <MaterialIcons name="phone" size={20} color="#00D9FF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteContact(contact.id)}
                >
                  <MaterialIcons name="close" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Add Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.infoCard}>
            <MaterialIcons name="notifications" size={24} color="#00D9FF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Instant Alerts</Text>
              <Text style={styles.infoText}>Your emergency contacts receive immediate alerts with your location</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="location-on" size={24} color="#00D9FF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Share Location</Text>
              <Text style={styles.infoText}>Real-time location sharing during emergency situations</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="security" size={24} color="#00D9FF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Privacy First</Text>
              <Text style={styles.infoText}>Your data is encrypted and secure. Contacts only shared during emergencies</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  placeholderTextColor="#999"
                  value={newContact.name}
                  onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={newContact.phone}
                  onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Sister, Mom, Friend"
                  placeholderTextColor="#999"
                  value={newContact.relation}
                  onChangeText={(text) => setNewContact({ ...newContact, relation: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={addContact}
              >
                <Text style={styles.confirmButtonText}>Add Contact</Text>
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00D9FF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#A0AFBB',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  contactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactRelation: {
    fontSize: 12,
    color: '#00D9FF',
    marginTop: 2,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 4,
    lineHeight: 18,
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
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
});

export default FamilyScreen;
