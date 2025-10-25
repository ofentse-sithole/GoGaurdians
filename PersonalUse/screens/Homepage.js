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
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import { sendEmergencyAlert } from '../Services/APIService';

const Homepage = () => {
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Bottom sheet drag state
  const COLLAPSED_OFFSET = 220;
  const EXPANDED_OFFSET = 0;
  const sheetOffset = useRef(new Animated.Value(COLLAPSED_OFFSET)).current;
  const dragStart = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        // capture current offset
        sheetOffset.stopAnimation((value) => {
          dragStart.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(
          COLLAPSED_OFFSET,
          Math.max(EXPANDED_OFFSET, dragStart.current + gesture.dy)
        );
        sheetOffset.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldExpand = dragStart.current + gesture.dy < COLLAPSED_OFFSET / 2;
        Animated.spring(sheetOffset, {
          toValue: shouldExpand ? EXPANDED_OFFSET : COLLAPSED_OFFSET,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
        }).start();
      },
    })
  ).current;

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
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    Alert.alert(
      'Confirm Emergency',
      'Are you sure you want to send an SOS alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => sendAlert('SOS'), style: 'destructive' },
      ]
    );
  };

  const sendAlert = async (type) => {
    setIncidentType(type);
    setShowSafetyOverlay(true);

    const coords = location || mapRegion;
    // TODO: replace with authenticated user id
    const userId = 'demo-user';
    try {
      const result = await sendEmergencyAlert(userId, type, coords);
      if (result?.success) {
        Alert.alert('SOS Alert Sent', 'Responders have been notified.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Network Issue', 'We could not reach the server. Your alert is queued.', [{ text: 'OK' }]);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to send alert. Please check your connection.', [{ text: 'OK' }]);
    }
  };

  const handleAIAssistantPress = () => {
    setShowSafetyOverlay(true);
    setIncidentType(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FA" />
      
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            pinColor="#007AFF"
          />
        )}
      </MapView>

      <View style={styles.header}>
        <View style={styles.headerButtonSpacer} />
        <Text style={styles.headerTitle}>GoGuardians</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowSettings(true)}>
          <MaterialIcons name="settings" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Status pill overlay */}
      <View style={styles.statusPillContainer}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>Safe</Text>
        </View>
      </View>

      <Animated.View style={[
        styles.bottomSheet,
        { transform: [{ translateY: sheetOffset }] },
      ]}>
        <View style={styles.bottomSheetHandle} {...panResponder.panHandlers} />
        
        <View style={styles.statusSection}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>You are safe</Text>
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
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <MaterialIcons name="group" size={24} color="#007AFF" />
            <Text style={styles.actionLabel}>Family</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <AntDesign name="enviroment" size={24} color="#007AFF" />
            <Text style={styles.actionLabel}>Safe Places</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {showSafetyOverlay && (
        <SafetyAssistantOverlay
          isEmergency={incidentType !== null}
          incidentType={incidentType}
          userLocation={location || mapRegion}
          onClose={() => setShowSafetyOverlay(false)}
        />
      )}

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
              {/* Settings items here */}
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
  headerButtonSpacer: {
    width: 44,
    height: 44,
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
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
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
});

export default Homepage;
