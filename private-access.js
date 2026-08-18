export const SESSION_KEY = "khPrivateSession";
const SESSION_DURATION_MS = 60 * 60 * 1000; // ১ ঘণ্টা — ৩০ মিনিট চাইলে: 30 * 60 * 1000

const KEY_ITERATIONS = 210000;
const KEY_SALT_HEX   = "e7a7b3ad2d7432213e2c15c7b07b275f";
const CANARY_IV_B64   = "/kEdCyN/Wt00zTkp";
const CANARY_CT_B64   = "PxOjXHYVtbIU5a1OsLiCnAN8IBzTBWObJopWdu9YkTm3wr+1";

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

async function verifyPassword(password) {
  if (!password) return null;
  try {
    const rawKey = await deriveRawKey(password);
    const aesKey = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    
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

const BOOK_SESSION_KEY   = "khBookSession";
const BOOK_KEY_SALT_HEX  = "41a249dfa0e6c0eca0665d9099fa3fa7";
const BOOK_CANARY_IV_B64 = "ZauK7HVIYEsFc/fc";
const BOOK_CANARY_CT_B64 = "k9GDD4VhZo6KDAhWvd0RDcx3Et+0YIZYowWi40QaLjhQ";

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

export async function unlockBookWithPassword(password) {
  const hexKey = await verifyBookPassword(password);
  if (hexKey) {
    saveBookSession(hexKey);
    return true;
  }
  return false;
}

export function refreshSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.key) saveSession(data.key);
  } catch (e) {}
}

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

  if (getActiveSessionKey()) {
    refreshSession();
    showStep("content");
    if (typeof onApproved === "function") onApproved();
  } else {
    showStep("password");
  }
}
