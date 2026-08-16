/* ==========================================================================
   kh-auth.js
   Google লগইন নিয়ন্ত্রণ করে। লগইন করার আগে ড্যাশবোর্ড (kh-main) সম্পূর্ণ
   লুকানো থাকে — কেউ লগইন ছাড়া কিছুই দেখতে/লিখতে পারবে না।
   লগইন করলে, শুধু সেই ব্যবহারকারীর নিজের ডেটা (ownerId মিলিয়ে) খুলে যায়
   (এটা khApp.js-এর initKhApp(uid) নিজেই সামলায়)।
   ========================================================================== */

import {
  auth, db, GoogleAuthProvider, FacebookAuthProvider,
  signInWithPopup,
  signOut, onAuthStateChanged,
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
      showAuthError("Couldn't sign in with Google: " + (err.code || err.message || "Unknown error"));
    }finally{
      signInBtn.disabled = false;
    }
  });

  /* ---------------- Facebook ----------------
     আগে signInWithRedirect ব্যবহার হতো, কিন্তু নতুন Android Chrome-এর
     storage-partitioning ফিচারের কারণে redirect থেকে ফেরার পর
     sessionStorage হারিয়ে যাচ্ছিল ("missing initial state" এরর) —
     ফলে লগইনই সম্পূর্ণ ব্যর্থ হচ্ছিল। তাই Google-এর মতোই এখন popup
     ব্যবহার করা হচ্ছে, যেটা আধুনিক মোবাইল ব্রাউজারে বেশি নির্ভরযোগ্য। */
  fbSignInBtn.addEventListener("click", async () => {
    authError.style.display = "none";
    fbSignInBtn.disabled = true;
    try{
      await signInWithPopup(auth, new FacebookAuthProvider());
    }catch(err){
      console.error(err);
      showAuthError("Couldn't sign in with Facebook: " + (err.code || err.message || "Unknown error"));
    }finally{
      fbSignInBtn.disabled = false;
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
      if(window.__khHideVerifyGate) window.__khHideVerifyGate();
    }
  });

  /* ---------------- পুরনো (ownerId ছাড়া) ডেটা অ্যাডমিনের নামে করে দেওয়া ----------------
     এটা একবারই চালানো উচিত, টিমের অন্য কেউ লগইন করে নতুন ডেটা লেখার আগে। */
  async function claimOldData(uid, btn){
    if(!confirm("All attendance/member data from before the login system was enabled (regardless of previous ownerId) will be assigned to this account. This should only be done once. Do you want to proceed?")) return;
    btn.disabled = true;
    btn.textContent = "Processing...";
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
      alert(`Done! ${count} old entries have been added to your account.`);
      btn.style.display = "none";
    }catch(err){
      console.error(err);
      alert("Couldn't claim old data. Check the console for errors / verify Firestore Rules.");
      btn.disabled = false;
      btn.textContent = "🗂️ Claim Old Data";
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

  const confirmWrap  = document.getElementById("khConfirmPasswordWrap");
  const confirmInput = document.getElementById("khConfirmPasswordInput");
  const confirmError = document.getElementById("khConfirmPasswordError");

  const termsTextEl = document.getElementById("khTermsText");

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
  }

  /* এরর হলে user টাইপ করা শুরু করলে সেই ফিল্ডের error auto-clear হবে */
  fullNameInput?.addEventListener("input", () => clearFieldError(fullNameInput, fullNameError));
  emailInput?.addEventListener("input", () => clearFieldError(emailInput, emailError));
  passwordInput?.addEventListener("input", () => clearFieldError(passwordInput, passwordError));
  confirmInput?.addEventListener("input", () => clearFieldError(confirmInput, confirmError));

  /* ---------------- Login / Sign up মোড টগল ---------------- */
  function setMode(newMode){
    mode = newMode;
    const isLogin = mode === "login";

    fullNameWrap.style.display = isLogin ? "none" : "block";
    confirmWrap.style.display  = isLogin ? "none" : "block";
    if(termsTextEl) termsTextEl.style.display = isLogin ? "none" : "block";
    forgotBtn.style.display    = isLogin ? "inline-block" : "none";
    submitBtn.textContent      = isLogin ? "Log In" : "Create Account";
    if(authTitle) authTitle.textContent = isLogin ? "Welcome Back" : "Create Account";
    if(subtitle) subtitle.textContent   = isLogin
      ? "Sign in to continue to WorkTrack"
      : "Join WorkTrack today";
    if(toggleText) toggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleModeBtn.textContent = isLogin ? "Sign up" : "Log In";

    clearAuthError();
    clearAllFieldErrors();
  }

  toggleModeBtn.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

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

  /* ---------------- Firebase error code → ফিল্ড-লেভেল বার্তা ---------------- */
  function handleAuthError(err){
    const code = err && err.code ? err.code : "";
    if(mode === "login"){
      if(code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials"){
        setFieldError(passwordInput, passwordError, "Incorrect password. Please try again.");
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
        // onAuthStateChanged (উপরের ব্লক) সরাসরি dashboard দেখাবে —
        // কোনো email verification / OTP ধাপ নেই, সরাসরি account তৈরি হয়ে যায়
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
    clearInterval(resendCooldownTimer);
    if(resendBtn){ resendBtn.disabled = false; resendBtn.textContent = "Resend Verification Email"; }
  };
  window.__khHideVerifyGate = function(){
    if(verifyBox) verifyBox.style.display = "none";
    if(loginSignupBox) loginSignupBox.style.display = "block";
  };

  /* Resend বাটনে ৬০ সেকেন্ড cooldown — খুব দ্রুত বারবার চাপলে Firebase নিজেই
     auth/too-many-requests দিয়ে ব্লক করে দেয় (স্প্যাম-বিরোধী সুরক্ষা)।
     এই cooldown সেই সমস্যা এড়াতে সাহায্য করবে। */
  let resendCooldownTimer = null;
  function startResendCooldown(seconds){
    if(!resendBtn) return;
    let remaining = seconds;
    const originalLabel = "Resend Verification Email";
    resendBtn.disabled = true;
    resendBtn.textContent = `Resend Verification Email (${remaining}s)`;
    clearInterval(resendCooldownTimer);
    resendCooldownTimer = setInterval(() => {
      remaining -= 1;
      if(remaining <= 0){
        clearInterval(resendCooldownTimer);
        resendBtn.disabled = false;
        resendBtn.textContent = originalLabel;
      }else{
        resendBtn.textContent = `Resend Verification Email (${remaining}s)`;
      }
    }, 1000);
  }

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
      startResendCooldown(60);
    }catch(err){
      console.error(err);
      if(verifyError){
        if(err.code === "auth/too-many-requests"){
          verifyError.textContent = "An email was just sent. Please wait a moment and try again, and check your inbox/spam folder.";
        }else{
          verifyError.textContent = "Couldn't resend email: " + (err.code || err.message || "Unknown error.");
        }
        verifyError.style.display = "block";
      }
      // too-many-requests এলে বাটন সাথে সাথে আবার সক্রিয় করলে একই সমস্যা হতে পারে,
      // তাই এখানেও একটা ছোট cooldown দেওয়া হচ্ছে
      startResendCooldown(err.code === "auth/too-many-requests" ? 60 : 5);
    }
  });

  backToLoginBtn?.addEventListener("click", async () => {
    await signOut(auth);
    setMode("login");
  });

});
