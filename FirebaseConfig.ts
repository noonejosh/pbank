import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9LERGeQFPGiUvqs4LxQy7pNeQudBi-ms",
  authDomain: "poweredbank-7c80d.firebaseapp.com",
  projectId: "poweredbank-7c80d",
  storageBucket: "poweredbank-7c80d.appspot.com",
  messagingSenderId: "240194093008",
  appId: "1:240194093008:web:f3bc4b7631bcda773903d5",
  measurementId: "G-M90V592HLS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Get Firebase Auth instance
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


// Firestore Database
export const db = getFirestore(app);
export { auth };
export default app;
