import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth,setPersistence,browserLocalPersistence  } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'; // Correct import for Firestore

const firebaseConfig = {
  apiKey: "AIzaSyBb2lQMvr2S9qZZTXE_ODT4OtcrlVFiyV0",
  authDomain: "qsar-992b5.firebaseapp.com",
  projectId: "qsar-992b5",
  storageBucket: "qsar-992b5.firebasestorage.app",
  messagingSenderId: "420593391680",
  appId: "1:420593391680:web:6634652564d5e0cd56e7a5",
  measurementId: "G-G1DVLMVHPH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Persistence set to browserLocalPersistence');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });
  
export { app, auth,db };
