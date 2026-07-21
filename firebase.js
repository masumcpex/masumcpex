/* ==========================================================================
   firebase.js
   Firebase অ্যাপ শুরু করে, Firestore আর Analytics চালু করে।
   এই ফাইলটা module হিসেবে import করা হয় — অন্য কোনো ফাইলে Firebase-এর
   কনফিগ কপি করার দরকার নেই, সবাই এখান থেকেই `db` নিয়ে ব্যবহার করবে।
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

/* Analytics মাঝেমধ্যে কিছু ব্রাউজার/ইনকগনিটোতে সাপোর্ট করে না,
   তাই সাপোর্ট চেক করে নিয়ে তারপর চালু করছি, যাতে এরর না আসে। */
isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});

/* বাকি ফাইলগুলো (knowledge-hub.js ইত্যাদি) থেকে সহজে ব্যবহারের জন্য
   দরকারি Firestore ফাংশনগুলোও এখান থেকে re-export করে দিলাম। */
export { collection, doc, addDoc, deleteDoc, onSnapshot, query, where, getDocs };
