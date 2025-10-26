/**
 * Config.js - Environment Configuration
 * Provides centralized API endpoints and configuration for the app
 * For React Native/Expo compatibility, uses direct values instead of requiring .env parsing
 */

const ENV = {
  dev: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    apiV1Url: process.env.API_V1_URL || 'http://localhost:3000/api/v1',
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    },
    maps: {
      apiKey: process.env.MAPS_API_KEY,
    },
    apiEndpoints: {
      location: process.env.LOCATION_SERVICE_URL || 'http://localhost:3000/api/v1/location',
      // Auth endpoints removed: using Firebase Auth SDK instead of custom backend auth routes
      emergency: {
        alert: process.env.EMERGENCY_ALERT_URL || 'http://localhost:3000/api/v1/emergency/alert',
        report: process.env.INCIDENT_REPORT_URL || 'http://localhost:3000/api/v1/incidents/report',
        communityAlerts: process.env.COMMUNITY_ALERTS_URL || 'http://localhost:3000/api/v1/alerts/community',
      },
      user: {
        profile: process.env.USER_PROFILE_URL || 'http://localhost:3000/api/v1/user/profile',
        emergencyContacts: process.env.EMERGENCY_CONTACTS_URL || 'http://localhost:3000/api/v1/user/emergency-contacts',
        settings: process.env.USER_SETTINGS_URL || 'http://localhost:3000/api/v1/user/settings',
        reports: process.env.USER_REPORTS_URL || 'http://localhost:3000/api/v1/user/reports',
      },
      ai: {
        assistance: process.env.AI_ASSISTANT_URL || 'http://localhost:3000/api/v1/ai/assistance',
      },
      safety: {
        tips: process.env.SAFETY_TIPS_URL || 'http://localhost:3000/api/v1/safety/tips',
        safeRoute: process.env.SAFE_ROUTE_URL || 'http://localhost:3000/api/v1/routes/safe-route',
      },
      business: {
        login: process.env.BUSINESS_LOGIN_URL || 'http://localhost:3000/api/v1/business/auth/login',
        register: process.env.BUSINESS_REGISTER_URL || 'http://localhost:3000/api/v1/business/auth/register',
        profile: process.env.BUSINESS_PROFILE_URL || 'http://localhost:3000/api/v1/business/profile',
      },
    },
    environment: process.env.ENVIRONMENT || 'development',
    debugMode: process.env.DEBUG_MODE === 'true',
    apiTimeout: parseInt(process.env.API_TIMEOUT) || 30000,
    appVersion: process.env.APP_VERSION || '1.0.0',
  },
  prod: {
    apiBaseUrl: process.env.API_BASE_URL,
    apiV1Url: process.env.API_V1_URL,
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    },
    maps: {
      apiKey: process.env.MAPS_API_KEY,
    },
    apiEndpoints: {
      location: process.env.LOCATION_SERVICE_URL,
      // Auth endpoints removed: using Firebase Auth SDK instead of custom backend auth routes
      emergency: {
        alert: process.env.EMERGENCY_ALERT_URL,
        report: process.env.INCIDENT_REPORT_URL,
        communityAlerts: process.env.COMMUNITY_ALERTS_URL,
      },
      user: {
        profile: process.env.USER_PROFILE_URL,
        emergencyContacts: process.env.EMERGENCY_CONTACTS_URL,
        settings: process.env.USER_SETTINGS_URL,
        reports: process.env.USER_REPORTS_URL,
      },
      ai: {
        assistance: process.env.AI_ASSISTANT_URL,
      },
      safety: {
        tips: process.env.SAFETY_TIPS_URL,
        safeRoute: process.env.SAFE_ROUTE_URL,
      },
      business: {
        login: process.env.BUSINESS_LOGIN_URL,
        register: process.env.BUSINESS_REGISTER_URL,
        profile: process.env.BUSINESS_PROFILE_URL,
      },
    },
    environment: process.env.ENVIRONMENT || 'production',
    debugMode: false,
    apiTimeout: parseInt(process.env.API_TIMEOUT) || 30000,
    appVersion: process.env.APP_VERSION,
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

// Export configuration
const config = getEnvVars();

export default config;
