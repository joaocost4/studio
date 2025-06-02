
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBv7YsuLx1ODwScyvSWpncAiQMJxNkJXq0",
  authDomain: "moranguinho-643b3.firebaseapp.com",
  projectId: "moranguinho-643b3",
  storageBucket: "moranguinho-643b3.firebasestorage.app",
  messagingSenderId: "912956126431",
  appId: "1:912956126431:web:7c1e34f58e97a39e02a56a",
  measurementId: "G-GMDWFVDE9H"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
