/* ==========================================================================
   knowledge-hub-login.js  (লগইন ভার্সন)
   ইমেইল/পাসওয়ার্ড দিয়ে লগইন/সাইনআপ/লগআউট হ্যান্ডল করে। লগইন সফল হলে
   khApp.js-এর একই ড্যাশবোর্ড লজিক চালু হয়, ব্যবহারকারীর uid দিয়ে।
   ========================================================================== */

import {
  auth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut
} from "./firebase.js";
import { initKhApp } from "./khApp.js";

document.addEventListener("DOMContentLoaded", () => {

  const authCard      = document.getElementById("authCard");
  const khDashboard   = document.getElementById("khDashboard");
  const authForm      = document.getElementById("authForm");
  const authEmail     = document.getElementById("authEmail");
  const authPassword  = document.getElementById("authPassword");
  const authError     = document.getElementById("authError");
  const authSignupBtn = document.getElementById("authSignupBtn");
  const authForgotBtn = document.getElementById("authForgotBtn");
  const logoutBtn       = document.getElementById("logoutBtn");
  const userEmailLabel  = document.getElementById("userEmailLabel");

  function showError(msg){
    authError.textContent = msg;
    authError.style.display = "block";
  }
  function clearError(){
    authError.style.display = "none";
    authError.textContent = "";
  }

  function friendlyError(err){
    const code = (err && err.code) || "";
    if(code.includes("invalid-email"))        return "সঠিক ইমেইল ঠিকানা দিন।";
    if(code.includes("user-not-found"))        return "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। নিচে 'নতুন অ্যাকাউন্ট তৈরি করুন' চাপুন।";
    if(code.includes("wrong-password") ||
       code.includes("invalid-credential"))    return "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।";
    if(code.includes("email-already-in-use"))  return "এই ইমেইলে আগে থেকেই একটা অ্যাকাউন্ট আছে। উপরে 'লগইন করুন' চাপুন।";
    if(code.includes("weak-password"))         return "পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে।";
    if(code.includes("too-many-requests"))     return "অনেকবার চেষ্টা হয়েছে, একটু পরে আবার চেষ্টা করুন।";
    return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করে দেখুন।";
  }

  authForm.addEventListener("submit", async e => {
    e.preventDefault();
    clearError();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if(!email || !password) return;
    const btn = document.getElementById("authLoginBtn");
    btn.disabled = true;
    try{
      await signInWithEmailAndPassword(auth, email, password);
    }catch(err){
      console.error(err);
      showError(friendlyError(err));
    }finally{
      btn.disabled = false;
    }
  });

  authSignupBtn.addEventListener("click", async () => {
    clearError();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if(!email || !password){ showError("ইমেইল ও পাসওয়ার্ড দুটোই লিখুন।"); return; }
    authSignupBtn.disabled = true;
    try{
      await createUserWithEmailAndPassword(auth, email, password);
    }catch(err){
      console.error(err);
      showError(friendlyError(err));
    }finally{
      authSignupBtn.disabled = false;
    }
  });

  authForgotBtn.addEventListener("click", async () => {
    clearError();
    const email = authEmail.value.trim();
    if(!email){ showError("রিসেট লিংক পাঠাতে আগে ইমেইল বক্সে ইমেইল লিখুন।"); return; }
    try{
      await sendPasswordResetEmail(auth, email);
      alert("পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।");
    }catch(err){
      console.error(err);
      showError(friendlyError(err));
    }
  });

  logoutBtn.addEventListener("click", () => {
    if(!confirm("লগআউট করতে চান?")) return;
    signOut(auth);
  });

  onAuthStateChanged(auth, user => {
    if(user){
      authCard.style.display = "none";
      khDashboard.style.display = "block";
      logoutBtn.style.display = "inline-block";
      userEmailLabel.textContent = user.email || "";
      initKhApp(user.uid);
    }else{
      authCard.style.display = "block";
      khDashboard.style.display = "none";
      logoutBtn.style.display = "none";
      userEmailLabel.textContent = "";
    }
  });
});
