import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Linking,
  Share,
  Switch,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationSharingService from '../LocationSharing/LocationSharing';

const EnhancedFamilyScreen = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [familyLocations, setFamilyLocations] = useState(new Map());
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ 
    name: '', 
    phone: '', 
    relation: '',
    isLocationShared: false 
  });
  const [refreshing, setRefreshing] = useState(false);

  // Initialize location service and load data
  useEffect(() => {
    initializeLocationService();
    loadFamilyMembers();
    
    // Set up location listeners
    const removeLocationListener = LocationSharingService.addLocationListener(handleLocationUpdate);
    const removeShareListener = LocationSharingService.addShareStatusListener(handleShareStatusUpdate);
    
    return () => {
      removeLocationListener();
      removeShareListener();
    };
  }, []);

  // Refresh family locations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFamilyLocations();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const initializeLocationService = async () => {
    try {
      const initialized = await LocationSharingService.initialize();
      if (initialized) {
        console.log('Location sharing service initialized');
      }
    } catch (error) {
      console.error('Failed to initialize location service:', error);
      Alert.alert('Error', 'Failed to initialize location services');
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const members = LocationSharingService.getFamilyMembers();
      setFamilyMembers(members);
      setIsLocationSharing(LocationSharingService.getSharingStatus());
      await refreshFamilyLocations();
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  };

  const refreshFamilyLocations = async () => {
    try {
      const locations = await LocationSharingService.getFamilyMembersLocations();
      setFamilyLocations(locations);
    } catch (error) {
      console.error('Failed to refresh family locations:', error);
    }
  };

  const handleLocationUpdate = (location) => {
    setCurrentLocation(location);
  };

  const handleShareStatusUpdate = (sharing) => {
    setIsLocationSharing(sharing);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFamilyMembers();
    await refreshFamilyLocations();
    setRefreshing(false);
  }, []);

  const toggleLocationSharing = async () => {
    try {
      if (isLocationSharing) {
        await LocationSharingService.stopLocationSharing();
        Alert.alert('Location Sharing Stopped', 'You are no longer sharing your location with family members.');
      } else {
        const success = await LocationSharingService.startLocationSharing();
        if (success) {
          Alert.alert('Location Sharing Started', 'Your location is now being shared with family members.');
        } else {
          Alert.alert('Error', 'Failed to start location sharing. Please check your permissions.');
        }
      }
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      Alert.alert('Error', 'Failed to toggle location sharing');
    }
  };

  const addContact = async () => {
    if (newContact.name && newContact.phone) {
      try {
        const member = await LocationSharingService.addFamilyMember({
          ...newContact,
          avatar: '👤',
        });
        
        await loadFamilyMembers();
        setNewContact({ name: '', phone: '', relation: '', isLocationShared: false });
        setShowAddModal(false);
        Alert.alert('Success', 'Contact added successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to add contact');
      }
    } else {
      Alert.alert('Error', 'Please fill in at least name and phone number');
    }
  };

  const deleteContact = async (memberId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await LocationSharingService.removeFamilyMember(memberId);
            if (success) {
              await loadFamilyMembers();
              Alert.alert('Success', 'Contact removed successfully');
            } else {
              Alert.alert('Error', 'Failed to remove contact');
            }
          }
        }
      ]
    );
  };

  const toggleMemberLocationSharing = async (memberId, enabled) => {
    try {
      const success = await LocationSharingService.toggleMemberLocationSharing(memberId, enabled);
      if (success) {
        await loadFamilyMembers();
      }
    } catch (error) {
      console.error('Error toggling member location sharing:', error);
      Alert.alert('Error', 'Failed to update location sharing settings');
    }
  };

  const viewMemberLocation = (member) => {
    const memberData = familyLocations.get(member.id);
    if (memberData && memberData.location) {
      const { latitude, longitude } = memberData.location;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const appleMapsUrl = `https://maps.apple.com/?q=${latitude},${longitude}`;
      
      Alert.alert(
        `${member.name}'s Location`,
        `Last updated: ${new Date(memberData.lastLocationUpdate).toLocaleString()}\n\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View on Maps', 
            onPress: () => {
              Alert.alert(
                'Open in Maps',
                'Choose your preferred maps app:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Google Maps', onPress: () => Linking.openURL(googleMapsUrl) },
                  { text: 'Apple Maps', onPress: () => Linking.openURL(appleMapsUrl) },
                ]
              );
            }
          },
        ]
      );
    } else {
      Alert.alert('No Location', `${member.name} is not currently sharing their location or location data is not available.`);
    }
  };

  const sendEmergencyAlert = async () => {
    Alert.alert(
      'Emergency Alert',
      'Send an emergency alert with your current location to all family members?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            const success = await LocationSharingService.sendEmergencyAlert('emergency');
            if (success) {
              Alert.alert('Alert Sent', 'Emergency alert has been sent to all family members with your current location.');
            } else {
              Alert.alert('Error', 'Failed to send emergency alert');
            }
          }
        }
      ]
    );
  };

  const callContact = async (phone) => {
    try {
      const phoneUrl = `tel:${phone}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to make phone call');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewContact({ name: '', phone: '', relation: '', isLocationShared: false });
    Keyboard.dismiss();
  };

  const getLocationStatus = (member) => {
    const memberData = familyLocations.get(member.id);
    if (!memberData || !memberData.isLocationShared) {
      return 'Location sharing disabled';
    }
    
    if (!memberData.location) {
      return 'Location not available';
    }
    
    const lastUpdate = new Date(memberData.lastLocationUpdate);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastUpdate) / 60000);
    
    if (diffMinutes < 1) {
      return 'Live';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    }
  };

  const getLocationStatusColor = (member) => {
    const memberData = familyLocations.get(member.id);
    if (!memberData || !memberData.isLocationShared || !memberData.location) {
      return '#F59E0B';
    }
    
    const lastUpdate = new Date(memberData.lastLocationUpdate);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastUpdate) / 60000);
    
    if (diffMinutes < 5) {
      return '#22C55E'; // Green for recent
    } else if (diffMinutes < 30) {
      return '#F59E0B'; // Yellow for somewhat old
    } else {
      return '#EF4444'; // Red for old
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <AntDesign name="contacts" size={24} color="#00D9FF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Family Location Center</Text>
            <Text style={styles.headerSubtitle}>{familyMembers.length} members</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Location Sharing Control */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Location Sharing</Text>
            <Switch
              value={isLocationSharing}
              onValueChange={toggleLocationSharing}
              trackColor={{ false: '#374151', true: '#00D9FF' }}
              thumbColor={isLocationSharing ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.locationCard}>
            <MaterialIcons name="my-location" size={24} color="#00D9FF" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Live Location Sharing</Text>
              <Text style={styles.locationText}>
                {isLocationSharing 
                  ? currentLocation 
                    ? `Active: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                    : 'Getting location...'
                  : 'Location sharing is disabled'
                }
              </Text>
            </View>
            <TouchableOpacity
              onPress={sendEmergencyAlert}
              style={styles.emergencyButton}
            >
              <MaterialIcons name="warning" size={20} color="#FFFFFF" />
              <Text style={styles.emergencyText}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="people" size={32} color="#00D9FF" />
            <Text style={styles.statNumber}>{familyMembers.length}</Text>
            <Text style={styles.statLabel}>Family Members</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="location-on" size={32} color={isLocationSharing ? "#22C55E" : "#F59E0B"} />
            <Text style={styles.statNumber}>{isLocationSharing ? "Active" : "Off"}</Text>
            <Text style={styles.statLabel}>Your Location</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="visibility" size={32} color="#00D9FF" />
            <Text style={styles.statNumber}>
              {familyMembers.filter(m => familyLocations.get(m.id)?.isLocationShared).length}
            </Text>
            <Text style={styles.statLabel}>Sharing Location</Text>
          </View>
        </View>

        {/* Family Members List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {familyMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="person-add" size={48} color="#A0AFBB" />
              <Text style={styles.emptyStateTitle}>No Family Members</Text>
              <Text style={styles.emptyStateText}>
                Add family members to start sharing locations and stay connected
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={styles.emptyStateButton}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Add First Member</Text>
              </TouchableOpacity>
            </View>
          ) : (
            familyMembers.map((member) => {
              const memberData = familyLocations.get(member.id);
              return (
                <View key={member.id} style={styles.contactCard}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.avatarEmoji}>{member.avatar}</Text>
                  </View>
                  
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{member.name}</Text>
                    {member.relation && (
                      <Text style={styles.contactRelation}>{member.relation}</Text>
                    )}
                    <Text style={styles.contactPhone}>{member.phone}</Text>
                    <View style={styles.locationStatus}>
                      <View 
                        style={[
                          styles.statusDot, 
                          { backgroundColor: getLocationStatusColor(member) }
                        ]} 
                      />
                      <Text style={styles.locationStatusText}>
                        {getLocationStatus(member)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      onPress={() => callContact(member.phone)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="phone" size={18} color="#00D9FF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => viewMemberLocation(member)}
                      style={[
                        styles.actionButton,
                        { opacity: memberData?.location ? 1 : 0.5 }
                      ]}
                      disabled={!memberData?.location}
                    >
                      <MaterialIcons name="location-on" size={18} color="#22C55E" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => toggleMemberLocationSharing(member.id, !memberData?.isLocationShared)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons 
                        name={memberData?.isLocationShared ? "visibility" : "visibility-off"} 
                        size={18} 
                        color={memberData?.isLocationShared ? "#22C55E" : "#F59E0B"} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => deleteContact(member.id)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="delete" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Family Member</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <MaterialIcons name="close" size={24} color="#0F1419" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter full name"
                      value={newContact.name}
                      onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter phone number"
                      value={newContact.phone}
                      onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Relationship</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Spouse, Child, Parent"
                      value={newContact.relation}
                      onChangeText={(text) => setNewContact({ ...newContact, relation: text })}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.switchContainer}>
                      <Text style={styles.inputLabel}>Enable Location Sharing</Text>
                      <Switch
                        value={newContact.isLocationShared}
                        onValueChange={(value) => setNewContact({ ...newContact, isLocationShared: value })}
                        trackColor={{ false: '#374151', true: '#00D9FF' }}
                        thumbColor={newContact.isLocationShared ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </View>
                    <Text style={styles.requiredNote}>
                      Allow this family member to see your location and share theirs with you
                    </Text>
                  </View>

                  <Text style={styles.requiredNote}>
                    * Required fields
                  </Text>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={addContact}
                    style={[
                      styles.confirmButton,
                      (!newContact.name || !newContact.phone) && styles.confirmButtonDisabled
                    ]}
                    disabled={!newContact.name || !newContact.phone}
                  >
                    <Text style={[
                      styles.confirmButtonText,
                      (!newContact.name || !newContact.phone) && styles.confirmButtonTextDisabled
                    ]}>
                      Add Member
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.15)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A0AFBB',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 4,
    textAlign: 'center',
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
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  locationStatusText: {
    fontSize: 11,
    color: '#A0AFBB',
    fontWeight: '500',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 6,
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationText: {
    fontSize: 12,
    color: '#A0AFBB',
    marginTop: 4,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#A0AFBB',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D9FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
    width: '100%',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requiredNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
    backgroundColor: '#FFFFFF',
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
  confirmButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  confirmButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default EnhancedFamilyScreen;