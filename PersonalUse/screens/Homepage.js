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
  StatusBar,
  PanResponder,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import PanicButton from '../Components/PanicButton';
import SafetyAssistantOverlay from '../Components/SafetyAssistantOverlay';
import { MaterialIcons, Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { sendEmergencyAlert } from '../Services/APIService';

const Homepage = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false);
  const [showSafetyOverlay, setShowSafetyOverlay] = useState(false);
  const [incidentType, setIncidentType] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef(null);
  
  // Bottom sheet drag state
  const COLLAPSED_HEIGHT = 280; // Height when collapsed
  const EXPANDED_HEIGHT = 500;  // Height when expanded
  const [isExpanded, setIsExpanded] = useState(false);
  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const dragY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical gestures with enough movement
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (evt, gestureState) => {
        // Store the current drag position
        sheetHeight.stopAnimation((value) => {
          dragY.current = value;
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new height based on drag direction
        const newHeight = dragY.current - gestureState.dy; // Negative dy = drag up = increase height
        
        // Constrain between collapsed and expanded heights
        const constrainedHeight = Math.min(
          EXPANDED_HEIGHT,
          Math.max(COLLAPSED_HEIGHT, newHeight)
        );
        
        sheetHeight.setValue(constrainedHeight);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (evt, gestureState) => {
        const currentHeight = dragY.current - gestureState.dy;
        const velocity = -gestureState.vy; // Invert velocity (positive = up)
        
        // Determine final state based on velocity and position
        let shouldExpand = false;
        
        if (velocity > 1) {
          // Fast upward swipe
          shouldExpand = true;
        } else if (velocity < -1) {
          // Fast downward swipe
          shouldExpand = false;
        } else {
          // Slow gesture, decide based on position
          const midPoint = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
          shouldExpand = currentHeight > midPoint;
        }
        
        const targetHeight = shouldExpand ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
        setIsExpanded(shouldExpand);
        
        // Animate to final position
        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          damping: 25,
          stiffness: 200,
          velocity: velocity,
        }).start();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Snap to nearest position on termination
        const currentHeight = dragY.current - gestureState.dy;
        const midPoint = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
        const shouldExpand = currentHeight > midPoint;
        const targetHeight = shouldExpand ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
        
        setIsExpanded(shouldExpand);
        
        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          damping: 25,
          stiffness: 200,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    requestLocationPermission();
    
    // Watch for location changes
    let locationSubscription;
    const watchLocation = async () => {
      if (locationPermissionGranted) {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (newLocation) => {
            const coords = newLocation.coords;
            setLocation(coords);
            console.log('Location updated:', coords);
          }
        );
      }
    };

    watchLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationPermissionGranted]);

  const requestLocationPermission = async () => {
    try {
      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermissionGranted(true);
        
        // Get current location with high accuracy
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          maximumAge: 10000,
          timeout: 15000,
        });
        
        const coords = currentLocation.coords;
        setLocation(coords);
        
        // Update map region to center on current location
        const newRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.005, // Smaller delta for closer zoom
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        
        // Animate map to new location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
        
        console.log('Location updated:', coords);
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to see your current location on the map.',
          [
            { text: 'Cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const centerMapOnUser = async () => {
    try {
      if (!locationPermissionGranted) {
        await requestLocationPermission();
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const coords = currentLocation.coords;
      setLocation(coords);
      
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      setMapRegion(newRegion);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error centering map:', error);
      Alert.alert('Error', 'Unable to get your current location');
    }
  };

  const handlePanicPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    // Show emergency service options instead of simple confirmation
    setShowEmergencyOptions(true);
  };

  const handleEmergencyServiceSelect = (serviceType) => {
    setShowEmergencyOptions(false);
    
    // Show confirmation for the specific service
    const serviceNames = {
      'POLICE': 'Police',
      'AMBULANCE': 'Ambulance',
      'PRIVATE_SECURITY': 'Private Security',
      'CPF': 'Community Protection Force (CPF)'
    };
    
    Alert.alert(
      `${serviceNames[serviceType]} Emergency`,
      `Are you sure you want to alert ${serviceNames[serviceType]}? This will send your location and emergency details.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => setShowEmergencyOptions(true) // Go back to service selection
        },
        { 
          text: `Alert ${serviceNames[serviceType]}`, 
          onPress: () => sendAlert(serviceType),
          style: 'destructive'
        },
      ]
    );
  };

  const sendAlert = async (type) => {
    setIncidentType(type);
    setShowSafetyOverlay(true);

    // Get most recent location
    let coords = location;
    if (!coords) {
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        coords = currentLocation.coords;
        setLocation(coords);
      } catch (error) {
        coords = mapRegion; // Fallback to map region
      }
    }

    // TODO: replace with authenticated user id
    const userId = 'demo-user';
    
    const serviceMessages = {
      'POLICE': 'Police have been notified and are responding to your location.',
      'AMBULANCE': 'Emergency medical services have been dispatched to your location.',
      'PRIVATE_SECURITY': 'Private security has been alerted and is en route.',
      'CPF': 'Community Protection Force has been notified and is responding.',
      'MEDICAL': 'Medical emergency alert sent to responders.',
      'SECURITY': 'Security threat alert sent to authorities.',
      'HELP': 'General help request sent to emergency contacts.',
      'SOS': 'SOS alert sent to all emergency services.'
    };
    
    try {
      const result = await sendEmergencyAlert(userId, type, coords);
      if (result?.success) {
        Alert.alert(
          'Emergency Alert Sent', 
          serviceMessages[type] || 'Responders have been notified.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Network Issue', 
          'We could not reach the server. Your alert is queued and will be sent when connection is restored.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      Alert.alert(
        'Error', 
        'Unable to send alert. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleBottomSheet = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    Animated.spring(sheetHeight, {
      toValue: newExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      useNativeDriver: false,
      damping: 25,
      stiffness: 200,
    }).start();
  };

  const handleAIAssistantPress = () => {
    // Navigate to the full AI Safety Assistant screen
    navigation.navigate('AIAssistant');
  };

  const handleFamilyPress = () => {
    navigation.navigate('Family');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FA" />
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        loadingEnabled={true}
        loadingIndicatorColor="#007AFF"
        loadingBackgroundColor="#F4F7FA"
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Current Location"
            description="You are here"
            pinColor="#007AFF"
          />
        )}
      </MapView>

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={centerMapOnUser}>
          <MaterialIcons name="my-location" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GoGuardians</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowSettings(true)}>
          <MaterialIcons name="settings" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Status pill overlay */}
      <View style={styles.statusPillContainer}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>
            {location ? 'Location Active' : 'Getting Location...'}
          </Text>
        </View>
      </View>

      <Animated.View style={[
        styles.bottomSheet,
        { 
          height: sheetHeight,
        },
      ]}>
        {/* Drag Handle Area */}
        <TouchableOpacity
      style={styles.dragHandleArea}
      onPress={toggleBottomSheet}
      activeOpacity={0.7}
    >
      <View style={styles.handleContainer}>
        <MaterialIcons
          name={isExpanded ? 'expand-less' : 'expand-more'}
          size={26}
          color="#007AFF"
        />
        <Text style={styles.dragHint}>
          {isExpanded ? 'Press down to collapse' : 'Press up for more options'}
        </Text>
      </View>
    </TouchableOpacity>
        
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, { backgroundColor: location ? '#22C55E' : '#F59E0B' }]} />
          <Text style={styles.statusText}>
            {location ? 'You are safe' : 'Getting your location...'}
          </Text>
        </View>

        <View style={styles.panicButtonContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <PanicButton onPress={handlePanicPress} />
          </Animated.View>
          <Text style={styles.panicHint}>Press for emergency</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAIAssistantPress}>
            <Feather name="shield" size={24} color="#007AFF" />
            <Text style={styles.actionLabel}>Safety Tips</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleFamilyPress}>
            <MaterialIcons name="group" size={24} color="#007AFF" />
            <Text style={styles.actionLabel}>Family</Text>
          </TouchableOpacity>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedSection}>
              <Text style={styles.expandedTitle}>Emergency Contacts</Text>
              <TouchableOpacity style={styles.expandedButton} onPress={handleFamilyPress}>
                <MaterialIcons name="contacts" size={20} color="#007AFF" />
                <Text style={styles.expandedButtonText}>Manage Contacts</Text>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/*<View style={styles.expandedSection}>
              <Text style={styles.expandedTitle}>Quick Emergency Actions</Text>
              <View style={styles.expandedActions}>
                <TouchableOpacity 
                  style={[styles.expandedActionButton, styles.medicalButton]}
                  onPress={() => sendAlert('MEDICAL')}
                >
                  <MaterialIcons name="local_hospital" size={20} color="#FFFFFF" />
                  <Text style={[styles.expandedActionText, styles.whiteText]}>Medical Emergency</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.expandedActionButton, styles.securityButton]}
                  onPress={() => sendAlert('SECURITY')}
                >
                  <MaterialIcons name="security" size={20} color="#FFFFFF" />
                  <Text style={[styles.expandedActionText, styles.whiteText]}>Security Threat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.expandedActionButton, styles.helpButton]}
                  onPress={() => sendAlert('HELP')}
                >
                  <MaterialIcons name="help" size={20} color="#FFFFFF" />
                  <Text style={[styles.expandedActionText, styles.whiteText]}>General Help</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.expandedSection}>
              <Text style={styles.expandedTitle}>Location & Safety</Text>
              <TouchableOpacity style={styles.expandedButton} onPress={centerMapOnUser}>
                <MaterialIcons name="my_location" size={20} color="#007AFF" />
                <Text style={styles.expandedButtonText}>Update My Location</Text>
                <MaterialIcons name="refresh" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>*/}
          </View>
        )}
      </Animated.View>

      {showSafetyOverlay && (
        <SafetyAssistantOverlay
          isEmergency={incidentType !== null}
          incidentType={incidentType}
          userLocation={location || mapRegion}
          onClose={() => setShowSafetyOverlay(false)}
        />
      )}

      {/* Emergency Service Options Modal */}
      <Modal
        visible={showEmergencyOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmergencyOptions(false)}
      >
        <View style={styles.emergencyModalOverlay}>
          <SafeAreaView style={styles.emergencyModalContainer}>
            <View style={styles.emergencyModalContent}>
              <View style={styles.emergencyModalHeader}>
                <MaterialIcons name="warning" size={32} color="#EF4444" />
                <Text style={styles.emergencyModalTitle}>Emergency Services</Text>
                <Text style={styles.emergencyModalSubtitle}>
                  Select the appropriate emergency service for your situation
                </Text>
              </View>

              <View style={styles.emergencyServicesGrid}>
                <TouchableOpacity
                  style={[styles.emergencyServiceButton, styles.policeButton]}
                  onPress={() => handleEmergencyServiceSelect('POLICE')}
                >
                  <MaterialIcons name="local-police" size={32} color="#FFFFFF" />
                  <Text style={styles.emergencyServiceTitle}>Police</Text>
                  <Text style={styles.emergencyServiceSubtitle}>Crime, violence, theft</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyServiceButton, styles.ambulanceButton]}
                  onPress={() => handleEmergencyServiceSelect('AMBULANCE')}
                >
                  <MaterialIcons name="medical-services" size={32} color="#FFFFFF" />
                  <Text style={styles.emergencyServiceTitle}>Medical</Text>
                  <Text style={styles.emergencyServiceSubtitle}>Medical emergency</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyServiceButton, styles.securityButton]}
                  onPress={() => handleEmergencyServiceSelect('PRIVATE_SECURITY')}
                >
                  <MaterialIcons name="security" size={32} color="#FFFFFF" />
                  <Text style={styles.emergencyServiceTitle}>Private Gaurd</Text>
                  <Text style={styles.emergencyServiceSubtitle}>Private security</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyServiceButton, styles.cpfButton]}
                  onPress={() => handleEmergencyServiceSelect('CPF')}
                >
                  <MaterialIcons name="groups" size={32} color="#FFFFFF" />
                  <Text style={styles.emergencyServiceTitle}>CPF</Text>
                  <Text style={styles.emergencyServiceSubtitle}>Community protection</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.emergencyCancelButton}
                onPress={() => setShowEmergencyOptions(false)}
              >
                <Text style={styles.emergencyCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={styles.settingsModal}>
          <View style={styles.settingsContent}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.settingsList}>
              <TouchableOpacity style={styles.settingsItem} onPress={requestLocationPermission}>
                <MaterialIcons name="location-on" size={24} color="#007AFF" />
                <View style={styles.settingsItemText}>
                  <Text style={styles.settingsItemTitle}>Location Services</Text>
                  <Text style={styles.settingsItemSubtitle}>
                    {locationPermissionGranted ? 'Enabled' : 'Tap to enable'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingsItem} onPress={centerMapOnUser}>
                <MaterialIcons name="my-location" size={24} color="#007AFF" />
                <View style={styles.settingsItemText}>
                  <Text style={styles.settingsItemTitle}>Center on My Location</Text>
                  <Text style={styles.settingsItemSubtitle}>Update map to current position</Text>
                </View>
              </TouchableOpacity>
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
    backgroundColor: '#F4F7FA',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusPillContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 60 : 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  dragHandleArea: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    // Make the drag area larger for easier interaction
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  dragHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  panicButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  panicHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
  },
  settingsModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  settingsContent: {
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  settingsList: {
    flex: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  settingsItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandedSection: {
    marginBottom: 20,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  expandedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
    marginLeft: 8,
  },
  expandedActions: {
    gap: 10,
  },
  expandedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  medicalButton: {
    backgroundColor: '#EF4444',
  },
  securityButton: {
    backgroundColor: '#F97316',
  },
  helpButton: {
    backgroundColor: '#EAB308',
  },
  expandedActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  emergencyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emergencyModalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  emergencyModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emergencyModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  emergencyModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emergencyServicesGrid: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  emergencyServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  policeButton: {
    backgroundColor: '#1E40AF', // Blue for police
  },
  ambulanceButton: {
    backgroundColor: '#EF4444', // Red for ambulance
  },
  securityButton: {
    backgroundColor: '#7C3AED', // Purple for private security
  },
  cpfButton: {
    backgroundColor: '#059669', // Green for CPF
  },
  emergencyServiceTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 19,
    flex: 1,
  },
  emergencyServiceSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 16,
    flex: 2,
  },
  emergencyCancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  emergencyCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  dragHandleArea: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHint: {
    marginLeft: 6,
    color: '#333',
    fontSize: 14,
  },
});

export default Homepage;