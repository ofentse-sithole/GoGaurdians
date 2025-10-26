import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LocationSharingService from './LocationSharingService';

const { width, height } = Dimensions.get('window');

const FamilyMapView = ({ navigation }) => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyLocations, setFamilyLocations] = useState(new Map());
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const mapRef = useRef(null);

  useEffect(() => {
    initializeData();
    
    // Set up location listeners
    const removeLocationListener = LocationSharingService.addLocationListener(handleLocationUpdate);
    const removeShareListener = LocationSharingService.addShareStatusListener(handleShareStatusUpdate);
    
    // Refresh family locations periodically
    const interval = setInterval(() => {
      refreshFamilyLocations();
    }, 10000);
    
    return () => {
      removeLocationListener();
      removeShareListener();
      clearInterval(interval);
    };
  }, []);

  const initializeData = async () => {
    try {
      await LocationSharingService.initialize();
      const members = LocationSharingService.getFamilyMembers();
      setFamilyMembers(members);
      setIsLocationSharing(LocationSharingService.getSharingStatus());
      
      // Get current location
      const location = await LocationSharingService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
      
      await refreshFamilyLocations();
    } catch (error) {
      console.error('Failed to initialize family map:', error);
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

  const centerMapOnAllMembers = () => {
    const locations = [];
    
    // Add current user location
    if (currentLocation) {
      locations.push(currentLocation);
    }
    
    // Add family members locations
    familyLocations.forEach((member) => {
      if (member.location) {
        locations.push(member.location);
      }
    });
    
    if (locations.length === 0) {
      Alert.alert('No Locations', 'No family member locations are available to show on the map.');
      return;
    }
    
    if (locations.length === 1) {
      // If only one location, center on it
      const location = locations[0];
      const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(region, 1000);
    } else {
      // Fit all locations
      mapRef.current?.fitToCoordinates(
        locations.map(loc => ({ latitude: loc.latitude, longitude: loc.longitude })),
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        }
      );
    }
  };

  const centerMapOnMember = (member) => {
    const memberData = familyLocations.get(member.id);
    if (memberData && memberData.location) {
      const region = {
        latitude: memberData.location.latitude,
        longitude: memberData.location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current?.animateToRegion(region, 1000);
    }
  };

  const handleMarkerPress = (member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
    centerMapOnMember(member);
  };

  const getLocationAge = (timestamp) => {
    const now = new Date();
    const lastUpdate = new Date(timestamp);
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

  const getMarkerColor = (timestamp) => {
    const now = new Date();
    const lastUpdate = new Date(timestamp);
    const diffMinutes = Math.floor((now - lastUpdate) / 60000);
    
    if (diffMinutes < 5) {
      return '#22C55E'; // Green for recent
    } else if (diffMinutes < 30) {
      return '#F59E0B'; // Yellow for somewhat old
    } else {
      return '#EF4444'; // Red for old
    }
  };

  const renderFamilyMemberMarker = (member) => {
    const memberData = familyLocations.get(member.id);
    if (!memberData || !memberData.location || !memberData.isLocationShared) {
      return null;
    }

    return (
      <Marker
        key={member.id}
        coordinate={{
          latitude: memberData.location.latitude,
          longitude: memberData.location.longitude,
        }}
        title={member.name}
        description={`Last seen: ${getLocationAge(memberData.lastLocationUpdate)}`}
        onPress={() => handleMarkerPress(member)}
      >
        <View style={[styles.markerContainer, { borderColor: getMarkerColor(memberData.lastLocationUpdate) }]}>
          <Text style={styles.markerEmoji}>{member.avatar}</Text>
        </View>
      </Marker>
    );
  };

  const renderCurrentLocationMarker = () => {
    if (!currentLocation || !isLocationSharing) {
      return null;
    }

    return (
      <Marker
        coordinate={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }}
        title="Your Location"
        description="Current location"
      >
        <View style={[styles.currentMarkerContainer]}>
          <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
        </View>
        <Circle
          center={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          radius={currentLocation.accuracy || 50}
          fillColor="rgba(0, 217, 255, 0.2)"
          strokeColor="rgba(0, 217, 255, 0.5)"
          strokeWidth={2}
        />
      </Marker>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Map</Text>
        <TouchableOpacity onPress={centerMapOnAllMembers} style={styles.centerButton}>
          <MaterialIcons name="center-focus-strong" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {renderCurrentLocationMarker()}
        {familyMembers.map(renderFamilyMemberMarker)}
      </MapView>

      {/* Bottom Panel with Family Members List */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHeader}>
          <MaterialIcons name="people" size={20} color="#00D9FF" />
          <Text style={styles.panelTitle}>Family Locations</Text>
          <TouchableOpacity onPress={refreshFamilyLocations} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={20} color="#00D9FF" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
          {/* Current User */}
          <TouchableOpacity 
            style={[styles.memberCard, isLocationSharing && styles.activeMemberCard]}
            onPress={() => {
              if (currentLocation) {
                const region = {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                };
                mapRef.current?.animateToRegion(region, 1000);
              }
            }}
          >
            <View style={[styles.memberAvatar, { backgroundColor: '#00D9FF' }]}>
              <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.memberName}>You</Text>
            <Text style={[styles.memberStatus, { color: isLocationSharing ? '#22C55E' : '#F59E0B' }]}>
              {isLocationSharing ? 'Sharing' : 'Not sharing'}
            </Text>
          </TouchableOpacity>

          {/* Family Members */}
          {familyMembers.map((member) => {
            const memberData = familyLocations.get(member.id);
            const hasLocation = memberData?.location && memberData?.isLocationShared;
            
            return (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, hasLocation && styles.activeMemberCard]}
                onPress={() => hasLocation && centerMapOnMember(member)}
              >
                <View style={[
                  styles.memberAvatar, 
                  { backgroundColor: hasLocation ? getMarkerColor(memberData.lastLocationUpdate) : '#9CA3AF' }
                ]}>
                  <Text style={styles.avatarEmoji}>{member.avatar}</Text>
                </View>
                <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                <Text style={[
                  styles.memberStatus,
                  { color: hasLocation ? '#22C55E' : '#9CA3AF' }
                ]}>
                  {hasLocation ? getLocationAge(memberData.lastLocationUpdate) : 'Offline'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Member Details Modal */}
      <Modal
        visible={showMemberDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMemberDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedMember?.name || 'Member Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowMemberDetails(false)}>
              <MaterialIcons name="close" size={24} color="#0F1419" />
            </TouchableOpacity>
          </View>

          {selectedMember && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.memberDetailCard}>
                <View style={styles.memberDetailHeader}>
                  <View style={styles.memberDetailAvatar}>
                    <Text style={styles.memberDetailEmoji}>{selectedMember.avatar}</Text>
                  </View>
                  <View style={styles.memberDetailInfo}>
                    <Text style={styles.memberDetailName}>{selectedMember.name}</Text>
                    {selectedMember.relation && (
                      <Text style={styles.memberDetailRelation}>{selectedMember.relation}</Text>
                    )}
                    <Text style={styles.memberDetailPhone}>{selectedMember.phone}</Text>
                  </View>
                </View>

                {(() => {
                  const memberData = familyLocations.get(selectedMember.id);
                  if (memberData?.location) {
                    return (
                      <View style={styles.locationDetails}>
                        <Text style={styles.locationDetailsTitle}>Location Details</Text>
                        <View style={styles.locationDetailRow}>
                          <MaterialIcons name="location-on" size={16} color="#00D9FF" />
                          <Text style={styles.locationDetailText}>
                            {memberData.location.latitude.toFixed(6)}, {memberData.location.longitude.toFixed(6)}
                          </Text>
                        </View>
                        <View style={styles.locationDetailRow}>
                          <MaterialIcons name="access-time" size={16} color="#00D9FF" />
                          <Text style={styles.locationDetailText}>
                            Last updated: {new Date(memberData.lastLocationUpdate).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.locationDetailRow}>
                          <MaterialIcons name="my-location" size={16} color="#00D9FF" />
                          <Text style={styles.locationDetailText}>
                            Accuracy: ±{Math.round(memberData.location.accuracy || 0)}m
                          </Text>
                        </View>
                      </View>
                    );
                  } else {
                    return (
                      <View style={styles.noLocationCard}>
                        <MaterialIcons name="location-off" size={48} color="#9CA3AF" />
                        <Text style={styles.noLocationTitle}>Location Not Available</Text>
                        <Text style={styles.noLocationText}>
                          {selectedMember.name} is not currently sharing their location or location data is not available.
                        </Text>
                      </View>
                    );
                  }
                })()}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      const phoneUrl = `tel:${selectedMember.phone}`;
                      Linking.openURL(phoneUrl);
                    }}
                  >
                    <MaterialIcons name="phone" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      const smsUrl = `sms:${selectedMember.phone}`;
                      Linking.openURL(smsUrl);
                    }}
                  >
                    <MaterialIcons name="message" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F1419',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.15)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 20,
  },
  currentMarkerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1419',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  membersScroll: {
    paddingLeft: 20,
  },
  memberCard: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    minWidth: 80,
  },
  activeMemberCard: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F1419',
    textAlign: 'center',
  },
  memberStatus: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  memberDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  memberDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  memberDetailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberDetailEmoji: {
    fontSize: 32,
  },
  memberDetailInfo: {
    flex: 1,
  },
  memberDetailName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1419',
  },
  memberDetailRelation: {
    fontSize: 14,
    color: '#00D9FF',
    marginTop: 2,
    fontWeight: '500',
  },
  memberDetailPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  locationDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1419',
    marginBottom: 12,
  },
  locationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  noLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  noLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1419',
    marginTop: 12,
  },
  noLocationText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D9FF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FamilyMapView;