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
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  sendEmailVerification, updateProfile
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
  const changeNumberBtn = document.getElementById("khChangeNumberBtn");

  /* ব্যর্থ চেষ্টার পর reCAPTCHA widget নষ্ট/ব্যবহৃত অবস্থায় থেকে যেত —
     সেটাই ছিল "দ্বিতীয়বার কোড পাঠানো যাচ্ছে না" সমস্যার মূল কারণ।
     এখন প্রতিটা ব্যর্থ চেষ্টার পর verifier সম্পূর্ণ রিসেট করে দেওয়া হয়,
     যাতে পরের ক্লিকে সবসময় একটা সতেজ (fresh) widget তৈরি হয়। */
  function resetRecaptcha(){
    try{ recaptchaVerifier?.clear(); }catch(e){ /* ignore */ }
    recaptchaVerifier = null;
    const container = document.getElementById("khRecaptchaContainer");
    if(container) container.innerHTML = "";
  }

  async function ensureRecaptcha(){
    if(recaptchaVerifier) return recaptchaVerifier;
    recaptchaVerifier = new RecaptchaVerifier(auth, "khRecaptchaContainer", { size: "invisible" });
    await recaptchaVerifier.render(); // render আগেই সেরে রাখা হচ্ছে, যাতে render-এর এরর এখানেই ধরা পড়ে
    return recaptchaVerifier;
  }

  function normalizePhone(raw){
    return (raw || "").trim().replace(/[\s\-()]/g, ""); // স্পেস/ড্যাশ/বন্ধনী বাদ — Firebase-এর কড়া E.164 ফরম্যাট লাগে
  }
  const PHONE_RE = /^\+[1-9]\d{7,14}$/;

  showPhoneFormBtn.addEventListener("click", () => {
    phoneForm.style.display = phoneForm.style.display === "none" ? "block" : "none";
  });

  sendCodeBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    const phone = normalizePhone(phoneInput.value);
    if(!PHONE_RE.test(phone)){
      showAuthError("দেশের কোডসহ সঠিক নম্বর দিন, যেমন: +60123456789");
      return;
    }
    sendCodeBtn.disabled = true;
    const originalLabel = sendCodeBtn.textContent;
    sendCodeBtn.textContent = "কোড পাঠানো হচ্ছে...";
    try{
      const verifier = await ensureRecaptcha();
      confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
      codeRow.style.display = "flex";
      if(changeNumberBtn) changeNumberBtn.style.display = "block";
      codeInput.value = "";
      codeInput.focus();
    }catch(err){
      console.error(err);
      resetRecaptcha(); // পরের চেষ্টায় নতুন widget তৈরি হবে
      if(err.code === "auth/invalid-phone-number"){
        showAuthError("ফোন নম্বরটি সঠিক নয়। দেশের কোডসহ আবার লিখুন, যেমন: +60123456789");
      }else if(err.code === "auth/too-many-requests" || err.code === "auth/quota-exceeded"){
        showAuthError("অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      }else if(err.code === "auth/captcha-check-failed" || err.code === "auth/argument-error"){
        showAuthError("যাচাইকরণে সমস্যা হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
      }else{
        showAuthError("কোড পাঠানো যায়নি। ইন্টারনেট সংযোগ চেক করুন, অথবা Firebase Console-এ Phone প্রোভাইডার চালু আছে কিনা দেখুন।");
      }
    }finally{
      sendCodeBtn.disabled = false;
      sendCodeBtn.textContent = originalLabel;
    }
  });

  phoneInput.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); sendCodeBtn.click(); }
  });

  verifyCodeBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    if(!confirmationResult){
      showAuthError("আগে ফোন নম্বরে কোড পাঠান।");
      return;
    }
    const code = codeInput.value.trim();
    if(!code){ showAuthError("কোডটি লিখুন।"); return; }
    verifyCodeBtn.disabled = true;
    const originalLabel = verifyCodeBtn.textContent;
    verifyCodeBtn.textContent = "যাচাই করা হচ্ছে...";
    try{
      await confirmationResult.confirm(code);
      // সফল হলে onAuthStateChanged (নিচে) বাকিটা সামলাবে
    }catch(err){
      console.error(err);
      if(err.code === "auth/invalid-verification-code"){
        showAuthError("কোড ভুল হয়েছে, আবার চেষ্টা করুন।");
      }else if(err.code === "auth/code-expired"){
        showAuthError("কোডের মেয়াদ শেষ হয়ে গেছে। নিচে থেকে নতুন কোড চান।");
        confirmationResult = null;
        codeRow.style.display = "none";
        if(changeNumberBtn) changeNumberBtn.style.display = "none";
        resetRecaptcha();
      }else{
        showAuthError("যাচাই করা যায়নি: " + (err.code || err.message || "অজানা সমস্যা"));
      }
    }finally{
      verifyCodeBtn.disabled = false;
      verifyCodeBtn.textContent = originalLabel;
    }
  });

  codeInput.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); verifyCodeBtn.click(); }
  });

  /* নম্বর ভুল লিখলে/অন্য নম্বর দিয়ে আবার চেষ্টা করতে চাইলে — পুরো ফর্ম রিলোড না করেই */
  changeNumberBtn?.addEventListener("click", () => {
    authError.style.display = "none";
    confirmationResult = null;
    codeRow.style.display = "none";
    changeNumberBtn.style.display = "none";
    codeInput.value = "";
    resetRecaptcha();
    phoneInput.focus();
  });

  signOutBtn.addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if(user){
      /* নতুন — শুধুমাত্র Email/Password দিয়ে সাইন-আপ করা এবং এখনো ইমেইল
         ভেরিফাই করেননি এমন ইউজারের জন্য ভেরিফিকেশন গেট দেখানো হয়।
         providerId === "password" চেক করার কারণে এটা শুধু email/password
         ইউজারদের জন্যই প্রযোজ্য — Google, Facebook, Phone ইউজারদের জন্য
         এই শর্ত কখনো true হবে না, তাই তাদের ফ্লো নিচের else-if এর মতোই
         অপরিবর্তিত থাকে (Google-এর জন্য এই ব্লকে কোনো আচরণগত পরিবর্তন নেই)। */
      const isPasswordUser = user.providerData.some(p => p.providerId === "password");
      if(isPasswordUser && !user.emailVerified){
        gate.style.display = "flex";
        mainEl.style.display = "none";
        userBar.style.display = "none";
        if(window.__khShowVerifyGate) window.__khShowVerifyGate(user);
        return;
      }

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
      if(window.__khHideVerifyGate) window.__khHideVerifyGate();
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
   Welcome Back / Create Account টগল + ইমেইল-পাসওয়ার্ড লগইন
   এটা সম্পূর্ণ আলাদা DOMContentLoaded ব্লক, উপরের Google/Facebook/Phone
   কোড এক লাইনও ছোঁয়া হয়নি — সেগুলো আগের মতোই কাজ করবে।

   আগে এই ব্লকটা khTabLogin/khTabSignup ইত্যাদি এমন সব element খুঁজত যেগুলো
   বর্তমান HTML-এ নেই (পুরনো ডিজাইনের জন্য লেখা হয়েছিল) — ফলে শুরুতেই
   `return` হয়ে পুরো ব্লকটাই নিষ্ক্রিয় থাকত। এখন বর্তমান HTML-এর আসল আইডি
   (khToggleModeBtn, khConfirmPasswordWrap, khTogglePassword ইত্যাদি) দিয়ে
   ঠিক করা হলো।
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const authError = document.getElementById("khAuthError");
  const authTitle = document.getElementById("khAuthTitle");
  const subtitle  = document.getElementById("khAuthSubtitle");

  const form        = document.getElementById("khEmailForm");
  const submitBtn   = document.getElementById("khEmailSubmitBtn");
  const forgotBtn   = document.getElementById("khForgotPasswordBtn");
  const toggleModeBtn = document.getElementById("khToggleModeBtn");
  const toggleText    = document.getElementById("khToggleText");

  const fullNameWrap  = document.getElementById("khFullNameWrap");
  const fullNameInput = document.getElementById("khFullNameInput");
  const fullNameError = document.getElementById("khFullNameError");

  const emailInput = document.getElementById("khEmailInput");
  const emailError = document.getElementById("khEmailError");

  const passwordInput = document.getElementById("khPasswordInput");
  const passwordError = document.getElementById("khPasswordError");
  const togglePasswordBtn = document.getElementById("khTogglePassword");

  const confirmWrap  = document.getElementById("khConfirmPasswordWrap");
  const confirmInput = document.getElementById("khConfirmPasswordInput");
  const confirmError = document.getElementById("khConfirmPasswordError");
  const toggleConfirmBtn = document.getElementById("khToggleConfirmPassword");

  const termsWrap  = document.getElementById("khTermsWrap");
  const termsCheckbox = document.getElementById("khTermsCheckbox");
  const termsError = document.getElementById("khTermsError");

  const loginSignupBox = document.getElementById("khLoginSignupBox");
  const verifyBox      = document.getElementById("khVerifyEmailBox");
  const resendBtn       = document.getElementById("khResendVerificationBtn");
  const backToLoginBtn  = document.getElementById("khBackToLoginBtn");
  const verifyError     = document.getElementById("khVerifyError");

  if(!form || !submitBtn || !toggleModeBtn) return; // এই এলিমেন্টগুলো না থাকলে কিছু করার নেই

  let mode = "login"; // "login" | "signup"
  let isSubmitting = false;

  /* ---------------- এরর হেল্পার ---------------- */
  function showAuthError(msg){
    if(!authError) return;
    authError.textContent = msg;
    authError.style.display = "block";
  }
  function clearAuthError(){
    if(!authError) return;
    authError.style.display = "none";
    authError.textContent = "";
  }
  function setFieldError(input, errorEl, msg){
    if(input) input.classList.add("kh-input-error");
    if(errorEl) errorEl.textContent = msg;
  }
  function clearFieldError(input, errorEl){
    if(input) input.classList.remove("kh-input-error");
    if(errorEl) errorEl.textContent = "";
  }
  function clearAllFieldErrors(){
    clearFieldError(fullNameInput, fullNameError);
    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);
    clearFieldError(confirmInput, confirmError);
    if(termsError) termsError.textContent = "";
  }

  /* এরর হলে user টাইপ করা শুরু করলে সেই ফিল্ডের error auto-clear হবে */
  fullNameInput?.addEventListener("input", () => clearFieldError(fullNameInput, fullNameError));
  emailInput?.addEventListener("input", () => clearFieldError(emailInput, emailError));
  passwordInput?.addEventListener("input", () => clearFieldError(passwordInput, passwordError));
  confirmInput?.addEventListener("input", () => clearFieldError(confirmInput, confirmError));
  termsCheckbox?.addEventListener("change", () => { if(termsError) termsError.textContent = ""; });

  /* ---------------- Login / Sign up মোড টগল ---------------- */
  function setMode(newMode){
    mode = newMode;
    const isLogin = mode === "login";

    fullNameWrap.style.display = isLogin ? "none" : "block";
    confirmWrap.style.display  = isLogin ? "none" : "block";
    termsWrap.style.display    = isLogin ? "none" : "block";
    forgotBtn.style.display    = isLogin ? "inline-block" : "none";
    submitBtn.textContent      = isLogin ? "Log In" : "Create Account";
    if(authTitle) authTitle.textContent = isLogin ? "Welcome Back" : "Create Account";
    if(subtitle) subtitle.textContent   = isLogin
      ? "Sign in to continue to Knowledge Hub"
      : "Join Knowledge Hub today";
    if(toggleText) toggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleModeBtn.textContent = isLogin ? "Sign up" : "Log In";

    clearAuthError();
    clearAllFieldErrors();
  }

  toggleModeBtn.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

  /* ---------------- পাসওয়ার্ড eye আইকন (show/hide, keyboard accessible) ---------------- */
  function wireEyeToggle(btn, input){
    if(!btn || !input) return;
    btn.addEventListener("click", () => {
      const willShow = input.type === "password";
      input.type = willShow ? "text" : "password";
      btn.textContent = willShow ? "🙈" : "👁";
      btn.setAttribute("aria-pressed", String(willShow));
      btn.setAttribute("aria-label", willShow ? "Hide password" : "Show password");
    });
  }
  wireEyeToggle(togglePasswordBtn, passwordInput);
  wireEyeToggle(toggleConfirmBtn, confirmInput);

  /* ---------------- ভ্যালিডেশন ---------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmail(){
    const value = (emailInput.value || "").trim();
    if(!value){ setFieldError(emailInput, emailError, "Email is required."); return false; }
    if(!EMAIL_RE.test(value)){ setFieldError(emailInput, emailError, "Please enter a valid email address."); return false; }
    clearFieldError(emailInput, emailError);
    return true;
  }

  function validateLoginPassword(){
    if(!passwordInput.value){ setFieldError(passwordInput, passwordError, "Password is required."); return false; }
    clearFieldError(passwordInput, passwordError);
    return true;
  }

  function validateFullName(){
    const value = (fullNameInput.value || "").trim();
    if(!value){ setFieldError(fullNameInput, fullNameError, "Full name is required."); return false; }
    if(value.length < 2){ setFieldError(fullNameInput, fullNameError, "Please enter your full name."); return false; }
    clearFieldError(fullNameInput, fullNameError);
    return true;
  }

  function validateSignupPassword(){
    if(!passwordInput.value){ setFieldError(passwordInput, passwordError, "Password is required."); return false; }
    if(passwordInput.value.length < 8){ setFieldError(passwordInput, passwordError, "Password must be at least 8 characters."); return false; }
    clearFieldError(passwordInput, passwordError);
    return true;
  }

  function validateConfirmPassword(){
    if(!confirmInput.value){ setFieldError(confirmInput, confirmError, "Please confirm your password."); return false; }
    if(confirmInput.value !== passwordInput.value){ setFieldError(confirmInput, confirmError, "Passwords do not match."); return false; }
    clearFieldError(confirmInput, confirmError);
    return true;
  }

  function validateTerms(){
    if(!termsCheckbox.checked){ termsError.textContent = "Please accept the Terms & Conditions."; return false; }
    termsError.textContent = "";
    return true;
  }

  /* ---------------- Firebase error code → ফিল্ড-লেভেল বার্তা ---------------- */
  function handleAuthError(err){
    const code = err && err.code ? err.code : "";
    if(mode === "login"){
      if(code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials"){
        setFieldError(passwordInput, passwordError, "ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।");
        return;
      }
      if(code === "auth/user-not-found"){
        setFieldError(emailInput, emailError, "No account found with this email.");
        return;
      }
      if(code === "auth/invalid-email"){
        setFieldError(emailInput, emailError, "Please enter a valid email address.");
        return;
      }
      if(code === "auth/too-many-requests"){
        showAuthError("Too many attempts. Please wait a moment and try again.");
        return;
      }
      showAuthError("Login failed: " + (err.message || "Unknown error."));
    }else{
      if(code === "auth/email-already-in-use"){
        setFieldError(emailInput, emailError, "This email is already registered.");
        return;
      }
      if(code === "auth/invalid-email"){
        setFieldError(emailInput, emailError, "Please enter a valid email address.");
        return;
      }
      if(code === "auth/weak-password"){
        setFieldError(passwordInput, passwordError, "Password is too weak. Please choose a stronger password.");
        return;
      }
      showAuthError("Account creation failed: " + (err.message || "Unknown error."));
    }
  }

  /* ---------------- ফর্ম সাবমিট (Enter কী দিয়েও কাজ করবে) ---------------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if(isSubmitting) return; // ডুপ্লিকেট রিকোয়েস্ট প্রতিরোধ
    clearAuthError();

    let valid = validateEmail();
    if(mode === "login"){
      if(!validateLoginPassword()) valid = false;
    }else{
      if(!validateFullName()) valid = false;
      if(!validateSignupPassword()) valid = false;
      if(!validateConfirmPassword()) valid = false;
      if(!validateTerms()) valid = false;
    }
    if(!valid) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    isSubmitting = true;
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = mode === "login" ? "Logging in…" : "Creating account…";

    try{
      if(mode === "login"){
        await signInWithEmailAndPassword(auth, email, password);
        // সফল হলে onAuthStateChanged (উপরের ব্লক) নিজেই gate লুকিয়ে dashboard দেখাবে
      }else{
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const name = fullNameInput.value.trim();
        if(name){
          try{ await updateProfile(cred.user, { displayName: name }); }
          catch(profileErr){ console.error(profileErr); }
        }
        try{
          await sendEmailVerification(cred.user);
        }catch(verifyErr){
          // সাইন-আপ সফল হয়েছে, শুধু ভেরিফিকেশন ইমেইল পাঠাতে সমস্যা হয়েছে —
          // ইউজার verify-gate স্ক্রিনেই "Resend" বাটন দিয়ে আবার চেষ্টা করতে পারবেন
          console.error(verifyErr);
        }
        // onAuthStateChanged এখন user.emailVerified === false দেখে নিজে থেকেই
        // verify-email গেট দেখাবে (নিচের window.__khShowVerifyGate হুক দ্রষ্টব্য)
      }
    }catch(err){
      console.error(err);
      handleAuthError(err);
    }finally{
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

  /* ---------------- পাসওয়ার্ড ভুলে গেছেন ---------------- */
  forgotBtn.addEventListener("click", async () => {
    clearAuthError();
    if(!validateEmail()) return;
    const email = emailInput.value.trim();

    forgotBtn.disabled = true;
    try{
      await sendPasswordResetEmail(auth, email);
      showAuthError("Password reset link sent to your email. Please check your inbox (and spam folder).");
    }catch(err){
      console.error(err);
      if(err.code === "auth/user-not-found"){
        setFieldError(emailInput, emailError, "No account found with this email.");
      }else{
        showAuthError("Couldn't send reset link: " + (err.code || err.message || "Unknown error."));
      }
    }finally{
      forgotBtn.disabled = false;
    }
  });

  /* ---------------- ইমেইল ভেরিফিকেশন গেট (সাইন-আপের পর) ---------------- */
  window.__khShowVerifyGate = function(){
    if(loginSignupBox) loginSignupBox.style.display = "none";
    if(verifyBox) verifyBox.style.display = "block";
  };
  window.__khHideVerifyGate = function(){
    if(verifyBox) verifyBox.style.display = "none";
    if(loginSignupBox) loginSignupBox.style.display = "block";
  };

  resendBtn?.addEventListener("click", async () => {
    if(verifyError) verifyError.style.display = "none";
    const user = auth.currentUser;
    if(!user) return;
    resendBtn.disabled = true;
    try{
      await sendEmailVerification(user);
      if(verifyError){
        verifyError.textContent = "Verification email sent again. Please check your inbox.";
        verifyError.style.display = "block";
      }
    }catch(err){
      console.error(err);
      if(verifyError){
        verifyError.textContent = "Couldn't resend email: " + (err.code || err.message || "Unknown error.");
        verifyError.style.display = "block";
      }
    }finally{
      resendBtn.disabled = false;
    }
  });

  backToLoginBtn?.addEventListener("click", async () => {
    await signOut(auth);
    setMode("login");
  });

});
