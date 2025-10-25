import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  Text,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import * as Location from 'expo-location';
import Maps from 'expo-maps';
import PanicButton from '../Components/PanicButton';
import AIAssistant from '../Components/AIAssistant';
import SafetyAssistantOverlay from '../Components/SafetyAssistantOverlay';
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Homepage = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showSafetyOverlay, setShowSafetyOverlay] = useState(false);
  const [incidentType, setIncidentType] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [communityAlertsEnabled, setCommunityAlertsEnabled] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const coords = currentLocation.coords;
        setLocation(coords);
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const handlePanicPress = () => {
    // Trigger pulse animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show incident type selection
    Alert.alert(
      'Emergency Alert',
      'Select incident type:',
      [
        { text: 'Crime', onPress: () => sendAlert('Crime') },
        { text: 'Medical', onPress: () => sendAlert('Medical') },
        { text: 'Fire', onPress: () => sendAlert('Fire') },
        { text: 'GBV', onPress: () => sendAlert('GBV') },
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      ]
    );
  };

  const sendAlert = (type) => {
    setIncidentType(type);
    setShowSafetyOverlay(true);

    // Simulate sending alert with location and incident type
    console.log('Alert sent:', {
      type,
      location: location || mapRegion,
      timestamp: new Date().toISOString(),
    });

    // Here you would send this data to your backend
    Alert.alert(
      'Alert Sent!',
      `Emergency alert (${type}) sent with your location to nearby responders.`,
      [{ text: 'OK' }]
    );
  };

  const handleAIAssistantPress = () => {
    // Open AI Assistant without triggering emergency
    setShowSafetyOverlay(true);
    setIncidentType(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1419" />
      
      {/* Full-Screen Map Background */}
      <Maps
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        followsUserLocation={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
      />

      {/* Dark Overlay for Better UI Contrast */}
      <View style={styles.overlay} />

      {/* Header - Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.appBadge}>
            <AntDesign name="shield" size={16} color="#00D9FF" />
          </View>
          <View>
            <Text style={styles.appName}>GoGuardians</Text>
            <Text style={styles.statusText}>Status: Safe</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <MaterialIcons name="settings" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content - Bottom Section */}
      <View style={styles.mainContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardContent}>
            <View style={styles.statusIndicator} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusCardTitle}>Your Location is Secure</Text>
              <Text style={styles.statusCardSubtitle}>Real-time monitoring active</Text>
            </View>
            <AntDesign name="checkcircle" size={24} color="#00D9FF" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            {/* AI Assistant Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAIAssistantPress}
            >
              <View style={styles.actionIcon}>
                <Feather name="bot" size={24} color="#00D9FF" />
              </View>
              <Text style={styles.actionLabel}>Safety Guide</Text>
            </TouchableOpacity>

            {/* Community Alerts Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setCommunityAlertsEnabled(!communityAlertsEnabled)}
            >
              <View style={[styles.actionIcon, communityAlertsEnabled && styles.actionIconActive]}>
                <MaterialIcons 
                  name={communityAlertsEnabled ? 'notifications-active' : 'notifications-off'}
                  size={24} 
                  color={communityAlertsEnabled ? '#00D9FF' : '#888'} 
                />
              </View>
              <Text style={styles.actionLabel}>Alerts</Text>
            </TouchableOpacity>

            {/* Emergency Contacts Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Emergency Contacts', 'Coming soon')}
            >
              <View style={styles.actionIcon}>
                <AntDesign name="contacts" size={24} color="#00D9FF" />
              </View>
              <Text style={styles.actionLabel}>Contacts</Text>
            </TouchableOpacity>

            {/* Report Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Reports', 'Coming soon')}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="description" size={24} color="#00D9FF" />
              </View>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Panic Button Section */}
        <View style={styles.panicSection}>
          <Text style={styles.emergencyText}>In an Emergency?</Text>
          <Animated.View 
            style={[
              styles.panicContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <PanicButton onPress={handlePanicPress} />
          </Animated.View>
          <Text style={styles.panicHint}>Press & Hold or Tap to trigger emergency alert</Text>
        </View>
      </View>

      {/* Safety Assistant Overlay */}
      {showSafetyOverlay && (
        <SafetyAssistantOverlay
          isEmergency={incidentType !== null}
          incidentType={incidentType}
          userLocation={location || mapRegion}
          onClose={() => setShowSafetyOverlay(false)}
        />
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={styles.settingsModal}>
          <View style={styles.settingsOverlay} />
          <View style={styles.settingsContent}>
            {/* Header */}
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity
                style={styles.closeSettingsButton}
                onPress={() => setShowSettings(false)}
              >
                <AntDesign name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.settingsList}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionLabel}>Account</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <MaterialIcons name="person" size={20} color="#00D9FF" />
                    <Text style={styles.settingLabel}>Profile</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <MaterialIcons name="phone" size={20} color="#00D9FF" />
                    <Text style={styles.settingLabel}>Emergency Contacts</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>
              </View>

              {/* Security Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionLabel}>Security & Privacy</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <MaterialIcons name="security" size={20} color="#00D9FF" />
                    <Text style={styles.settingLabel}>Privacy Settings</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <MaterialIcons name="location-on" size={20} color="#00D9FF" />
                    <Text style={styles.settingLabel}>Location Permissions</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>
              </View>

              {/* Support Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionLabel}>Support</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <MaterialIcons name="help" size={20} color="#00D9FF" />
                    <Text style={styles.settingLabel}>Safety Tips & Resources</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <MaterialIcons name="info" size={20} color="#00D9FF" />
                    <Text style={styles.settingLabel}>About GoGuardians</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>
              </View>

              {/* Logout Section */}
              <View style={styles.settingsSection}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={() => {
                    setShowSettings(false);
                    navigation.navigate('PersonalLogin');
                  }}
                >
                  <MaterialIcons name="logout" size={20} color="#FFFFFF" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingsFooter} />
            </ScrollView>
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 20, 25, 0.4)',
    zIndex: 1,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 20, 25, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.1)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 11,
    color: '#00D9FF',
    fontWeight: '500',
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },

  // Main Content
  mainContent: {
    flex: 1,
    zIndex: 5,
    paddingBottom: 0,
  },

  // Status Card
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D9FF',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  statusInfo: {
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusCardSubtitle: {
    fontSize: 12,
    color: '#A0AFBB',
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  actionIconActive: {
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    borderColor: 'rgba(0, 217, 255, 0.4)',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Panic Button Section
  panicSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  emergencyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  panicContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  panicHint: {
    fontSize: 12,
    color: '#A0AFBB',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },

  // Settings Modal
  settingsModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  settingsContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: Platform.OS === 'ios' ? 0 : 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F1419',
    letterSpacing: -0.5,
  },
  closeSettingsButton: {
    padding: 8,
  },
  settingsList: {
    flex: 1,
    paddingHorizontal: 0,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F1419',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  settingsFooter: {
    height: 20,
  },
});

export default Homepage;
