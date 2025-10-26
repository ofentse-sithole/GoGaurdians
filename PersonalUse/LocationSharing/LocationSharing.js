import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationSharingService {
  constructor() {
    this.isSharing = false;
    this.locationSubscription = null;
    this.watchId = null;
    this.familyMembers = new Map();
    this.locationListeners = new Set();
    this.shareListeners = new Set();
  }

  // Initialize location sharing service
  async initialize() {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Load existing family members from storage
      await this.loadFamilyMembers();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize location sharing:', error);
      return false;
    }
  }

  // Start sharing location with family members
  async startLocationSharing() {
    try {
      if (this.isSharing) {
        console.log('Location sharing already active');
        return;
      }

      // Request background location permissions for continuous tracking
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('Background location permission denied - using foreground only');
      }

      // Start watching location changes
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        this.handleLocationUpdate.bind(this)
      );

      this.isSharing = true;
      this.notifyShareListeners(true);
      
      // Save sharing state
      await AsyncStorage.setItem('isLocationSharing', 'true');
      
      console.log('Location sharing started');
      return true;
    } catch (error) {
      console.error('Failed to start location sharing:', error);
      return false;
    }
  }

  // Stop sharing location
  async stopLocationSharing() {
    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      this.isSharing = false;
      this.notifyShareListeners(false);
      
      // Save sharing state
      await AsyncStorage.setItem('isLocationSharing', 'false');
      
      console.log('Location sharing stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop location sharing:', error);
      return false;
    }
  }

  // Handle location updates
  handleLocationUpdate(locationData) {
    const location = {
      latitude: locationData.coords.latitude,
      longitude: locationData.coords.longitude,
      accuracy: locationData.coords.accuracy,
      timestamp: locationData.timestamp,
      heading: locationData.coords.heading,
      speed: locationData.coords.speed,
    };

    // Update current user's location
    this.currentLocation = location;
    
    // Notify all location listeners
    this.notifyLocationListeners(location);
    
    // Share location with family members (in real app, this would send to server)
    this.shareLocationWithFamily(location);
  }

  // Share location with family members
  async shareLocationWithFamily(location) {
    try {
      // In a real implementation, this would send location to a server
      // For demo purposes, we'll simulate sharing with local storage
      const locationData = {
        userId: await this.getCurrentUserId(),
        location: location,
        timestamp: Date.now(),
      };

      // Store location update locally (in production, send to server)
      await AsyncStorage.setItem(
        `user_location_${locationData.userId}`,
        JSON.stringify(locationData)
      );

      console.log('Location shared with family members');
    } catch (error) {
      console.error('Failed to share location:', error);
    }
  }

  // Add family member for location sharing
  async addFamilyMember(memberData) {
    try {
      const member = {
        id: memberData.id || Date.now().toString(),
        name: memberData.name,
        phone: memberData.phone,
        relation: memberData.relation,
        avatar: memberData.avatar || '👤',
        isLocationShared: memberData.isLocationShared || false,
        lastLocationUpdate: null,
        location: null,
      };

      this.familyMembers.set(member.id, member);
      await this.saveFamilyMembers();
      
      console.log(`Added family member: ${member.name}`);
      return member;
    } catch (error) {
      console.error('Failed to add family member:', error);
      throw error;
    }
  }

  // Remove family member
  async removeFamilyMember(memberId) {
    try {
      this.familyMembers.delete(memberId);
      await this.saveFamilyMembers();
      
      console.log(`Removed family member: ${memberId}`);
      return true;
    } catch (error) {
      console.error('Failed to remove family member:', error);
      return false;
    }
  }

  // Enable/disable location sharing for specific family member
  async toggleMemberLocationSharing(memberId, enabled) {
    try {
      const member = this.familyMembers.get(memberId);
      if (member) {
        member.isLocationShared = enabled;
        await this.saveFamilyMembers();
        
        console.log(`Location sharing ${enabled ? 'enabled' : 'disabled'} for ${member.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle member location sharing:', error);
      return false;
    }
  }

  // Get family members locations
  async getFamilyMembersLocations() {
    try {
      const locations = new Map();
      
      for (const [memberId, member] of this.familyMembers) {
        if (member.isLocationShared) {
          // In production, fetch from server
          const locationData = await AsyncStorage.getItem(`user_location_${memberId}`);
          if (locationData) {
            const parsedData = JSON.parse(locationData);
            member.location = parsedData.location;
            member.lastLocationUpdate = parsedData.timestamp;
          }
        }
        locations.set(memberId, member);
      }
      
      return locations;
    } catch (error) {
      console.error('Failed to get family members locations:', error);
      return new Map();
    }
  }

  // Get current location
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
        timeout: 15000,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      return this.currentLocation || null;
    }
  }

  // Send emergency alert with location to all family members
  async sendEmergencyAlert(alertType = 'emergency', customMessage = '') {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) {
        throw new Error('Unable to get current location');
      }

      const alertData = {
        type: alertType,
        location: currentLocation,
        message: customMessage,
        timestamp: Date.now(),
        userId: await this.getCurrentUserId(),
      };

      // In production, send to server and notify all family members
      // For demo, we'll store locally
      await AsyncStorage.setItem(
        `emergency_alert_${alertData.timestamp}`,
        JSON.stringify(alertData)
      );

      console.log('Emergency alert sent to family members');
      return true;
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      return false;
    }
  }

  // Location sharing status listeners
  addLocationListener(callback) {
    this.locationListeners.add(callback);
    return () => this.locationListeners.delete(callback);
  }

  addShareStatusListener(callback) {
    this.shareListeners.add(callback);
    return () => this.shareListeners.delete(callback);
  }

  notifyLocationListeners(location) {
    this.locationListeners.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Location listener error:', error);
      }
    });
  }

  notifyShareListeners(isSharing) {
    this.shareListeners.forEach(callback => {
      try {
        callback(isSharing);
      } catch (error) {
        console.error('Share status listener error:', error);
      }
    });
  }

  // Utility methods
  async getCurrentUserId() {
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}`;
      await AsyncStorage.setItem('userId', userId);
    }
    return userId;
  }

  async loadFamilyMembers() {
    try {
      const membersData = await AsyncStorage.getItem('familyMembers');
      if (membersData) {
        const members = JSON.parse(membersData);
        this.familyMembers = new Map(Object.entries(members));
      }
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  }

  async saveFamilyMembers() {
    try {
      const membersObject = Object.fromEntries(this.familyMembers);
      await AsyncStorage.setItem('familyMembers', JSON.stringify(membersObject));
    } catch (error) {
      console.error('Failed to save family members:', error);
    }
  }

  // Get all family members
  getFamilyMembers() {
    return Array.from(this.familyMembers.values());
  }

  // Get sharing status
  getSharingStatus() {
    return this.isSharing;
  }

  // Calculate distance between two locations
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value) {
    return (value * Math.PI) / 180;
  }

  // Cleanup
  cleanup() {
    this.stopLocationSharing();
    this.locationListeners.clear();
    this.shareListeners.clear();
  }
}

// Export singleton instance
export default new LocationSharingService();