import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database'; // Realtime DB

// Prefer config injected by app.config.js (from .env) so dev, preview, and prod stay consistent
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

// Helpful diagnostics to catch misconfigurations
const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missing = required.filter((k) => !firebaseConfig[k]);
if (missing.length) {
  const maskedKey = firebaseConfig.apiKey ? `${String(firebaseConfig.apiKey).slice(0, 6)}…` : 'undefined';
  console.warn(
    `[firebaseConfig] Missing Firebase credentials: ${missing.join(', ')}. apiKey=${maskedKey}. Check your .env and app.config.js injection.`
  );
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err) {
  auth = getAuth(app); // fallback if already initialized
}

// Firestore (for user/personal data)
const firestore = getFirestore(app);

// Storage (for avatars and media)
const storage = getStorage(app);

// Realtime Database (for business data)
const realtimeDB = getDatabase(app);

export { auth, firestore, realtimeDB, storage };
