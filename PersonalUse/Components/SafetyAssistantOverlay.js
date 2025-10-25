import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Text,
  Animated,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SafetyAssistantOverlay = ({
  isEmergency,
  incidentType,
  userLocation,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('guidance');
  const slideAnim = React.useRef(new Animated.Value(500)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const safetyTips = {
    Crime: [
      '🚶 Move to a well-lit, populated area',
      '📱 Keep your phone accessible',
      '🔔 Make noise to attract attention',
      '🚗 If threatened, move towards police/security',
      '👥 Stay in groups when possible',
    ],
    Medical: [
      '🚨 Call emergency services immediately',
      '💊 If conscious, stay calm and breathe steadily',
      '🛑 Do not move if head/spine injury is suspected',
      '💉 Provide any relevant medical history',
      '🤝 Let responders know your location',
    ],
    Fire: [
      '🚪 Leave the building immediately',
      '🌫️ Stay low to avoid smoke',
      '🧯 Use fire extinguisher only if trained',
      '🔥 Do not use elevators',
      '🚨 Move to assembly point and call 911',
    ],
    GBV: [
      '🚨 Get to a safe location immediately',
      '👥 Alert someone you trust',
      '📸 Document evidence if safe to do so',
      '💬 Reach out to support services',
      '🤝 You are not alone - help is available',
    ],
  };

  const emergencyContacts = [
    { name: 'Police', number: '911', icon: 'shield' },
    { name: 'Medical', number: '911', icon: 'activity' },
    { name: 'Fire', number: '911', icon: 'alert-triangle' },
    { name: 'Support Hotline', number: '1-800-799-7233', icon: 'phone' },
  ];

  const nearbyResources = [
    { name: 'Police Station', distance: '0.5 km', icon: 'map-pin' },
    { name: 'Hospital', distance: '1.2 km', icon: 'map-pin' },
    { name: 'Fire Station', distance: '0.8 km', icon: 'map-pin' },
    { name: 'Safe Zone / Shelter', distance: '1.5 km', icon: 'map-pin' },
  ];

  const getTipsForIncident = () => {
    if (incidentType && safetyTips[incidentType]) {
      return safetyTips[incidentType];
    }
    return [];
  };

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <MaterialIcons
                  name={isEmergency ? 'emergency' : 'info'}
                  size={28}
                  color={isEmergency ? '#FF4444' : '#00D9FF'}
                />
                <Text style={styles.headerText}>
                  {isEmergency ? `${incidentType} Response` : 'Safety Assistant'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose}>
                <MaterialIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Status Info */}
            {isEmergency && (
              <View style={styles.statusBanner}>
                <View style={styles.statusContent}>
                  <MaterialIcons name="check-circle" size={24} color="#00D9FF" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.statusTitle}>Alert Sent</Text>
                    <Text style={styles.statusText}>
                      Responders are being notified of your location
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'guidance' && styles.activeTab]}
                onPress={() => setActiveTab('guidance')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'guidance' && styles.activeTabText,
                  ]}
                >
                  Guidance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
                onPress={() => setActiveTab('contacts')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'contacts' && styles.activeTabText,
                  ]}
                >
                  Contacts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
                onPress={() => setActiveTab('resources')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'resources' && styles.activeTabText,
                  ]}
                >
                  Nearby
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              {activeTab === 'guidance' && (
                <View>
                  {isEmergency ? (
                    <>
                      <Text style={styles.sectionTitle}>
                        Immediate Actions for {incidentType}
                      </Text>
                      {getTipsForIncident().map((tip, index) => (
                        <View key={index} style={styles.tipItem}>
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <>
                      <Text style={styles.sectionTitle}>Safety Tips</Text>
                      <View style={styles.aiSuggestion}>
                        <MaterialIcons name="lightbulb" size={24} color="#00D9FF" />
                        <Text style={styles.aiText}>
                          Stay aware of your surroundings and keep emergency contacts saved.
                        </Text>
                      </View>
                      <Text style={styles.subsectionTitle}>
                        Quick Safety Reminders
                      </Text>
                      {[
                        'Share your location with trusted contacts',
                        'Keep your phone charged',
                        'Know your emergency exits',
                        'Report suspicious activity',
                        'Use the buddy system',
                      ].map((reminder, index) => (
                        <View key={index} style={styles.reminderItem}>
                          <Feather name="check-circle" size={20} color="#00D9FF" />
                          <Text style={styles.reminderText}>{reminder}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {activeTab === 'contacts' && (
                <View>
                  <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                  {emergencyContacts.map((contact, index) => (
                    <TouchableOpacity key={index} style={styles.contactItem}>
                      <View style={styles.contactInfo}>
                        <MaterialIcons name="phone" size={24} color="#00D9FF" />
                        <View style={{ marginLeft: 15 }}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactNumber}>{contact.number}</Text>
                        </View>
                      </View>
                      <MaterialIcons name="call" size={28} color="#00D9FF" />
                    </TouchableOpacity>
                  ))}

                  <Text style={styles.sectionTitle}>Your Emergency Contacts</Text>
                  <View style={styles.emptyState}>
                    <MaterialIcons name="person-add" size={32} color="#CCC" />
                    <Text style={styles.emptyText}>
                      No emergency contacts saved yet
                    </Text>
                    <TouchableOpacity style={styles.addContactButton}>
                      <Text style={styles.addContactText}>Add Contact</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeTab === 'resources' && (
                <View>
                  <Text style={styles.sectionTitle}>Nearby Safe Resources</Text>
                  {nearbyResources.map((resource, index) => (
                    <View key={index} style={styles.resourceItem}>
                      <View style={styles.resourceInfo}>
                        <View style={styles.resourceIcon}>
                          <MaterialIcons name="location-on" size={20} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.resourceName}>{resource.name}</Text>
                          <Text style={styles.resourceDistance}>
                            {resource.distance} away
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.directionsButton}>
                        <MaterialIcons name="directions" size={20} color="#00D9FF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            {isEmergency && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.cancelAlertButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelAlertText}>Cancel Alert</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callButton}>
                  <MaterialIcons name="phone" size={20} color="#FFFFFF" />
                  <Text style={styles.callButtonText}>Call Police</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  statusBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#E8F8FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D9FF',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00D9FF',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00D9FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#00D9FF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 12,
  },
  tipItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  aiText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  reminderText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  addContactButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#00D9FF',
    borderRadius: 20,
  },
  addContactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resourceDistance: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  directionsButton: {
    padding: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelAlertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF4444',
    alignItems: 'center',
  },
  cancelAlertText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4444',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: '#00D9FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});

export default SafetyAssistantOverlay;
