// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9LERGeQFPGiUvqs4LxQy7pNeQudBi-ms",
  authDomain: "poweredbank-7c80d.firebaseapp.com",
  projectId: "poweredbank-7c80d",
  storageBucket: "poweredbank-7c80d.firebasestorage.app",
  messagingSenderId: "240194093008",
  appId: "1:240194093008:web:f3bc4b7631bcda773903d5",
  measurementId: "G-M90V592HLS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;