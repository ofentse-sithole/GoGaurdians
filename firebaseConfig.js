import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // Realtime DB

// Read secure values injected at build time via app.config.js -> extra.firebase
const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
const firebaseExtra = extra.firebase || {};

const firebaseConfig = {
  apiKey: firebaseExtra.apiKey,
  authDomain: firebaseExtra.authDomain,
  databaseURL: firebaseExtra.databaseURL,
  projectId: firebaseExtra.projectId,
  storageBucket: firebaseExtra.storageBucket,
  messagingSenderId: firebaseExtra.messagingSenderId,
  appId: firebaseExtra.appId,
};

// Basic sanity check to help during local setup
if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
  console.warn(
    '[firebaseConfig] Missing Firebase credentials. Check your .env and app.config.js injection.'
  );
}

const app = initializeApp(firebaseConfig);

// Only initialize auth once (important for React Native with Hermes)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err) {
  auth = getAuth(app); // fallback if already initialized
}

// Firestore (for personal data)
const firestore = getFirestore(app);

// Realtime Database (for business data)
const realtimeDB = getDatabase(app);

export { auth, firestore, realtimeDB };