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
} from 'react-native';
import * as Location from 'expo-location';
import PanicButton from '../Components/PanicButton';
import AIAssistant from '../Components/AIAssistant';
import SafetyAssistantOverlay from '../Components/SafetyAssistantOverlay';
import MapView from 'react-native-maps';
import { MaterialIcons, Feather } from '@expo/vector-icons';

const Homepage = ({ navigation }) => {
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
    <View style={styles.container}>
      {/* Full-Screen Map */}
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChange={setMapRegion}
        showsUserLocation
        followsUserLocation
        zoomEnabled
        scrollEnabled
        pitchEnabled
      >
        {location && (
          <MapView.Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            pinColor="teal"
          />
        )}
      </MapView>

      {/* Top Right Settings Icon */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setShowSettings(true)}
      >
        <MaterialIcons name="settings" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Central Panic Button - Floating */}
      <View style={styles.panicContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <PanicButton onPress={handlePanicPress} />
        </Animated.View>
      </View>

      {/* AI Assistant Floating Action Icon */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={handleAIAssistantPress}
      >
        <Feather name="bot" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Community Alerts Toggle - Optional */}
      <TouchableOpacity
        style={styles.communityAlertToggle}
        onPress={() => setCommunityAlertsEnabled(!communityAlertsEnabled)}
      >
        <MaterialIcons
          name={communityAlertsEnabled ? 'notifications-active' : 'notifications-off'}
          size={20}
          color={communityAlertsEnabled ? '#00D9FF' : '#999999'}
        />
      </TouchableOpacity>

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
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsModal}>
          <View style={styles.settingsContent}>
            <TouchableOpacity
              style={styles.closeSettingsButton}
              onPress={() => setShowSettings(false)}
            >
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>

            <ScrollView style={styles.settingsList}>
              <Text style={styles.settingsTitle}>Settings</Text>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Profile</Text>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Emergency Contacts</Text>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Safety Tips</Text>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Privacy & Permissions</Text>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
                  setShowSettings(false);
                  navigation.navigate('PersonalLogin');
                }}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 45 : 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    padding: 12,
    zIndex: 10,
  },
  panicContainer: {
    position: 'absolute',
    bottom: '35%',
    left: '50%',
    marginLeft: -50,
    zIndex: 15,
  },
  aiButton: {
    position: 'absolute',
    bottom: 100,
    right: 25,
    backgroundColor: 'rgba(0, 217, 255, 0.9)',
    borderRadius: 50,
    padding: 15,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  communityAlertToggle: {
    position: 'absolute',
    bottom: 100,
    left: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 40,
    padding: 12,
    zIndex: 10,
  },
  settingsModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  closeSettingsButton: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 10,
  },
  settingsList: {
    paddingHorizontal: 20,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    marginLeft: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 12,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default Homepage;
