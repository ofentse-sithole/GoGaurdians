import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../../firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission denied');
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
      if (this.isSharing) return;
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('Background location permission denied - using foreground only');
      }
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        this.handleLocationUpdate.bind(this)
      );
      this.isSharing = true;
      this.notifyShareListeners(true);
      try {
        const uid = await this.getCurrentUserId();
        if (uid && firestore) {
          const userRef = doc(firestore, 'users', uid);
          await setDoc(userRef, { preferences: { locationSharing: true } }, { merge: true });
        }
      } catch (e) {
        console.warn('Failed to persist sharing preference to Firestore:', e?.message || String(e));
      }
      await AsyncStorage.setItem('isLocationSharing', 'true');
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
      try {
        const uid = await this.getCurrentUserId();
        if (uid && firestore) {
          const userRef = doc(firestore, 'users', uid);
          await setDoc(userRef, { preferences: { locationSharing: false } }, { merge: true });
        }
      } catch (e) {
        console.warn('Failed to persist sharing preference to Firestore:', e?.message || String(e));
      }
      await AsyncStorage.setItem('isLocationSharing', 'false');
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
    this.currentLocation = location;
    this.notifyLocationListeners(location);
    this.shareLocationWithFamily(location);
  }

  // Share location with family members by writing to Firestore
  async shareLocationWithFamily(location) {
    try {
      const uid = await this.getCurrentUserId();
      if (!uid) return;
      if (firestore) {
        const userRef = doc(firestore, 'users', uid);
        await setDoc(
          userRef,
          {
            liveLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy ?? null,
              heading: location.heading ?? null,
              speed: location.speed ?? null,
              timestamp: Date.now(),
            },
          },
          { merge: true }
        );
      }
      await AsyncStorage.setItem(
        `user_location_${uid}`,
        JSON.stringify({ userId: uid, location, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Failed to share location:', error);
    }
  }

  // Add family member
  async addFamilyMember(memberData) {
    try {
      const uid = await this.getCurrentUserId();
      const normalizedPhone = (memberData.phone || '').replace(/\D/g, '');
      const newMember = {
        name: memberData.name?.trim() || '',
        phone: normalizedPhone,
        relation: memberData.relation?.trim() || '',
        avatar: memberData.avatar || '👤',
        isLocationShared: !!memberData.isLocationShared,
        lastLocationUpdate: null,
        location: null,
        createdAt: serverTimestamp(),
      };
      if (uid && firestore) {
        const famCol = collection(firestore, 'users', uid, 'family');
        const docRef = await addDoc(famCol, newMember);
        const member = { id: docRef.id, ...newMember };
        this.familyMembers.set(member.id, member);
        await this.saveFamilyMembersLocal();
        return member;
      }
      const member = { id: memberData.id || String(Date.now()), ...newMember };
      this.familyMembers.set(member.id, member);
      await this.saveFamilyMembersLocal();
      return member;
    } catch (error) {
      console.error('Failed to add family member:', error);
      throw error;
    }
  }

  // Remove family member
  async removeFamilyMember(memberId) {
    try {
      const uid = await this.getCurrentUserId();
      if (uid && firestore) {
        const ref = doc(firestore, 'users', uid, 'family', memberId);
        await deleteDoc(ref);
      }
      this.familyMembers.delete(memberId);
      await this.saveFamilyMembersLocal();
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
        const uid = await this.getCurrentUserId();
        if (uid && firestore) {
          const ref = doc(firestore, 'users', uid, 'family', memberId);
          await setDoc(ref, { isLocationShared: enabled }, { merge: true });
        }
        await this.saveFamilyMembersLocal();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling member location sharing:', error);
      return false;
    }
  }

  // Get family members + locations (if stored)
  async getFamilyMembersLocations() {
    try {
      await this.loadFamilyMembers();
      const locations = new Map();
      for (const [memberId, member] of this.familyMembers) {
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

  // Send emergency alert with location
  async sendEmergencyAlert(alertType = 'emergency', customMessage = '') {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) throw new Error('Unable to get current location');
      const alertData = {
        type: alertType,
        location: currentLocation,
        message: customMessage,
        timestamp: Date.now(),
        userId: await this.getCurrentUserId(),
      };
      try {
        const uid = await this.getCurrentUserId();
        if (uid && firestore) {
          const alertsCol = collection(firestore, 'users', uid, 'alerts');
          await addDoc(alertsCol, { ...alertData, createdAt: serverTimestamp() });
        }
      } catch (e) {
        console.warn('Failed to persist emergency alert to Firestore:', e?.message || String(e));
      }
      return true;
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      return false;
    }
  }

  // Listeners
  addLocationListener(callback) {
    this.locationListeners.add(callback);
    return () => this.locationListeners.delete(callback);
  }
  addShareStatusListener(callback) {
    this.shareListeners.add(callback);
    return () => this.shareListeners.delete(callback);
  }
  notifyLocationListeners(location) {
    this.locationListeners.forEach((cb) => {
      try { cb(location); } catch (e) { console.error('Location listener error:', e); }
    });
  }
  notifyShareListeners(isSharing) {
    this.shareListeners.forEach((cb) => {
      try { cb(isSharing); } catch (e) { console.error('Share status listener error:', e); }
    });
  }

  // Utilities
  async getCurrentUserId() {
    const u = auth?.currentUser;
    if (u?.uid) return u.uid;
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}`;
      await AsyncStorage.setItem('userId', userId);
    }
    return userId;
  }

  async loadFamilyMembers() {
    try {
      const u = auth?.currentUser;
      const uid = u?.uid || await AsyncStorage.getItem('userId');
      if (uid && firestore) {
        const famCol = collection(firestore, 'users', uid, 'family');
        const q = query(famCol, orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        const next = new Map();
        snap.forEach((d) => {
          const data = d.data() || {};
          next.set(d.id, {
            id: d.id,
            name: data.name || '',
            phone: data.phone || '',
            relation: data.relation || '',
            avatar: data.avatar || '👤',
            isLocationShared: !!data.isLocationShared,
            lastLocationUpdate: data.lastLocationUpdate || null,
            location: data.location || null,
          });
        });
        this.familyMembers = next;
        await this.saveFamilyMembersLocal();
        return;
      }
      const membersData = await AsyncStorage.getItem('familyMembers');
      if (membersData) {
        const members = JSON.parse(membersData);
        this.familyMembers = new Map(Object.entries(members));
      }
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  }

  async saveFamilyMembersLocal() {
    try {
      const membersObject = Object.fromEntries(this.familyMembers);
      await AsyncStorage.setItem('familyMembers', JSON.stringify(membersObject));
    } catch (error) {
      console.error('Failed to save family members:', error);
    }
  }

  // Getters
  getFamilyMembers() {
    return Array.from(this.familyMembers.values());
  }
  getSharingStatus() {
    return this.isSharing;
  }

  // Utils
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  toRad(value) { return (value * Math.PI) / 180; }

  cleanup() {
    this.stopLocationSharing();
    this.locationListeners.clear();
    this.shareListeners.clear();
  }
}

export default new LocationSharingService();