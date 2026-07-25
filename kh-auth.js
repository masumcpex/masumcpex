/* ==========================================================================
   kh-auth.js
   Google লগইন নিয়ন্ত্রণ করে। লগইন করার আগে ড্যাশবোর্ড (kh-main) সম্পূর্ণ
   লুকানো থাকে — কেউ লগইন ছাড়া কিছুই দেখতে/লিখতে পারবে না।
   লগইন করলে, শুধু সেই ব্যবহারকারীর নিজের ডেটা (ownerId মিলিয়ে) খুলে যায়
   (এটা khApp.js-এর initKhApp(uid) নিজেই সামলায়)।
   ========================================================================== */

import {
  auth, db, GoogleAuthProvider, FacebookAuthProvider, RecaptchaVerifier,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signInWithPhoneNumber, signOut, onAuthStateChanged,
  collection, getDocs, writeBatch
} from "./firebase.js";
import { initKhApp } from "./khApp.js";

const ADMIN_EMAIL = "masumcpex@gmail.com"; // শুধু এই ইমেইল "পুরনো ডেটা claim করুন" বাটন দেখবে

document.addEventListener("DOMContentLoaded", () => {

  const gate        = document.getElementById("khAuthGate");
  const mainEl      = document.getElementById("khMain");
  const userBar     = document.getElementById("khUserBar");
  const userEmailEl = document.getElementById("khUserEmail");
  const signInBtn   = document.getElementById("googleSignInBtn");
  const fbSignInBtn = document.getElementById("facebookSignInBtn");
  const signOutBtn  = document.getElementById("khSignOutBtn");
  const authError   = document.getElementById("khAuthError");
  const claimBtn    = document.getElementById("khClaimOldDataBtn");

  const showPhoneFormBtn = document.getElementById("showPhoneFormBtn");
  const phoneForm        = document.getElementById("khPhoneForm");
  const phoneInput       = document.getElementById("khPhoneInput");
  const sendCodeBtn      = document.getElementById("khSendCodeBtn");
  const codeRow          = document.getElementById("khCodeRow");
  const codeInput        = document.getElementById("khCodeInput");
  const verifyCodeBtn    = document.getElementById("khVerifyCodeBtn");

  function showAuthError(msg){
    authError.textContent = msg;
    authError.style.display = "block";
  }

  /* ---------------- Google ---------------- */
  signInBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    signInBtn.disabled = true;
    try{
      await signInWithPopup(auth, new GoogleAuthProvider());
    }catch(err){
      console.error(err);
      showAuthError("Google দিয়ে লগইন করা যায়নি: " + (err.code || err.message || "অজানা সমস্যা"));
    }finally{
      signInBtn.disabled = false;
    }
  });

  /* ---------------- Facebook ---------------- */
  fbSignInBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    fbSignInBtn.disabled = true;
    try{
      await signInWithPopup(auth, new FacebookAuthProvider());
    }catch(err){
      console.error(err);
      showAuthError("Facebook দিয়ে লগইন করা যায়নি: " + (err.code || err.message || "অজানা সমস্যা"));
    }finally{
      fbSignInBtn.disabled = false;
    }
  });

  /* redirect ব্যবহার না করলেও, আগে redirect দিয়ে চেষ্টা করা থাকলে সেই ফলাফল/এরর ধরার জন্য রেখে দেওয়া হলো */
  getRedirectResult(auth).catch((err) => {
    console.error(err);
  });

  /* ---------------- ফোন নম্বর (OTP) ---------------- */
  let confirmationResult = null;
  let recaptchaVerifier = null;

  showPhoneFormBtn.addEventListener("click", () => {
    phoneForm.style.display = phoneForm.style.display === "none" ? "block" : "none";
  });

  sendCodeBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    const phone = phoneInput.value.trim();
    if(!phone.startsWith("+")){
      showAuthError("দেশের কোডসহ নম্বর দিন, যেমন: +8801XXXXXXXXX");
      return;
    }
    sendCodeBtn.disabled = true;
    try{
      if(!recaptchaVerifier){
        recaptchaVerifier = new RecaptchaVerifier(auth, "khRecaptchaContainer", { size: "invisible" });
      }
      confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      codeRow.style.display = "flex";
    }catch(err){
      console.error(err);
      showAuthError("কোড পাঠানো যায়নি। নম্বরটা ঠিক আছে কিনা দেখুন, অথবা Firebase Console-এ Phone প্রোভাইডার চালু আছে কিনা চেক করুন।");
    }finally{
      sendCodeBtn.disabled = false;
    }
  });

  verifyCodeBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    if(!confirmationResult) return;
    const code = codeInput.value.trim();
    if(!code){ showAuthError("কোডটি লিখুন।"); return; }
    verifyCodeBtn.disabled = true;
    try{
      await confirmationResult.confirm(code);
    }catch(err){
      console.error(err);
      showAuthError("কোড ভুল হয়েছে, আবার চেষ্টা করুন।");
    }finally{
      verifyCodeBtn.disabled = false;
    }
  });

  signOutBtn.addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if(user){
      gate.style.display = "none";
      mainEl.style.display = "block";
      userBar.style.display = "flex";
      userEmailEl.textContent = user.email || user.phoneNumber || "";

      /* শুধু অ্যাডমিন ইমেইলের জন্য পুরনো (লগইনের আগের) ডেটা claim করার বাটন */
      if(user.email === ADMIN_EMAIL && claimBtn){
        claimBtn.style.display = "inline-block";
        claimBtn.onclick = () => claimOldData(user.uid, claimBtn);
      } else if(claimBtn){
        claimBtn.style.display = "none";
      }

      initKhApp(user.uid);
    }else{
      gate.style.display = "flex";
      mainEl.style.display = "none";
      userBar.style.display = "none";
    }
  });

  /* ---------------- পুরনো (ownerId ছাড়া) ডেটা অ্যাডমিনের নামে করে দেওয়া ----------------
     এটা একবারই চালানো উচিত, টিমের অন্য কেউ লগইন করে নতুন ডেটা লেখার আগে। */
  async function claimOldData(uid, btn){
    if(!confirm("পুরনো সব হাজিরা/সদস্য ডেটা আপনার অ্যাকাউন্টের নামে করে দেওয়া হবে। এটা একবারই করা উচিত। এগিয়ে যেতে চান?")) return;
    btn.disabled = true;
    btn.textContent = "কাজ চলছে...";
    try{
      const batch = writeBatch(db);
      let count = 0;

      const membersSnap = await getDocs(collection(db, "kh_members"));
      membersSnap.forEach(d => {
        if(!("ownerId" in d.data())){ batch.update(d.ref, { ownerId: uid }); count++; }
      });

      const recordsSnap = await getDocs(collection(db, "kh_records"));
      recordsSnap.forEach(d => {
        if(!("ownerId" in d.data())){ batch.update(d.ref, { ownerId: uid }); count++; }
      });

      if(count > 0) await batch.commit();
      alert(`সম্পন্ন! ${count} টা পুরনো এন্ট্রি আপনার অ্যাকাউন্টে যোগ হয়ে গেছে।`);
      btn.style.display = "none";
    }catch(err){
      console.error(err);
      alert("পুরনো ডেটা claim করা যায়নি। কনসোলে এরর দেখুন / Firestore Rules চেক করুন।");
      btn.disabled = false;
      btn.textContent = "🗂️ পুরনো ডেটা নিজের করে নিন";
    }
  }

});
