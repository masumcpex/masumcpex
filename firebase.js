/* ==========================================================================
   firebase.js
   Firebase অ্যাপ শুরু করে, Firestore, Auth (Google লগইন), আর Analytics চালু করে।
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDp8J-8XI-wGtn3MYNjauEyDHoIt7WhnCY",
  authDomain: "masumcpex-f65cf.firebaseapp.com",
  projectId: "masumcpex-f65cf",
  storageBucket: "masumcpex-f65cf.firebasestorage.app",
  messagingSenderId: "535080144365",
  appId: "1:535080144365:web:2836f3fd49f33d4cf76be4",
  measurementId: "G-YWN0YE6M7H"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});

export {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs,
  serverTimestamp, writeBatch,
  GoogleAuthProvider, FacebookAuthProvider, RecaptchaVerifier,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signInWithPhoneNumber, signOut, onAuthStateChanged
};
