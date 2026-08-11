/* ==========================================================================
   private-access.js
   "🔒 বাস্তবতার অন্ধকার পৃষ্ঠা" — একমাত্র এন্ট্রি পয়েন্ট।

   ফ্লো (শুধু index.html-এর #private-chapters সেকশনে):
     Google Sign-In → approvedPrivateUsers চেক (Firestore) → Private Password
     → সব ঠিক থাকলে localStorage-এ একটা আনলক ফ্ল্যাগ সেট হয়।

   অন্য সব প্রাইভেট পেজ (unpublished.html, nasir.html, ...) আলাদা কোনো লগইন
   UI দেখায় না — তারা শুধু private-guard.js দিয়ে চেক করে, আনলক না থাকলে
   সরাসরি হোমপেজের এই সেকশনে ফিরিয়ে দেয়।

   গুরুত্বপূর্ণ সততার নোট:
   Password-টা plaintext না রেখে SHA-256 hash হিসেবে রাখা হয়েছে, কিন্তু
   এটা কোনো ব্যাকএন্ড ছাড়া "সত্যিকারের সিকিউর" verification না — hash-টা
   browser-এই থাকছে। প্রকৃত সুরক্ষা এখনো আসে Firestore Security Rules-এর
   approvedPrivateUsers চেক থেকে — password ধাপটা শুধু already-approved
   মানুষের জন্য একটা এক্সট্রা UI-স্তর, চূড়ান্ত সিকিউরিটি বাউন্ডারি না।
   ========================================================================== */

import {
  auth, db, GoogleAuthProvider,
  signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc
} from "./firebase.js";

export const UNLOCK_KEY = "privateChapterUnlocked";

// SHA-256("family@masumcpex.com")
const PRIVATE_PASSWORD_HASH =
  "630082ef80e2f60f5cf688cef5d2e7111c337f0afaeb0097fa76055140966d7a";

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * হোমপেজের #private-chapters সেকশনে ব্যবহার করার জন্য — একমাত্র জায়গা
 * যেখানে "Continue with Google" বাটন ও পাসওয়ার্ড ফর্ম দেখানো হবে।
 */
export function initPrivateGate(opts) {
  const {
    googleStepId, passwordStepId, contentId,
    signInBtnId, passwordInputId, passwordSubmitBtnId,
    signOutBtnId, statusId,
    onApproved
  } = opts;

  const googleStepEl   = document.getElementById(googleStepId);
  const passwordStepEl = document.getElementById(passwordStepId);
  const contentEl      = document.getElementById(contentId);
  const statusEl       = document.getElementById(statusId);
  const signInBtn       = document.getElementById(signInBtnId);
  const pwInput         = document.getElementById(passwordInputId);
  const pwSubmitBtn     = document.getElementById(passwordSubmitBtnId);
  const signOutBtn      = document.getElementById(signOutBtnId);

  function setStatus(msg, isError) {
    if (!statusEl) return;
    if (!msg) { statusEl.style.display = "none"; statusEl.textContent = ""; return; }
    statusEl.textContent = msg;
    statusEl.style.display = "block";
    statusEl.classList.toggle("private-gate-error", !!isError);
    statusEl.classList.toggle("private-gate-ok", !isError);
  }

  function showStep(step) { // "google" | "password" | "content"
    if (googleStepEl)   googleStepEl.style.display   = step === "google"   ? "" : "none";
    if (passwordStepEl) passwordStepEl.style.display = step === "password" ? "" : "none";
    if (contentEl)       contentEl.style.display       = step === "content" ? "" : "none";
  }

  signInBtn?.addEventListener("click", async () => {
    setStatus("");
    signInBtn.disabled = true;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error(err);
      setStatus("Google দিয়ে লগইন করা যায়নি। আবার চেষ্টা করুন।", true);
    } finally {
      signInBtn.disabled = false;
    }
  });

  pwSubmitBtn?.addEventListener("click", async () => {
    setStatus("");
    const val = (pwInput?.value || "").trim();
    if (!val) { setStatus("❌ Password লিখুন।", true); return; }
    pwSubmitBtn.disabled = true;
    try {
      const hash = await sha256Hex(val);
      if (hash === PRIVATE_PASSWORD_HASH) {
        localStorage.setItem(UNLOCK_KEY, "1");
        if (pwInput) pwInput.value = "";
        setStatus("");
        showStep("content");
        if (typeof onApproved === "function") onApproved();
      } else {
        setStatus("❌ Password সঠিক নয়। আবার চেষ্টা করুন।", true);
      }
    } finally {
      pwSubmitBtn.disabled = false;
    }
  });

  pwInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); pwSubmitBtn?.click(); }
  });

  signOutBtn?.addEventListener("click", async () => {
    try { await signOut(auth); } catch (err) { console.error(err); }
    localStorage.removeItem(UNLOCK_KEY);
    showStep("google");
    setStatus("");
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showStep("google");
      setStatus("");
      return;
    }

    setStatus("✓ Google account verified — অনুমোদন যাচাই হচ্ছে...");
    try {
      const snap = await getDoc(doc(db, "approvedPrivateUsers", user.uid));
      if (!snap.exists()) {
        showStep("google");
        setStatus("❌ এই Google account-এর জন্য access অনুমোদিত নয়।", true);
        return;
      }
      setStatus("");
      if (localStorage.getItem(UNLOCK_KEY) === "1") {
        showStep("content");
        if (typeof onApproved === "function") onApproved();
      } else {
        showStep("password");
      }
    } catch (err) {
      console.error(err);
      showStep("google");
      setStatus("❌ অনুমোদন যাচাই করা যায়নি। আবার চেষ্টা করুন।", true);
    }
  });
}
