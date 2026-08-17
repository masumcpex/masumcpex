/* ==========================================================================
   private-access.js
   "Unrevealed Chapter" — password-gated + AES-GCM এনক্রিপ্টেড কন্টেন্ট।

   পুরনো সিস্টেমে কন্টেন্ট সবসময় পেজের HTML-এই plain text থাকতো, শুধু
   display:none দিয়ে লুকানো হতো — View Source করলেই পড়া যেত। এখন কন্টেন্ট
   AES-GCM দিয়ে এনক্রিপ্ট করে রাখা আছে (nasir.html, amar-golpo.html,
   nazim.html, hafsa.html এর ভেতরে <script type="application/json"> ট্যাগে)।
   সঠিক password থেকে PBKDF2 দিয়ে একটা key তৈরি হয়, সেই key দিয়েই
   ব্রাউজারে decrypt হয়ে আসল লেখা দেখা যায়। ভুল password দিলে GCM
   authentication ব্যর্থ হয়ে decrypt-ই হবে না — তাই আলাদা করে hash
   রাখারও দরকার নেই, decryption নিজেই verification.

   সেশন ১ ঘণ্টা মেয়াদে localStorage-এ থাকে (নিচে SESSION_DURATION_MS
   দেখুন — চাইলে ৩০ মিনিট করতে শুধু ওই একটা সংখ্যা বদলান)। সক্রিয়ভাবে
   কোনো private page দেখলে মেয়াদ আবার বেড়ে যায় (sliding session); ১ ঘণ্টা
   কিছু না দেখলে আবার password লাগবে। ব্রাউজার রিফ্রেশ করলে বারবার
   password লাগবে না, যতক্ষণ মেয়াদ আছে।
   ========================================================================== */

export const SESSION_KEY = "khPrivateSession";
const SESSION_DURATION_MS = 60 * 60 * 1000; // ১ ঘণ্টা — ৩০ মিনিট চাইলে: 30 * 60 * 1000

const KEY_ITERATIONS = 210000;
const KEY_SALT_HEX   = "143dc0f3eec381a4826725ec1596968e";
const CANARY_IV_B64   = "Vi9GruTL99oIJdJ9";
const CANARY_CT_B64   = "n4bH+euBLT8Uozy8+qvbg1Xewo7SqrP3a0HI";

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}
function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function deriveRawKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(KEY_SALT_HEX), iterations: KEY_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256
  );
  return new Uint8Array(bits);
}

/** সঠিক password দিলে hex key ফেরত দেয়, ভুল হলে null। */
async function verifyPassword(password) {
  if (!password) return null;
  try {
    const rawKey = await deriveRawKey(password);
    const aesKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    // canary decrypt করে দেখা — সফল হলেই password সঠিক
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(CANARY_IV_B64) }, aesKey, b64ToBytes(CANARY_CT_B64)
    );
    return bytesToHex(rawKey);
  } catch (e) {
    return null;
  }
}

function saveSession(hexKey) {
  const exp = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ key: hexKey, exp }));
}

/** সেশন এখনো valid থাকলে key হেক্স ফেরত দেয়, নাহলে null (ও পুরনো এন্ট্রি মুছে দেয়)। */
export function getActiveSessionKey() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { key, exp } = JSON.parse(raw);
    if (!key || !exp || Date.now() > exp) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return key;
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ==========================================================================
   বই-লক সিস্টেম ("চলার পথে আমার গল্প") — উপরের "Unrevealed Chapter"
   password থেকে সম্পূর্ণ স্বতন্ত্র। আলাদা salt, আলাদা canary, আলাদা
   localStorage session key — একটার password দিয়ে আরেকটা আনলক হবে না।
   ========================================================================== */

const BOOK_SESSION_KEY   = "khBookSession";
const BOOK_KEY_SALT_HEX  = "7f541eb18789c3e9c272e92e1c7bfb5c";
const BOOK_CANARY_IV_B64 = "R0zK8yw3QEGSv+05";
const BOOK_CANARY_CT_B64 = "OGk+Y4tSMn57eEkqjiq5Dn9c";

async function deriveBookRawKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(BOOK_KEY_SALT_HEX), iterations: KEY_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256
  );
  return new Uint8Array(bits);
}

async function verifyBookPassword(password) {
  if (!password) return null;
  try {
    const rawKey = await deriveBookRawKey(password);
    const aesKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(BOOK_CANARY_IV_B64) }, aesKey, b64ToBytes(BOOK_CANARY_CT_B64)
    );
    return bytesToHex(rawKey);
  } catch (e) {
    return null;
  }
}

function saveBookSession(hexKey) {
  const exp = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(BOOK_SESSION_KEY, JSON.stringify({ key: hexKey, exp }));
}

/** বই-সেশন এখনো valid থাকলে true, নাহলে false (ও পুরনো এন্ট্রি মুছে দেয়)। */
export function hasActiveBookSession() {
  try {
    const raw = localStorage.getItem(BOOK_SESSION_KEY);
    if (!raw) return false;
    const { key, exp } = JSON.parse(raw);
    if (!key || !exp || Date.now() > exp) {
      localStorage.removeItem(BOOK_SESSION_KEY);
      return false;
    }
    return true;
  } catch (e) {
    localStorage.removeItem(BOOK_SESSION_KEY);
    return false;
  }
}

/** বইয়ের নিজস্ব password verify করে সঠিক হলে বইয়ের নিজস্ব session save করে। */
export async function unlockBookWithPassword(password) {
  const hexKey = await verifyBookPassword(password);
  if (hexKey) {
    saveBookSession(hexKey);
    return true;
  }
  return false;
}

/** সক্রিয় থাকলে সেশনের মেয়াদ আবার ১ ঘণ্টা বাড়িয়ে দেয় (sliding expiry)। */
export function refreshSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.key) saveSession(data.key);
  } catch (e) {}
}

/**
 * হোমপেজের #private-chapters সেকশনে ব্যবহার করার জন্য — একমাত্র জায়গা
 * যেখানে password ফর্ম দেখানো হবে।
 */
export function initPrivateGate(opts) {
  const {
    passwordStepId, contentId,
    passwordInputId, passwordSubmitBtnId,
    signOutBtnId, statusId,
    onApproved
  } = opts;

  const passwordStepEl = document.getElementById(passwordStepId);
  const contentEl      = document.getElementById(contentId);
  const statusEl       = document.getElementById(statusId);
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

  function showStep(step) { // "password" | "content"
    if (passwordStepEl) passwordStepEl.style.display = step === "password" ? "" : "none";
    if (contentEl)       contentEl.style.display       = step === "content" ? "" : "none";
  }

  async function tryUnlock() {
    setStatus("");
    const val = (pwInput?.value || "").trim();
    if (!val) { setStatus(" Password লিখুন।", true); return; }
    if (pwSubmitBtn) pwSubmitBtn.disabled = true;
    try {
      const hexKey = await verifyPassword(val);
      if (hexKey) {
        saveSession(hexKey);
        if (pwInput) pwInput.value = "";
        setStatus("");
        showStep("content");
        if (typeof onApproved === "function") onApproved();
      } else {
        setStatus(" Password সঠিক নয়। আবার চেষ্টা করুন।", true);
      }
    } finally {
      if (pwSubmitBtn) pwSubmitBtn.disabled = false;
    }
  }

  pwSubmitBtn?.addEventListener("click", tryUnlock);

  pwInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); tryUnlock(); }
  });

  signOutBtn?.addEventListener("click", () => {
    clearSession();
    showStep("password");
    setStatus("");
  });

  // আগে থেকে সেশন valid থাকলে সরাসরি content দেখাও, মেয়াদও বাড়িয়ে দাও।
  if (getActiveSessionKey()) {
    refreshSession();
    showStep("content");
    if (typeof onApproved === "function") onApproved();
  } else {
    showStep("password");
  }
}
