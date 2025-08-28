// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBZ7kBW8K1aDSN4mXwLpX0mW3XDYcsx4ag",
  authDomain: "weave-together-v1.firebaseapp.com",
  projectId: "weave-together-v1",
  storageBucket: "weave-together-v1.appspot.com",
  messagingSenderId: "654766593432",
  appId: "1:654766593432:web:62c45167013839659d87ed",
  measurementId: "G-0ZXE2PN0ZD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();