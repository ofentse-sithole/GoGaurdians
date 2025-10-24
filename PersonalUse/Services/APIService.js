import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * API Integration Services for GoGuardians Homepage
 * Handles communication between frontend and backend
 */

const API_BASE_URL = 'https://api.gogaurdians.com';

// ============================================
// EMERGENCY ALERT SERVICE
// ============================================

/**
 * Send emergency alert with location and incident type
 * @param {string} userId - User ID
 * @param {string} incidentType - Crime | Medical | Fire | GBV
 * @param {object} location - {latitude, longitude, accuracy}
 * @returns {Promise} Alert ID and status
 */
export const sendEmergencyAlert = async (userId, incidentType, location) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/emergencies`, {
      userId,
      incidentType,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 10,
      },
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
    });

    // Store alert ID locally for reference
    await AsyncStorage.setItem(
      'currentAlertId',
      response.data.alertId
    );

    return {
      success: true,
      alertId: response.data.alertId,
      message: 'Alert sent successfully',
    };
  } catch (error) {
    console.error('Error sending alert:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update emergency alert status
 * @param {string} alertId - Alert ID to update
 * @param {string} status - ACTIVE | CANCELLED | RESOLVED
 * @returns {Promise}
 */
export const updateAlertStatus = async (alertId, status) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/emergencies/${alertId}`,
      { status, updatedAt: new Date().toISOString() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating alert:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// RESOURCES SERVICE
// ============================================

/**
 * Get nearby emergency resources (police, hospitals, shelters)
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {string} type - police | hospital | fire | shelter (optional)
 * @param {number} radius - Search radius in km (default: 5)
 * @returns {Promise} Array of resources
 */
export const getNearbyResources = async (latitude, longitude, type = null, radius = 5) => {
  try {
    const params = {
      lat: latitude,
      lon: longitude,
      radius,
    };

    if (type) params.type = type;

    const response = await axios.get(`${API_BASE_URL}/resources`, { params });

    return {
      success: true,
      resources: response.data.resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        latitude: resource.location.latitude,
        longitude: resource.location.longitude,
        distance: calculateDistance(
          latitude,
          longitude,
          resource.location.latitude,
          resource.location.longitude
        ),
        phone: resource.phone,
        isOpen: resource.isOpen,
        eta: resource.eta, // Estimated time to reach
      })),
    };
  } catch (error) {
    console.error('Error fetching resources:', error);
    return {
      success: false,
      error: error.message,
      resources: [],
    };
  }
};

// ============================================
// EMERGENCY CONTACTS SERVICE
// ============================================

/**
 * Get user's saved emergency contacts
 * @param {string} userId - User ID
 * @returns {Promise} Array of emergency contacts
 */
export const getEmergencyContacts = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/emergency-contacts`
    );

    return {
      success: true,
      contacts: response.data.contacts,
    };
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return {
      success: false,
      error: error.message,
      contacts: [],
    };
  }
};

/**
 * Notify emergency contacts about alert
 * @param {string} userId - User ID
 * @param {string} alertId - Alert ID
 * @param {string} message - Custom message
 * @param {object} location - {latitude, longitude}
 * @returns {Promise}
 */
export const notifyEmergencyContacts = async (
  userId,
  alertId,
  message,
  location
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/${userId}/notify-contacts`,
      {
        alertId,
        message,
        location,
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      notifiedCount: response.data.notifiedCount,
    };
  } catch (error) {
    console.error('Error notifying contacts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Save new emergency contact
 * @param {string} userId - User ID
 * @param {string} name - Contact name
 * @param {string} phone - Phone number
 * @returns {Promise}
 */
export const saveEmergencyContact = async (userId, name, phone) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/${userId}/emergency-contacts`,
      { name, phone }
    );

    return {
      success: true,
      contact: response.data.contact,
    };
  } catch (error) {
    console.error('Error saving contact:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================
// RESPONDER SERVICE
// ============================================

/**
 * Get responder locations for active alert
 * (Only visible after alert is sent)
 * @param {string} alertId - Alert ID
 * @returns {Promise} Array of responder locations
 */
export const getResponderLocations = async (alertId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/emergencies/${alertId}/responders`
    );

    return {
      success: true,
      responders: response.data.responders.map(responder => ({
        id: responder.id,
        type: responder.type, // police | ambulance | fire
        latitude: responder.location.latitude,
        longitude: responder.location.longitude,
        eta: responder.eta, // ETA in minutes
        name: responder.name,
      })),
    };
  } catch (error) {
    console.error('Error fetching responders:', error);
    return {
      success: false,
      error: error.message,
      responders: [],
    };
  }
};

// ============================================
// SAFETY TIPS SERVICE
// ============================================

/**
 * Get incident-specific safety tips
 * @param {string} incidentType - Crime | Medical | Fire | GBV
 * @returns {Promise} Array of safety tips
 */
export const getSafetyTips = async (incidentType) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/safety-tips`,
      { params: { type: incidentType } }
    );

    return {
      success: true,
      tips: response.data.tips,
    };
  } catch (error) {
    console.error('Error fetching safety tips:', error);
    return {
      success: false,
      error: error.message,
      tips: [],
    };
  }
};

// ============================================
// COMMUNITY ALERTS SERVICE
// ============================================

/**
 * Get community alerts nearby
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {number} radius - Search radius in km (default: 2)
 * @returns {Promise} Array of community alerts
 */
export const getCommunityAlerts = async (latitude, longitude, radius = 2) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/community-alerts`, {
      params: {
        lat: latitude,
        lon: longitude,
        radius,
      },
    });

    return {
      success: true,
      alerts: response.data.alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        description: alert.description,
        latitude: alert.location.latitude,
        longitude: alert.location.longitude,
        timestamp: alert.timestamp,
        distance: calculateDistance(
          latitude,
          longitude,
          alert.location.latitude,
          alert.location.longitude
        ),
        severity: alert.severity, // LOW | MEDIUM | HIGH
      })),
    };
  } catch (error) {
    console.error('Error fetching community alerts:', error);
    return {
      success: false,
      error: error.message,
      alerts: [],
    };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - User latitude
 * @param {number} lon1 - User longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {number} Distance in km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c + Number.EPSILON) * 100) / 100; // Round to 2 decimals
};

const toRad = degrees => (degrees * Math.PI) / 180;

/**
 * Setup real-time location tracking
 * (Background location updates for active alerts)
 * @param {string} alertId - Alert ID
 * @param {function} onLocationUpdate - Callback function
 * @returns {function} Cleanup function to stop tracking
 */
export const setupRealtimeLocationTracking = (alertId, onLocationUpdate) => {
  let locationSubscription = null;

  const startTracking = async () => {
    try {
      locationSubscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Or every 5 seconds
        },
        async (location) => {
          const coords = location.coords;

          // Send location to backend
          await axios.post(
            `${API_BASE_URL}/emergencies/${alertId}/location-update`,
            {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              timestamp: new Date().toISOString(),
            }
          );

          // Call callback for UI updates
          onLocationUpdate(coords);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  startTracking();

  // Return cleanup function
  return async () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
  };
};

export default {
  sendEmergencyAlert,
  updateAlertStatus,
  getNearbyResources,
  getEmergencyContacts,
  notifyEmergencyContacts,
  saveEmergencyContact,
  getResponderLocations,
  getSafetyTips,
  getCommunityAlerts,
  calculateDistance,
  setupRealtimeLocationTracking,
};
