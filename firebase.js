/* ==========================================================================
   firebase.js
   Masum Notes — Firebase App + Firestore + Auth initialization

   দুইটা মোড সাপোর্ট করে:
   ১) Anonymous (no-login) — knowledge-hub.html / knowledge-hub.js ব্যবহার করে
   ২) Email/Password (login) — knowledge-hub-login.html / knowledge-hub-login.js ব্যবহার করে

   দুইটার জন্যই Firestore rules একই থাকে — কারণ rule শুধু চেক করে
   request.auth.uid, সেটা anonymous হোক বা email-লগইন হোক, কোনো তফাত নেই।
   এই ফাইলটি ES module — সব HTML পেজে type="module" দিয়ে script লোড হতে হবে।
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// আপনার Firebase প্রজেক্ট কনফিগ (masumcpex-f65cf)
const firebaseConfig = {
  apiKey: "AIzaSyDp8J-8XI-wGtn3MYNjauEyDHoIt7WhnCY",
  authDomain: "masumcpex-f65cf.firebaseapp.com",
  projectId: "masumcpex-f65cf",
  storageBucket: "masumcpex-f65cf.firebasestorage.app",
  messagingSenderId: "535080144365",
  appId: "1:535080144365:web:2836f3fd49f33d4cf76be4",
  measurementId: "G-YWN0YE6M7H"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * --- Anonymous মোডের জন্য ---
 * এই ডিভাইসের anonymous UID রেডি হলে callback(uid) কল হবে।
 * কোনো UI ছাড়াই স্বয়ংক্রিয়ভাবে সাইন-ইন হয়ে যায়।
 */
export function khWhenReady(callback){
  onAuthStateChanged(auth, user => {
    if(user){
      callback(user.uid);
    }else{
      signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));
    }
  });
}

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch
};
