/* ==========================================================================
   firebase.js
   Firebase v10 Modular SDK — Firestore + Google Auth (শুধু Knowledge Hub-এর
   এডমিনের জন্য) + Analytics।

   কোনো পেজেই লগইন পপআপ/মোডাল জোর করে দেখানো হয় না — সম্পূর্ণ সাইট
   লগইন ছাড়াই ব্রাউজ করা যায়। Login শুধু Knowledge Hub পেজে, শুধু বাটনে
   চাপলে চালু হয়।
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getAnalytics, logEvent
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let analytics = null;
try { analytics = getAnalytics(app); } catch (e) { console.warn("Analytics init skipped:", e); }

const ADMIN_EMAIL = "masumcpex@gmail.com";

function khSignIn(){ return signInWithRedirect(auth, provider); }
function khSignOut(){ return signOut(auth); }

// পেজ লোড হওয়ার সাথে সাথে চেক করে, রিডাইরেক্ট থেকে ফিরে আসার পর লগইন সম্পূর্ণ হলো কিনা
getRedirectResult(auth).catch((err) => {
  console.error("Google sign-in redirect error:", err);
  alert("লগইনে সমস্যা হয়েছে: " + err.message + "\n\nFirebase Console-এ Authorized domain-এ masumcpex.github.io যোগ করা আছে কিনা চেক করুন।");
});
// callback(isAdmin: boolean, user: object|null)
function khOnAuthChange(callback){
  onAuthStateChanged(auth, (user) => {
    const isAdmin = !!user && user.email === ADMIN_EMAIL;
    callback(isAdmin, user);
  });
}

/* একটাই ডকুমেন্টে পুরো লিস্ট রাখা হচ্ছে:
   khData/members -> { list: [ "নাম১", ... ] }
   khData/records -> { list: [ {id,date,member,status,hours}, ... ] } */
function khWatchDoc(name, callback){
  const ref = doc(db, "khData", name);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data().list || []) : []);
  }, (err) => {
    console.error("Firestore watch error:", err);
    callback(null); // null = সংযোগ সমস্যা, কলিং কোড localStorage fallback ব্যবহার করবে
  });
}
function khSaveDoc(name, list){
  const ref = doc(db, "khData", name);
  return setDoc(ref, { list, updatedAt: Date.now() });
}

function khLogEvent(name, params){
  if(analytics) logEvent(analytics, name, params || {});
}

// non-module স্ক্রিপ্ট থেকেও ব্যবহারের সুবিধার জন্য window-এ এক্সপোজ
window.khFirebase = {
  auth, ADMIN_EMAIL,
  signIn: khSignIn,
  signOut: khSignOut,
  onAuthChange: khOnAuthChange,
  watchDoc: khWatchDoc,
  saveDoc: khSaveDoc,
  logEvent: khLogEvent
};

export { khSignIn, khSignOut, khOnAuthChange, khWatchDoc, khSaveDoc, khLogEvent, ADMIN_EMAIL };
