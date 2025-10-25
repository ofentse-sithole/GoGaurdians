import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  getReactNativePersistence, 
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; //Realtime DB

const firebaseConfig = {
  apiKey: "AIzaSyD_uvQqGPm9a3MOWo0PcRA8Ki8PT89QYV0",
  authDomain: "gogaurdian-a48a3.firebaseapp.com",
  databaseURL: "https://gogaurdian-a48a3-default-rtdb.firebaseio.com",
  projectId: "gogaurdian-a48a3",
  storageBucket: "gogaurdian-a48a3.firebasestorage.app",
  messagingSenderId: "936286639319",
  appId: "1:936286639319:web:ddb3755c3159ce56208c92"
};

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