import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBrOLRbgEJXailwr66AmNr_W73o8OVsNlA",
  authDomain: "webchat-2da0b.firebaseapp.com",
  projectId: "webchat-2da0b",
  storageBucket: "webchat-2da0b.firebasestorage.app",
  messagingSenderId: "985138349762",
  appId: "1:985138349762:web:32b3494ef8612bb1315d5b",
  measurementId: "G-PJ7HY6LWNG"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);