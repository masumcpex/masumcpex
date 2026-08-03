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
  collection, getDocs, writeBatch,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail
} from "./firebase.js";
import { initKhApp } from "./khApp.js";

const ADMIN_EMAIL = "admin@masumcpex.com"; // শুধু এই ইমেইল "পুরনো ডেটা claim করুন" বাটন দেখবে

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

  /* ---------------- Facebook ----------------
     মোবাইলে Facebook-এর "আগে লগইন করেছিলেন, Continue করবেন?" কনফার্মেশন
     ধাপটা নতুন ট্যাবে খোলার প্রবণতা আছে, যেটা popup-এর sessionStorage
     ভেঙে দেয় ("missing initial state" এরর)। তাই এখানে redirect ব্যবহার
     করা হচ্ছে — পুরো পেজ একই ট্যাবে Facebook-এ যাবে, তারপর ফিরে আসবে। */
  fbSignInBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    fbSignInBtn.disabled = true;
    try{
      await signInWithRedirect(auth, new FacebookAuthProvider());
    }catch(err){
      console.error(err);
      showAuthError("Facebook দিয়ে লগইন করা যায়নি: " + (err.code || err.message || "অজানা সমস্যা"));
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
    if(!confirm("লগইন সিস্টেম চালু হওয়ার আগের সব হাজিরা/সদস্য ডেটা (আগের ownerId যাই থাকুক) আপনার এই অ্যাকাউন্টের নামে করে দেওয়া হবে। এটা একবারই করা উচিত। এগিয়ে যেতে চান?")) return;
    btn.disabled = true;
    btn.textContent = "কাজ চলছে...";
    try{
      const batch = writeBatch(db);
      let count = 0;

      const membersSnap = await getDocs(collection(db, "kh_members"));
      membersSnap.forEach(d => {
        if(d.data().ownerId !== uid){ batch.update(d.ref, { ownerId: uid }); count++; }
      });

      const recordsSnap = await getDocs(collection(db, "kh_records"));
      recordsSnap.forEach(d => {
        if(d.data().ownerId !== uid){ batch.update(d.ref, { ownerId: uid }); count++; }
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

/* ==========================================================================
   নতুন — Welcome Back / Create Account টগল + ইমেইল-পাসওয়ার্ড লগইন
   এটা সম্পূর্ণ আলাদা DOMContentLoaded ব্লক, উপরের Google/Facebook/Phone
   কোড এক লাইনও ছোঁয়া হয়নি — সেগুলো আগের মতোই কাজ করবে।
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const authError = document.getElementById("khAuthError");

  const tabLogin  = document.getElementById("khTabLogin");
  const tabSignup = document.getElementById("khTabSignup");
  const subtitle  = document.getElementById("khAuthSubtitle");
  const confirmRow = document.getElementById("khConfirmPasswordRow");
  const forgotBtn = document.getElementById("khForgotPasswordBtn");
  const submitBtn = document.getElementById("khEmailSubmitBtn");

  const emailInput    = document.getElementById("khEmailInput");
  const passwordInput = document.getElementById("khPasswordInput");
  const confirmInput  = document.getElementById("khConfirmPasswordInput");

  const switchToSignupWrap = document.getElementById("khSwitchToSignupWrap");
  const switchToLoginWrap  = document.getElementById("khSwitchToLoginWrap");
  const switchToSignupBtn  = document.getElementById("khSwitchToSignup");
  const switchToLoginBtn   = document.getElementById("khSwitchToLogin");

  if(!tabLogin || !tabSignup || !submitBtn) return; // এই এলিমেন্টগুলো না থাকলে কিছু করার নেই

  let mode = "login"; // "login" | "signup"

  function showAuthError(msg){
    if(!authError) return;
    authError.textContent = msg;
    authError.style.display = "block";
  }
  function clearAuthError(){
    if(!authError) return;
    authError.style.display = "none";
  }

  function setMode(newMode){
    mode = newMode;
    const isLogin = mode === "login";

    tabLogin.classList.toggle("kh-auth-tab-active", isLogin);
    tabSignup.classList.toggle("kh-auth-tab-active", !isLogin);

    confirmRow.style.display = isLogin ? "none" : "flex";
    forgotBtn.style.display  = isLogin ? "inline-block" : "none";
    submitBtn.textContent    = isLogin ? "লগ ইন" : "অ্যাকাউন্ট তৈরি করুন";
    subtitle.textContent     = isLogin
      ? "নিজের হাজিরা দেখতে ও লিখতে সাইন-ইন করুন। প্রতিটি অ্যাকাউন্ট শুধু নিজের ডেটাই দেখতে পাবে।"
      : "নতুন অ্যাকাউন্ট তৈরি করে নিজের হাজিরা খাতা শুরু করুন।";

    switchToSignupWrap.style.display = isLogin ? "inline" : "none";
    switchToLoginWrap.style.display  = isLogin ? "none" : "inline";

    clearAuthError();
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabSignup.addEventListener("click", () => setMode("signup"));
  switchToSignupBtn?.addEventListener("click", () => setMode("signup"));
  switchToLoginBtn?.addEventListener("click", () => setMode("login"));

  /* পাসওয়ার্ড চোখ আইকন — দেখান/লুকান */
  document.querySelectorAll(".kh-pass-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if(!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "🙈" : "👁️";
    });
  });

  /* লগ ইন / অ্যাকাউন্ট তৈরি */
  submitBtn.addEventListener("click", async () => {
    clearAuthError();
    const email = (emailInput.value || "").trim();
    const password = passwordInput.value || "";

    if(!email || !password){
      showAuthError("ইমেইল ও পাসওয়ার্ড দুটোই দিন।");
      return;
    }

    submitBtn.disabled = true;
    try{
      if(mode === "login"){
        await signInWithEmailAndPassword(auth, email, password);
      }else{
        const confirmPass = confirmInput.value || "";
        if(password.length < 6){
          showAuthError("পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে।");
          return;
        }
        if(password !== confirmPass){
          showAuthError("দুটো পাসওয়ার্ড মিলছে না।");
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
    }catch(err){
      console.error(err);
      showAuthError("লগইন করা যায়নি: " + (err.code || err.message || "অজানা সমস্যা"));
    }finally{
      submitBtn.disabled = false;
    }
  });

  /* পাসওয়ার্ড ভুলে গেছেন */
  forgotBtn.addEventListener("click", async () => {
    clearAuthError();
    const email = (emailInput.value || "").trim();
    if(!email){
      showAuthError("আগে উপরে আপনার ইমেইলটা লিখুন, তারপর 'পাসওয়ার্ড ভুলে গেছেন?' চাপুন।");
      return;
    }
    try{
      await sendPasswordResetEmail(auth, email);
      showAuthError("পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইনবক্স (ও স্প্যাম ফোল্ডার) চেক করুন।");
    }catch(err){
      console.error(err);
      showAuthError("রিসেট লিংক পাঠানো যায়নি: " + (err.code || err.message || "অজানা সমস্যা"));
    }
  });

});
