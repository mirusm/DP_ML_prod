// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBb2lQMvr2S9qZZTXE_ODT4OtcrlVFiyV0",
  authDomain: "qsar-992b5.firebaseapp.com",
  projectId: "qsar-992b5",
  storageBucket: "qsar-992b5.firebasestorage.app",
  messagingSenderId: "420593391680",
  appId: "1:420593391680:web:6634652564d5e0cd56e7a5",
  measurementId: "G-G1DVLMVHPH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
export {app, auth};